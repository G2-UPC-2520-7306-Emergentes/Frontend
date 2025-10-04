import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Router} from '@angular/router';

// Interfaz para el modelo de datos del formulario
interface BatchEditData {
  nombreLote: string;
  nombreFinca: string;
  variedad: string;
  fechaCosecha: string;
  descripcion: string;
}

@Component({
  selector: 'app-edit-batch',
  standalone: true,
  // 🚨 CRUCIAL: Importamos ReactiveFormsModule para usar FormGroups
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-batch.component.html',
  styleUrls: ['./edit-batch.component.css'],
})
export class EditBatchComponent implements OnInit {

  // Formulario que agrupa los controles
  editForm: FormGroup;

  // Datos de lote fijos para simular la edición
  private initialBatchData: BatchEditData = {
    nombreLote: 'Lote 2023-10-26 (Editar)',
    nombreFinca: 'Finca El Paraíso',
    variedad: 'Heirloom Tomates',
    fechaCosecha: '2023-10-26',
    descripcion: 'Este es un lote activo con excelente trazabilidad. Modifica los campos necesarios.',
  };

  isLoading: boolean = false;

  // Inyectamos FormBuilder para construir el formulario
  constructor(private fb: FormBuilder, private router: Router) {
    // Inicializamos el formulario en el constructor
    this.editForm = this.fb.group({
      nombreLote: ['', Validators.required],
      nombreFinca: ['', Validators.required],
      variedad: ['', Validators.required],
      fechaCosecha: ['', Validators.required],
      descripcion: [''],
      // El control de imagen se manejará por separado o se añadirá aquí
    });
  }

  ngOnInit(): void {
    // Cargamos los datos de prueba en el formulario al iniciar
    this.editForm.patchValue(this.initialBatchData);
    console.log('Componente EditBatch cargado con datos de lote fijos para edición.');
  }

  /**
   * Maneja el envío del formulario al hacer clic en "Guardar cambios".
   */
  onSubmit(): void {
    if (this.editForm.valid) {
      console.log('Formulario de Edición Lote Enviado:', this.editForm.value);
      this.isLoading = true;

      // 🚨 FUTURO: Aquí harías la llamada al BatchService para actualizar los datos.
      // this.batchService.update(this.editForm.value).subscribe(...)

      setTimeout(() => {
        this.isLoading = false;
        alert('Datos de lote actualizados (Simulación)');
        // FUTURO: Navegar de vuelta a la vista de detalles
      }, 1500);

    } else {
      console.log('El formulario no es válido. Revise los campos requeridos.');
      // Marcar todos los campos como 'touched' para mostrar los errores de validación
      this.editForm.markAllAsTouched();
    }
  }

  cancelEdit(): void {
    console.log('Edición cancelada.');
    // FUTURO: Navegar de vuelta a la vista de lotes o detalles.
    this.router.navigate(['/sidenav/view-batch']);

  }
}
