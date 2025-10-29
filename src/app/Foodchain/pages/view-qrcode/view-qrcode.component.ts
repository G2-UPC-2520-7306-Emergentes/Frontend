import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, first } from 'rxjs/operators';
import { of } from 'rxjs';


import { BatchService } from '../../services/batch.service';
import { StepService } from '../../services/step.service';
import { Batch } from '../../model/batch.entity';
import { Step } from '../../model/step.entity';

@Component({
  selector: 'app-view-qrcode',
  standalone: true,
  templateUrl: './view-qrcode.component.html',
  styleUrls: ['./view-qrcode.component.css'],
  imports: [CommonModule]
})
export class ViewQrcodeComponent implements OnInit {


  batchId: string | null = null;
  batchDetails: Batch | null = null;
  stepsHistory: Step[] = [];

  // Estado de la UI
  isLoading: boolean = true;
  errorMessage: string | null = null;
  activeTab: 'details' | 'history' = 'details';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private batchService: BatchService,
    private stepService: StepService
  ) { }

  ngOnInit(): void {

    this.route.paramMap.pipe(
      switchMap(params => {
        this.batchId = params.get('lotId');

        if (!this.batchId) {
          this.errorMessage = 'ID de Lote no proporcionado en la URL (QR Inválido).';
          this.isLoading = false;
          return of(null);
        }


        return this.batchService.getBatchById(this.batchId);
      }),
      first()
    ).subscribe({
      next: (batch: Batch | null) => {
        this.batchDetails = batch;

        if (batch) {

          this.loadStepsHistory(batch.id);
        } else {
          this.errorMessage = `Lote con ID ${this.batchId} no encontrado.`;
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar datos del QR:', err);
        this.errorMessage = 'Error al conectar con los servicios de trazabilidad.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga y ordena el historial de pasos para el lote.
   */
  loadStepsHistory(lotId: string): void {
    this.stepService.getStepsByLotId(lotId)
      .pipe(first())
      .subscribe({
        next: (steps: Step[] | null) => {
          if (steps && steps.length > 0) {

            this.stepsHistory = steps.sort((a, b) => {
              const dateA = `${a.stepDate} ${a.stepTime}`;
              const dateB = `${b.stepDate} ${b.stepTime}`;
              return dateA.localeCompare(dateB);
            });
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar historial:', err);

          this.errorMessage = this.errorMessage || 'Error al cargar el historial de trazabilidad.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Cambia la pestaña activa.
   */
  setActiveTab(tab: 'details' | 'history'): void {
    this.activeTab = tab;
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
    return 'Entidad Externa';
  }
}
