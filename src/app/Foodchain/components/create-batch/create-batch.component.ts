import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http'; // <-- HttpClient es clave
import { BatchCreatePayload, BatchService } from '../../services/batch.service';
import { Batch } from '../../model/batch.entity';
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
  selectedFile: File | null = null;

  // 🔑 CONFIGURACIONES DE CLOUDINARY (Usa tus credenciales)
  private CLOUDINARY_CLOUD_NAME = 'dwrfcod77';
  private CLOUDINARY_UPLOAD_PRESET = 'lote_images'; // <-- Asegúrate que este preset es UNSEIGNED


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private batchService: BatchService,
    private sessionService: SessionService,
    private http: HttpClient // Inyectamos HttpClient
  ) {}

  ngOnInit(): void {
    this.batchForm = this.fb.group({
      lotName: ['', Validators.required],
      farmName: ['', Validators.required],
      variety: ['', Validators.required],
      harvestDate: ['', Validators.required],
      description: [''],
    });
  }

  // Captura del archivo se mantiene igual
  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  /**
   * Maneja el envío del formulario: 1. Sube a Cloudinary, 2. Crea el Lote con la URL.
   */
  async onSubmit(): Promise<void> { // <-- Se convierte en ASÍNCRONA

    // 1. Validaciones
    if (this.batchForm.invalid || !this.selectedFile) {
      this.batchForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos y selecciona un archivo de imagen.');
      return;
    }

    const connectedUserId = this.sessionService.getUserId();
    if (!connectedUserId) {
      alert('Error de sesión. Por favor, vuelva a iniciar sesión.');
      this.router.navigate(['/login']);
      return;
    }

    // --- FASE 1: SUBIDA A CLOUDINARY ---

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', this.selectedFile, this.selectedFile.name);
    cloudinaryFormData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);

    let imageUrl: string = '';

    try {
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`;

      // La subida debe esperar la respuesta, por eso usamos 'await' con 'toPromise()'
      const cloudinaryResponse = await this.http
        .post<any>(cloudinaryUrl, cloudinaryFormData)
        .toPromise();

      // Obtener la URL pública que usaremos en la base de datos
      imageUrl = cloudinaryResponse!.secure_url;
      console.log('Imagen subida a Cloudinary. URL:', imageUrl);

    } catch (error) {
      console.error('Error al subir la imagen directamente a Cloudinary:', error);
      alert('Error al subir la imagen a Cloudinary. Revisa la consola y tu configuración.');
      return; // Detener el proceso
    }

    // --- FASE 2: CREACIÓN DEL LOTE (JSON) ---

    const payload: BatchCreatePayload = {
      ...this.batchForm.value,
      imageUrl: imageUrl, // <-- Enviamos la URL obtenida de Cloudinary
      producer_id: connectedUserId
    };

    // 3. Enviar Payload a tu Backend usando el BatchService estándar (solo JSON)
    this.batchService.createBatch(payload)
      .subscribe({
        next: (batch) => {
          if (batch) {
            alert(`Lote '${batch.lotName}' creado exitosamente con ID: ${batch.id}`);
            this.router.navigate(['/sidenav/details-batch', batch.id]);
          }
        },
        error: (error) => {
          // Manejo de error de la API del lote
          console.error('Error al crear el lote JSON:', error);
        }
      });
  }
}
