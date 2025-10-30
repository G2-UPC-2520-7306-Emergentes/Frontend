import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common'; // Necesario para formatear la fecha/hora

import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import {Batch} from '../../model/batch.entity';
import {User} from '../../model/user.entity';
import {Step} from '../../model/step.entity';
import {SessionService} from '../../services/session.service';
import {UserService} from '../../services/user.service';
import {BatchService} from '../../services/batch.service';
import {StepService} from '../../services/step.service';

// 💡 Estructura de métricas
interface DashboardMetrics {
  totalLotes: number;
  tiposEstado: number; // Ahora usado para el CONTEO de Lotes "Activo"
  totalPersonal: number;
}

// 💡 Nuevo tipo para extender User con el conteo de pasos
interface UserWithStepCount extends User {
  stepCount: number;
}

// 💡 Nuevo tipo para extender Batch con la info del paso reciente
interface BatchWithRecentStep extends Batch {
  lastStepDate: Date | null;
  lastStepType: string | null;
}

// 💡 Tipo de datos que se procesará en el .subscribe
interface DashboardData {
  producerBatches: Batch[];
  companyUsers: UserWithStepCount[];
}

// 💡 Tipo de datos cargados desde el forkJoin
interface LoadData {
  batches: Batch[];
  allUsers: User[];
  allSteps: Step[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // Agregamos DatePipe para el formateo de fechas
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  currentUser: User | any = {};
  companyUsers: UserWithStepCount[] = [];
  sortedBatches: BatchWithRecentStep[] = []; // Propiedad para la nueva tabla

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

  /**
   * Getter que combina el nombre y apellido del usuario logueado.
   */
  get userFullName(): string {
    if (this.currentUser && this.currentUser.firstName && this.currentUser.lastName) {
      // Usamos 'firstName' y 'lastName' según tu modelo de User
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return 'Cargando...';
  }

  /**
   * Carga toda la información del dashboard en paralelo.
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
          return of({ producerBatches: [], companyUsers: [] } as DashboardData);
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

            const producerBatches = data.batches.filter(b => b.producer_id === userId);

            const companyUsers = data.allUsers.filter(u => u.companyName === companyName);
            const usersWithSteps = this.calculateStepCounts(companyUsers, data.allSteps);

            // 💡 Lógica de ordenamiento para la nueva tabla
            this.sortedBatches = this.sortBatchesByRecentStep(producerBatches, data.allSteps);

            return { producerBatches, companyUsers: usersWithSteps } as DashboardData;
          })
        );
      })
    ).subscribe({
      next: (data: DashboardData) => {


        this.processMetrics(data.producerBatches);
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

    // 💡 CONTEO LÓTICO: Contar el número exacto de lotes con state === "Activo"
    const activeLotCount = batches.filter(batch =>
      batch.state === 'Activo'
    ).length;

    // Asignar el conteo de lotes "Activos" a la métrica.
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

    // 1. Inicializar el mapa de lotes (Usando ID de lote como STRING)
    batches.forEach(batch => {
      // 💡 CORRECCIÓN 1: Aseguramos que la clave del Map sea STRING
      const batchIdString = String(batch.id);
      batchesMap.set(batchIdString, {
        ...batch,
        lastStepDate: null,
        lastStepType: null,
      });
    });

    // 2. Encontrar el paso más reciente para cada lote
    steps.forEach(step => {
      // 💡 CORRECCIÓN 2: Aseguramos que la búsqueda sea con STRING
      const lotIdSearchString = String(step.lotId);
      const batch = batchesMap.get(lotIdSearchString);

      // Console log de verificación final (puedes quitarlo después)
      // console.log(`Paso ID: ${step.id} | Buscando Lote ID: ${lotIdSearchString} | Lote Encontrado?: ${!!batch}`);

      if (batch) {

        // Lógica de manejo de fechas (se mantiene la versión robusta anterior)
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

    // 3. Convertir el mapa a un array y ordenar (se mantiene igual)
    const sortedArray = Array.from(batchesMap.values()).sort((a, b) => {
      if (!a.lastStepDate) return 1;
      if (!b.lastStepDate) return -1;
      return b.lastStepDate.getTime() - a.lastStepDate.getTime();
    });

    return sortedArray;
  }
}
