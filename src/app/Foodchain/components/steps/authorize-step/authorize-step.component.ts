import { Component, OnInit } from '@angular/core';
 // Ajusta la ruta
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import {StepService} from '../../../services/step.service';
import {SessionService} from '../../../services/session.service';
import {Step} from '../../../model/step.entity';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-authorize-step',
  standalone: true, // Asumiendo que es standalone
  imports: [
    CommonModule,  ],
  templateUrl: './authorize-step.component.html',
  styleUrls: ['./authorize-step.component.css']
})
export class AuthorizeStepComponent implements OnInit {

  /** Lista de pasos pendientes a autorizar. */
  pendingSteps$: Observable<Step[]> | undefined;

  /** ID del usuario logueado. */
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
   * Carga los pasos pendientes asociados al usuario logueado.
   */
  loadPendingSteps(): void {
    if (this.loggedUserId) {
      this.pendingSteps$ = this.stepService.getPendingStepsByUserId(this.loggedUserId);
    } else {
      console.error('No hay un usuario logueado.');
      // Opcional: Redirigir al login o mostrar un mensaje
    }
  }

  /**
   * Maneja la acción de aceptar un paso.
   * @param step El objeto Step a aceptar.
   */
  onAccept(step: Step): void {
    if (!step.id) return;

    this.stepService.updateStepStatus(step.id, 'accepted').pipe(
      // Después de la actualización exitosa, recargar la lista de pasos
      tap(result => {
        if (result) {
          alert(`Paso ${step.id} aceptado con éxito.`);
        } else {
          alert(`No se pudo aceptar el paso ${step.id}.`);
        }
      }),
      switchMap(() => {
        // Recarga la lista para reflejar el cambio (el paso aceptado desaparecerá)
        return this.stepService.getPendingStepsByUserId(this.loggedUserId!);
      })
    ).subscribe(updatedSteps => {
      // Reemplaza el Observable para actualizar la vista
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
      // Después de la actualización exitosa, recargar la lista de pasos
      tap(result => {
        if (result) {
          alert(`Paso ${step.id} rechazado (cancelled) con éxito.`);
        } else {
          alert(`No se pudo rechazar el paso ${step.id}.`);
        }
      }),
      switchMap(() => {
        // Recarga la lista para reflejar el cambio (el paso rechazado desaparecerá)
        return this.stepService.getPendingStepsByUserId(this.loggedUserId!);
      })
    ).subscribe(updatedSteps => {
      // Reemplaza el Observable para actualizar la vista
      this.pendingSteps$ = new Observable<Step[]>(observer => observer.next(updatedSteps));
    });
  }
}
