import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { retry, catchError, map, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseService } from '../../shared/services/base.service';
import { Step } from '../model/step.entity';

// ... (StepCreatePayload no cambia) ...
export interface StepCreatePayload {
  stepType: string;
  stepDate: string;
  stepTime: string;
  location: string;
  observations?: string;
  lotId: string;
  userId: string;
  hash: string;
}

@Injectable({
  providedIn: 'root'
})
export class StepService extends BaseService<Step> {

  constructor() {
    super();
    this.resourceEndPoint = '/steps';
  }

  // ------------------------------
  // 🆕 MÉTODO CREADO: Obtener Step por ID (Filtrando con getAll)
  // ------------------------------
  /**
   * Obtiene un paso por su ID.
   * 💡 NOTA: Esto es ineficiente si la API soporta GET /steps/:id,
   * ya que descarga *todos* los pasos para encontrar solo uno.
   * @param id El ID del paso.
   */
  getStepById(id: string): Observable<Step | null> {
    if (!id) {
      return of(null);
    }

    return this.getAll().pipe(
      map((allSteps: Step[]) => {
        // Filtra la lista completa para encontrar el paso con el ID
        const foundStep = allSteps.find(step => step.id === id);
        return foundStep || null;
      }),
      retry(1), // Intenta una vez extra por si falla la conexión
      catchError((error) => {
        console.error(`[StepService] Error al obtener paso ${id} (en getStepById):`, error);
        return of(null);
      })
    );
  }

  // ------------------------------
  // 🛠️ MÉTODO CORREGIDO: Actualizar Status
  // ------------------------------
  /**
   * Actualiza el estado de un paso asegurando que todos los datos persistan.
   * @param stepId El ID del paso a actualizar.
   * @param newStatus El nuevo estado ('accepted' o 'cancelled').
   * @returns Un Observable que emite el objeto Step actualizado o null si falla.
   */
  updateStepStatus(stepId: string, newStatus: 'accepted' | 'cancelled'): Observable<Step | null> {

    // 1. Obtener el paso actual usando el nuevo método getStepById
    return this.getStepById(stepId).pipe(
      // 2. Usar switchMap para cambiar al Observable de la actualización
      switchMap((currentStep: Step | null) => {
        if (!currentStep) {
          console.error(`[StepService] Paso ID ${stepId} no encontrado para actualizar.`);
          return of(null);
        }

        // 3. Crear el objeto de actualización completo
        // Copiamos todos los campos y sobrescribimos solo el status.
        const updatedStep: Step = {
          ...currentStep,
          status: newStatus
        };

        // 4. Enviar el objeto Step COMPLETO
        return this.update(stepId, updatedStep)
          .pipe(
            map(result => result || null),
            catchError((error: HttpErrorResponse) => {
              console.error(`Error de API al actualizar el paso ${stepId}:`, error);
              alert(`Error al cambiar el estado del paso: ${error.message}`);
              return of(null);
            })
          );
      }),
      catchError((error) => {
        console.error(`Error en la cadena de obtención/actualización para paso ${stepId}:`, error);
        return of(null);
      })
    );
  }


  // ------------------------------
  // 🔒 RESTO DE MÉTODOS (SIN CAMBIOS)
  // ------------------------------

  /**
   * Registra un nuevo paso de trazabilidad en el sistema.
   * @param newStepPayload El objeto con los datos esenciales del paso.
   * @returns Un Observable que emite el objeto Step creado o null si falla.
   */
  createStep(newStepPayload: StepCreatePayload): Observable<Step | null> {
    const stepEntity = new Step(newStepPayload);

    return this.create(stepEntity as unknown as Step)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error de API durante la creación del paso:', error);
          let errorMessage = 'Error desconocido al registrar el paso.';
          if (error.status === 400) {
            errorMessage = 'Datos inválidos. Asegúrate de que todos los campos requeridos estén correctos.';
          } else if (error.status === 0 || error.status === 500) {
            errorMessage = 'Error de conexión con el servidor. Inténtalo más tarde.';
          }
          alert(`Error al registrar el paso: ${errorMessage}`);
          return of(null);
        })
      );
  }

  /**
   * Obtiene todos los pasos pendientes asociados a un usuario específico.
   * NOTA: Requiere que BaseService.getAll() traiga el campo 'status'.
   * @param userId El ID del usuario.
   * @returns Un Observable que emite un array de Step con status 'pending'.
   */
  getPendingStepsByUserId(userId: string): Observable<Step[]> {
    if (!userId) {
      console.warn('[StepService] ID de usuario vacío. Devolviendo array vacío.');
      return of([]);
    }

    return this.getAll().pipe(
      map((allSteps: Step[]) => {
        return allSteps.filter(step =>
          step.userId === userId && step.status === 'pending'
        );
      }),
      retry(2),
      catchError((error) => {
        console.error('[StepService] ERROR al obtener pasos pendientes:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene todos los pasos registrados (útil para administración o depuración).
   */
  getAllSteps(): Observable<Step[]> {
    return this.getAll()
      .pipe(
        retry(2),
        catchError((error) => {
          console.error('Error de API al obtener todos los pasos:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene todos los pasos y los filtra por un ID de lote específico.
   * NOTA: Se asume filtrado en cliente ya que BaseService solo tiene getAll().
   * @param lotId El ID del lote a filtrar.
   * @returns Un Observable que emite un array de Step.
   */
  getStepsByLotId(lotId: string | number | null): Observable<Step[]> {
    const cleanedLotId = String(lotId || '').trim();
    console.log(`[StepService] Solicitando pasos para Lote ID SANEADO: "${cleanedLotId}"`);

    if (!cleanedLotId) {
      console.warn('[StepService] ID de lote inválido o vacío después del saneamiento. Devolviendo array vacío.');
      return of([]);
    }

    return this.getAll()
      .pipe(
        map((allSteps: Step[]) => {
          console.log(`[StepService] Total de Pasos recibidos de la API: ${allSteps.length}`);
          const filteredSteps = allSteps.filter(step => {
            const stepLotId = String(step.lotId || '').trim();
            const isMatch = stepLotId === cleanedLotId;

            console.log(
              `[StepService]   - Paso ID: ${step.id} | Lote ID del Paso SANEADO: "${stepLotId}" | Coincide con "${cleanedLotId}"?: ${isMatch}`
            );
            return isMatch;
          });

          console.log(`[StepService] Pasos filtrados y devueltos: ${filteredSteps.length}`);
          return filteredSteps;
        }),
        retry(2),
        catchError((error) => {
          console.error('[StepService] ERROR al obtener pasos:', error);
          return of([]);
        })
      );
  }
}
