import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { first } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import {CommonModule} from '@angular/common';

// 🛑 IMPORTANTE: Asegúrate que esta interfaz en el servicio se ha actualizado
// a 'token' en lugar de 'accessToken' y que 'userId' es opcional o se ha eliminado,
// o si no, el tipado no será estricto.
import { RegisterService, SignInPayload, AuthResponse } from '../../Foodchain/services/register.service'; // AJUSTA LA RUTA
import {SessionService} from '../../Foodchain/services/session.service'; // Asumo que esta ruta es correcta

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
  loginError: boolean = false;

  constructor(
    private fb: FormBuilder,
    // 🛑 CAMBIO: Inyectamos el RegisterService para el método signIn
    private registerService: RegisterService,
    private router: Router,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
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
   * Maneja el envío del formulario, llamando al servicio de autenticación.
   */
  onSubmit(): void {
    this.loginError = false; // Limpiar el error anterior

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    // 1. Construir el payload con los datos del formulario
    const payload: SignInPayload = { email, password };

    // 🛑 LOGS DE DEPURACIÓN AÑADIDOS
    console.log('--- INTENTANDO LOGIN ---');
    console.log('1. Valor del Formulario (RAW):', this.loginForm.value);
    console.log('2. Payload Final Enviado (estructura del JSON):', payload);
    console.log('------------------------');
    // 🛑 FIN DE LOGS DE DEPURACIÓN

    // 2. Llamar al servicio signIn de la API
    this.registerService.signIn(payload)
      .pipe(first())
      .subscribe({
        next: (authResponse: AuthResponse | null) => {

          console.log('3. RESPUESTA DEL SERVIDOR (Status 200 OK):', authResponse);

          // 🛑 CORRECCIÓN CLAVE: Comprobamos si existe la propiedad 'token'
          if (authResponse && authResponse.token) {

            console.log('Login exitoso. Token JWT recibido.');

            // 🛑 ALMACENAMIENTO CORREGIDO:
            // 1. Guardamos el TOKEN usando la propiedad 'token' de la respuesta.
            this.sessionService.setToken(authResponse.token);

            // 2. Guardamos el EMAIL como identificador de usuario (ya que 'userId' no viene, usamos 'email')
            this.sessionService.setUserId(authResponse.email);

            this.router.navigate(['/sidenav/dashboard']);
          } else {
            // Este caso ocurre si el servicio devuelve 'null' (credenciales inválidas)
            this.loginError = true;
            console.error('Fallo en la autenticación: Credenciales incorrectas o error de servicio.');
          }
        },
        error: (err: HttpErrorResponse) => {
          // Error de red o error no manejado por el servicio
          this.loginError = true;
          console.error('Error al intentar iniciar sesión:', err);
        }
      });
  }

  // --- Getters y Validaciones de la Interfaz ---

  get f() { return this.loginForm.controls; }

  isEmailInvalidAndTouched(): boolean {
    const emailControl = this.f['email'];
    return emailControl.invalid && emailControl.touched;
  }

  isPasswordInvalidAndTouched(): boolean {
    const passwordControl = this.f['password'];
    return passwordControl.invalid && passwordControl.touched;
  }
}
