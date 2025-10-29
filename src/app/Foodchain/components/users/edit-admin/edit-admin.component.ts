import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {SessionService} from '../../../services/session.service';
import {UserService} from '../../../services/user.service';

// ✨ Importamos tus servicios

// Interfaz para mapear los datos que el formulario necesita
interface UserProfileForm {
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string;
  empresa: string;
  cargo: string;
}

// Interfaz para el historial de firmas
interface SignatureHistory {
  hash: string;
  eventsCount: number;
  generatedDate: string;
  status: 'Anterior' | 'Actual';
}

@Component({
  selector: 'app-edit-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-admin.component.html',
  styleUrls: ['./edit-admin.component.css'],
})
export class EditAdminComponent implements OnInit {

  profileForm: FormGroup;
  isLoading: boolean = false;

  signatureHistory: SignatureHistory[] = [
    { hash: '9c8d...5678', eventsCount: 100, generatedDate: '2023-07-20', status: 'Anterior' },
    { hash: '3e4f...1234', eventsCount: 50, generatedDate: '2022-12-05', status: 'Anterior' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    // ✨ Inyectamos SessionService
    private sessionService: SessionService,
    // ✨ Inyectamos UserService
    private userService: UserService
  ) {
    // Inicializamos el formulario con los controles
    this.profileForm = this.fb.group({
      nombreCompleto: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      empresa: ['', Validators.required],
      cargo: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // 1. Obtener el ID del usuario logueado
    const userId = this.sessionService.getUserId();

    if (userId) {
      this.isLoading = true;
      console.log(`Usuario logueado ID: ${userId}. Cargando perfil con UserService.getById...`);

      // 2. Llamar a getById() usando el ID de la sesión
      this.userService.getById(userId).subscribe({
        next: (user) => {
          // 3. Mapear los campos del objeto User (asumimos que incluye los campos creados)
          const formData: UserProfileForm = {
            // Combinamos nombre y apellido para el campo 'nombreCompleto'
            nombreCompleto: `${user.firstName} ${user.lastName}`,
            correoElectronico: user.email,
            // Mapeamos el campo 'phoneNumber' (que creamos) al campo 'telefono'
            telefono: user.phoneNumber || '',
            empresa: user.companyName,
            // Asumimos que 'requestedRole' es el 'cargo' en el formulario
            cargo: user.requestedRole,
          };

          // 4. Rellenar el formulario con los datos mapeados
          this.profileForm.patchValue(formData);
          this.isLoading = false;

          // Opcional: Mostrar la firma actual si existiera un campo para ello
          // this.updateCurrentSignature(user.currentSignatureHash);

          console.log('Perfil cargado y formulario rellenado exitosamente.');
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Fallo al obtener perfil del usuario logueado. ¿ID válido? ¿API accesible?', err);
          alert('Error al cargar datos del usuario. Por favor, verifica la conexión o inicia sesión de nuevo.');

          // Si la llamada falla, se asume que la sesión no es válida y se redirige
          this.sessionService.clearSession();
          this.router.navigate(['/login']);
        }
      });
    } else {
      console.warn('ID de usuario no encontrado en la sesión. Redirigiendo a Login.');
      this.router.navigate(['/login']);
    }
  }

  /**
   * Maneja la acción de guardar el perfil y generar una nueva firma.
   * En el futuro, enviarías el userId y los datos del formulario al servicio para actualizar.
   */
  onSubmitAndGenerateSignature(): void {
    // ... (Mantener la lógica de guardar) ...
    if (this.profileForm.valid) {
      console.log('Datos de perfil enviados y Firma Digital solicitada:', this.profileForm.value);
      this.isLoading = true;

      const userId = this.sessionService.getUserId();

      if (userId) {
        // 🚨 FUTURO: Desestructurar profileForm.value para separarlo en firstName, lastName, etc.
        // y llamar a un método de 'update' del UserService
        // this.userService.updateProfile(userId, { /* datos separados */ }).subscribe(...)
      }

      setTimeout(() => {
        this.isLoading = false;
        alert('Perfil actualizado y Firma Digital generada (Simulación).');
        this.signatureHistory.unshift({
          hash: '7f9a...3333',
          eventsCount: 0,
          generatedDate: new Date().toISOString().split('T')[0],
          status: 'Anterior'
        });
      }, 1500);

    } else {
      console.log('El formulario de perfil no es válido.');
      this.profileForm.markAllAsTouched();
    }
  }

  cancelEdit(): void {
    console.log('Edición de perfil cancelada.');
    this.router.navigate(['/sidenav']);
  }

  addUser(): void{
    this.router.navigate(['/sidenav/newuser-admin']);
  }
}
