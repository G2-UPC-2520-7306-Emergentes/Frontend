import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

// 🚨 Importar la librería de QR

import { QRCodeComponent } from 'angularx-qrcode';

import {Batch} from '../../model/batch.entity';
import {BatchService} from '../../services/batch.service';
import {SessionService} from '../../services/session.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-view-batch',
  standalone: true,
  // 🚨 Añadir QRCodeModule a los imports
  imports: [CommonModule, RouterLink, FormsModule, QRCodeComponent],
  templateUrl: './view-batch.component.html',
  styleUrls: ['./view-batch.component.css'],
})
export class ViewBatchComponent implements OnInit {

  filteredBatches: Batch[] = [];

  searchText: string = '';
  currentPage: number = 1;
  totalPages: number = 1;

  isLoading: boolean = false;
  errorMessage: string | null = null;

  // 🚨 Nuevas propiedades para la generación de QR
  showQrModal: boolean = false;
  qrData: string = ''; // URL a codificar
  qrCodeBatchId: string = ''; // ID para mostrar en el modal

  constructor(
    private router: Router,
    private batchService: BatchService,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    this.loadBatchesByProducer();
  }

  loadBatchesByProducer(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const connectedUserId = this.sessionService.getUserId();

    if (!connectedUserId) {
      this.errorMessage = 'No se pudo obtener la sesión. Inicie sesión.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    this.batchService.getAllBatches()
      .pipe(
        first(),
        catchError((error) => {
          console.error('Error al cargar lotes:', error);
          this.errorMessage = 'Ocurrió un error al cargar los lotes desde el servidor.';
          this.isLoading = false;
          return of([]); // Devuelve un observable de un array vacío
        })
      )
      .subscribe((allBatches: Batch[]) => {
        this.filteredBatches = allBatches.filter(
          // Asumimos que la entidad Batch tiene una propiedad 'producer_id'
          (batch: Batch) => batch.producer_id === connectedUserId
        );

        this.isLoading = false;

        if (this.filteredBatches.length === 0 && !this.errorMessage) {
          this.errorMessage = `¡Hola Productor ${connectedUserId}! Aún no tienes lotes registrados.`;
        }
      });
  }

  viewDetail(batchId: string): void {
    this.router.navigate([`/sidenav/details-batch/${batchId}`]);
  }

  editBatch(batchId: string): void {
    this.router.navigate([`/sidenav/edit-batch/${batchId}`]);
  }

  /**
   * Genera la URL pública del lote y activa la visualización del QR.
   * @param batchId El ID del lote para el QR.
   */
  generateQR(batchId: string | number): void {
    const baseUrl = window.location.origin;
    // Esta URL debe apuntar al ViewQrcodeComponent (asumo que está en tu router)
    const qrCodeUrl = `${baseUrl}/view-qrcode/${batchId}`;

    // 1. Asignar datos
    this.qrData = qrCodeUrl;
    this.qrCodeBatchId = String(batchId);

    // 2. 🚨 CLAVE: Activar el modal
    this.showQrModal = true;

    // Opcional: Agregar un console.log para verificar que se ejecuta
    console.log("Generando QR para URL:", this.qrData);
  }

  /**
   * Cierra el modal/panel del QR.
   */
  closeQrModal(): void {
    this.showQrModal = false;
    this.qrData = '';
    this.qrCodeBatchId = '';
  }

  closeBatch(batchId: string): void {
    console.log(`Acción: Cerrar lote para el lote: ${batchId}`);
    // Lógica para actualizar el estado del lote a 'Cerrado'
  }
}
