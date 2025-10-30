import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  tiposEstado: number;
  totalPersonal: number;
}

// 💡 Nuevo tipo para extender User con el conteo de pasos
interface UserWithStepCount extends User {
  stepCount: number;
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
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  currentUser: User | any = {};
  companyUsers: UserWithStepCount[] = [];

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
    private stepService: StepService // Inyección de StepService
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
   * Utilizado en el HTML para mostrar el nombre completo.
   */
  get userFullName(): string {
    if (this.currentUser && this.currentUser.firstName && this.currentUser.lastName) {
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

    // 1. Obtener la información completa del usuario logueado
    this.userService.getById(userId).pipe(
      catchError((err) => {
        this.errorMessage = 'Error al cargar el perfil del usuario.';
        console.error('Error cargando usuario:', err);
        return of(null as unknown as User);
      }),

      // 2. Encadenar la carga de los demás datos
      switchMap((user: User | null) => {
        if (!user) {
          this.isLoading = false;
          // Retornamos el tipo final esperado, inicializado a vacío para evitar el error TS2769
          return of({ producerBatches: [] as Batch[], companyUsers: [] as UserWithStepCount[] } as DashboardData);
        }

        this.currentUser = user;
        const companyName = user.companyName;

        // 3. Cargar lotes, usuarios y pasos en paralelo
        return forkJoin({
          batches: this.batchService.getAllBatches().pipe(catchError(() => of([] as Batch[]))),
          allUsers: this.userService.getAll().pipe(catchError(() => of([] as User[]))),
          allSteps: this.stepService.getAllSteps().pipe(catchError(() => of([] as Step[])))
        }).pipe(
          // 4. Mapear y procesar los resultados
          map((data: LoadData) => {

            // Lógica de Lotes (Métricas)
            const producerBatches = data.batches.filter(b => b.producer_id === userId);

            // Lógica de Usuarios y Pasos
            const companyUsers = data.allUsers.filter(u => u.companyName === companyName);
            const usersWithSteps = this.calculateStepCounts(companyUsers, data.allSteps);

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

    // 1. Contar pasos por ID de usuario
    steps.forEach(step => {
      const id = step.userId;
      stepCounts[id] = (stepCounts[id] || 0) + 1;
    });

    // 2. Asignar el conteo al objeto User
    return users.map(user => ({
      ...user,
      stepCount: stepCounts[user.id] || 0
    }));
  }

  /**
   * Calcula las métricas de lotes y estados.
   */
  processMetrics(batches: Batch[]): void {
    this.metrics.totalLotes = batches.length;

    const distinctStates = new Set(batches.map(b => b.state));
    this.metrics.tiposEstado = distinctStates.size;
  }

  /**
   * Filtra los usuarios de la compañía, excluyendo al usuario logueado, y establece la métrica total.
   */
  processCompanyUsers(allUsers: UserWithStepCount[], currentUserId: string): void {
    // La métrica cuenta a todos, incluido el usuario logueado
    this.metrics.totalPersonal = allUsers.length;

    // La lista visible excluye al usuario logueado
    this.companyUsers = allUsers.filter(u => u.id !== currentUserId);
  }
}
