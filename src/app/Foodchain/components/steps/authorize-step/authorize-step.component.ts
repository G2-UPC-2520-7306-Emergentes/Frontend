import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import {StepService} from '../../../services/step.service';
import {SessionService} from '../../../services/session.service';
import {Step} from '../../../model/step.entity';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-authorize-step',
  standalone: true,
  imports: [
    CommonModule,  ],
  templateUrl: './authorize-step.component.html',
  styleUrls: ['./authorize-step.component.css']
})
export class AuthorizeStepComponent implements OnInit {

  /** Lista de pasos pendientes a autorizar. */
  pendingSteps$: Observable<Step[]> | undefined;

  /** ID del usuario logueado. (Se mantiene pero solo se usa si se requiere en el futuro, o para el guardado) */
  private loggedUserId: string | null;

  constructor(
    private stepService: StepService,
    private sessionService: SessionService
  ) {
    this.loggedUserId = this.sessionService.getUserId();
  }

  ngOnInit(): void {
    this.loadPendingSteps();
  }

  /**
   * Carga *todos* los pasos pendientes, sin filtrar por el ID del usuario.
   * 💡 Se asume que el servicio tiene un método para obtener todos los 'pending'.
   */
  loadPendingSteps(): void {
    // ❌ Se elimina el filtro por loggedUserId.
    this.pendingSteps$ = this.stepService.getPendingSteps();

    // Opcional: Si el servicio solo tiene 'getPendingStepsByUserId', puedes pasar un ID vacío/nulo
    // y la lógica de backend debe interpretarlo como 'todos'.
    // Ejemplo: this.pendingSteps$ = this.stepService.getPendingStepsByUserId('');
  }

  /**
   * Maneja la acción de aceptar un paso.
   * @param step El objeto Step a aceptar.
   */
  onAccept(step: Step): void {
    if (!step.id) return;

    this.stepService.updateStepStatus(step.id, 'accepted').pipe(
      tap(result => {
        if (result) {
          alert(`Paso ${step.id} aceptado con éxito.`);
        } else {
          alert(`No se pudo aceptar el paso ${step.id}.`);
        }
      }),
      switchMap(() => {
        // Recarga *todos* los pasos pendientes (sin filtro de usuario)
        return this.stepService.getPendingSteps(); // 💡 Llamada al nuevo método
      })
    ).subscribe(updatedSteps => {
      this.pendingSteps$ = new Observable<Step[]>(observer => observer.next(updatedSteps));
    });
  }

  /**
   * Maneja la acción de rechazar un paso.
   * @param step El objeto Step a rechazar.
   */
  onReject(step: Step): void {
    if (!step.id) return;

    this.stepService.updateStepStatus(step.id, 'cancelled').pipe(
      tap(result => {
        if (result) {
          alert(`Paso ${step.id} rechazado (cancelled) con éxito.`);
        } else {
          alert(`No se pudo rechazar el paso ${step.id}.`);
        }
      }),
      switchMap(() => {
        // Recarga *todos* los pasos pendientes (sin filtro de usuario)
        return this.stepService.getPendingSteps(); // 💡 Llamada al nuevo método
      })
    ).subscribe(updatedSteps => {
      this.pendingSteps$ = new Observable<Step[]>(observer => observer.next(updatedSteps));
    });
  }
}
