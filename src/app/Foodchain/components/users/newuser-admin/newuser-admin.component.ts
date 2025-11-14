import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CreateUserBody, UserService } from '../../../services/user.service';
import { Router, RouterLink } from '@angular/router';
// 🔑 Importar SessionService y UserService
import { SessionService } from '../../../services/session.service';
import { User } from '../../../model/user.entity'; // Asegúrate de que User esté disponible


interface RolePermission {
  key: string;
  description: string;
}

@Component({
  selector: 'app-newuser-admin',
  standalone: true,
  imports: [HttpClientModule, CommonModule, ReactiveFormsModule],
  templateUrl: './newuser-admin.component.html',
  styleUrls: ['./newuser-admin.component.css'],
})
export class NewUserAdminComponent implements OnInit {

  userForm!: FormGroup;
  isLoading: boolean = false;
  // Variable para almacenar el nombre de la compañía
  adminCompanyName: string = 'Cargando Compañía...';

  // ✅ DATOS ACTUALIZADOS: Roles
  roles = [
    { name: 'Distribuidor', value: 'DISTRIBUTOR' },
    { name: 'Productor', value: 'PRODUCER' },
    { name: 'Procesador', value: 'PROCESSOR' },
    { name: 'Transportista', value: 'TRANSPORTER' },
    { name: 'Retailer', value: 'RETAILER' },
    { name: 'Inspector de Calidad', value: 'QUALITY_INSPECTOR' },
    { name: 'Administrador', value: 'ADMIN' },
  ];

  permissionsMap: Record<string, RolePermission[]> = {
    // ... (Mapeo de permisos omitido por brevedad, se mantiene el del original)
    DISTRIBUTOR: [
      { key: 'REGISTER_RECEPTIONS', description: 'Registrar recepciones' },
      { key: 'VIEW_DISTRIBUTION_HISTORY', description: 'Ver historial de distribución' },
      { key: 'MANAGE_INVENTORY', description: 'Gestionar inventario' },
    ],
    PRODUCER: [
      { key: 'REGISTER_HARVEST', description: 'Registrar cosecha' },
      { key: 'VIEW_OWN_HISTORY', description: 'Ver historial propio' },
      { key: 'UPLOAD_EVIDENCE', description: 'Subir evidencias' },
    ],
    PROCESSOR: [
      { key: 'REGISTER_PROCESSING', description: 'Registrar procesamiento' },
      { key: 'VIEW_PRODUCTION_HISTORY', description: 'Ver historial de producción' },
      { key: 'GENERATE_REPORTS', description: 'Generar reportes' },
    ],
    TRANSPORTER: [
      { key: 'REGISTER_DELIVERIES', description: 'Registrar entregas' },
      { key: 'VIEW_ASSIGNED_ROUTES', description: 'Ver rutas asignadas' },
      { key: 'UPLOAD_DELIVERY_EVIDENCE', description: 'Subir evidencias de entrega' },
    ],
    RETAILER: [
      { key: 'REGISTER_AVAILABILITY', description: 'Registrar disponibilidad' },
      { key: 'GENERATE_QR_CODES', description: 'Generar códigos QR' },
      { key: 'VIEW_PRODUCT_HISTORY', description: 'Ver historial de productos' },
    ],
    QUALITY_INSPECTOR: [
      { key: 'REGISTER_INSPECTIONS', description: 'Registrar inspecciones' },
      { key: 'VIEW_FULL_HISTORY', description: 'Ver historial completo' },
      { key: 'APPROVE_REJECT_BATCHES', description: 'Aprobar/rechazar lotes' },
    ],
    ADMIN: [
      { key: 'MANAGE_USERS', description: 'Gestionar todos los usuarios' },
      { key: 'MANAGE_ROLES', description: 'Gestionar roles y permisos' },
      { key: 'FULL_ACCESS', description: 'Acceso total al sistema' },
    ],
  };

