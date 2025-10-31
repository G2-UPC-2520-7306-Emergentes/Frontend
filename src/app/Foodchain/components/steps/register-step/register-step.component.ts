import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { first, switchMap, catchError} from 'rxjs/operators'; // 💡 Agregamos switchMap y forkJoin
import {of, EMPTY, forkJoin} from 'rxjs'; // 💡 Agregamos EMPTY
import { GoogleMapsModule } from '@angular/google-maps';

import { Batch } from '../../../model/batch.entity';
import { User } from '../../../model/user.entity'; // Asegúrate de importar User
import { StepCreatePayload, StepService } from '../../../services/step.service';
import { SessionService } from '../../../services/session.service';
import { BatchService } from '../../../services/batch.service';
import { Step } from '../../../model/step.entity';
import { UserService } from '../../../services/user.service'; // 💡 Importamos UserService

@Component({
  selector: 'app-register-step',
  standalone: true,
  templateUrl: './register-step.component.html',
  styleUrls: ['./register-step.component.css'],
  // 💡 Asegúrate de que HttpClientModule esté en un AppModule o similar si usas standalone
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule, RouterLink, GoogleMapsModule]
})
export class RegisterStepComponent implements OnInit {

  stepForm!: FormGroup;
  availableLots: Batch[] = [];
  stepTypes: string[] = ['Productor', 'Procesador', 'Empacador', 'Inspector de Calidad', 'Distribuidor', 'Retailer'];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  currentUser!: User; // 💡 Propiedad para almacenar el usuario actual

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
    private userService: UserService // 💡 Inyectamos UserService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadUserBatches(); // Ahora gestionará la lógica de filtrado compleja
    this.loadGeolocation();
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
      stepType: ['', Validators.required],
      stepDate: [{ value: currentDateTime.date, disabled: true }, Validators.required],
      stepTime: [{ value: currentDateTime.time, disabled: true }, Validators.required],
      location: [{ value: 'Cargando ubicación...', disabled: true }, Validators.required],
      observations: [''],
    });
  }

  loadGeolocation(): void {
    // ... (Lógica de geolocalización sin cambios)
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
   * 💡 LÓGICA MODIFICADA: Carga lotes basados en companyOption (create vs join).
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

    // 1. Obtener el usuario actual para saber su rol y compañía
    this.userService.getById(connectedUserId).pipe(
      first(),

      catchError((error) => {
        console.error('Error al cargar el usuario:', error);
        this.errorMessage = 'No se pudo cargar la información de su perfil.';
        this.isLoading = false;
        return EMPTY;
      }),

      // 2. Usar switchMap para obtener todos los lotes y todos los usuarios de la base de datos
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

      // 3. Filtrar los lotes basado en la lógica de companyOption
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

        // --- Lógica de Filtrado de Lotes ---
        if (this.currentUser.companyOption === 'create') {
          // Caso 'create' (Administrador/Propietario): Solo ve sus lotes
          lotesVisibles = allBatches.filter(
            (batch: Batch) => String(batch.producer_id) === currentUserIdString
          );
        } else if (this.currentUser.companyOption === 'join') {
          // Caso 'join' (Miembro/Empleado): Ve los lotes del Administrador de su empresa

          // Buscar al administrador (companyOption: 'create') de la misma compañía
          const adminUser = allUsers.find(
            u => u.companyName === this.currentUser.companyName && u.companyOption === 'create'
          );

          if (adminUser) {
            const adminIdString = String(adminUser.id);
            // Filtrar lotes por el ID del administrador
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
          // Si hay lotes, habilitamos el selector
          this.stepForm.get('lotId')?.enable();
        }
      });
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
