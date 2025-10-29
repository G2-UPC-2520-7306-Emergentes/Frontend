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

  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-batch.component.html',
  styleUrls: ['./edit-batch.component.css'],
})
export class EditBatchComponent implements OnInit {


  editForm: FormGroup;


  private initialBatchData: BatchEditData = {
    nombreLote: 'Lote 2023-10-26 (Editar)',
    nombreFinca: 'Finca El Paraíso',
    variedad: 'Heirloom Tomates',
    fechaCosecha: '2023-10-26',
    descripcion: 'Este es un lote activo con excelente trazabilidad. Modifica los campos necesarios.',
  };

  isLoading: boolean = false;


  constructor(private fb: FormBuilder, private router: Router) {
    // Inicializamos el formulario en el constructor
    this.editForm = this.fb.group({
      nombreLote: ['', Validators.required],
      nombreFinca: ['', Validators.required],
      variedad: ['', Validators.required],
      fechaCosecha: ['', Validators.required],
      descripcion: [''],

    });
  }

  ngOnInit(): void {

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



      setTimeout(() => {
        this.isLoading = false;
        alert('Datos de lote actualizados (Simulación)');

      }, 1500);

    } else {
      console.log('El formulario no es válido. Revise los campos requeridos.');

      this.editForm.markAllAsTouched();
    }
  }

  cancelEdit(): void {
    console.log('Edición cancelada.');

    this.router.navigate(['/sidenav/view-batch']);

  }
}
