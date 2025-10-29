import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {SessionService} from '../../../services/session.service';
import {UserService} from '../../../services/user.service';
import {User} from '../../../model/user.entity';



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

    private sessionService: SessionService,

    private userService: UserService
  ) {

    this.profileForm = this.fb.group({
      nombreCompleto: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      empresa: ['', Validators.required],
      cargo: ['', Validators.required],
    });
  }

  ngOnInit(): void {

    const userId = this.sessionService.getUserId();

    if (userId) {
      this.isLoading = true;
      console.log(`Usuario logueado ID: ${userId}. Cargando perfil con UserService.getById...`);


      this.userService.getById(userId).subscribe({
        next: (user) => {

          const formData: UserProfileForm = {

            nombreCompleto: `${user.firstName} ${user.lastName}`,
            correoElectronico: user.email,

            telefono: user.phoneNumber || '',
            empresa: user.companyName,

            cargo: user.requestedRole,
          };


          this.profileForm.patchValue(formData);
          this.isLoading = false;




          console.log('Perfil cargado y formulario rellenado exitosamente.');
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Fallo al obtener perfil del usuario logueado. ¿ID válido? ¿API accesible?', err);
          alert('Error al cargar datos del usuario. Por favor, verifica la conexión o inicia sesión de nuevo.');


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
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      alert('Por favor completa los campos requeridos.');
      return;
    }

    const userId = this.sessionService.getUserId();
    if (!userId) {
      alert('No se encontró el ID del usuario en la sesión.');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    const [firstName, ...lastNameParts] = this.profileForm.value.nombreCompleto.trim().split(' ');
    const lastName = lastNameParts.join(' ');

    console.log('Obteniendo usuario completo antes de actualizar...');


    this.userService.getById(userId).subscribe({
      next: (currentUser) => {
        if (!currentUser) {
          this.isLoading = false;
          alert('No se pudo obtener la información del usuario.');
          return;
        }


        const updatedUser: User = {
          ...currentUser,
          firstName,
          lastName,
          email: this.profileForm.value.correoElectronico,
          phoneNumber: this.profileForm.value.telefono,
          companyName: this.profileForm.value.empresa,
          requestedRole: this.profileForm.value.cargo,
        };

        console.log('Enviando actualización completa del usuario:', updatedUser);


        this.userService.updateProfile(userId, updatedUser).subscribe({
          next: (updated) => {
            this.isLoading = false;
            if (updated) {
              alert('✅ Perfil actualizado correctamente.');


              this.signatureHistory.unshift({
                hash: '7f9a...3333',
                eventsCount: 0,
                generatedDate: new Date().toISOString().split('T')[0],
                status: 'Anterior'
              });
            } else {
              alert('No se pudo actualizar el perfil.');
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error al actualizar perfil:', err);
            alert('Error al actualizar perfil. Intenta nuevamente.');
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al obtener usuario antes de actualizar:', err);
        alert('Error al cargar los datos actuales del usuario.');
      }
    });
  }

  cancelEdit(): void {
    console.log('Edición de perfil cancelada.');
    this.router.navigate(['/sidenav']);
  }

  addUser(): void{
    this.router.navigate(['/sidenav/newuser-admin']);
  }
}
