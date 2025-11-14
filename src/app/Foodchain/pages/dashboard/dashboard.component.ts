import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { Batch } from '../../model/batch.entity';
import { User } from '../../model/user.entity';
import { Step } from '../../model/step.entity';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { BatchService } from '../../services/batch.service';
import { StepService } from '../../services/step.service';

// ... (Interfaces se mantienen sin cambios) ...
interface DashboardMetrics {
  totalLotes: number;
  tiposEstado: number;
  totalPersonal: number;
}
interface UserWithStepCount extends User {
  stepCount: number;
}
interface BatchWithRecentStep extends Batch {
  lastStepDate: Date | null;
  lastStepType: string | null;
}
interface DashboardData {
  companyBatches: Batch[]; // 💡 Cambiado a companyBatches
  companyUsers: UserWithStepCount[];
}
interface LoadData {
  batches: Batch[];
  allUsers: User[];
  allSteps: Step[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  currentUser: User | any = {};
  companyUsers: UserWithStepCount[] = [];
  sortedBatches: BatchWithRecentStep[] = [];

  metrics: DashboardMetrics = {
    totalLotes: 0,
    tiposEstado: 0,
    totalPersonal: 0,
  };

  isLoading: boolean = true;
  isLoadingUsers: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private sessionService: SessionService,
    private userService: UserService,
    private batchService: BatchService,
    private stepService: StepService
  ) { }

  ngOnInit(): void {
    const userId = this.sessionService.getUserId();
    if (!userId) {
      this.errorMessage = 'No hay sesión activa. Por favor, inicia sesión.';
      this.isLoading = false;
      return;
    }
    this.loadDashboardData(userId);
  }

  get userFullName(): string {
    if (this.currentUser && this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return 'Cargando...';
  }

  /**
   * Carga toda la información del dashboard en paralelo, ahora filtrando lotes por compañía.
   */
  loadDashboardData(userId: string): void {
    this.isLoading = true;
    this.isLoadingUsers = true;

    this.userService.getById(userId).pipe(
      catchError((err) => {
        this.errorMessage = 'Error al cargar el perfil del usuario.';
        console.error('Error cargando usuario:', err);
        return of(null as unknown as User);
      }),

      switchMap((user: User | null) => {
        if (!user) {
          this.isLoading = false;
          return of({ companyBatches: [], companyUsers: [] } as DashboardData);
        }

        this.currentUser = user;
        const companyName = user.companyName;

        // Cargar lotes, usuarios y pasos en paralelo
        return forkJoin({
          batches: this.batchService.getAllBatches().pipe(catchError(() => of([] as Batch[]))),
          allUsers: this.userService.getAll().pipe(catchError(() => of([] as User[]))),
          allSteps: this.stepService.getAllSteps().pipe(catchError(() => of([] as Step[])))
        }).pipe(
          map((data: LoadData) => {

            // 1. Identificar todos los usuarios de la compañía
            const companyUsers = data.allUsers.filter(u => u.companyName === companyName);
            const userIdsInCompany = new Set(companyUsers.map(u => u.id));

            // 2. 💡 ¡NUEVO FILTRO! Filtrar lotes por la compañía
            const companyBatches = data.batches.filter(b =>
              // Incluir el lote si su producer_id está en el Set de IDs de la compañía
              userIdsInCompany.has(b.producer_id)
            );

            const usersWithSteps = this.calculateStepCounts(companyUsers, data.allSteps);

            // 💡 Lógica de ordenamiento para la nueva tabla, ahora con los lotes de la compañía
            this.sortedBatches = this.sortBatchesByRecentStep(companyBatches, data.allSteps);

            return { companyBatches, companyUsers: usersWithSteps } as DashboardData;
          })
        );
      })
    ).subscribe({
      next: (data: DashboardData) => {
        // 💡 Usar companyBatches para las métricas
        this.processMetrics(data.companyBatches);
        this.processCompanyUsers(data.companyUsers, userId);

        this.isLoading = false;
        this.isLoadingUsers = false;
      },
      error: (err) => {
        this.errorMessage = 'Fallo en la carga de datos del dashboard.';
        this.isLoading = false;
        this.isLoadingUsers = false;
        console.error('Dashboard Error:', err);
      }
    });
  }

  // ... (calculateStepCounts, processMetrics, processCompanyUsers, y sortBatchesByRecentStep se mantienen igual,
  // pero ahora usan los datos de toda la compañía) ...

  /**
   * Calcula el número de pasos por usuario.
   */
  calculateStepCounts(users: User[], steps: Step[]): UserWithStepCount[] {
    const stepCounts: { [userId: string]: number } = {};

    steps.forEach(step => {
      const id = step.userId;
      stepCounts[id] = (stepCounts[id] || 0) + 1;
    });

    return users.map(user => ({
      ...user,
      stepCount: stepCounts[user.id] || 0
    }));
  }

  /**
   * Calcula las métricas de lotes y el CONTEO de lotes con estado "Activo".
   */
  processMetrics(batches: Batch[]): void {
    this.metrics.totalLotes = batches.length;

    const activeLotCount = batches.filter(batch =>
      batch.state === 'Activo'
    ).length;

    this.metrics.tiposEstado = activeLotCount;
  }

  /**
   * Filtra los usuarios de la compañía, excluyendo al usuario logueado, y establece la métrica total.
   */
  processCompanyUsers(allUsers: UserWithStepCount[], currentUserId: string): void {
    this.metrics.totalPersonal = allUsers.length;
    this.companyUsers = allUsers.filter(u => u.id !== currentUserId);
  }

  /**
   * Encuentra el paso más reciente para cada lote y ordena la lista.
   */
  sortBatchesByRecentStep(batches: Batch[], steps: Step[]): BatchWithRecentStep[] {
    const batchesMap: Map<string, BatchWithRecentStep> = new Map();

    batches.forEach(batch => {
      const batchIdString = String(batch.id);
      batchesMap.set(batchIdString, {
        ...batch,
        lastStepDate: null,
        lastStepType: null,
      });
    });

    steps.forEach(step => {
      const lotIdSearchString = String(step.lotId);
      const batch = batchesMap.get(lotIdSearchString);

      if (batch) {
        const time = step.stepTime.split(':').length === 2 ? `${step.stepTime}:00` : step.stepTime;
        const dateString = `${step.stepDate}T${time}`;
        const stepDateTime = new Date(dateString);

        if (isNaN(stepDateTime.getTime())) {
          return;
        }

        if (!batch.lastStepDate || stepDateTime.getTime() > batch.lastStepDate.getTime()) {
          batch.lastStepDate = stepDateTime;
          batch.lastStepType = step.stepType;
        }
      }
    });

    const sortedArray = Array.from(batchesMap.values()).sort((a, b) => {
      if (!a.lastStepDate) return 1;
      if (!b.lastStepDate) return -1;
      return b.lastStepDate.getTime() - a.lastStepDate.getTime();
    });

    return sortedArray;
  }
}
