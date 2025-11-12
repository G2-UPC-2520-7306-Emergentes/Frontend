import { Component, OnInit } from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap, catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
import {BatchService} from '../../services/batch.service';
import {StepService} from '../../services/step.service';
import {SessionService} from '../../services/session.service';
import {Batch} from '../../model/batch.entity';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-delete-batch',
  standalone: true,
  templateUrl: './delete-batch.component.html',
  imports: [CommonModule,
  ],
  styleUrls: ['./delete-batch.component.css']
})
export class DeleteBatchComponent implements OnInit {

  batches: Batch[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  private producerId: string | null = null;

  constructor(
    private batchService: BatchService,
    private stepService: StepService,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    this.producerId = this.sessionService.getUserId();
    if (this.producerId) {
      this.loadBatches();
    } else {
      this.errorMessage = 'No se encontró el ID del productor logueado.';
      this.isLoading = false;
    }
  }

  /**
   * Carga la lista de lotes asociados al productor logueado.
   */
  loadBatches(): void {
    if (!this.producerId) return;

    this.isLoading = true;
    this.errorMessage = null;

    this.batchService.getBatchesByProducerId(this.producerId)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          // Filtrar lotes cuyo status no sea 'deleted' para no mostrarlos, si aplicara.
          this.batches = data.filter(batch => batch.state !== 'deleted');
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = `Error al cargar lotes: ${err.message}`;
        }
      });
  }

  /**
   * Cambia el estado del lote a 'cancelled' (usa PUT con el objeto completo).
   * @param batch El lote a cancelar.
   */
  onCancelBatch(batch: Batch): void {
    if (!confirm(`¿Estás seguro de que deseas CANCELAR el lote "${batch.lotName}"? El estado de trazabilidad ya no podrá ser modificado.`)) {
      return;
    }

    // 1. Crear el objeto de actualización COMPLETO
    // Se asume que la entidad Batch tiene un campo 'status'
    const updatedBatch: Batch = {
      ...batch,
      state: 'cancelled'
    } as Batch;

    // 2. Usar updateBatch que llama a this.update(id, entity) del BaseService (PUT)
    this.batchService.updateBatch(batch.id, updatedBatch)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (result) {
            alert(`Lote "${batch.lotName}" cancelado con éxito.`);
            this.updateLocalBatch(result); // Actualizar la vista local
          } else {
            alert(`Fallo al cancelar el lote "${batch.lotName}".`);
          }
        },
        error: () => {
          alert('Ocurrió un error de conexión al intentar cancelar el lote.');
        }
      });
  }

  /**
   * Elimina el lote y todos sus pasos relacionados (usa DELETE).
   * @param batch El lote a eliminar.
   */
  onDeleteBatch(batch: Batch): void {
    if (!confirm(`¡ADVERTENCIA! ¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE el lote "${batch.lotName}" y TODOS los pasos asociados?`)) {
      return;
    }

    // 1. Eliminar todos los pasos relacionados
    this.stepService.deleteAllStepsByLotId(batch.id)
      .pipe(
        // 2. Encadenar con la eliminación del lote
        switchMap((stepsDeletedSuccessfully) => {
          if (!stepsDeletedSuccessfully) {
            console.warn('Algunos pasos fallaron en la eliminación. Intentando eliminar el lote de todas formas.');
          }
          // Llama a deleteBatch, que a su vez llama a super.delete(id)
          return this.batchService.deleteBatch(batch.id);
        }),
        take(1),
        catchError((error) => {
          console.error('Error al encadenar la eliminación de lote/pasos:', error);
          alert('Error crítico al intentar la eliminación completa.');
          return of(false);
        })
      )
      .subscribe((batchDeletedSuccessfully) => {
        if (batchDeletedSuccessfully) {
          alert(`Lote "${batch.lotName}" eliminado permanentemente.`);
          this.removeLocalBatch(batch.id); // Remover de la vista local
        } else {
          alert(`Fallo al eliminar el lote "${batch.lotName}".`);
        }
      });
  }

  // Métodos de utilidad para actualizar la UI
  private updateLocalBatch(updatedBatch: Batch): void {
    const index = this.batches.findIndex(b => b.id === updatedBatch.id);
    if (index > -1) {
      this.batches[index] = updatedBatch;
    }
  }

  private removeLocalBatch(batchId: string): void {
    this.batches = this.batches.filter(b => b.id !== batchId);
  }
}
