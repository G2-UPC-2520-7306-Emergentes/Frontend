import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {CreateUserBody, RegisterPayload, UserService} from '../../../services/user.service';
import { Router, RouterLink } from '@angular/router';

interface RolePermission {
  key: string;
  description: string;
}

@Component({
  selector: 'app-newuser-admin',
  standalone: true,
  imports: [HttpClientModule,CommonModule, ReactiveFormsModule],
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

  constructor(private fb: FormBuilder,
              private userService: UserService,  protected router: Router,) {
    this.userForm = this.fb.group({
      nombreCompleto: ['Carlos Mendoza', Validators.required],
      email: ['carlos.mendoza@foodchain.com', [Validators.required, Validators.email]],
      telefono: ['+51 555 123 789', Validators.required],
      empresa: ['Distribuidora Central', Validators.required],
      rol: ['PRODUCER', Validators.required],
    });
  }

  ngOnInit(): void {

    this.updatePermissions(this.userForm.get('rol')?.value);


    this.userForm.get('rol')?.valueChanges.subscribe(roleValue => {
      this.updatePermissions(roleValue);
    });
    console.log('Componente NewUserAdmin cargado con datos de prueba y roles actualizados.');
  }

  updatePermissions(roleValue: string): void {

    const roleName = this.roles.find(r => r.value === roleValue)?.name || 'Seleccionado';
    const permissionsBlock = document.querySelector('.permissions-header');
    if (permissionsBlock) {
      permissionsBlock.innerHTML = `<i class="fas fa-shield-alt"></i> Permisos del Rol: ${roleName}`;
    }

    this.selectedPermissions = this.permissionsMap[roleValue] || [];
  }


  onSubmit(): void {
    if (this.userForm.valid) {
      this.isLoading = true;

      const formValue = this.userForm.value;
      const nombreCompleto = formValue.nombreCompleto.split(' ');
      const firstName = nombreCompleto[0];
      const lastName = nombreCompleto.slice(1).join(' ') || '-';


      const newUserBody: CreateUserBody = {
        firstName: firstName,
        lastName: lastName,
        email: formValue.email,
        companyName: formValue.empresa,
        phoneNumber: formValue.telefono,
        requestedRole: formValue.rol,

        // Campos fijos/predeterminados:
        password: "admin1234",
        companyOption: "join",
        taxId: "",
        digitalSignature: "",
      };

      console.log('--- Cuerpo Enviado a la API (Limpio) ---', newUserBody);

      // 🚨 ¡Cambiado a registerCompany!
      this.userService.registerCompany(newUserBody).subscribe({
        next: (user) => {
          this.isLoading = false;
          if (user) {
            alert(`Usuario ${user.firstName} ${user.lastName} (ID: ${user.id}) creado con éxito.`);
            this.userForm.reset();
            this.userForm.get('rol')?.setValue(this.roles[0].value);
          }
        },
        error: (error) => {
          this.isLoading = false;

        }
      });

    } else {
      console.log('El formulario no es válido. Revise los campos.');
      this.userForm.markAllAsTouched();
    }
  }

  cancelCreation(): void {
    console.log('Creación de usuario cancelada.');
    this.router.navigate(['/sidenav/dashboard']);
  }
}
