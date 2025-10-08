import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { first, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Importar el componente de QR
import { QRCodeComponent } from 'angularx-qrcode';

import { Batch } from '../../model/batch.entity';
import { BatchService } from '../../services/batch.service';
// 🚨 NUEVAS IMPORTACIONES
import { Step } from '../../model/step.entity';
import { StepService } from '../../services/step.service';

@Component({
  selector: 'app-details-batch',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './details-batch.component.html',
  styleUrls: ['./details-batch.component.css'],
})
export class DetailsBatchComponent implements OnInit {

  batchId: string | null = null;
  batchData: Batch | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Propiedad para almacenar los pasos
  steps: Step[] = [];

  // Propiedades del QR
  qrData: string = '';
  qrUrl: string = '';
  qrGenerated: boolean = false;

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private batchService: BatchService,
    private stepService: StepService // 🚨 Inyectar StepService
  ) { }

  ngOnInit(): void {
    // 🚨 NOTA IMPORTANTE: Si tu ruta es /details-batch/:id, cambia 'batchId' por 'id' aquí.
    this.batchId = this.route.snapshot.paramMap.get('batchId');

    if (this.batchId) {
      this.loadBatchDetails(this.batchId);
    } else {
      this.errorMessage = 'No se proporcionó un ID de lote.';
      this.isLoading = false;
    }
  }

  loadBatchDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.batchService.getBatchById(id)
      .pipe(
        first(),
        catchError((error) => {
          this.errorMessage = `Error: No se pudo cargar el lote con ID ${id}.`;
          this.isLoading = false;
          console.error('Error al cargar lote:', error);
          return of(null);
        })
      )
      .subscribe((batch: Batch | null) => {
        this.isLoading = false;
        if (batch) {
          this.batchData = batch;
          this.generateQRUrl(batch.id);
          // 🚨 CLAVE: Llamar a la carga de pasos inmediatamente después
          this.loadBatchSteps(batch.id);
        } else if (!this.errorMessage) {
          this.errorMessage = `Lote con ID ${id} no encontrado.`;
        }
      });
  }

  /**
   * Carga todos los pasos relacionados con este lote.
   * @param lotId ID del lote.
   */
  loadBatchSteps(lotId: string | number): void {
    this.stepService.getStepsByLotId(lotId)
      .pipe(
        first(),
        catchError((error) => {
          console.error('Error al cargar pasos de trazabilidad:', error);
          // Solo logueamos el error, no interrumpimos la vista del lote
          return of([]);
        })
      )
      .subscribe((steps: Step[]) => {
        // 🚨 Ordenar por fecha del paso para mostrar cronológicamente
        this.steps = steps.sort((a, b) => new Date(a.stepDate).getTime() - new Date(b.stepDate).getTime());
      });
  }

  generateQRUrl(id: string | number): void {
    const baseUrl = window.location.origin;
    this.qrUrl = `${baseUrl}/view-qrcode/${id}`;
    this.qrData = this.qrUrl;
    this.qrGenerated = true;
  }

  editBatch(): void {
    if (this.batchId) {
      this.router.navigate([`/sidenav/edit-batch/${this.batchId}`]);
    }
  }
}
