import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Batch } from '../../model/batch.entity'; // Asegúrate de que esta clase exista

export type BatchDetailView = 'summary' | 'history' | 'qr';

@Component({
  selector: 'app-details-batch',
  // Es crucial que sea standalone
  standalone: true,
  // Solo necesitamos CommonModule y RouterLink
  imports: [CommonModule, RouterLink],
  templateUrl: './details-batch.component.html',
  styleUrls: ['./details-batch.component.css'],
})
export class DetailsBatchComponent implements OnInit {

  // ✅ Datos de lote inicializados directamente para visualización
  // Ya no es 'null'
  batch: Batch = {
    id: 'LOT-PRUEBA-FIJA-001',
    lotName: 'Lote de Café Arábica Supremo',
    farmName: 'Finca El Tesoro (Datos Fijos)',
    variety: 'Bourbon Rojo',
    harvestDate: '2025-05-01',
    createdDate: '2025-06-15',
    state: 'Tostado y Empaquetado',
    imageUrl: 'https://placehold.co/600x400/215732/ffffff?text=LOTE+FIJO',
    // Puedes añadir más propiedades según tu clase Batch...
  } as Batch;

  // ✅ Estados de carga fijos para asegurar la visualización
  isLoading: boolean = false; // Siempre falso para mostrar el contenido
  errorMessage: string | null = null; // Siempre nulo

  currentView: BatchDetailView = 'summary';

  // 🛑 ELIMINAMOS la inyección de BatchService para evitar el NG0200
  constructor() { }

  ngOnInit(): void {
    // Ya no es necesario llamar a loadBatchDetails(), los datos ya están listos.
    console.log('Componente DetailsBatch cargado con datos fijos.');
  }

  // ELIMINAMOS loadBatchDetails() ya que los datos son fijos.

  changeView(view: BatchDetailView): void {
    this.currentView = view;
  }
}
