import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

// Importamos el UserService y la interfaz RegisterPayload
import { UserService, RegisterPayload } from '../../Foodchain/services/user.service'; // AJUSTA LA RUTA

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register-login.component.html',
  styleUrls: ['./register-login.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule]
})
export class RegisterLoginComponent implements OnInit {

  registerForm: FormGroup;
  roles = ['Administrator', 'Auditor', 'Supply Chain Manager', 'Standard User'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      companyName: ['', Validators.required],
      taxId: [''],
      companyOption: ['join', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]], // Requerido y solo números
      requestedRole: ['', Validators.required],
      agreement: [false, Validators.requiredTrue],
      recaptcha: [false, Validators.requiredTrue],
    }, {
      validators: this.passwordsMatchValidator.bind(this)
    });
  }

  ngOnInit(): void {}

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      alert('Formulario inválido. Revisa los campos requeridos y la coincidencia de contraseñas.');
      this.registerForm.markAllAsTouched();
      return;
    }


    const {  confirmPassword,
      agreement,
      recaptcha,
      ...newUserToSave } = this.registerForm.value;

    // 2. 🚀 Llama al servicio y se suscribe al resultado
    this.userService.registerUser(newUserToSave as RegisterPayload)
      .subscribe((user) => {

        if (user) {
          alert('Registro exitoso');

          this.router.navigate(['/login']);
        }
      });
  }

  get f() {
    return this.registerForm.controls;
  }
}
