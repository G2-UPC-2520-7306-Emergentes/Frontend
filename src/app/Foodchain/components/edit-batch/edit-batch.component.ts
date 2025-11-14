import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { first } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { of, Observable, Observer } from 'rxjs'; // 💡 Importamos Observable y Observer
import {Batch} from '../../model/batch.entity';
import {BatchService, BatchUpdatePayload} from '../../services/batch.service';


@Component({
  selector: 'app-edit-batch',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './edit-batch.component.html',
  styleUrls: ['./edit-batch.component.css'],
})
export class EditBatchComponent implements OnInit {

  editForm!: FormGroup;
  isLoading: boolean = true;
  isSaving: boolean = false;
  errorMessage: string | null = null;
  batchId!: string;
  protected currentBatchData: Batch | null = null;
  selectedFile: File | null = null;

  // ❌ Eliminadas: CLOUDINARY_CLOUD_NAME y CLOUDINARY_UPLOAD_PRESET


  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private route: ActivatedRoute,
    private batchService: BatchService,
    private http: HttpClient // Se mantiene HttpClient, aunque ya no se use para Cloudinary, podría ser necesario en el futuro.
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
   * Captura el archivo de imagen seleccionado por el usuario.
   */
  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      console.log('Archivo seleccionado:', this.selectedFile?.name);
    } else {
      this.selectedFile = null;
      console.log('Selección de archivo cancelada.');
    }
  }

  // 💡 NUEVO: Función para convertir el archivo seleccionado a Base64 (hash)
  private convertFileToBase64(file: File): Observable<string> {
    return new Observable((observer: Observer<string>) => {
      const reader = new FileReader();

      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };

      reader.onerror = (error) => {
        observer.error(error);
      };
      reader.readAsDataURL(file);
    });
  }

  get f() { return this.editForm.controls; }

  /**
   * Maneja el envío del formulario: 1. Convierte imagen a Base64 (si existe), 2. Actualiza el lote.
   */
  async onSubmit(): Promise<void> {
    if (this.editForm.invalid || this.isSaving) {
      this.editForm.markAllAsTouched();
      return;
    }

    if (!this.currentBatchData) {
      alert('Error interno: Los datos del lote original no están disponibles.');
      return;
    }

    this.isSaving = true;
    let newImageUrl: string | undefined;

    // --- FASE 1: CONVERSIÓN A BASE64 (Solo si se seleccionó un nuevo archivo) ---
    if (this.selectedFile) {
      try {
        // 1. CONVERSIÓN A BASE64
        const base64ImageString = await this.convertFileToBase64(this.selectedFile!)
          .toPromise() as string | undefined; // toPromise() es legacy, pero se mantiene si es necesario.

        if (!base64ImageString) {
          throw new Error("La conversión Base64 devolvió un valor nulo.");
        }

        newImageUrl = base64ImageString;
        console.log('Nueva imagen convertida a Base64 (Hash):', newImageUrl.substring(0, 50) + '...');

      } catch (error) {
        console.error('Error al convertir la imagen a Base64:', error);
        alert('Error crítico al procesar la imagen. La actualización del lote ha sido cancelada.');
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
      // Caso 1: Se convirtió una nueva imagen (Base64).
      editedFields.imageUrl = newImageUrl;
    } else if (this.currentBatchData.imageUrl) {
      // Caso 2: No se seleccionó una nueva imagen. Mantenemos el valor existente (Base64 o URL legacy).
      editedFields.imageUrl = this.currentBatchData.imageUrl;
    }


    // Fusionar el lote original con los campos editados
    const fullUpdatePayload = {
      ...this.currentBatchData,
      ...editedFields
    };

    const { id, ...payloadToSend } = fullUpdatePayload;
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
