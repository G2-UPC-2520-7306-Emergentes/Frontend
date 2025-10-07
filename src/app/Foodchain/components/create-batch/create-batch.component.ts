import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {BatchCreatePayload, BatchService} from '../../services/batch.service';
import {Batch} from '../../model/batch.entity';

@Component({
  selector: 'app-create-batch',
  standalone: true,
  templateUrl: './create-batch.component.html',
  styleUrls: ['./create-batch.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule]
})
export class CreateBatchComponent implements OnInit {

  batchForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private batchService: BatchService
  ) {}

  ngOnInit(): void {
    // Inicialización del formulario reactivo para crear un lote
    this.batchForm = this.fb.group({
      // Campos obligatorios según la entidad y la UI
      lotName: ['', Validators.required],
      farmName: ['', Validators.required],
      variety: ['', Validators.required],
      harvestDate: ['', Validators.required], // Debe ser un string en formato YYYY-MM-DD

      // Campos opcionales (Description y Image URL)
      description: [''],
      imageUrl: [''] // En una app real, esto manejaría la subida de archivos
    });
  }

  /**
   * Maneja el envío del formulario para crear el lote.
   */
  onSubmit(): void {
    if (this.batchForm.invalid) {
      this.batchForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    // 1. Prepara el payload para el servicio
    const payload: BatchCreatePayload = this.batchForm.value;

    // El servicio se encarga de crear la entidad Batch y asignarle 'createdDate' y 'state'

    // 2. Llama al servicio para crear el lote
    this.batchService.createBatch(payload)
      .subscribe((batch: Batch | null) => {
        if (batch) {
          alert(`Lote '${batch.lotName}' creado exitosamente con ID: ${batch.id}`);
          // 3. Redirigir al dashboard o a la vista de detalles del lote
          this.router.navigate(['/dashboard']);
        }
        // Si es null, el servicio ya mostró un mensaje de error.
      });
  }

  // Getter para acceso fácil a los controles en el HTML
  get f() {
    return this.batchForm.controls;
  }
}
