import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../../services/session.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../model/user.entity';
// 💡 Importamos UUID para generar el hash/clave secreta
import { v4 as uuidv4 } from 'uuid';
import { StepService } from '../../../services/step.service';
import { Step } from '../../../model/step.entity';
import { forkJoin } from 'rxjs';


// Interfaz para mapear los datos que el formulario necesita
interface UserProfileForm {
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string;
  empresa: string;
  cargo: string;
}

// 🔑 Interfaz para el historial de firmas (Hash COMPLETO para comparación)
interface SignatureHistory {
  hash: string;
  eventsCount: number;
  generatedDate: string;
  status: 'Anterior' | 'Actual'; // Tipo de unión literal estricto
  displayHash: string; // Nuevo campo para el hash truncado para la vista
}

@Component({
  selector: 'app-edit-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-admin.component.html',
  styleUrls: ['./edit-admin.component.css'],
})
export class EditAdminComponent implements OnInit {

  profileForm!: FormGroup;
  isLoading: boolean = false;
  currentUserId: string = ''; // Almacena el ID del usuario logueado
  currentUserSignature: string = ''; // Almacena la firma actual

  public companyOption: string | undefined;

  signatureHistory: SignatureHistory[] = [];
  previousSignatures: { hash: string, generatedDate: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sessionService: SessionService,
    private userService: UserService,
    private stepService: StepService
  ) {
    this.profileForm = this.fb.group({
      nombreCompleto: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      empresa: ['', Validators.required],
      cargo: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const userId = this.sessionService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUserId = userId;
    this.isLoading = true;

    forkJoin({
      user: this.userService.getById(userId),
      steps: this.stepService.getAllSteps()
    }).subscribe({
      next: ({ user, steps }) => {
        this.companyOption = user.companyOption;

        // 1. Cargar datos del formulario
        this.currentUserSignature = user.digitalSignature || 'SIN_FIRMA';

        const formData: UserProfileForm = {
          nombreCompleto: `${user.firstName} ${user.lastName}`,
          correoElectronico: user.email,
          telefono: user.phoneNumber || '',
          empresa: user.companyName,
          cargo: user.requestedRole,
        };

        this.profileForm.patchValue(formData);

        // 2. Procesar y construir el historial de firmas
        this.buildSignatureHistory(user, steps);

        this.isLoading = false;
        console.log('Perfil cargado. Firma Digital Actual:', this.currentUserSignature);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Fallo al obtener datos iniciales.', err);
        alert('Error al cargar datos del usuario o los pasos.');
        this.sessionService.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * 🔑 Construye el historial de firmas del usuario a partir de los pasos registrados.
   */
  buildSignatureHistory(user: User, allSteps: Step[]): void {
    const signatureCounts = new Map<string, number>();

    // 1. Filtrar pasos que corresponden a este usuario y que tienen una firma.
    const userSteps = allSteps.filter(step =>
      String(step.userId) === String(user.id) && !!step.digitalSignature &&
      step.status === 'accepted'// 🔑 Usamos digitalSignature
    );

    // 2. Contar los pasos por la clave de firma (digitalSignature)
    userSteps.forEach(step => {
      // 🔑 Usamos step.digitalSignature para el hash de la firma
      const hash = step.digitalSignature;
      signatureCounts.set(hash, (signatureCounts.get(hash) || 0) + 1);
    });

    // 3. Obtener el conjunto de todos los hashes de firma usados por el usuario
    const usedHashes = new Set(userSteps.map(step => step.digitalSignature));

    // 4. Asegurarse de incluir la firma actual (incluso si no tiene pasos aún)
    if (user.digitalSignature && user.digitalSignature !== 'SIN_FIRMA') {
      usedHashes.add(user.digitalSignature);
    }

    // 5. Mapear los hashes únicos al historial
    this.signatureHistory = Array.from(usedHashes)
      .map(hash => {
        // Determinar el estado y obtener el conteo
        const status: 'Anterior' | 'Actual' = (hash === user.digitalSignature) ? 'Actual' : 'Anterior';
        const eventsCount = signatureCounts.get(hash) || 0;

        // Buscar el paso más reciente que usó este hash
        const latestStep = userSteps
          .filter(step => step.digitalSignature === hash)
          .sort((a, b) => new Date(b.stepDate).getTime() - new Date(a.stepDate).getTime())[0];

        const generatedDate = latestStep ? latestStep.stepDate : new Date().toISOString().split('T')[0];

        return {
          hash: hash,
          eventsCount: eventsCount,
          generatedDate: generatedDate,
          status: status,
          displayHash: this.getDisplayHash(hash),
        } as SignatureHistory;
      })
      .sort((a, b) => {
        // Poner la firma actual primero y luego ordenar por fecha descendente
        if (a.status === 'Actual') return -1;
        if (b.status === 'Actual') return 1;
        return new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime();
      });

    this.previousSignatures = this.signatureHistory
      .filter(item => item.status === 'Anterior')
      .map(item => ({ hash: item.hash, generatedDate: item.generatedDate }));
  }

  /**
   * Genera el hash truncado para la visualización.
   */
  getDisplayHash(hash: string): string {
    return hash.length > 10 ? `${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}` : hash;
  }

  /**
   * Genera un string aleatorio y criptográficamente único (UUID)
   * para simular la "Firma Digital" o clave hash privada del usuario.
   */
  generateDigitalSignatureHash(): string {
    return uuidv4();
  }

  /**
   * Maneja la acción de guardar el perfil y generar una nueva firma.
   */
  onSubmitAndGenerateSignature(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      alert('Por favor completa los campos requeridos.');
      return;
    }

    if (!this.currentUserId) {
      alert('No se encontró el ID del usuario en la sesión.');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    // 1. GENERAR LA NUEVA FIRMA DIGITAL (HASH)
    const newDigitalSignature = this.generateDigitalSignatureHash();

    // 2. Obtener datos actuales (para no perder password, taxId, etc.)
    this.userService.getById(this.currentUserId).subscribe({
      next: (currentUser) => {
        if (!currentUser) {
          this.isLoading = false;
          alert('No se pudo obtener la información del usuario.');
          return;
        }

        const [firstName, ...lastNameParts] = this.profileForm.value.nombreCompleto.trim().split(' ');
        const lastName = lastNameParts.join(' ');

        // 3. Crear el objeto de actualización, ASEGURANDO LA PERSISTENCIA DE TODOS LOS DATOS.
        const updatedUser: Partial<User> = {
          ...currentUser, // Mantiene todos los campos existentes.

          // Campos actualizados del formulario (sobrescriben los de currentUser)
          firstName: firstName,
          lastName: lastName,
          email: this.profileForm.value.correoElectronico,
          phoneNumber: this.profileForm.value.telefono,
          companyName: this.profileForm.value.empresa,
          requestedRole: this.profileForm.value.cargo,

          // Firma Digital: Sobreescribe la firma antigua.
          digitalSignature: newDigitalSignature,
        };

        delete updatedUser.id;

        // 4. Enviar actualización al servidor.
        this.userService.updateProfile(this.currentUserId, updatedUser).subscribe({
          next: (updated) => {
            this.isLoading = false;
            if (updated) {
              alert('✅ Perfil actualizado y nueva Firma Digital generada con éxito.');

              this.currentUserSignature = updated.digitalSignature || newDigitalSignature;

              // Recargamos los pasos y reconstruimos el historial para incluir la nueva firma
              this.stepService.getAllSteps().subscribe(steps => {
                this.buildSignatureHistory(updated, steps);
              });

            } else {
              alert('No se pudo actualizar el perfil.');
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error al actualizar perfil:', err);
            alert('Error al actualizar perfil. Intenta nuevamente.');
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al obtener usuario antes de actualizar:', err);
        alert('Error al cargar los datos actuales del usuario.');
      }
    });
  }


  copyDigitalSignature(): void {
    if (this.currentUserSignature && this.currentUserSignature !== 'SIN_FIRMA') {
      // Usa la API del portapapeles
      navigator.clipboard.writeText(this.currentUserSignature)
        .then(() => {
          alert('✅ Firma Digital copiada al portapapeles. ¡Úsala para validar tus pasos!');
        })
        .catch(err => {
          console.error('No se pudo copiar el texto: ', err);
          alert('Error al copiar la firma digital. Por favor, cópiala manualmente.');
        });
    } else {
      alert('Aún no tienes una firma digital activa para copiar.');
    }
  }

  cancelEdit(): void {
    console.log('Edición de perfil cancelada.');
    this.router.navigate(['/sidenav']);
  }

  addUser(): void{
    this.router.navigate(['/sidenav/newuser-admin']);
  }
}
