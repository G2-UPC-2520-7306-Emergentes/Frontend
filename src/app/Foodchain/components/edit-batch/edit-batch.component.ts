import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {BatchService, BatchUpdatePayload} from '../../services/batch.service';
import {Batch} from '../../model/batch.entity';




@Component({
  selector: 'app-edit-batch',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-batch.component.html',
  styleUrls: ['./edit-batch.component.css'],
})
export class EditBatchComponent implements OnInit {

  editForm!: FormGroup;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  batchId!: string;
  private currentBatchData!: Batch;

  // 💡 Valor de placeholder para la imagen que no se enviará al API si no se modifica
  private defaultImageUrlPlaceholder: string = 'NO_IMAGE_UPLOADED';


  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private route: ActivatedRoute,
    private batchService: BatchService
  ) {
    this.editForm = this.fb.group({
      nombreLote: ['', Validators.required],
      nombreFinca: ['', Validators.required],
      variedad: ['', Validators.required],
      fechaCosecha: ['', Validators.required],
      // 💡 Agregamos el control de la imagen, con el placeholder inicial
      imageUrl: [this.defaultImageUrlPlaceholder]
    });
  }

  ngOnInit(): void {
    const idFromRoute = this.route.snapshot.paramMap.get('batchId');
    this.batchId = idFromRoute || '';

    if (!this.batchId) {
      this.errorMessage = 'Error: ID de lote no proporcionado en la URL.';
      this.isLoading = false;
      return;
    }

    this.loadBatchData(this.batchId);
  }

  loadBatchData(id: string): void {
    this.isLoading = true;

    this.batchService.getBatchById(id)
      .pipe(
        first(),
        catchError((error) => {
          console.error('Error al cargar lote:', error);
          this.errorMessage = 'No se pudo cargar la información del lote. Verifique que el lote exista.';
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe((batch: Batch | null) => {
        if (batch) {
          this.currentBatchData = batch;

          // Mapear las propiedades reales del Batch a los controles del formulario
          this.editForm.patchValue({
            nombreLote: batch.lotName,
            nombreFinca: batch.farmName,
            variedad: batch.variety,
            fechaCosecha: batch.harvestDate,
            // 💡 Usamos la URL real si existe, o el placeholder para mantener el estado del control
            imageUrl: batch.imageUrl || this.defaultImageUrlPlaceholder,
          });
        } else {
          this.errorMessage = this.errorMessage || 'Lote no encontrado o error en el servicio.';
        }
        this.isLoading = false;
      });
  }

  get f() { return this.editForm.controls; }

  /**
   * Maneja el envío del formulario: Actualiza el lote.
   */
  onSubmit(): void {
    if (this.editForm.valid && this.batchId) {
      this.isLoading = true;

      const formValues = this.editForm.value;

      // 1. Mapear los datos editables
      const editedFields: BatchUpdatePayload = {
        lotName: formValues.nombreLote,
        farmName: formValues.nombreFinca,
        variety: formValues.variedad,
        harvestDate: formValues.fechaCosecha,
      };

      // LÓGICA DE IMAGEN
      const currentImageUrl = formValues.imageUrl;
      if (currentImageUrl !== this.defaultImageUrlPlaceholder) {
        editedFields.imageUrl = currentImageUrl;
      } else if (this.currentBatchData.imageUrl) {
        editedFields.imageUrl = this.currentBatchData.imageUrl;
      } else {
        delete editedFields.imageUrl;
      }

      // 2. Fusionar el lote original con los campos editados
      const fullUpdatePayload = {
        ...this.currentBatchData, // Copia todos los campos originales
        ...editedFields           // Sobreescribe los campos editados
      };

      // 3. 💡 SOLUCIÓN TS2790: Usar desestructuración para crear un nuevo objeto sin 'id'
      // Extraemos el id y el resto de las propiedades las metemos en payloadToSend
      const { id, ...payloadToSend } = fullUpdatePayload;

      // Aseguramos el tipo final para el servicio
      const finalPayload = payloadToSend as unknown as BatchUpdatePayload;


      // 4. Enviar el payload completo sin el ID
      this.batchService.updateBatch(this.batchId, finalPayload)
        .pipe(
          first(),
          catchError((error) => {
            console.error('Fallo final en la actualización:', error);
            this.isLoading = false;
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response) {
            alert('Datos de lote actualizados exitosamente.');
            this.router.navigate(['/sidenav/view-batch']);
          }
          this.isLoading = false;
        });

    } else {
      console.log('El formulario no es válido. Revise los campos requeridos.');
      this.editForm.markAllAsTouched();
    }
  }

  // 💡 Función simulada para manejar la carga de imagen desde el botón "Buscar archivo"
  onImageFileSelect(event: any): void {
    // Simulación: Asigna una URL de ejemplo al control del formulario
    const simulatedUrl = 'https://example.com/new-batch-image-upload-2025.jpg';
    this.f['imageUrl'].setValue(simulatedUrl);
    alert('Simulación: Imagen cargada y lista para guardar.');
  }

  cancelEdit(): void {
    console.log('Edición cancelada.');
    this.router.navigate(['/sidenav/view-batch']);
  }
}
