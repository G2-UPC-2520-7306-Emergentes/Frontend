import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms'; // 💡 Añadimos FormControl
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BatchCreatePayload, BatchService } from '../../services/batch.service';
import { SessionService } from '../../services/session.service';
import { Observable, Observer } from 'rxjs';

// 1. 📋 ESTRUCTURA DEL CATÁLOGO DE PRODUCTOS Y VARIEDADES
interface VarietyOption {
  type: string;
  varieties: string[];
}

const PRODUCT_CATALOG: VarietyOption[] = [
  {
    type: 'Café',
    varieties: ['Caturra', 'Typica', 'Geisha', 'Catuai', 'Bourbon', 'Pacamara'],
  },
  {
    type: 'Papa',
    varieties: ['Amarilla', 'Huayro', 'Canchan', 'Peruanita', 'Tumbay', 'Yungay'],
  },
  {
    type: 'Cacao',
    varieties: ['Blanco de Piura', 'CCN-51', 'Chuncho', 'Criollo'],
  },
  {
    type: 'Mango', // Fruta de exportación
    varieties: ['Kent', 'Haden', 'Ataúlfo', 'Edward'],
  },
  {
    type: 'Uva', // Común en la costa
    varieties: ['Red Globe', 'Sugraone', 'Crimson Seedless', 'Italia'],
  },
  {
    type: 'Quinua', // Grano andino
    varieties: ['Blanca de Junín', 'Roja', 'Negra', 'Pasankalla'],
  },
  {
    type: 'Maíz', // Ampliamente cultivado
    varieties: ['Choclo', 'Gigante del Cusco', 'Canchita', 'Maíz Morado'],
  },
];

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
  isLoading: boolean = false;

  // 2. 🔑 PROPIEDADES PARA CONTROLAR LA DOBLE LISTA
  productTypes: string[] = PRODUCT_CATALOG.map(item => item.type);
  selectedProductType: string = ''; // Almacena la selección del primer dropdown
  availableVarieties: string[] = []; // Opciones para el segundo dropdown

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

      // 💡 Necesitas un control para el Tipo de Producto que no se guarda en la entidad,
      // pero usaremos 'variety' para almacenar el string FINAL.
      productTypeControl: ['', Validators.required], // ⬅️ NUEVO CONTROL PARA EL PRIMER DROPDOWN

      variety: ['', Validators.required], // ⬅️ SEGUNDO DROPDOWN (almacenará la variedad específica)

      harvestDate: ['', Validators.required],
      description: [''],
    });
  }

  // 4. 🔗 LÓGICA DE DEPENDENCIA AL SELECCIONAR EL TIPO DE PRODUCTO
  onProductTypeSelected(): void {
    // Obtenemos el valor del control 'productTypeControl'
    this.selectedProductType = this.batchForm.get('productTypeControl')?.value || '';

    // 1. Resetear el control 'variety' y las opciones disponibles
    this.batchForm.patchValue({ variety: '' });
    this.availableVarieties = [];

    // 2. Buscar las variedades correspondientes al tipo seleccionado
    const selectedCatalog = PRODUCT_CATALOG.find(
      item => item.type === this.selectedProductType
    );

    // 3. Actualizar la lista para el dropdown de variedades
    this.availableVarieties = selectedCatalog ? selectedCatalog.varieties : [];
  }

  // ... (onFileSelected y convertFileToBase64 se mantienen sin cambios) ...

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

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


  /**
   * Maneja el envío del formulario: 1. Convierte a Base64, 2. Combina Tipo + Variedad, 3. Crea el Lote.
   */
  async onSubmit(): Promise<void> {

    // 1. Validaciones
    // Nota: Aunque productTypeControl y variety son requeridos, revisamos el formulario.
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
    let base64ImageString: string | undefined;

    // --- FASE 1 & 2: CONVERSIÓN Y CREACIÓN DEL LOTE ---
    try {

      // 1. CONVERSIÓN A BASE64
      base64ImageString = await this.convertFileToBase64(this.selectedFile!)
        .toPromise() as string | undefined;

      if (!base64ImageString) {
        throw new Error("La conversión Base64 devolvió un valor nulo.");
      }

      console.log('Imagen convertida a Base64 (Hash):', base64ImageString.substring(0, 50) + '...');

      // 2. 🔑 CREACIÓN DEL STRING UNIFICADO (Ej: "Café - Caturra")
      const finalVarietyString =
        `${this.batchForm.get('productTypeControl')?.value} - ${this.batchForm.get('variety')?.value}`;


      // 3. CREACIÓN DEL PAYLOAD
      const formValue = this.batchForm.value;

      const payload: BatchCreatePayload = {
        lotName: formValue.lotName,
        farmName: formValue.farmName,

        // 🔑 ASIGNAMOS EL STRING UNIFICADO AL CAMPO 'variety'
        variety: finalVarietyString,

        harvestDate: formValue.harvestDate,
        description: formValue.description,

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
            this.isLoading = false;
            console.error('Error al crear el lote JSON:', error);
            alert('Error al crear el lote. Revisa la consola para más detalles.');
          }
        });

    } catch (error) {
      console.error('Error durante el proceso de lote:', error);
      alert('Error en la creación o procesamiento de la imagen del lote.');
      this.isLoading = false;
    }
  }
}
