import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Interfaz para definir la estructura de los permisos
interface RolePermission {
  key: string;
  description: string;
}

@Component({
  selector: 'app-newuser-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './newuser-admin.component.html',
  styleUrls: ['./newuser-admin.component.css'],
})
export class NewUserAdminComponent implements OnInit {

  userForm: FormGroup;
  isLoading: boolean = false;

  // ✅ DATOS ACTUALIZADOS: Roles
  roles = [
    { name: 'Distribuidor', value: 'DISTRIBUTOR' },
    { name: 'Productor', value: 'PRODUCER' },
    { name: 'Procesador', value: 'PROCESSOR' }, // Nuevo
    { name: 'Transportista', value: 'TRANSPORTER' }, // Nuevo
    { name: 'Retailer', value: 'RETAILER' }, // Nuevo
    { name: 'Inspector de Calidad', value: 'QUALITY_INSPECTOR' }, // Nuevo
    { name: 'Administrador', value: 'ADMIN' },
  ];

  // ✅ DATOS ACTUALIZADOS: Mapeo de permisos por rol (Basado en la imagen)
  permissionsMap: Record<string, RolePermission[]> = {
    // Permisos del rol Distribuidor (Manteniendo los que ya tenías)
    DISTRIBUTOR: [
      { key: 'REGISTER_RECEPTIONS', description: 'Registrar recepciones' },
      { key: 'VIEW_DISTRIBUTION_HISTORY', description: 'Ver historial de distribución' },
      { key: 'MANAGE_INVENTORY', description: 'Gestionar inventario' },
    ],
    // Permisos del rol Productor (Actualizado según la imagen)
    PRODUCER: [
      { key: 'REGISTER_HARVEST', description: 'Registrar cosecha' },
      { key: 'VIEW_OWN_HISTORY', description: 'Ver historial propio' },
      { key: 'UPLOAD_EVIDENCE', description: 'Subir evidencias' },
    ],
    // Permisos del rol Procesador (Nuevo según la imagen)
    PROCESSOR: [
      { key: 'REGISTER_PROCESSING', description: 'Registrar procesamiento' },
      { key: 'VIEW_PRODUCTION_HISTORY', description: 'Ver historial de producción' },
      { key: 'GENERATE_REPORTS', description: 'Generar reportes' },
    ],
    // Permisos del rol Transportista (Nuevo según la imagen)
    TRANSPORTER: [
      { key: 'REGISTER_DELIVERIES', description: 'Registrar entregas' },
      { key: 'VIEW_ASSIGNED_ROUTES', description: 'Ver rutas asignadas' },
      { key: 'UPLOAD_DELIVERY_EVIDENCE', description: 'Subir evidencias de entrega' },
    ],
    // Permisos del rol Retailer (Nuevo según la imagen)
    RETAILER: [
      { key: 'REGISTER_AVAILABILITY', description: 'Registrar disponibilidad' },
      { key: 'GENERATE_QR_CODES', description: 'Generar códigos QR' },
      { key: 'VIEW_PRODUCT_HISTORY', description: 'Ver historial de productos' },
    ],
    // Permisos del rol Inspector de Calidad (Nuevo según la imagen)
    QUALITY_INSPECTOR: [
      { key: 'REGISTER_INSPECTIONS', description: 'Registrar inspecciones' },
      { key: 'VIEW_FULL_HISTORY', description: 'Ver historial completo' },
      { key: 'APPROVE_REJECT_BATCHES', description: 'Aprobar/rechazar lotes' },
    ],
    // Permisos del rol Administrador (Mantenido)
    ADMIN: [
      { key: 'MANAGE_USERS', description: 'Gestionar todos los usuarios' },
      { key: 'MANAGE_ROLES', description: 'Gestionar roles y permisos' },
      { key: 'FULL_ACCESS', description: 'Acceso total al sistema' },
    ],
  };

  selectedPermissions: RolePermission[] = [];

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      nombreCompleto: ['Carlos Mendoza', Validators.required],
      email: ['carlos.mendoza@foodchain.com', [Validators.required, Validators.email]],
      telefono: ['+51 555 123 789', Validators.required],
      empresa: ['Distribuidora Central', Validators.required],
      rol: ['PRODUCER', Validators.required], // Inicializa con Productor como ejemplo
    });
  }

  ngOnInit(): void {
    // Inicializa los permisos al cargar el componente
    this.updatePermissions(this.userForm.get('rol')?.value);

    // Suscribe a los cambios del control 'rol' para actualizar los permisos DINÁMICAMENTE
    this.userForm.get('rol')?.valueChanges.subscribe(roleValue => {
      this.updatePermissions(roleValue);
    });
    console.log('Componente NewUserAdmin cargado con datos de prueba y roles actualizados.');
  }

  updatePermissions(roleValue: string): void {
    // Asegura que el nombre del rol se muestre en el bloque de permisos (ej. 'productor')
    const roleName = this.roles.find(r => r.value === roleValue)?.name || 'Seleccionado';
    const permissionsBlock = document.querySelector('.permissions-header');
    if (permissionsBlock) {
      permissionsBlock.innerHTML = `<i class="fas fa-shield-alt"></i> Permisos del Rol: ${roleName}`;
    }

    this.selectedPermissions = this.permissionsMap[roleValue] || [];
  }

  // ... (onSubmit y cancelCreation se mantienen sin cambios)
  onSubmit(): void {
    if (this.userForm.valid) {
      console.log('Formulario de Nuevo Usuario Enviado:', this.userForm.value);
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
        alert('Usuario creado con éxito (Simulación)');
      }, 1500);
    } else {
      console.log('El formulario no es válido. Revise los campos.');
      this.userForm.markAllAsTouched();
    }
  }

  cancelCreation(): void {
    console.log('Creación de usuario cancelada.');
  }
}
