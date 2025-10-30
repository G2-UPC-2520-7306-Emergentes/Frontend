import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Agregamos DatePipe si no estaba
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { first, catchError, switchMap } from 'rxjs/operators';
import { of, EMPTY, forkJoin } from 'rxjs'; // Importamos forkJoin y EMPTY

import { QRCodeComponent } from 'angularx-qrcode';

import { Batch } from '../../model/batch.entity'; // Asegúrate de que la ruta sea correcta
import { User } from '../../model/user.entity'; // 💡 Asegúrate de que la ruta sea correcta
import { BatchService } from '../../services/batch.service';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service'; // 💡 UserService es necesario

@Component({
  selector: 'app-view-batch',
  standalone: true,
  // DatePipe no es necesario aquí si solo se usa en el template, pero lo incluimos por buenas prácticas
  imports: [CommonModule, RouterLink, FormsModule, QRCodeComponent, DatePipe],
  templateUrl: './view-batch.component.html',
  styleUrls: ['./view-batch.component.css'],
})
export class ViewBatchComponent implements OnInit {

  filteredBatches: Batch[] = [];
  currentUser!: User; // 💡 Propiedad para almacenar el usuario actual

  searchText: string = '';
  currentPage: number = 1;
  totalPages: number = 1;

  isLoading: boolean = false;
  errorMessage: string | null = null;

  showQrModal: boolean = false;
  qrData: string = '';
  qrCodeBatchId: string = '';

  constructor(
    private router: Router,
    private batchService: BatchService,
    private sessionService: SessionService,
    private userService: UserService // 💡 Servicio de usuario inyectado
  ) { }

  ngOnInit(): void {
    this.loadBatches();
  }

  /**
   * Carga los lotes basándose en el companyOption del usuario.
   */
  loadBatches(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const connectedUserId = this.sessionService.getUserId();

    if (!connectedUserId) {
      this.errorMessage = 'No se pudo obtener la sesión. Inicie sesión.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    // 1. Obtener el usuario actual
    this.userService.getById(connectedUserId).pipe(
      first(),

      catchError((error) => {
        console.error('Error al cargar el usuario:', error);
        this.errorMessage = 'No se pudo cargar la información de su perfil.';
        this.isLoading = false;
        return EMPTY; // Detiene el flujo
      }),

      // 2. Usar switchMap para obtener todos los lotes y todos los usuarios
      switchMap((user: User) => {
        this.currentUser = user; // Guardamos el usuario

        return forkJoin({
          allBatches: this.batchService.getAllBatches().pipe(
            catchError(() => of([] as Batch[]))
          ),
          allUsers: this.userService.getAll().pipe(
            catchError(() => of([] as User[]))
          )
        });
      }),

      // 3. Filtrar los lotes basado en la lógica de companyOption
      catchError((error) => {
        console.error('Error al cargar datos:', error);
        this.errorMessage = 'Ocurrió un error al cargar los datos necesarios.';
        this.isLoading = false;
        return of({ allBatches: [], allUsers: [] });
      })
    )
      .subscribe(({ allBatches, allUsers }) => {
        let lotesVisibles: Batch[] = [];

        const currentUserIdString = String(connectedUserId);

        // Lógica de Filtrado
        if (this.currentUser.companyOption === 'create') {
          // Caso 'create' (Administrador/Propietario): Solo ve sus lotes
          lotesVisibles = allBatches.filter(
            (batch: Batch) => String(batch.producer_id) === currentUserIdString
          );
        } else if (this.currentUser.companyOption === 'join') {
          // Caso 'join' (Miembro/Empleado): Ve los lotes del Administrador de su empresa

          // Buscar al administrador (companyOption: 'create') de la misma compañía
          const adminUser = allUsers.find(
            u => u.companyName === this.currentUser.companyName && u.companyOption === 'create'
          );

          if (adminUser) {
            const adminIdString = String(adminUser.id);
            // Filtrar lotes por el ID del administrador
            lotesVisibles = allBatches.filter(
              (batch: Batch) => String(batch.producer_id) === adminIdString
            );
          } else {
            this.errorMessage = 'Empresa sin administrador registrado para visualizar lotes.';
          }
        }

        this.filteredBatches = lotesVisibles;
        this.isLoading = false;

        if (this.filteredBatches.length === 0 && !this.errorMessage) {
          const roleText = this.currentUser.companyOption === 'join' ? 'Miembro' : 'Productor';
          this.errorMessage = `¡Hola ${roleText}! Aún no tienes lotes visibles.`;
        }
      });
  }

  viewDetail(batchId: string | number): void {
    this.router.navigate([`/sidenav/details-batch/${batchId}`]);
  }

  editBatch(batchId: string | number): void {
    this.router.navigate([`/sidenav/edit-batch/${batchId}`]);
  }

  /**
   * Genera la URL pública del lote y activa la visualización del QR.
   * @param batchId El ID del lote para el QR.
   */
  generateQR(batchId: string | number): void {
    const baseUrl = window.location.origin;

    const qrCodeUrl = `${baseUrl}/view-qrcode/${batchId}`;

    this.qrData = qrCodeUrl;
    this.qrCodeBatchId = String(batchId);

    this.showQrModal = true;

    console.log("Generando QR para URL:", this.qrData);
  }

  /**
   * Cierra el modal/panel del QR.
   */
  closeQrModal(): void {
    this.showQrModal = false;
    this.qrData = '';
    this.qrCodeBatchId = '';
  }

  closeBatch(batchId: string | number): void {
    console.log(`Acción: Cerrar lote para el lote: ${batchId}`);
    // Aquí iría la lógica para cambiar el estado del lote a 'Cerrado' o similar.
  }
}
