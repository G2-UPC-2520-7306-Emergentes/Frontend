import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import {Batch} from '../../model/batch.entity';
import {BatchCreatePayload, BatchService} from '../../services/batch.service';
import {SessionService} from '../../services/session.service';

@Component({
  selector: 'app-duplicate-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './duplicate-form.component.html',
  styleUrls: ['./duplicate-form.component.css']
})
export class DuplicateFormComponent implements OnInit {

  batchForm!: FormGroup;
  originalBatchId!: string;
  originalBatch: Batch | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    protected router: Router,
    private batchService: BatchService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadOriginalBatch();
  }

  /**
   * Inicializa el formulario reactivo con los campos editables.
   */
  initForm(): void {
    this.batchForm = this.fb.group({
      // Campos obligatorios y únicos (deben ser modificados)
      lotName: ['', Validators.required],
      harvestDate: [this.getTodayDate(), Validators.required],

      // Campos copiados y editables
      farmName: ['', Validators.required],
      variety: ['', Validators.required],
      imageUrl: [''], // Campo opcional
    });
  }

  /**
   * Obtiene la fecha de hoy en formato 'YYYY-MM-DD' para el input type="date".
   */
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Carga los datos del lote original a partir del ID en la URL y pre-llena el formulario.
   */
  loadOriginalBatch(): void {
    // 1. Obtener el ID de la URL
    this.route.params.pipe(
      switchMap(params => {
        this.originalBatchId = params['id'];
        if (this.originalBatchId) {
          // 2. Llamar al servicio para obtener el lote por ID
          return this.batchService.getBatchById(this.originalBatchId);
        }
        this.errorMessage = 'ID de lote no proporcionado para duplicación.';
        return of(null);
      })
    ).subscribe({
      next: (batch) => {
        this.isLoading = false;
        if (batch) {
          this.originalBatch = batch;
          this.patchForm(batch);
        } else {
          this.errorMessage = `No se pudo cargar el lote con ID: ${this.originalBatchId}.`;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al cargar los datos del lote original.';
        console.error(err);
      }
    });
  }

  /**
   * Pre-llena el formulario con los datos del lote original, ajustando los campos únicos.
   */
  patchForm(batch: Batch): void {
    // 💡 Creamos un nombre temporal único
    const newLotName = `${batch.lotName} (Copia - ${this.getTodayDate()})`;

    this.batchForm.patchValue({
      // 🚨 AJUSTES CLAVE
      lotName: newLotName,
      harvestDate: this.getTodayDate(), // Nueva fecha de cosecha

      // ✅ CAMPOS COPIADOS
      farmName: batch.farmName,
      variety: batch.variety,
      imageUrl: batch.imageUrl,
    });
  }

  /**
   * Maneja el envío del formulario para crear el nuevo lote.
   */
  onSubmit(): void {
    if (this.batchForm.invalid) {
      this.batchForm.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    const userId = this.sessionService.getUserId();
    if (!userId) {
      this.errorMessage = 'Sesión no válida. Por favor, inicia sesión de nuevo.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValues = this.batchForm.value;

    // 2. Preparar el payload para la creación del nuevo lote
    const newBatchPayload: BatchCreatePayload = {
      lotName: formValues.lotName,
      farmName: formValues.farmName,
      variety: formValues.variety,
      harvestDate: formValues.harvestDate,
      imageUrl: formValues.imageUrl,
      producer_id: userId,
    };

    // 3. Llamada al servicio para crear el nuevo lote
    this.batchService.createBatch(newBatchPayload).subscribe({
      next: (newBatch) => {
        this.isSaving = false;
        if (newBatch) {
          this.successMessage = `Lote duplicado y creado exitosamente: ${newBatch.lotName}`;
          // 4. Redirigir al usuario a la lista de lotes
          setTimeout(() => {
            this.router.navigate(['/sidenav/duplicate-batch']);
          }, 2000);

        } else {
          // El error ya fue manejado por el service, solo actualizamos el estado
          this.errorMessage = 'Fallo en la creación del lote. Revisa la consola y el mensaje de error anterior.';
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = 'Error desconocido al guardar el nuevo lote.';
        console.error('Error de guardado:', err);
      }
    });
  }

  /**
   * Helper para determinar si un campo debe mostrar error de validación.
   */
  isFieldInvalid(field: string): boolean | undefined {
    const control = this.batchForm.get(field);
    return control?.invalid && (control?.dirty || control?.touched);
  }
}
