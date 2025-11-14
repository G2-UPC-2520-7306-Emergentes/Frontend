import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs'; // Importamos forkJoin
import { retry, catchError, map, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseService } from '../../shared/services/base.service';
import { Step } from '../model/step.entity'; // Asegúrate de que la ruta a Step.entity sea correcta

// --- Interfaces de Carga ---
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
  // 🆕 MÉTODO: Elimina todos los pasos asociados a un Lote
  // ------------------------------
  /**
   * Obtiene todos los pasos de un lote y los elimina uno por uno utilizando BaseService.delete(id).
   * @param lotId El ID del lote cuyos pasos se deben eliminar.
   * @returns Un Observable que emite true si todas las eliminaciones fueron exitosas.
   */
  deleteAllStepsByLotId(lotId: string): Observable<boolean> {
    // 1. Obtener todos los pasos del lote
    return this.getStepsByLotId(lotId).pipe(
      // 2. Usar switchMap para cambiar al Observable de las eliminaciones
      switchMap((steps: Step[]) => {
        if (steps.length === 0) {
          console.log(`[StepService] No hay pasos para eliminar para el lote ${lotId}.`);
          return of(true);
        }

        console.log(`[StepService] Eliminando ${steps.length} pasos para el lote ${lotId}.`);

        // 3. Mapear cada paso a un Observable de eliminación
        const deleteObservables = steps.map(step => this.delete(step.id).pipe(
          catchError((error) => {
            console.error(`Error al eliminar el paso ${step.id}:`, error);
            return of(false);
          })
        ));

        // 4. Usar forkJoin para esperar a que todas las eliminaciones terminen
        return forkJoin(deleteObservables).pipe(
          // Verifica que no haya habido fallas (ningún 'false' en el array de resultados)
          map(results => results.every(result => result !== false)),
          catchError((error) => {
            console.error(`Error en el forkJoin de eliminación de pasos para lote ${lotId}:`, error);
            return of(false);
          })
        );
      })
    );
  }

  // ------------------------------
  // 🆕 MÉTODO: Obtener Step por ID (Filtrando con getAll)
  // ------------------------------
  /**
   * Obtiene un paso por su ID.
   * @param id El ID del paso.
   */
  getStepById(id: string): Observable<Step | null> {
    if (!id) {
      return of(null);
    }

    return this.getAll().pipe(
      map((allSteps: Step[]) => {
        const foundStep = allSteps.find(step => step.id === id);
        return foundStep || null;
      }),
      retry(1),
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
   * Actualiza el estado de un paso, asegurando que todos los datos persistan (uso de PUT en BaseService).
   * @param stepId El ID del paso a actualizar.
   * @param newStatus El nuevo estado ('accepted' o 'cancelled').
   * @returns Un Observable que emite el objeto Step actualizado o null si falla.
   */
  updateStepStatus(stepId: string, newStatus: 'accepted' | 'cancelled'): Observable<Step | null> {

    // 1. Obtener el paso actual
    return this.getStepById(stepId).pipe(
      // 2. Usar switchMap para cambiar al Observable de la actualización
      switchMap((currentStep: Step | null) => {
        if (!currentStep) {
          console.error(`[StepService] Paso ID ${stepId} no encontrado para actualizar.`);
          return of(null);
        }

        // 3. Crear el objeto de actualización completo
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
  getPendingSteps(): Observable<Step[]> {

    // Utilizamos el método getAll() existente que trae todos los pasos.
    return this.getAll().pipe(
      map((allSteps: Step[]) => {
        // Filtramos localmente para devolver solo aquellos con status 'pending'.
        return allSteps.filter(step => step.status === 'pending');
      }),
      retry(2), // Reintentar la llamada en caso de error temporal.
      catchError((error) => {
        console.error('[StepService] ERROR al obtener TODOS los pasos pendientes:', error);
        return of([]); // Devuelve un array vacío en caso de error.
      })
    );
  }

  // ------------------------------
  // 🔒 RESTO DE MÉTODOS
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
   * Obtiene todos los pasos registrados.
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
   * @param lotId El ID del lote a filtrar.
   * @returns Un Observable que emite un array de Step.
   */
  getStepsByLotId(lotId: string | number | null): Observable<Step[]> {
    const cleanedLotId = String(lotId || '').trim();
    console.log(`[StepService] Solicitando pasos para Lote ID SANEADO: "${cleanedLotId}"`);

    if (!cleanedLotId) {
      console.warn('[StepService] ID de lote inválido o vacío. Devolviendo array vacío.');
      return of([]);
    }

    return this.getAll()
      .pipe(
        map((allSteps: Step[]) => {
          console.log(`[StepService] Total de Pasos recibidos de la API: ${allSteps.length}`);
          const filteredSteps = allSteps.filter(step => {
            const stepLotId = String(step.lotId || '').trim();
            return stepLotId === cleanedLotId;
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
