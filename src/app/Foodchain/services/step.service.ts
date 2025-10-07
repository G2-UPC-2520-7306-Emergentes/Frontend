import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
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
}
