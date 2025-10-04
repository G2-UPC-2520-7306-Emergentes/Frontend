import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Para enlaces de acciones
import { FormsModule } from '@angular/forms'; // Necesario para el input de búsqueda
import { Router } from '@angular/router';

// Interfaz que representa una fila en la tabla
interface BatchListItem {
  id: string;
  lote: string;
  estado: 'Activo' | 'Cerrado' | 'En Revisión';
  fechaCreacion: string;
  ultimaActividad: string;
  // Acciones (no son parte de la interfaz de datos, pero se muestran en la fila)
}

@Component({
  selector: 'app-view-batch',
  standalone: true,
  // Incluimos FormsModule para el input de búsqueda y CommonModule para *ngFor, etc.
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './view-batch.component.html',
  styleUrls: ['./view-batch.component.css'],
})
export class ViewBatchComponent implements OnInit {

  // ✅ Datos de lote inicializados directamente para visualización
  availableBatches: BatchListItem[] = [
    { id: '123', lote: 'Lote A123 (ID: 456)', estado: 'Activo', fechaCreacion: '2023-08-15', ultimaActividad: '2023-08-20' },
    { id: '789', lote: 'Lote B456 (ID: 789)', estado: 'Cerrado', fechaCreacion: '2023-07-20', ultimaActividad: '2023-07-25' },
    { id: '101', lote: 'Lote C789 (ID: 101)', estado: 'En Revisión', fechaCreacion: '2023-06-10', ultimaActividad: '2023-06-15' },
    { id: '123a', lote: 'Lote D012 (ID: 123)', estado: 'Activo', fechaCreacion: '2023-05-05', ultimaActividad: '2023-05-10' },
    { id: '456a', lote: 'Lote E345 (ID: 456)', estado: 'Cerrado', fechaCreacion: '2023-04-12', ultimaActividad: '2023-04-17' },
    { id: '789a', lote: 'Lote F678 (ID: 789)', estado: 'En Revisión', fechaCreacion: '2023-03-20', ultimaActividad: '2023-03-25' },
    { id: '101a', lote: 'Lote G901 (ID: 101)', estado: 'Activo', fechaCreacion: '2023-02-15', ultimaActividad: '2023-02-20' },
    { id: '123b', lote: 'Lote H234 (ID: 123)', estado: 'Cerrado', fechaCreacion: '2023-01-08', ultimaActividad: '2023-01-13' },
  ];

  // Variables para la interfaz (búsqueda y paginación)
  searchText: string = '';
  currentPage: number = 1;
  totalPages: number = 13; // Fijo para simulación

  isLoading: boolean = false;
  errorMessage: string | null = null;

  // 🛑 Constructor vacío
  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('Componente ViewBatch cargado con datos fijos.');
  }

  // Métodos de simulación para las acciones
  viewDetail(batchId: string): void {
    console.log(`Acción: Ver detalle para el lote: ${batchId}`);

    // FUTURO: Navegar a /sidenav/batches/${batchId}
    this.router.navigate(['/sidenav/details-batch']);

  }

  editBatch(batchId: string): void {
    console.log(`Acción: Editar para el lote: ${batchId}`);
    // FUTURO: Navegar al formulario de edición
    this.router.navigate(['/sidenav/edit-batch']);

  }

  generateQR(batchId: string): void {
    console.log(`Acción: Generar QR para el lote: ${batchId}`);
  }

  closeBatch(batchId: string): void {
    console.log(`Acción: Cerrar lote para el lote: ${batchId}`);
  }
}
