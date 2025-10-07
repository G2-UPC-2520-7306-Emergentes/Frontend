import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {BatchCreatePayload, BatchService} from '../../services/batch.service';
import {Batch} from '../../model/batch.entity';
import { SessionService } from '../../services/session.service'; // Ajusta la ruta

@Component({
  selector: 'app-create-batch',
  standalone: true,
  templateUrl: './create-batch.component.html',
  styleUrls: ['./create-batch.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule, RouterLink]
})
export class CreateBatchComponent implements OnInit {

  batchForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private batchService: BatchService,
    // La inyección del SessionService es CORRECTA
    private sessionService: SessionService
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
      imageUrl: ['https://www.ciencuadras.com/blog/wp-content/uploads/2022/10/beneficios-de-comprar-un-lote-o-terreno.jpg'],
      // 🚨 CORRECCIÓN: ELIMINAR producer_id del formulario. Lo inyectaremos al hacer submit.
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

    // 🚨 PASO 1: Obtener y validar el ID del usuario conectado
    const connectedUserId = this.sessionService.getUserId();

    if (!connectedUserId) {
      alert('Error de sesión. Por favor, vuelva a iniciar sesión.');
      this.router.navigate(['/login']); // Redirigir si no hay ID
      return;
    }

    // 2. Construir el payload final, inyectando el producer_id
    const payload: BatchCreatePayload = {
      // Copia todos los valores del formulario
      ...this.batchForm.value,
      // 🚀 Asigna el producer_id obtenido del servicio (la forma correcta)
      producer_id: connectedUserId
    };

    // 3. Llama al servicio para crear el lote
    this.batchService.createBatch(payload)
      .subscribe((batch: Batch | null) => {
        if (batch) {
          alert(`Lote '${batch.lotName}' creado exitosamente con ID: ${batch.id} por el productor: ${batch.producer_id}`);
          // 4. Redirigir al dashboard o a la vista de detalles del lote
          this.router.navigate(['/sidenav/details-batch']);
        }
        // Si es null, el servicio ya mostró un mensaje de error.
      });
  }
}
