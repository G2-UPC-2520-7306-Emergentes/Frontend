import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { first, switchMap, catchError} from 'rxjs/operators';
import {of, EMPTY, forkJoin} from 'rxjs';
import { GoogleMapsModule } from '@angular/google-maps';

import { Batch } from '../../../model/batch.entity';
import { User } from '../../../model/user.entity';
import { StepCreatePayload, StepService } from '../../../services/step.service';
import { SessionService } from '../../../services/session.service';
import { BatchService } from '../../../services/batch.service';
import { Step } from '../../../model/step.entity';
import { UserService } from '../../../services/user.service';

// ===========================================
// 1. CATÁLOGO DE PASOS DE PROCESO (Step Catalog)
// ===========================================

interface StepCatalogItem {
  productType: string;
  steps: string[];
}

const STEP_CATALOG: StepCatalogItem[] = [
  {
    productType: 'Café',
    steps: [
      'Cosecha',
      'Despulpado',
      'Fermentación',
      'Lavado',
      'Secado',
      'Trillado',
      'Tostado',
      'Empaque',
      'Envío a Centro de Distribución',
      'Recepción en Punto de Venta',
    ],
  },
  {
    productType: 'Papa',
    steps: [
      'Cosecha',
      'Selección y Calibración',
      'Almacenamiento en cámara fría',
      'Empaque para distribución',
      'Envío a Centro de Distribución',
      'Recepción en Punto de Venta',
    ],
  },
  {
    productType: 'Cacao',
    steps: [
      'Cosecha',
      'Fermentación en cajas',
      'Secado al sol',
      'Almacenamiento',
      'Venta a Procesador',
    ],
  },
  {
    productType: 'Mango',
    steps: [
      'Cosecha',
      'Selección y Limpieza',
      'Tratamiento Post-cosecha (agua caliente)',
      'Empaque para exportación',
      'Envío a Puerto/Aeropuerto',
      'Recepción en Distribuidor',
      'Recepción en Punto de Venta',
    ],
  },
  {
    productType: 'Uva',
    steps: [
      'Cosecha Manual',
      'Despalillado y Prensado',
      'Fermentación Inicial',
      'Embotellado/Empaque',
      'Envío a Centro de Distribución',
      'Recepción en Punto de Venta',
    ],
  },
  {
    productType: 'Quinua',
    steps: [
      'Cosecha',
      'Trilla',
      'Desaponificación (Lavado)',
      'Secado',
      'Envasado',
      'Envío a Centro de Distribución',
      'Recepción en Punto de Venta',
    ],
  },
  {
    productType: 'Maíz',
    steps: [
      'Cosecha',
      'Secado de Mazorca',
      'Desgrane',
      'Almacenamiento',
      'Empaque',
      'Envío a Centro de Distribución',
      'Recepción en Punto de Venta',
    ],
  },
];


