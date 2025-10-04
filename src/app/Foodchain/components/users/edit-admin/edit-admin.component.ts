import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Route, Router} from '@angular/router';
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
  // 🚨 CRUCIAL: Importamos ReactiveFormsModule
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-admin.component.html',
  styleUrls: ['./edit-admin.component.css'],
})
export class EditAdminComponent implements OnInit {

  profileForm: FormGroup;
  isLoading: boolean = false;

  // ✅ Datos de perfil fijos para simular la carga
  private initialProfileData = {
    nombreCompleto: 'Juan Pérez Administrador',
    correoElectronico: 'juan.perez@foodchain.com',
    telefono: '+51 987 654 321',
    empresa: 'FoodChain Central',
    cargo: 'Administrador de Trazabilidad',
  };

  // ✅ Historial de firmas fijo para simular la carga
  signatureHistory: SignatureHistory[] = [
    { hash: '9c8d...5678', eventsCount: 100, generatedDate: '2023-07-20', status: 'Anterior' },
    { hash: '3e4f...1234', eventsCount: 50, generatedDate: '2022-12-05', status: 'Anterior' },
  ];

  constructor(private fb: FormBuilder, private router: Router) {
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
    // Cargamos los datos de prueba en el formulario
    this.profileForm.patchValue(this.initialProfileData);
    console.log('Componente EditAdmin (Mi Perfil) cargado con datos de prueba.');
  }

  /**
   * Maneja la acción de guardar el perfil y generar una nueva firma.
   */
  onSubmitAndGenerateSignature(): void {
    if (this.profileForm.valid) {
      console.log('Datos de perfil enviados y Firma Digital solicitada:', this.profileForm.value);
      this.isLoading = true;

      // 🚨 FUTURO: Aquí iría la llamada al servicio para guardar los datos y generar la firma.
      // this.adminService.updateProfileAndGenerateSignature(this.profileForm.value).subscribe(...)

      setTimeout(() => {
        this.isLoading = false;
        alert('Perfil actualizado y Firma Digital generada (Simulación).');
        // Simulación: añadir la nueva firma al historial
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
    // FUTURO: Implementar navegación de vuelta
  }

  addUser(): void{
    this.router.navigate(['/sidenav/newuser-admin']);
  }
}
