import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; // Para obtener el ID y la navegación
import { first, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Importar el componente de QR
import { QRCodeComponent } from 'angularx-qrcode';

import { Batch } from '../../model/batch.entity';
import { BatchService } from '../../services/batch.service';
import { SessionService } from '../../services/session.service'; // Aunque no se usa directamente, es buena práctica

@Component({
  selector: 'app-details-batch',
  standalone: true,
  // ✅ Importar QRCodeComponent y módulos de Angular
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './details-batch.component.html',
  styleUrls: ['./details-batch.component.css'],
})
export class DetailsBatchComponent implements OnInit {

  batchId: string | null = null;
  batchData: Batch | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Propiedades del QR
  qrData: string = '';
  qrUrl: string = ''; // URL que se genera para el QR

  // Se usa para asegurar que la URL se genere una sola vez
  qrGenerated: boolean = false;

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private batchService: BatchService
  ) { }

  ngOnInit(): void {
    // 1. Obtener el batchId de la URL
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
          // 🚨 Generar el QR inmediatamente después de cargar los datos
          this.generateQRUrl(batch.id);
        } else if (!this.errorMessage) {
          this.errorMessage = `Lote con ID ${id} no encontrado.`;
        }
      });
  }

  /**
   * Construye la URL pública que será codificada en el QR.
   * @param id El ID del lote.
   */
  generateQRUrl(id: string | number): void {
    const baseUrl = window.location.origin;
    // URL pública que apunta al componente de vista pública (ViewQrcodeComponent)
    this.qrUrl = `${baseUrl}/view-qrcode/${id}`;
    this.qrData = this.qrUrl; // Los datos del QR son la URL
    this.qrGenerated = true; // Marca como generado
  }

  editBatch(): void {
    if (this.batchId) {
      this.router.navigate([`/sidenav/edit-batch/${this.batchId}`]);
    }
  }
}
