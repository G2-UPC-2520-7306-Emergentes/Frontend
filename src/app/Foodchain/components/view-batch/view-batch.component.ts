import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { first, catchError, switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, EMPTY, forkJoin, Subject } from 'rxjs';

import { QRCodeComponent } from 'angularx-qrcode';

import { Batch } from '../../model/batch.entity';
import { User } from '../../model/user.entity';
import { BatchService } from '../../services/batch.service';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-view-batch',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, QRCodeComponent, DatePipe],
  templateUrl: './view-batch.component.html',
  styleUrls: ['./view-batch.component.css'],
})
export class ViewBatchComponent implements OnInit {

  // Propiedades para el filtro
  private allBatches: Batch[] = [];
  private searchSubject = new Subject<string>();

  filteredBatches: Batch[] = [];
  currentUser!: User;

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
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadBatches();
    this.setupSearchSubscription();
  }

  /**
   * Configura la suscripción reactiva para la caja de búsqueda.
   */
  setupSearchSubscription(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchValue => {
      this.filterBatches(searchValue);
    });
  }

  /**
   * Se llama cada vez que cambia el modelo en el input de búsqueda.
   */
  onSearchChange(): void {
    this.searchSubject.next(this.searchText);
  }

  /**
   * Ejecuta el filtrado sobre la lista completa de lotes.
   */
  filterBatches(searchText: string): void {
    if (!searchText) {
      this.filteredBatches = this.allBatches;
      this.errorMessage = null;
      return;
    }

    const searchLower = searchText.toLowerCase();

    this.filteredBatches = this.allBatches.filter(batch => {
      const lotNameMatch = batch.lotName.toLowerCase().includes(searchLower);
      const idMatch = String(batch.id).includes(searchLower);

      return lotNameMatch || idMatch;
    });

    if (this.filteredBatches.length === 0 && !this.isLoading) {
      this.errorMessage = 'No se encontraron lotes que coincidan con su búsqueda.';
    } else {
      if (this.allBatches.length > 0) {
        this.errorMessage = null;
      }
    }
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
        return EMPTY;
      }),

      switchMap((user: User) => {
        this.currentUser = user;

        return forkJoin({
          allBatches: this.batchService.getAllBatches().pipe(
            catchError(() => of([] as Batch[]))
          ),
          allUsers: this.userService.getAll().pipe(
            catchError(() => of([] as User[]))
          )
        });
      }),

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

        if (this.currentUser.companyOption === 'create') {
          lotesVisibles = allBatches.filter(
            (batch: Batch) => String(batch.producer_id) === currentUserIdString
          );
        } else if (this.currentUser.companyOption === 'join') {
          const adminUser = allUsers.find(
            u => u.companyName === this.currentUser.companyName && u.companyOption === 'create'
          );

          if (adminUser) {
            const adminIdString = String(adminUser.id);

            lotesVisibles = allBatches.filter(
              (batch: Batch) => String(batch.producer_id) === adminIdString
            );
          } else {
            this.errorMessage = 'Empresa sin administrador registrado para visualizar lotes.';
          }
        }

        this.allBatches = lotesVisibles;
        this.filterBatches(this.searchText);
        this.isLoading = false;

        if (this.allBatches.length === 0 && !this.errorMessage) {
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
