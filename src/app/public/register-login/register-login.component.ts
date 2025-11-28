// src/app/modules/auth/register-login.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

// Importamos el RegisterService y la interfaz RegistroPayload
import { RegisterService, RegistroPayload } from '../../Foodchain/services/register.service'; // AJUSTA ESTA RUTA

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register-login.component.html',
  styleUrls: ['./register-login.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule]
})
export class RegisterLoginComponent implements OnInit {

  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private registerService: RegisterService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      // Campos de la Entidad Registro
      enterpriseId: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],

      // Campo extra para validación
      confirmPassword: ['', Validators.required],

      // 🛑 CAMPOS agreement y recaptcha ELIMINADOS
    }, {
      // Aplicamos el validador de coincidencia
      validators: this.passwordsMatchValidator.bind(this)
    });
  }

  // --- Validador de Coincidencia de Contraseñas ---
  passwordsMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
  }
  // ------------------------------------------------


  onSubmit() {
    if (this.registerForm.invalid) {
      alert('Formulario inválido. Revisa los campos obligatorios.');
      this.registerForm.markAllAsTouched();
      return;
    }

    // Desestructuramos solo los campos necesarios para el payload
    const { enterpriseId, email, password } = this.registerForm.value;

    const payload: RegistroPayload = {
      enterpriseId: enterpriseId,
      email: email,
      password: password
    };

    this.registerService.registerUser(payload)
      .subscribe((registro) => {
        if (registro) {
          alert('¡Registro exitoso!');
          this.router.navigate(['/login']);
        }
      });
  }

  get f() {
    return this.registerForm.controls;
  }
}
