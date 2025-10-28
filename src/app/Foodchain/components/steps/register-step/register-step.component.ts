import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { first } from 'rxjs/operators';
import {Batch} from '../../../model/batch.entity';
import {StepCreatePayload, StepService} from '../../../services/step.service';
import {SessionService} from '../../../services/session.service';
import {BatchService} from '../../../services/batch.service';
import {Step} from '../../../model/step.entity';

// 🚨 Importar Servicios y Entidades

@Component({
  selector: 'app-register-step',
  standalone: true,
  templateUrl: './register-step.component.html',
  styleUrls: ['./register-step.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule, RouterLink]
})
export class RegisterStepComponent implements OnInit {

  stepForm!: FormGroup;

  // Lista de lotes filtrados por usuario
  availableLots: Batch[] = [];

  stepTypes: string[] = ['Productor', 'Procesador', 'Empacador', 'Inspector de Calidad', 'Distribuidor', 'Retailer'];

  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private stepService: StepService,
    private sessionService: SessionService,
    private batchService: BatchService // Inyectado
  ) { }

  ngOnInit(): void {
    // 1. Inicializar formulario
    this.initForm();
    // 2. Cargar los lotes específicos del usuario
    this.loadUserBatches();
  }

  // Función para obtener fecha y hora actuales en formato compatible
  getCurrentDateTime(): { date: string, time: string } {
    const now = new Date();
    // Formato YYYY-MM-DD para el input type="date"
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // Formato HH:MM para el input type="time"
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    return { date: dateString, time: timeString };
  }

  initForm(): void {
    // Obtener la fecha y hora actuales
    const currentDateTime = this.getCurrentDateTime();

    this.stepForm = this.fb.group({
      lotId: ['', Validators.required],
      stepType: ['', Validators.required],
      // CAMBIO 1: Configurar el valor inicial y deshabilitar el control
      stepDate: [{ value: currentDateTime.date, disabled: true }, Validators.required],
      // CAMBIO 2: Configurar el valor inicial y deshabilitar el control
      stepTime: [{ value: currentDateTime.time, disabled: true }, Validators.required],
      location: ['', Validators.required],
      observations: [''],
    });
  }

  /**
   * Obtiene el ID del usuario, llama al BatchService y filtra los lotes.
   */
  loadUserBatches(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const connectedUserId = this.sessionService.getUserId();

    if (!connectedUserId) {
      this.errorMessage = 'Error: ID de usuario no disponible. Inicie sesión.';
      this.isLoading = false;
      return;
    }

    // Obtener todos los lotes y filtrar por el ID del usuario
    this.batchService.getAllBatches()
      .pipe(first())
      .subscribe({
        next: (allBatches: Batch[]) => {
          this.availableLots = allBatches.filter(
            (batch: Batch) => batch.producer_id === connectedUserId
          );
          this.isLoading = false;

          if (this.availableLots.length === 0) {
            this.errorMessage = 'No tienes lotes para registrar un paso.';
            this.stepForm.get('lotId')?.disable();
          }
        },
        error: (error) => {
          console.error('Error al cargar lotes para el usuario:', error);
          this.errorMessage = 'Error al conectar con el servicio de lotes.';
          this.isLoading = false;
        }
      });
  }

  get f() { return this.stepForm.controls; }

  /**
   * Maneja el envío del formulario para registrar el paso.
   */
  onSubmit(): void {
    // Es crucial usar getRawValue() para incluir los campos deshabilitados (stepDate y stepTime)
    const rawFormValues = this.stepForm.getRawValue();

    if (this.stepForm.invalid) {
      this.stepForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos para el paso.');
      return;
    }

    const connectedUserId = this.sessionService.getUserId();

    if (!connectedUserId) {
      alert('Error de sesión. ID de usuario no disponible.');
      this.router.navigate(['/login']);
      return;
    }

    // Usar rawFormValues para obtener todos los campos, incluidos los deshabilitados
    const formValues = rawFormValues;

    // Construcción del payload incluyendo los IDs y el hash vacío
    const payload: StepCreatePayload = {
      ...formValues,
      // Asegurar que los campos deshabilitados estén presentes
      stepDate: formValues.stepDate,
      stepTime: formValues.stepTime,
      lotId: formValues.lotId,
      userId: connectedUserId,
      hash: '', // Inicialmente vacío
    };

    this.stepService.createStep(payload)
      .subscribe((step: Step | null) => {
        if (step) {
          alert(`Paso registrado exitosamente para el Lote ID: ${step.lotId}`);
          this.router.navigate(['/sidenav/view-batch']);
        }
      });
  }
}
