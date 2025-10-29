import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {BatchCreatePayload, BatchService} from '../../services/batch.service';
import {Batch} from '../../model/batch.entity';
import { SessionService } from '../../services/session.service';

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

    private sessionService: SessionService
  ) {}

  ngOnInit(): void {

    this.batchForm = this.fb.group({

      lotName: ['', Validators.required],
      farmName: ['', Validators.required],
      variety: ['', Validators.required],
      harvestDate: ['', Validators.required],


      description: [''],
      imageUrl: ['https://www.ciencuadras.com/blog/wp-content/uploads/2022/10/beneficios-de-comprar-un-lote-o-terreno.jpg'],

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


    const connectedUserId = this.sessionService.getUserId();

    if (!connectedUserId) {
      alert('Error de sesión. Por favor, vuelva a iniciar sesión.');
      this.router.navigate(['/login']);
      return;
    }


    const payload: BatchCreatePayload = {

      ...this.batchForm.value,

      producer_id: connectedUserId
    };


    this.batchService.createBatch(payload)
      .subscribe((batch: Batch | null) => {
        if (batch) {
          alert(`Lote '${batch.lotName}' creado exitosamente con ID: ${batch.id} por el productor: ${batch.producer_id}`);

          this.router.navigate(['/sidenav/details-batch']);
        }

      });
  }
}
