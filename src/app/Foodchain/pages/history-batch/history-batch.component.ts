import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// 💡 Agregamos switchMap, catchError, of, EMPTY, forkJoin
import { first, switchMap, catchError } from 'rxjs/operators';
import { of, EMPTY, forkJoin } from 'rxjs';

import { SessionService } from '../../services/session.service';
import { BatchService } from '../../services/batch.service';
import { StepService } from '../../services/step.service';
import { UserService } from '../../services/user.service'; // 💡 Nuevo: Importamos UserService
import { Batch } from '../../model/batch.entity';
import { Step } from '../../model/step.entity';
import { User } from '../../model/user.entity'; // 💡 Nuevo: Importamos la entidad User

@Component({
  selector: 'app-history-batch',
  standalone: true,
  templateUrl: './history-batch.component.html',
  styleUrls: ['./history-batch.component.css'],
  imports: [CommonModule, FormsModule]
})
export class HistoryBatchComponent implements OnInit {

  userBatches: Batch[] = [];
  stepsHistory: Step[] = [];
  selectedLotId: string | null = null;
  currentUser!: User; // 💡 Nuevo: Propiedad para almacenar el usuario actual

  isLoadingBatches: boolean = true;
  isLoadingSteps: boolean = false;
  errorBatchMessage: string | null = null;
  errorStepMessage: string | null = null;

  constructor(
    private sessionService: SessionService,
    private batchService: BatchService,
    private stepService: StepService,
    private userService: UserService, // 💡 Nuevo: Inyectamos UserService
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserBatches();
  }

  /**
   * 💡 MODIFICADO: Carga los lotes visibles según el rol (companyOption) del usuario.
   * Si es 'create', ve sus lotes. Si es 'join', ve los lotes del administrador de su empresa.
   */
  loadUserBatches(): void {
    this.isLoadingBatches = true;
    this.errorBatchMessage = null;

    const connectedUserId = this.sessionService.getUserId();

    if (!connectedUserId) {
      this.errorBatchMessage = 'Error de sesión. ID de usuario no disponible.';
      this.isLoadingBatches = false;
      return;
    }

    // 1. Obtener el usuario actual
    this.userService.getById(connectedUserId).pipe(
      first(),

      catchError((error) => {
        console.error('Error al cargar el usuario:', error);
        this.errorBatchMessage = 'No se pudo cargar la información de su perfil.';
        this.isLoadingBatches = false;
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
        this.errorBatchMessage = 'Ocurrió un error al cargar los datos necesarios.';
        this.isLoadingBatches = false;
        return of({ allBatches: [], allUsers: [] });
      })
    )
      .subscribe(({ allBatches, allUsers }) => {
        let lotesVisibles: Batch[] = [];

        const currentUserIdString = String(connectedUserId);

        // --- Lógica de Filtrado de Lotes ---
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
            this.errorBatchMessage = 'Empresa sin administrador registrado para visualizar lotes.';
          }
        }

        this.userBatches = lotesVisibles;
        this.isLoadingBatches = false;

        if (this.userBatches.length > 0) {
          if (!this.selectedLotId) {
            // Seleccionar el primer lote visible por defecto
            this.selectedLotId = this.userBatches[0].id;
          }
          this.loadStepsByLotId(this.selectedLotId);
        } else if (!this.errorBatchMessage) {
          // Mensaje genérico si no se encontraron lotes para su rol
          const roleText = this.currentUser.companyOption === 'join' ? 'Miembro' : 'Productor';
          this.errorBatchMessage = `¡Hola ${roleText}! No hay lotes visibles para esta sección.`;
        }
      });
  }


  onLotSelected(): void {
    if (this.selectedLotId) {
      this.loadStepsByLotId(this.selectedLotId);
    } else {
      this.stepsHistory = [];
      this.errorStepMessage = null;
    }
  }

  loadStepsByLotId(lotId: string): void {
    this.isLoadingSteps = true;
    this.errorStepMessage = null;
    this.stepsHistory = [];

    this.stepService.getStepsByLotId(lotId)
      .pipe(first())
      .subscribe({
        next: (steps: Step[]) => {
          this.stepsHistory = steps.sort((a, b) => {
            const dateA = `${a.stepDate} ${a.stepTime}`;
            const dateB = `${b.stepDate} ${b.stepTime}`;
            return dateA.localeCompare(dateB);
          });

          this.isLoadingSteps = false;

          if (this.stepsHistory.length === 0) {
            this.errorStepMessage = 'No hay pasos registrados aún para este lote.';
          }
        },
        error: (error) => {
          console.error('Error al cargar historial de pasos:', error);
          this.errorStepMessage = 'Error al obtener el historial de trazabilidad.';
          this.isLoadingSteps = false;
        }
      });
  }

  formatHash(hash: string): string {
    if (!hash || hash.length < 8) {
      return '**********';
    }
    return `${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`;
  }

  getRoleTitle(stepType: string, index: number): string {
    if (index === 0) return 'Productor';
    if (stepType.includes('Procesamiento')) return 'Procesador';
    if (stepType.includes('Empaque')) return 'Empacador';
    return 'Entidad Externa';
  }
}
