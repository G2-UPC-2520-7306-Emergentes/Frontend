import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Batch } from '../../model/batch.entity';
import { RouterLink } from '@angular/router';


interface DuplicableBatch {
  id: string;
  lotName: string;
  createdDate: string;
  varietyAndFarm: string;
  state: 'Activo' | 'Cerrado' | 'Procesado';
  imageUrl: string;
}

@Component({
  selector: 'app-duplicate-batch',

  standalone: true,

  imports: [CommonModule, RouterLink],

  templateUrl: './duplicate-batch.component.html',
  styleUrls: ['./duplicate-batch.component.css'],
})
export class DuplicateBatchComponent implements OnInit {


  availableBatches: DuplicableBatch[] = [
    {
      id: 'LOT-2023-07-15',
      lotName: 'Lote 2023-07-15',
      createdDate: '15 de julio de 2023',
      varietyAndFarm: 'Variedad: Arábica / Finca: El Paraíso',
      state: 'Activo',
      imageUrl: 'assets/images/coffee1.png'
    },
    {
      id: 'LOT-2023-08-22',
      lotName: 'Lote 2023-08-22',
      createdDate: '22 de agosto de 2023',
      varietyAndFarm: 'Variedad: Robusta / Finca: La Esperanza',
      state: 'Cerrado',
      imageUrl: 'assets/images/coffee2.png'
    },
    {
      id: 'LOT-2023-09-10',
      lotName: 'Lote 2023-09-10',
      createdDate: '10 de septiembre de 2023',
      varietyAndFarm: 'Variedad: Typica / Finca: Santa Clara',
      state: 'Activo',
      imageUrl: 'assets/images/coffee3.png'
    },
  ];

  isLoading: boolean = false;
  errorMessage: string | null = null;


  constructor() { }

  ngOnInit(): void {
    console.log('Componente DuplicateBatch cargado con lotes disponibles (datos fijos).');
  }

  /**
   * Maneja la lógica de duplicación.
   * En el futuro, aquí harías una llamada al BatchService.
   * @param batchId El ID del lote a duplicar.
   */
  duplicateBatch(batchId: string): void {
    console.log(`Función Duplicar llamada para el ID: ${batchId}`);
    // 🚨 FUTURO: Aquí iría la lógica de llamada a la API y navegación.
    // this.batchService.duplicate(batchId).subscribe(...)
  }


}
