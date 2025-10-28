// (El código TypeScript permanece idéntico al de la respuesta anterior, ya que no tenía referencias a .touched en el TS)
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { first } from 'rxjs/operators';
import { GoogleMapsModule } from '@angular/google-maps';

import {Batch} from '../../../model/batch.entity';
import {StepCreatePayload, StepService} from '../../../services/step.service';
import {SessionService} from '../../../services/session.service';
import {BatchService} from '../../../services/batch.service';
import {Step} from '../../../model/step.entity';

@Component({
  selector: 'app-register-step',
  standalone: true,
  templateUrl: './register-step.component.html',
  styleUrls: ['./register-step.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule, RouterLink, GoogleMapsModule]
})
export class RegisterStepComponent implements OnInit {

  stepForm!: FormGroup;
  availableLots: Batch[] = [];
  stepTypes: string[] = ['Productor', 'Procesador', 'Empacador', 'Inspector de Calidad', 'Distribuidor', 'Retailer'];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  mapOptions: google.maps.MapOptions = {};
  markerOptions: google.maps.MarkerOptions = { draggable: false };
  center: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  zoom: number = 15;


  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private stepService: StepService,
    private sessionService: SessionService,
    private batchService: BatchService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadUserBatches();
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
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      this.stepForm.get('location')?.setValue('Geolocation no soportada por este navegador.');
    }
  }

  loadUserBatches(): void {
    this.isLoading = true;
    this.errorMessage = null;
    const connectedUserId = this.sessionService.getUserId();

    if (!connectedUserId) {
      this.errorMessage = 'Error: ID de usuario no disponible. Inicie sesión.';
      this.isLoading = false;
      return;
    }

    this.batchService.getAllBatches()
      .pipe(first())
      .subscribe({
        next: (allBatches: Batch[]) => {
          this.availableLots = allBatches.filter(
            (batch: Batch) => batch.producer_id === connectedUserId
          );
          this.isLoading = false;

          if (this.availableLots.length === 0) {
            this.errorMessage = 'No tienes lotes para registrar un paso.';
            this.stepForm.get('lotId')?.disable();
          }
        },
        error: (error) => {
          console.error('Error al cargar lotes para el usuario:', error);
          this.errorMessage = 'Error al conectar con el servicio de lotes.';
          this.isLoading = false;
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
