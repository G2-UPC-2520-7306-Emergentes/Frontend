import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import {Batch} from '../../model/batch.entity';
import {BatchService} from '../../services/batch.service';
import {SessionService} from '../../services/session.service'; // Usaremos first() para desuscribirnos

// La interfaz BatchListItem ya no es necesaria si usamos la entidad Batch directamente.
// Pero la mantenemos si tu HTML depende de ella, ajustando los tipos.

@Component({
  selector: 'app-view-batch',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './view-batch.component.html',
  styleUrls: ['./view-batch.component.css'],
})
export class ViewBatchComponent implements OnInit {

  // 🚨 Usamos la entidad real Batch. Esta será la lista filtrada que se muestre en el HTML.
  filteredBatches: Batch[] = [];

  // Variables para la interfaz
  searchText: string = '';
  currentPage: number = 1;
  totalPages: number = 1;

  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    // 🚨 Inyectar los servicios
    private batchService: BatchService,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    // 🚨 Llamamos a la nueva función de carga y filtrado al iniciar el componente
    this.loadBatchesByProducer();
  }

  /**
   * Carga todos los lotes de la API y filtra solo los que corresponden al productor conectado.
   */
  loadBatchesByProducer(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // 1. Obtener el ID del usuario conectado
    const connectedUserId = this.sessionService.getUserId();

    if (!connectedUserId) {
      this.errorMessage = 'No se pudo obtener la sesión. Inicie sesión.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    // 2. Llamar al BatchService para obtener todos los lotes
    this.batchService.getAllBatches()
      .pipe(first()) // Nos desuscribimos después de recibir los datos una vez
      .subscribe({
        next: (allBatches: Batch[]) => {
          // 3. Filtrar los lotes en el frontend
          this.filteredBatches = allBatches.filter(
            // Asumimos que la entidad Batch tiene una propiedad 'producer_id'
            (batch: Batch) => batch.producer_id === connectedUserId
          );

          this.isLoading = false;

          if (this.filteredBatches.length === 0) {
            this.errorMessage = `¡Hola Productor ${connectedUserId}! Aún no tienes lotes registrados.`;
          }
        },
        error: (error) => {
          console.error('Error al cargar lotes:', error);
          this.errorMessage = 'Ocurrió un error al cargar los lotes desde el servidor.';
          this.isLoading = false;
        }
      });
  }

  // Métodos de navegación (Asegúrate de que tus rutas esperan el batchId)
  viewDetail(batchId: string): void {
    this.router.navigate([`/sidenav/details-batch/${batchId}`]);
  }

  editBatch(batchId: string): void {
    this.router.navigate([`/sidenav/edit-batch/${batchId}`]);
  }

  generateQR(batchId: string): void {
    console.log(`Acción: Generar QR para el lote: ${batchId}`);
    // Lógica para generación de QR
  }

  closeBatch(batchId: string): void {
    console.log(`Acción: Cerrar lote para el lote: ${batchId}`);
    // Lógica para actualizar el estado del lote a 'Cerrado'
  }
}
