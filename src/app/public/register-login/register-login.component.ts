import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterLink} from '@angular/router';

// Nota: Eliminamos la importación de FormsModule

// La interfaz es opcional, pero mantiene la estructura de datos limpia
interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  // ... resto de propiedades ...
}

@Component({
  selector: 'app-register',
  templateUrl: './register-login.component.html', // Usamos el nombre de tu archivo
  styleUrls: ['./register-login.component.css'],
  standalone: true,
  // 🚨 Solo necesitamos CommonModule para *ngIf y *ngFor
  imports: [CommonModule, RouterLink]
})
export class RegisterLoginComponent implements OnInit {

  registerError: boolean = false;
  roles = ['Administrator', 'Auditor', 'Supply Chain Manager', 'Standard User'];

  constructor(private router: Router) { }

  ngOnInit(): void {
    // No hay inicialización de formulario, ¡genial!
  }

  // 2. Manejo del Submit del Formulario
  // Recibimos el formulario HTMLElement directamente
  public onSubmit(form: HTMLFormElement): void {

    // 1. Prevenir el envío clásico del formulario
    // (Angular lo hace automáticamente con (ngSubmit), pero aquí es manual si fuera necesario)
    // El evento 'submit' de Angular ya previene el refresh, pero es bueno saberlo.

    this.registerError = false;

    // 2. Usar el objeto nativo FormData para obtener todos los valores
    const formData = new FormData(form);

    // Creamos un objeto simple de JavaScript
    const data: any = {};
    formData.forEach((value, key) => (data[key] = value));

    // Validaciones Manuales (deben ser implementadas completamente por ti ahora)
    if (!data.email || !data.password || !data.confirmPassword) {
      this.registerError = true;
      console.error('Por favor, rellene todos los campos requeridos.');
      return;
    }

    if (data.password !== data.confirmPassword) {
      alert('Error: Las contraseñas no coinciden.');
      this.registerError = true;
      return;
    }
    console.log('Datos de Registro Válidos:', data);
    this.router.navigate(['/sidenav']);
    // Aquí harías la llamada a tu API con el objeto 'data'
  }

  // Helper para validación visual (necesitarás más lógica en el HTML)
  isPasswordMismatch(form: HTMLFormElement): boolean {
    const password = form.querySelector('[name="password"]') as HTMLInputElement;
    const confirm = form.querySelector('[name="confirmPassword"]') as HTMLInputElement;

    return password && confirm && password.value !== confirm.value && password.value.length > 0;
  }
}
