import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BatchCreatePayload, BatchService } from '../../services/batch.service';
import { SessionService } from '../../services/session.service';
import { Observable, Observer } from 'rxjs'; // Necesario para la conversión a Base64

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
  isLoading: boolean = false; // Estado de carga para el envío

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private batchService: BatchService,
    private sessionService: SessionService,
    private http: HttpClient
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

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  /**
   * Convierte un objeto File a una cadena Base64 (Data URL).
   * @param file El archivo File seleccionado.
   * @returns Un Observable que emite la cadena Base64.
   */
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

      // Leemos el archivo como una URL de datos (Base64)
      reader.readAsDataURL(file);
    });
  }

  /**
   * Maneja el envío del formulario: 1. Convierte a Base64, 2. Crea el Lote con el string Base64.
   */
  async onSubmit(): Promise<void> {

    // 1. Validaciones iniciales
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

    this.isLoading = true;

    // Declaramos la variable que contendrá el Base64 (puede ser undefined si toPromise falla)
    let base64ImageString: string | undefined;

    // --- FASE 1 & 2: CONVERSIÓN Y CREACIÓN DEL LOTE (En bloque try unificado) ---
    try {

      // 1. CONVERSIÓN A BASE64
      // Usamos el operador ! para asegurar a TS que selectedFile no es null aquí.
      // Usamos 'as string | undefined' para tipar correctamente toPromise, que está obsoleto.
      base64ImageString = await this.convertFileToBase64(this.selectedFile!)
        .toPromise() as string | undefined;

      // 2. VERIFICACIÓN CRÍTICA
      if (!base64ImageString) {
        throw new Error("La conversión Base64 devolvió un valor nulo.");
      }

      console.log('Imagen convertida a Base64 (Hash):', base64ImageString.substring(0, 50) + '...');

      // 3. CREACIÓN DEL PAYLOAD (Dentro del contexto seguro donde base64ImageString es string)
      const payload: BatchCreatePayload = {
        ...this.batchForm.value,
        // ✅ base64ImageString es string aquí, sin necesidad del operador !
        imageUrl: base64ImageString,
        producer_id: connectedUserId
      };

      // 4. Enviar Payload a tu Backend
      this.batchService.createBatch(payload)
        .subscribe({
          next: (batch) => {
            this.isLoading = false;
            if (batch) {
              alert(`Lote '${batch.lotName}' creado exitosamente con ID: ${batch.id}`);
              this.router.navigate(['/sidenav/details-batch', batch.id]);
            }
          },
          error: (error) => {
            // Manejo de error de la API del lote
            console.error('Error al crear el lote JSON:', error);
            alert('Error al crear el lote. Revisa la consola para más detalles.');
          }
        });

    } catch (error) {
      // 5. CAPTURA DE CUALQUIER ERROR (conversión o verificación)
      console.error('Error durante el proceso de lote:', error);
      alert('Error en la creación o procesamiento de la imagen del lote.');
      this.isLoading = false;
      // Retornar en el catch asegura que el proceso se detiene.
    }
  }
}
