import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { first } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import {UserService} from '../../Foodchain/services/user.service';
import {User} from '../../Foodchain/model/user.entity';
import {CommonModule} from '@angular/common';
import {SessionService} from '../../Foodchain/services/session.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, RouterLink
  ],
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  // Propiedades
  loginForm!: FormGroup;
  passwordVisible: boolean = false;
  loginError: boolean = false; // Para mostrar el mensaje de error

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router, // Para la navegación después del login
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    // Inicialización del formulario reactivo
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  /**
   * Alterna la visibilidad de la contraseña.
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * Maneja el envío del formulario.
   */
  onSubmit(): void {
    this.loginError = false; // Limpiar el error anterior

    if (this.loginForm.invalid) {
      // Marcar todos los campos como 'touched' para mostrar los errores de validación
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    // Lógica de autenticación:
    // 1. Obtener todos los usuarios.
    // 2. Buscar si existe un usuario con el email y la contraseña coincidentes.

    this.userService.getAll()
      .pipe(first()) // Nos aseguramos de desuscribirnos después de la primera emisión
      .subscribe({
        next: (users: User[]) => {
          // Busca el usuario por email Y password
          const userFound = users.find(
            user => user.email === email && user.password === password
          );

          if (userFound) {
            console.log('Login exitoso para el usuario:', userFound.email);
            // 🚨 Aquí se debe implementar la lógica de sesión (ej. guardar token/usuario en localStorage o en un servicio de estado)
            const userIdAsString = userFound.id.toString();

            this.sessionService.setUserId(userIdAsString);
            // Redirigir al usuario (ej. a la página de inicio o dashboard)
            this.router.navigate(['/sidenav']); // Cambia '/home' por la ruta de tu dashboard
          } else {
            // No se encontró un usuario con esas credenciales
            this.loginError = true;
            console.error('Credenciales incorrectas: Email o contraseña no coinciden.');
          }
        },
        error: (err: HttpErrorResponse) => {
          // Manejo de error de la API (ej. servidor caído, error 404, etc.)
          this.loginError = true;
          console.error('Error al intentar conectar con el servicio de usuarios:', err);
          // Opcional: Mostrar un mensaje más específico para errores de red.
        }
      });
  }

  // --- Métodos de Ayuda para el HTML (Opcional, pero útil) ---

  /**
   * Getter conveniente para acceder a los controles del formulario.
   */
  get f() { return this.loginForm.controls; }

  /**
   * Verifica si el campo de email tiene errores y ha sido tocado.
   */
  isEmailInvalidAndTouched(): boolean {
    const emailControl = this.f['email'];
    return emailControl.invalid && emailControl.touched;
  }

  /**
   * Verifica si el campo de password tiene errores y ha sido tocado.
   */
  isPasswordInvalidAndTouched(): boolean {
    const passwordControl = this.f['password'];
    return passwordControl.invalid && passwordControl.touched;
  }
}