  selectedPermissions: RolePermission[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private sessionService: SessionService, // 🔑 Inyectar
    protected router: Router,
  ) {
    // Inicializar el formulario con un valor temporal o vacío
    this.userForm = this.fb.group({
      nombreCompleto: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      // 🔑 Inicializar el control de 'empresa' con el estado deshabilitado
      empresa: [{ value: this.adminCompanyName, disabled: true }, Validators.required],
      rol: ['DISTRIBUTOR', Validators.required], // Valor por defecto
    });
  }

  ngOnInit(): void {
    const userId = this.sessionService.getUserId();

    if (!userId) {
      // Manejar el caso de que no haya ID de usuario logueado
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    // 🔑 Cargar los datos del usuario logueado para obtener el nombre de la compañía
    this.userService.getById(userId).subscribe({
      next: (user: User) => {
        if (user && user.companyName) {
          this.adminCompanyName = user.companyName;

          // 🔑 Establecer el valor real de la empresa en el control deshabilitado
          this.userForm.get('empresa')?.setValue(this.adminCompanyName);
        } else {
          console.warn('No se pudo obtener el nombre de la compañía del usuario logueado.');
          this.adminCompanyName = 'Empresa Desconocida';
          this.userForm.get('empresa')?.setValue(this.adminCompanyName);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener datos del usuario logueado:', err);
        this.adminCompanyName = 'Error al cargar';
        this.userForm.get('empresa')?.setValue(this.adminCompanyName);
        this.isLoading = false;
        // Opcional: Redirigir o mostrar un error fatal
      }
    });

    this.updatePermissions(this.userForm.get('rol')?.value);

    this.userForm.get('rol')?.valueChanges.subscribe(roleValue => {
      this.updatePermissions(roleValue);
    });
  }

  updatePermissions(roleValue: string): void {
    // Lógica para actualizar permisos (Mantenida)
    const roleName = this.roles.find(r => r.value === roleValue)?.name || 'Seleccionado';
    const permissionsBlock = document.querySelector('.permissions-header');
    if (permissionsBlock) {
      permissionsBlock.innerHTML = `<i class="fas fa-shield-alt"></i> Permisos del Rol: ${roleName}`;
    }

    this.selectedPermissions = this.permissionsMap[roleValue] || [];
  }


  onSubmit(): void {
    // 🔑 IMPORTANTE: Habilitar el campo 'empresa' temporalmente antes de leer su valor
    // para que se incluya en userForm.value
    const empresaControl = this.userForm.get('empresa');
    empresaControl?.enable();

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
        companyName: formValue.empresa, // Usamos el valor del control (que es el nombre de la compañía del admin)
        phoneNumber: formValue.telefono,
        requestedRole: formValue.rol,

        // Campos fijos/predeterminados:
        password: "admin1234",
        companyOption: "join",
        taxId: "",
        digitalSignature: "",
      };

      console.log('--- Cuerpo Enviado a la API ---', newUserBody);

      this.userService.registerCompany(newUserBody).subscribe({
        next: (user) => {
          this.isLoading = false;
          // 🔑 Volver a deshabilitar después de la operación
          empresaControl?.disable();
          if (user) {
            alert(`Usuario ${user.firstName} ${user.lastName} (ID: ${user.id}) creado con éxito.`);
            this.userForm.reset();
            // Restablecer el valor de la empresa y el rol
            this.userForm.get('rol')?.setValue(this.roles[0].value);
            this.userForm.get('empresa')?.setValue(this.adminCompanyName);
          }
        },
        error: (error) => {
          this.isLoading = false;
          // 🔑 Volver a deshabilitar después de la operación
          empresaControl?.disable();
          alert('Error al crear el usuario. Por favor, revisa la consola para más detalles.');
        }
      });

    } else {
      console.log('El formulario no es válido. Revise los campos.');
      this.userForm.markAllAsTouched();
      // 🔑 Volver a deshabilitar si la validación falla antes del submit
      empresaControl?.disable();
    }
  }

  cancelCreation(): void {
    console.log('Creación de usuario cancelada.');
    this.router.navigate(['/sidenav/dashboard']);
  }
}
