import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {retry, catchError, map} from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseService } from '../../shared/services/base.service';
import { Step } from '../model/step.entity';



/**
 * Define la estructura de los datos necesarios para crear un nuevo Step.
 * El componente RegisterStepComponent será responsable de asegurar que estos campos existan.
 */
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
