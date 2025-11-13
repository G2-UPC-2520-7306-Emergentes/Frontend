import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {User} from '../../Foodchain/model/user.entity';
import {UserService} from '../../Foodchain/services/user.service'; // Necesario para 'of(null)'

@Component({
  selector: 'app-recover-login',
  templateUrl: './recover-login.component.html',
  styleUrls: ['./recover-login.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule]
})
export class RecoverLoginComponent implements OnInit {

  currentStep: number = 1; // 1: Email, 2: Contraseña Anterior, 3: Nueva Contraseña
  stepError: string | null = null;

  userEmail: string = '';
  currentUser: User | null = null;
  passwordUpdated: boolean = false;

  constructor(private router: Router, private userService: UserService) { }

  ngOnInit(): void { }

  private isValidEmail(email: string): boolean {
    const re = /\S+@\S+\.\S+/;
    return re.test(email.toLowerCase());
  }

// -----------------------------------------------------------------------
  /**
   * PASO 1: Verifica si el correo existe en el sistema.
   * Si existe, pasa al Paso 2.
   */
  public onVerifyEmail(event: Event, form: HTMLFormElement): void {
    event.preventDefault();
    this.stepError = null;
    const formData = new FormData(form);
    this.userEmail = formData.get('email') as string;

    if (!this.userEmail || !this.isValidEmail(this.userEmail)) {
      this.stepError = 'Por favor, ingresa un correo electrónico válido.';
      return;
    }

    this.userService.getUserByEmail(this.userEmail).subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
          this.currentStep = 2; // Éxito: Pasar al Paso 2
        } else {
          this.stepError = 'Este correo electrónico no está registrado.';
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al buscar usuario:', err);
        this.stepError = 'Ocurrió un error en el servidor. Inténtalo de nuevo.';
      }
    });
  }

// -----------------------------------------------------------------------
  /**
   * PASO 2: Valida la contraseña anterior ingresada.
   * NOTA: La lógica de comparación directa (this.currentUser.password === oldPassword)
   * es INSEGURA. En producción, debe hacerse con una llamada de autenticación al backend.
   */
  public onValidatePassword(event: Event, form: HTMLFormElement): void {
    event.preventDefault();
    this.stepError = null;
    const formData = new FormData(form);
    const oldPassword = formData.get('oldPassword') as string;

    if (!oldPassword || !this.currentUser) {
      this.stepError = 'Datos incompletos o error de sesión.';
      return;
    }

    // ** Lógica TEMPORAL (NO SEGURA EN PRODUCCIÓN):
    if (this.currentUser.password === oldPassword) {
      this.currentStep = 3; // Contraseña validada: Pasar al Paso 3
    } else {
      this.stepError = 'Contraseña anterior incorrecta. Inténtalo de nuevo.';
    }
  }

// -----------------------------------------------------------------------
  /**
   * PASO 3: Establece la nueva contraseña.
   * Implementa el patrón GET-THEN-PUT para asegurar que se envíe el objeto completo
   * y no se borren los demás datos del usuario.
   */
  public onSetNewPassword(event: Event, form: HTMLFormElement): void {
    event.preventDefault();
    this.stepError = null;
    const formData = new FormData(form);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      this.stepError = 'Las contraseñas no coinciden.';
      return;
    }
    if (newPassword.length < 8) {
      this.stepError = 'Usa al menos 8 caracteres para mayor seguridad.';
      return;
    }
    if (!this.currentUser || !this.currentUser.id) {
      this.stepError = 'Error. Vuelve a iniciar el proceso.';
      return;
    }

    const userId = this.currentUser.id;

    // 1. Obtener el usuario completo para evitar perder campos (GET)
    this.userService.getById(userId).pipe(
      // 2. Encadenar para actualizar la contraseña y realizar el PUT
      switchMap((fullUser: User) => {
        if (!fullUser) {
          // Lanzar error si no se encuentra el usuario (aunque ya debería existir)
          throw new Error('Usuario no encontrado para la actualización.');
        }

        // Clonar el objeto y SOLO modificar la contraseña
        const updatedUser: User = { ...fullUser, password: newPassword };

        // 3. Llamar al método update (PUT) con el objeto completo
        return this.userService.update(userId, updatedUser);
      }),
      // 4. Capturar errores en la secuencia
      catchError((error) => {
        console.error('Error en el proceso de actualización:', error);
        this.stepError = 'Ocurrió un error al actualizar la contraseña: Inténtalo más tarde.';
        return of(null); // Devolver un Observable de null
      })
    ).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.passwordUpdated = true;
          this.currentUser = user; // Actualizar el objeto local
          // Redirigir al login después de un breve mensaje de éxito
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      }
    });
  }
}
