import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // 💡 Importamos HttpClient
import { first } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {Batch} from '../../model/batch.entity';
import {BatchService, BatchUpdatePayload} from '../../services/batch.service';




@Component({
  selector: 'app-edit-batch',
  standalone: true,
  // 💡 Agregamos HttpClientModule
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './edit-batch.component.html',
  styleUrls: ['./edit-batch.component.css'],
})
export class EditBatchComponent implements OnInit {

  editForm!: FormGroup;
  isLoading: boolean = true;
  isSaving: boolean = false; // 💡 Nuevo estado para el guardado
  errorMessage: string | null = null;
  batchId!: string;
  // 💡 CORREGIDO: Permite ser null al inicio para evitar TS2531
  protected currentBatchData: Batch | null = null;

  // 💡 Nuevo: Estado para el archivo seleccionado
  selectedFile: File | null = null;

  // 🔑 CONFIGURACIONES DE CLOUDINARY (Usa tus credenciales)
  private CLOUDINARY_CLOUD_NAME = 'dwrfcod77';
  private CLOUDINARY_UPLOAD_PRESET = 'lote_images'; // <-- Asegúrate que este preset es UNSEIGNED


  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private route: ActivatedRoute,
    private batchService: BatchService,
    private http: HttpClient // 💡 Inyectamos HttpClient
  ) {
    this.editForm = this.fb.group({
      nombreLote: ['', Validators.required],
      nombreFinca: ['', Validators.required],
      variedad: ['', Validators.required],
      fechaCosecha: ['', Validators.required],
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
          });
        } else {
          this.errorMessage = this.errorMessage || 'Lote no encontrado o error en el servicio.';
        }
        this.isLoading = false;
      });
  }

  /**
   * 💡 Nuevo: Captura el archivo de imagen seleccionado por el usuario.
   */
  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      // 💡 Seguridad extra en la consola:
      console.log('Archivo seleccionado:', this.selectedFile?.name);
    } else {
      this.selectedFile = null;
      console.log('Selección de archivo cancelada.');
    }
  }

  get f() { return this.editForm.controls; }

  /**
   * Maneja el envío del formulario: 1. Sube imagen (si existe), 2. Actualiza el lote.
   */
  async onSubmit(): Promise<void> {
    if (this.editForm.invalid || this.isSaving) {
      this.editForm.markAllAsTouched();
      return;
    }

    // Si el lote original no se cargó por alguna razón, no continuar.
    if (!this.currentBatchData) {
      alert('Error interno: Los datos del lote original no están disponibles.');
      return;
    }

    this.isSaving = true;
    let newImageUrl: string | undefined;

    // --- FASE 1: SUBIDA A CLOUDINARY (Solo si se seleccionó un nuevo archivo) ---
    if (this.selectedFile) {
      try {
        const cloudinaryFormData = new FormData();
        // 💡 Uso seguro de 'selectedFile' y 'selectedFile.name' ya que está dentro del IF
        cloudinaryFormData.append('file', this.selectedFile, this.selectedFile.name);
        cloudinaryFormData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`;

        // Nota: toPromise() está deprecado, pero se mantiene por consistencia
        const cloudinaryResponse = await this.http
          .post<any>(cloudinaryUrl, cloudinaryFormData)
          .toPromise();

        newImageUrl = cloudinaryResponse!.secure_url;
        console.log('Nueva imagen subida a Cloudinary. URL:', newImageUrl);

      } catch (error) {
        console.error('Error al subir la imagen a Cloudinary:', error);
        alert('Error crítico al subir la imagen. La actualización del lote ha sido cancelada.');
        this.isSaving = false;
        return;
      }
    }

    // --- FASE 2: CONSTRUCCIÓN DEL PAYLOAD Y ACTUALIZACIÓN ---

    // Mapear los datos editables a la estructura real de la entidad Batch
    const editedFields: BatchUpdatePayload = {
      lotName: this.f['nombreLote'].value,
      farmName: this.f['nombreFinca'].value,
      variety: this.f['variedad'].value,
      harvestDate: this.f['fechaCosecha'].value,
    };

    // Lógica de URL de Imagen:
    if (newImageUrl) {
      // Caso 1: Se subió una nueva imagen.
      editedFields.imageUrl = newImageUrl;
    } else if (this.currentBatchData.imageUrl) {
      // Caso 2: No se subió una nueva imagen, pero el lote ya tenía una.
      editedFields.imageUrl = this.currentBatchData.imageUrl;
    }
    // Si no hay newImageUrl ni currentBatchData.imageUrl, la propiedad imageUrl simplemente no se incluye
    // en editedFields, preservando el comportamiento de la API.


    // Fusionar el lote original con los campos editados para preservar metadatos
    const fullUpdatePayload = {
      ...this.currentBatchData,
      ...editedFields
    };

    // Usar desestructuración para crear un nuevo objeto sin 'id' (soluciona TS2790)
    const { id, ...payloadToSend } = fullUpdatePayload;
    // Aseguramos que la descripción (que es opcional y no estaba en el FormGroup) se mantenga

    const finalPayload = payloadToSend as unknown as BatchUpdatePayload;


    // Enviar la actualización
    this.batchService.updateBatch(this.batchId, finalPayload)
      .pipe(
        first(),
        catchError((error) => {
          console.error('Fallo final en la actualización:', error);
          this.isSaving = false;
          return of(null);
        })
      )
      .subscribe((response) => {
        this.isSaving = false;
        if (response) {
          alert('Datos de lote actualizados exitosamente.');
          this.router.navigate(['/sidenav/view-batch']);
        }
      });
  }

  cancelEdit(): void {
    console.log('Edición cancelada.');
    this.router.navigate(['/sidenav/view-batch']);
  }
}
