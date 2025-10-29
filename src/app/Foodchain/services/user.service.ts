import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseService } from '../../shared/services/base.service';
import { User } from '../model/user.entity'; // ✨ Usando la entidad User

// Define la Interfaz del Payload de Registro
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
  confirmPassword?: string;
  id: string; // Puede ser número o string
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
   * @param newUserPayload El objeto de usuario (payload) limpio.
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
          return of(null);
        })
      );
  }

  /**
   * Actualiza los datos del perfil de un usuario existente.
   * @param id El ID del usuario a actualizar.
   * @param updatedUser El objeto User completo con los campos modificados.
   * @returns Un Observable que emite el objeto User actualizado o null si falla.
   */
  updateProfile(id: string, updatedUser: Partial<User>): Observable<User | null> {
    return this.update(id, updatedUser).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error de API durante la actualización del perfil:', error);
        alert('Error al actualizar el perfil: El servidor no pudo procesar la solicitud.');
        return of(null);
      })
    );
  }



  // --- Métodos CRUD Heredados/Sobrescritos ---

  // El método retorna un Observable de la clase User
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
