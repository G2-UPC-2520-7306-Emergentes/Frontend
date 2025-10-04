import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterLink} from '@angular/router'; // Para volver al Login

@Component({
  selector: 'app-recover-login',
  templateUrl: './recover-login.component.html',
  styleUrls: ['./recover-login.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class RecoverLoginComponent implements OnInit {

  // Controla qué vista se muestra (1: Email, 2: New Password)
  currentStep: number = 1;
  stepError: string | null = null;

  // Variables para la vista de éxito del paso 2
  passwordUpdated: boolean = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  // Helper simple para validar formato de email
  private isValidEmail(email: string): boolean {
    const re = /\S+@\S+\.\S+/;
    return re.test(email.toLowerCase());
  }

  // Maneja el envío del formulario del Paso 1 (Enviar Email)
  public onSendLink(event: Event, form: HTMLFormElement): void {
    event.preventDefault();

    this.stepError = null;
    const formData = new FormData(form);
    const email = formData.get('email') as string;

    if (!email) {
      this.stepError = 'Please enter your email address.';
      return;
    }

    // 🚨 VALIDACIÓN SIMPLE DE FORMATO (Lo que pediste)
    if (!this.isValidEmail(email)) {
      this.stepError = 'Please enter a valid email address.';
      return;
    }

    // SIMULACIÓN DE ÉXITO: Cambia al Paso 2
    console.log(`Email link sent simulation for: ${email}`);
    this.currentStep = 2;
    // En un caso real, aquí llamas a la API y esperas la respuesta
  }

  // Maneja el envío del formulario del Paso 2 (Crear Nueva Contraseña)
  public onSetNewPassword(event: Event, form: HTMLFormElement): void {

    event.preventDefault();
    this.stepError = null;
    const formData = new FormData(form);
    const password = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || !confirmPassword) {
      this.stepError = 'Please enter and confirm your new password.';
      return;
    }

    if (password !== confirmPassword) {
      this.stepError = 'Passwords do not match.';
      return;
    }

    // Puedes agregar más validaciones aquí (ej: longitud mínima)
    if (password.length < 8) {
      this.stepError = 'Use at least 8 characters for better security.';
      return;
    }

    // SIMULACIÓN DE ÉXITO: Cambia el estado para mostrar el mensaje de éxito
     this.router.navigate(['/login']).then(() => {
        console.log("Navigation successful.");
      }).catch(err => {
        console.error("Navigation failed:", err);
      });

  // 3 segundos para que el usuario vea el mensaje de éxito
  }
}
