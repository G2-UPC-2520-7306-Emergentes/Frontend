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
  loginError: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
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
   * Maneja el envío del formulario.
   */
  onSubmit(): void {
    this.loginError = false; // Limpiar el error anterior

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;



    this.userService.getAll()
      .pipe(first())
      .subscribe({
        next: (users: User[]) => {
          const userFound = users.find(
            user => user.email === email && user.password === password
          );

          if (userFound) {
            console.log('Login exitoso para el usuario:', userFound.email);

            const userIdAsString = userFound.id.toString();

            this.sessionService.setUserId(userIdAsString);

            this.router.navigate(['/sidenav']);
          } else {

            this.loginError = true;
            console.error('Credenciales incorrectas: Email o contraseña no coinciden.');
          }
        },
        error: (err: HttpErrorResponse) => {

          this.loginError = true;
          console.error('Error al intentar conectar con el servicio de usuarios:', err);

        }
      });
  }



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
