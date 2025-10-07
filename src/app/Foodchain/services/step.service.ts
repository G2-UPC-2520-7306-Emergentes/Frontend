import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {retry, catchError, map} from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseService } from '../../shared/services/base.service';
import { Step } from '../model/step.entity'; // 🚨 Importar la entidad Step

// --- Interfaz del Payload de Creación de Paso ---

/**
 * Define la estructura de los datos necesarios para crear un nuevo Step.
 * El componente RegisterStepComponent será responsable de asegurar que estos campos existan.
 */
export interface StepCreatePayload {
  // Datos del Formulario
  stepType: string;
  stepDate: string;
  stepTime: string;
  location: string;
  observations?: string;

  // IDs inyectados por el componente (fuera del formulario)
  lotId: string; // ID del lote seleccionado
  userId: string; // ID del usuario conectado

  // Campo que debe ser enviado (vacío por ahora)
  hash: string;
}

// --- Clase del Servicio ---

@Injectable({
  providedIn: 'root'
})
export class StepService extends BaseService<Step> { // 🚨 Heredar de BaseService<Step>

  constructor() {
    super();
    // 🚨 Establece el endpoint principal para las operaciones CRUD del recurso Step
    this.resourceEndPoint = '/steps';
  }

  // --- Método Específico para Creación de Paso ---

  /**
   * Registra un nuevo paso de trazabilidad en el sistema.
   * @param newStepPayload El objeto con los datos esenciales del paso.
   * @returns Un Observable que emite el objeto Step creado o null si falla.
   */
  createStep(newStepPayload: StepCreatePayload): Observable<Step | null> {

    // Creamos una instancia de Step para asegurarnos de que todos los valores
    // (incluidos los por defecto como el hash vacío) se asignen antes de enviar.
    const stepEntity = new Step(newStepPayload);

    // Aplicamos la conversión (as unknown as Step) para satisfacer el tipado del create.
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

  // --- Métodos Adicionales (Opcional, similar a BatchService) ---

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
  getStepsByLotId(lotId: string | number | null): Observable<Step[]> { // <- Acepta más tipos

    // 🚨 CORRECCIÓN CLAVE: Asegura que lotId es una cadena antes de llamar a .trim()
    const cleanedLotId = String(lotId || '').trim();

    console.log(`[StepService] Solicitando pasos para Lote ID SANEADO: "${cleanedLotId}"`);

    // Si el ID es una cadena vacía después del saneamiento, no tiene sentido buscar
    if (!cleanedLotId) {
      console.warn('[StepService] ID de lote inválido o vacío después del saneamiento. Devolviendo array vacío.');
      return of([]);
    }

    return this.getAll()
      .pipe(
        map((allSteps: Step[]) => {
          console.log(`[StepService] Total de Pasos recibidos de la API: ${allSteps.length}`);

          const filteredSteps = allSteps.filter(step => {
            // Saneamos el lotId del paso de la misma manera
            const stepLotId = String(step.lotId || '').trim();
            const isMatch = stepLotId === cleanedLotId;

            // Log de depuración por cada paso (¡Importante!)
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