@Component({
  selector: 'app-register-step',
  standalone: true,
  templateUrl: './register-step.component.html',
  styleUrls: ['./register-step.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule, GoogleMapsModule]
})
export class RegisterStepComponent implements OnInit {

  stepForm!: FormGroup;
  availableLots: Batch[] = [];
  availableStepTypes: string[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  currentUser!: User;
  selectedLot: Batch | undefined;

  mapOptions: google.maps.MapOptions = {};
  markerOptions: google.maps.MarkerOptions = { draggable: false };
  center: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  zoom: number = 15;


  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private stepService: StepService,
    private sessionService: SessionService,
    private batchService: BatchService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadUserBatches();
    this.loadGeolocation();

    // Suscribirse a cambios en lotId para actualizar la lista de pasos
    this.stepForm.get('lotId')?.valueChanges.subscribe(() => {
      this.onLotSelected();
    });
  }

  getCurrentDateTime(): { date: string, time: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    return { date: dateString, time: timeString };
  }


  initForm(): void {
    const currentDateTime = this.getCurrentDateTime();

    this.stepForm = this.fb.group({
      lotId: ['', Validators.required],
      stepType: [{ value: '', disabled: true }, Validators.required],
      stepDate: [{ value: currentDateTime.date, disabled: true }, Validators.required],
      stepTime: [{ value: currentDateTime.time, disabled: true }, Validators.required],
      location: [{ value: 'Cargando ubicación...', disabled: true }, Validators.required],
      observations: [''],
      status: ['pending'],
    });
  }

  loadGeolocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const locationString = `${lat}, ${lon}`;

          this.stepForm.get('location')?.setValue(locationString);

          this.center = { lat: lat, lng: lon };
          this.mapOptions = {
            center: this.center,
            zoom: this.zoom,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
          };
          this.markerOptions = { position: this.center, title: 'Ubicación del Paso' };

        },
        (error) => {
          console.error('Error de geolocalización:', error);
          this.stepForm.get('location')?.setValue('Geolocalización no disponible. Permiso denegado.');
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      this.stepForm.get('location')?.setValue('Geolocation no soportada por este navegador.');
    }
  }

  /**
   * Carga lotes visibles para el usuario según su rol/empresa.
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

    this.userService.getById(connectedUserId).pipe(
      first(),
      catchError((error) => {
        console.error('Error al cargar el usuario:', error);
        this.errorMessage = 'No se pudo cargar la información de su perfil.';
        this.isLoading = false;
        return EMPTY;
      }),
      switchMap((user: User) => {
        this.currentUser = user;
        return forkJoin({
          allBatches: this.batchService.getAllBatches().pipe(
            catchError(() => of([] as Batch[]))
          ),
          allUsers: this.userService.getAll().pipe(
            catchError(() => of([] as User[]))
          )
        });
      }),
      catchError((error) => {
        console.error('Error al cargar datos:', error);
        this.errorMessage = 'Ocurrió un error al cargar los datos necesarios.';
        this.isLoading = false;
        return of({ allBatches: [], allUsers: [] });
      })
    )
      .subscribe(({ allBatches, allUsers }) => {
        let lotesVisibles: Batch[] = [];
        const currentUserIdString = String(connectedUserId);

        if (this.currentUser.companyOption === 'create') {
          lotesVisibles = allBatches.filter(
            (batch: Batch) => String(batch.producer_id) === currentUserIdString
          );
        } else if (this.currentUser.companyOption === 'join') {
          const adminUser = allUsers.find(
            u => u.companyName === this.currentUser.companyName && u.companyOption === 'create'
          );

          if (adminUser) {
            const adminIdString = String(adminUser.id);
            lotesVisibles = allBatches.filter(
              (batch: Batch) => String(batch.producer_id) === adminIdString
            );
          } else {
            this.errorMessage = 'Empresa sin administrador registrado para asignar lotes.';
          }
        }

        this.availableLots = lotesVisibles;
        this.isLoading = false;

        if (this.availableLots.length === 0) {
          this.errorMessage = 'No tienes lotes activos disponibles para registrar un paso.';
          this.stepForm.get('lotId')?.disable();
        } else {
          this.stepForm.get('lotId')?.enable();
        }
      });
  }

  /**
   * Se ejecuta al seleccionar un lote y carga los pasos asociados.
   */
  onLotSelected(): void {
    const lotId = this.stepForm.get('lotId')?.value;

    // 1. Encontrar el lote seleccionado
    this.selectedLot = this.availableLots.find(lot => String(lot.id) === String(lotId));

    // 2. Resetear el campo de paso y su lista
    this.stepForm.get('stepType')?.setValue('');
    this.availableStepTypes = [];

    if (this.selectedLot) {

      // 🐛 DEBUG 1: Muestra el valor completo del campo 'variety' del lote
      console.log('DEBUG 1: Lote seleccionado:', this.selectedLot.lotName);
      console.log('DEBUG 2: Campo variety del Lote:', this.selectedLot.variety);

      // El formato de variety es: "TipoProducto - VariedadEspecifica" (Ej: "Café - Caturra")
      const productType = this.selectedLot.variety.split(' - ')[0];

      // 🐛 DEBUG 3: Muestra el tipo de producto extraído para la búsqueda
      console.log('DEBUG 3: Tipo de Producto extraído:', productType);

      // 3. Buscar los pasos en el catálogo
      const catalogEntry = STEP_CATALOG.find(item => item.productType === productType);

      // 🐛 DEBUG 4: Muestra si se encontró la entrada en el catálogo
      console.log('DEBUG 4: Entrada de Catálogo encontrada:', catalogEntry);

      if (catalogEntry) {
        this.availableStepTypes = catalogEntry.steps;
        this.stepForm.get('stepType')?.enable(); // Habilitar el select de pasos
      } else {
        this.stepForm.get('stepType')?.disable();
        this.availableStepTypes = [`No hay pasos definidos para el tipo de producto: ${productType}`];
        console.error(`ERROR: No se encontró una lista de pasos para el tipo: "${productType}"`);
      }
    } else {
      this.stepForm.get('stepType')?.disable();
    }
  }

  get f() { return this.stepForm.controls; }

  onSubmit(): void {
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

    const formValues = rawFormValues;

    const payload: StepCreatePayload = {
      ...formValues,
      stepDate: formValues.stepDate,
      stepTime: formValues.stepTime,
      location: formValues.location,
      lotId: formValues.lotId,
      userId: connectedUserId,
      hash: '',
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
