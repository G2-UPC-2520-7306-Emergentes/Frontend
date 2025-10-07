import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseService } from '../../shared/services/base.service';
import { Batch } from '../model/batch.entity';

// Define la Interfaz del Payload de creación (sin 'id' y campos generados automáticamente)
export interface BatchCreatePayload {
  lotName: string;
  farmName: string;
  variety: string;
  harvestDate: string;
  // Campos opcionales que vienen del formulario
  description?: string; // Lo añado basado en el UI: "Description or Notes (Optional)"
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BatchService extends BaseService<Batch> {

  constructor() {
    super();
    // 🚨 Establece el endpoint principal para las operaciones CRUD del recurso Batch
    this.resourceEndPoint = '/batches';
  }

  // --- Nuevo Método Específico para Creación de Lote ---

  /**
   * Registra un nuevo lote en el sistema, utilizando el método create() heredado.
   * Añade manejo de errores robusto y específico de la lógica de creación.
   * @param newBatchPayload El objeto con los datos esenciales del lote.
   * @returns Un Observable que emite el objeto Batch creado o null si falla.
   */
  createBatch(newBatchPayload: BatchCreatePayload): Observable<Batch | null> {

    // El payload solo tiene los datos de entrada del usuario.
    // El constructor de la entidad Batch añadirá 'createdDate' y 'state'.

    // Creamos una instancia de Batch para asegurarnos de que los valores por defecto se asignen
    const batchEntity = new Batch(newBatchPayload);

    // Aplicamos la doble conversión (as unknown as Batch) para satisfacer el tipado del create.
    return this.create(batchEntity as unknown as Batch)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error de API durante la creación del lote:', error);

          let errorMessage = 'Error desconocido al crear el lote.';

          if (error.status === 409 || error.status === 400) {
            errorMessage = 'Datos inválidos. Verifica que el nombre del lote no esté duplicado.';
          } else if (error.status === 0 || error.status === 500) {
            errorMessage = 'Error de conexión con el servidor. Inténtalo más tarde.';
          }

          alert(`Error al crear el lote: ${errorMessage}`);

          return of(null);
        })
      );
  }
}
