import {Component, OnInit, SecurityContext} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { first, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { DomSanitizer, SafeUrl,  } from '@angular/platform-browser';

import { QRCodeComponent } from 'angularx-qrcode';

import { Batch } from '../../model/batch.entity';
import { BatchService } from '../../services/batch.service';
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

  steps: Step[] = [];

  qrData: string = '';
  qrUrl: string = '';
  qrGenerated: boolean = false;


  qrImageURL: string = '';

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private batchService: BatchService,
    private stepService: StepService,

    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
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
          this.loadBatchSteps(batch.id);
        } else if (!this.errorMessage) {
          this.errorMessage = `Lote con ID ${id} no encontrado.`;
        }
      });
  }

  loadBatchSteps(lotId: string | number): void {
    this.stepService.getStepsByLotId(lotId)
      .pipe(
        first(),
        catchError((error) => {
          console.error('Error al cargar pasos de trazabilidad:', error);
          return of([]);
        })
      )
      .subscribe((steps: Step[]) => {
        this.steps = steps.sort((a, b) => new Date(a.stepDate).getTime() - new Date(b.stepDate).getTime());
      });
  }

  generateQRUrl(id: string | number): void {
    const baseUrl = window.location.origin;
    this.qrUrl = `${baseUrl}/view-qrcode/${id}`;
    this.qrData = this.qrUrl;
    this.qrGenerated = true;
  }

  /**
   * 🚨 MÉTODO CORREGIDO: Usa DomSanitizer para extraer el string del SafeUrl.
   * @param url La URL de datos generada por el componente <qrcode>.
   */
  captureQRData(url: SafeUrl): void {

    const rawUrl = this.sanitizer.sanitize(SecurityContext.URL, url);
    this.qrImageURL = rawUrl || '';
  }

  editBatch(): void {
    if (this.batchId) {
      this.router.navigate([`/sidenav/edit-batch/${this.batchId}`]);
    }
  }

  /**
   * Método que toma la URL de datos del QR (Base64) y fuerza la descarga como archivo PNG.
   */
  downloadQR(): void {
    if (!this.qrImageURL || !this.batchData) {
      console.error('QR code data or batch data not available.');

      alert('El código QR no está listo para descargar. Intente de nuevo.');
      return;
    }

    try {

      const dataURL = this.qrImageURL;


      const a = document.createElement('a');


      a.href = dataURL;


      const fileName = `QR_Lote_${this.batchData.id}_${this.batchData.lotName.replace(/\s/g, '_')}.png`;
      a.download = fileName;


      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (e) {
      console.error('Error al descargar el QR.', e);
      alert('Ocurrió un error al intentar descargar el QR.');
    }
  }
}
