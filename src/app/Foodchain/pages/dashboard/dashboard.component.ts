import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import {Batch} from '../../model/batch.entity';
import {User} from '../../model/user.entity';
import {SessionService} from '../../services/session.service';
import {UserService} from '../../services/user.service';
import {BatchService} from '../../services/batch.service';

// 💡 Estructura de métricas para el HTML
interface DashboardMetrics {
  totalLotes: number;
  tiposEstado: number; // Cantidad de estados distintos
  totalPersonal: number;
}

// 💡 Definición del tipo de datos que se procesará en el .subscribe
interface DashboardData {
  producerBatches: Batch[];
  companyUsers: User[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // Asegúrate de que los pipes (como | lowercase) estén disponibles
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  // Inicialización de las propiedades
  currentUser: User | any = {};
  companyUsers: User[] = [];

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
    private batchService: BatchService
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


  // ===========================================
  // 💡 PROPIEDAD CORREGIDA PARA EL NOMBRE COMPLETO
  // ===========================================
  /**
   * Getter que combina el nombre y apellido del usuario logueado.
   * Se utiliza en la plantilla (HTML) en lugar de currentUser.nombreCompleto.
   */
  get userFullName(): string {
    if (this.currentUser && this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    // Retorna 'Cargando...' si no hay datos o están incompletos.
    return 'Cargando...';
  }

  /**
   * Carga la información del usuario logueado, las métricas y la lista de personal.
   */
  loadDashboardData(userId: string): void {
    this.isLoading = true;
    this.isLoadingUsers = true;

    // 1. Obtener la información completa del usuario logueado
    this.userService.getById(userId).pipe(
      // Si falla la obtención del usuario inicial, retornamos un observable de null
      catchError((err) => {
        this.errorMessage = 'Error al cargar el perfil del usuario.';
        console.error('Error cargando usuario:', err);
        return of(null as unknown as User);
      }),

      // 2. Usar switchMap para encadenar las llamadas con el companyName
      switchMap((user: User | null) => {
        if (!user) {
          // 🛑 SI EL USUARIO FALLA: Retornamos el tipo final esperado (DashboardData), inicializado a vacío.
          this.isLoading = false;
          return of({
            producerBatches: [] as Batch[],
            companyUsers: [] as User[]
          } as DashboardData);
        }

        this.currentUser = user;
        const companyName = user.companyName;

        // 3. Cargar todos los lotes y todos los usuarios en paralelo
        return forkJoin({
          batches: this.batchService.getAllBatches().pipe(catchError(() => of([] as Batch[]))),
          allUsers: this.userService.getAll().pipe(catchError(() => of([] as User[])))
        }).pipe(
          // 4. Mapear y procesar los resultados para obtener el tipo DashboardData
          map(({ batches, allUsers }) => {

            // Filtramos lotes del productor actual para métricas
            const producerBatches = batches.filter(b => b.producer_id === userId);

            // Filtramos usuarios de la misma compañía
            const companyUsers = allUsers.filter(u => u.companyName === companyName);

            return { producerBatches, companyUsers } as DashboardData;
          })
        );
      })
    ).subscribe({
      // 5. El .subscribe ahora espera un único tipo: DashboardData
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
   * Calcula las métricas de lotes y estados.
   */
  processMetrics(batches: Batch[]): void {
    this.metrics.totalLotes = batches.length;

    // Calcular el número de estados distintos (tiposEstado)
    const distinctStates = new Set(batches.map(b => b.state));
    this.metrics.tiposEstado = distinctStates.size;
  }

  /**
   * Filtra los usuarios de la compañía, excluyendo al usuario logueado, y establece la métrica total.
   */
  processCompanyUsers(allUsers: User[], currentUserId: string): void {
    // La métrica cuenta a todos, incluido el usuario logueado
    this.metrics.totalPersonal = allUsers.length;

    // La lista visible excluye al usuario logueado
    this.companyUsers = allUsers.filter(u => u.id !== currentUserId);
  }
}
