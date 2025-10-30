// En duplicate-batch.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Batch } from '../../model/batch.entity'; // Asegúrate de que esta entidad Batch esté correcta
import { BatchService } from '../../services/batch.service';
import {SessionService} from '../../services/session.service'; // Asegúrate de la ruta
import { Router } from '@angular/router'; // 👈 IMPORTANTE: Asegúrate de importar Router
// Nota: Puedes reutilizar o adaptar esta interfaz.
// Si los datos de BatchService ya coinciden, podrías usar directamente Batch.
interface DuplicableBatch {
  id: string;
  lotName: string;
  createdDate: string; // En un escenario real, harías más fácil el mapeo o dejarías el Date
  varietyAndFarm: string;
  state: 'Activo' | 'Cerrado' | 'Procesado';
  imageUrl: string;
  // producer_id: string; // No es necesario exponerlo aquí si se usa solo para el filtro.
}

@Component({
  selector: 'app-duplicate-batch',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './duplicate-batch.component.html',
  styleUrls: ['./duplicate-batch.component.css'],
})
export class DuplicateBatchComponent implements OnInit {

  // Inicializa como un array vacío, no con datos fijos.
  availableBatches: DuplicableBatch[] = [];

  isLoading: boolean = false;
  errorMessage: string | null = null;


  // 💡 Inyectar los servicios
  constructor(
    private batchService: BatchService,
    private sessionService: SessionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBatchesByProducer();
  }

  /**
   * Carga los lotes filtrados según el ID del usuario conectado.
   */
  loadBatchesByProducer(): void {
    const userId = this.sessionService.getUserId();

    if (!userId) {
      this.errorMessage = 'Error: No hay un usuario conectado. No se pueden cargar los lotes.';
      console.error(this.errorMessage);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.batchService.getBatchesByProducerId(userId).subscribe({
      next: (batches: Batch[]) => {
        // 🚀 Mapear los datos de Batch a DuplicableBatch
        this.availableBatches = batches.map(batch => ({
          id: batch.id,
          lotName: batch.lotName,
          createdDate: this.formatDate(batch.harvestDate), // Ajusta según tu entidad Batch y cómo la quieres mostrar
          varietyAndFarm: `Variedad: ${batch.variety} / Finca: ${batch.farmName}`, // Asumiendo que Batch tiene variety y farmName
          // Mapea el estado correctamente. Esto puede requerir lógica si el estado es un código.
          state: (batch.state as 'Activo' | 'Cerrado' | 'Procesado') || 'Activo', // Asumiendo un campo 'state'
          imageUrl: batch.imageUrl || 'assets/images/default.png' // Usa una imagen por defecto si no hay
        })) as DuplicableBatch[];
        this.isLoading = false;
        console.log(`Lotes del productor ${userId} cargados:`, this.availableBatches);
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los lotes. Inténtalo más tarde.';
        this.isLoading = false;
        console.error('Error al suscribirse para cargar lotes:', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Función auxiliar para formatear la fecha (ejemplo).
   */
  private formatDate(dateString: string): string {
    // Lógica simple de formato. Idealmente usarías DatePipe o algo más robusto.
    try {
      return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateString;
    }
  }


  /**
   * Maneja la lógica de duplicación.
   * @param batchId El ID del lote a duplicar.
   */
  duplicateBatch(batchId: string): void {
    console.log(`Función Duplicar llamada para el ID: ${batchId}`);

    this.router.navigate(['/sidenav/duplicate-form', batchId]);
  }

}
