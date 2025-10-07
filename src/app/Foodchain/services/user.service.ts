import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseService } from '../../shared/services/base.service';
import { User } from '../model/user.entity';

// Define la Interfaz del Payload (la estructura que viene del formulario)
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  taxId?: string;
  companyOption: 'join' | 'create';
  requestedRole: string;
  agreement: boolean;
  recaptcha: boolean;
  // Opcional, si el componente no lo limpia antes:
  confirmPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService<User> {

  constructor() {
    super();
    this.resourceEndPoint = '/users';
  }

  // --- Nuevo Método Específico para Registro ---

  /**
   * Registra un nuevo usuario en el sistema, utilizando el método create() heredado.
   * Añade manejo de errores robusto y específico de la lógica de registro.
   * @param newUserPayload El objeto de usuario (payload) limpio sin el campo confirmPassword.
   * @returns Un Observable que emite el objeto User registrado o null si falla.
   */
  registerUser(newUserPayload: RegisterPayload): Observable<User | null> {
    // Aplicamos la doble conversión (as unknown as User) para resolver el TS2352
    // y satisfacer la firma de BaseService.create(item: any).
    return this.create(newUserPayload as unknown as User)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error de API durante el registro:', error);

          let errorMessage = 'Error desconocido al registrar el usuario.';

          if (error.status === 409 || error.status === 400) {
            errorMessage = 'El correo electrónico ya está registrado o los datos son inválidos.';
          } else if (error.status === 0 || error.status === 500) {
            errorMessage = 'Error de conexión con el servidor. Inténtalo más tarde.';
          }

          alert(`Error de registro: ${errorMessage}`);

          // Devolvemos null para que el componente no se confunda
          return of(null);
        })
      );
  }

  // --- Métodos CRUD Heredados/Sobrescritos ---

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.resourcePath()}/${id}`, this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getAllByRequestedRole(roleName: string): Observable<User[]> {
    return this.getAll().pipe(
      map(users => users.filter(user => user.requestedRole === roleName)),
      catchError(this.handleError)
    );
  }
}
