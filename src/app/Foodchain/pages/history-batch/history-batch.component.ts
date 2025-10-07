import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

// Entidades y Servicios
import { SessionService } from '../../services/session.service';
import { BatchService } from '../../services/batch.service';
import { StepService } from '../../services/step.service';
import { Batch } from '../../model/batch.entity';
import { Step } from '../../model/step.entity';

@Component({
  selector: 'app-history-batch',
  standalone: true,
  templateUrl: './history-batch.component.html',
  styleUrls: ['./history-batch.component.css'],
  imports: [CommonModule, FormsModule]
})
export class HistoryBatchComponent implements OnInit {

  userBatches: Batch[] = [];
  stepsHistory: Step[] = [];
  selectedLotId: string | null = null;

  isLoadingBatches: boolean = true;
  isLoadingSteps: boolean = false;
  errorBatchMessage: string | null = null;
  errorStepMessage: string | null = null;

  constructor(
    private sessionService: SessionService,
    private batchService: BatchService,
    private stepService: StepService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserBatches();
  }

  /**
   * Carga los lotes asociados al ID del usuario conectado.
   */
  loadUserBatches(): void {
    this.isLoadingBatches = true;
    this.errorBatchMessage = null;

    const connectedUserId = this.sessionService.getUserId();

    console.log('--- DIAGNÓSTICO DE CARGA DE LOTES ---');
    console.log('1. ID de Usuario Conectado (SessionService):', connectedUserId, '| Tipo:', typeof connectedUserId);

    if (!connectedUserId) {
      this.errorBatchMessage = 'Error de sesión. ID de usuario no disponible.';
      this.isLoadingBatches = false;
      console.error('DIAGNÓSTICO: ID de usuario no encontrado. Cancelando carga.');
      return;
    }

    this.batchService.getAllBatches()
      .pipe(first())
      .subscribe({
        next: (allBatches: Batch[]) => {
          console.log('2. Total de Lotes Obtenidos de la API:', allBatches.length);

          // 🚨 FILTRADO CON LOGS DETALLADOS
          this.userBatches = allBatches.filter(
            (batch: Batch) => {
              const batchProducerId = String(batch.producer_id); // Asegurar que ambos son strings
              const isMatch = batchProducerId === connectedUserId;

              // Log de depuración por cada lote
              console.log(
                `   - Lote ID: ${batch.id} | Producer ID del Lote: ${batchProducerId} | Coincide con ${connectedUserId}?: ${isMatch}`
              );

              return isMatch;
            }
          );

          console.log('3. Lotes Filtrados exitosamente:', this.userBatches.length);
          console.log('--- FIN DEL DIAGNÓSTICO ---');

          this.isLoadingBatches = false;

          if (this.userBatches.length > 0) {
            if (!this.selectedLotId) {
              this.selectedLotId = this.userBatches[0].id;
            }
            this.loadStepsByLotId(this.selectedLotId);
          } else {
            this.errorBatchMessage = `No hay lotes registrados para el usuario ID ${connectedUserId}.`;
          }
        },
        error: (error) => {
          console.error('DIAGNÓSTICO: Error al cargar lotes:', error);
          this.errorBatchMessage = 'Error al conectar con el servicio de lotes.';
          this.isLoadingBatches = false;
        }
      });
  }

  // --- El resto de los métodos se mantienen iguales ---
  onLotSelected(): void {
    if (this.selectedLotId) {
      this.loadStepsByLotId(this.selectedLotId);
    } else {
      this.stepsHistory = [];
      this.errorStepMessage = null;
    }
  }

  loadStepsByLotId(lotId: string): void {
    this.isLoadingSteps = true;
    this.errorStepMessage = null;
    this.stepsHistory = [];

    this.stepService.getStepsByLotId(lotId)
      .pipe(first())
      .subscribe({
        next: (steps: Step[]) => {
          this.stepsHistory = steps.sort((a, b) => {
            const dateA = `${a.stepDate} ${a.stepTime}`;
            const dateB = `${b.stepDate} ${b.stepTime}`;
            return dateA.localeCompare(dateB);
          });
        
          this.isLoadingSteps = false;

          if (this.stepsHistory.length === 0) {
            this.errorStepMessage = 'No hay pasos registrados aún para este lote.';
          }
        },
        error: (error) => {
          console.error('Error al cargar historial de pasos:', error);
          this.errorStepMessage = 'Error al obtener el historial de trazabilidad.';
          this.isLoadingSteps = false;
        }
      });
  }

  formatHash(hash: string): string {
    if (!hash || hash.length < 8) {
      return '**********';
    }
    return `${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`;
  }

  getRoleTitle(stepType: string, index: number): string {
    if (index === 0) return 'Productor';
    if (stepType.includes('Procesamiento')) return 'Procesador';
    if (stepType.includes('Empaque')) return 'Empacador';
    return 'Entidad Externa';
  }
}
