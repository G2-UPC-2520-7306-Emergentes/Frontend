import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {retry, catchError, map} from 'rxjs/operators';
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
  producer_id: string;
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

  getAllBatches(): Observable<Batch[]> {
    // Usamos el método getAll() heredado de BaseService
    return this.getAll()
      .pipe(
        retry(2), // Reintentar la operación si falla
        // El manejo de errores genérico (this.handleError) ya debería estar en BaseService
        catchError((error) => {
          console.error('Error de API al obtener todos los lotes:', error);
          // Retornamos un Observable de un array vacío en caso de error para que la aplicación no se caiga
          return of([]);
        })
      );
  }

  /**
   * Obtiene un lote específico por su ID.
   * Carga todos los lotes y filtra en el cliente, ya que getById no está en BaseService.
   * @param id El ID del lote a buscar.
   * @returns Un Observable que emite el objeto Batch o null si no se encuentra.
   */
  getBatchById(id: string | number): Observable<Batch | null> {
    const targetId = String(id).trim(); // Aseguramos que el ID es una cadena limpia

    // Usamos getAllBatches y luego filtramos con map
    return this.getAllBatches().pipe(
      map((allBatches: Batch[]) => {
        // Encontramos el primer lote cuyo ID coincida
        const batch = allBatches.find(
          // La comparación debe ser estricta para IDs que son strings o numbers
          b => String(b.id) === targetId
        );

        if (!batch) {
          console.warn(`Lote con ID ${targetId} no encontrado en el filtro local.`);
        }

        // Retorna el lote encontrado o null
        return batch || null;
      }),
      // Añadimos manejo de errores por si getAllBatches falla completamente
      catchError((error) => {
        console.error(`Error al obtener todos los lotes para buscar ID ${targetId}:`, error);
        return of(null);
      })
    );
  }

}
