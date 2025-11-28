import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs'; // Importamos throwError de 'rxjs'
import { catchError, map, retry } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseService } from '../../shared/services/base.service';
import { Registro } from '../model/registro'; // Clase Registro del usuario

// Interfaz para los datos que se envían al iniciar sesión
export interface SignInPayload {
  email: string;
  password: string;
}

// Interfaz para la respuesta exitosa del servidor al iniciar sesión (Token JWT)
export interface AuthResponse {
  email: string; // <-- Añadimos email
  token: string; // <-- CAMBIAMOS de accessToken a token
  // userId: string; <-- Eliminamos userId o lo hacemos opcional si no viene
}

// La interfaz de Registro (para el sign-up)
export interface RegistroPayload {
  enterpriseId: string;
  email: string;
  password: string;
}


@Injectable({
  providedIn: 'root'
})
export class RegisterService extends BaseService<Registro> {

  private readonly signInEndPoint = 'iam/auth/sign-in';
  private readonly signUpEndPoint = 'iam/auth/sign-up';

  constructor() {
    super();
    this.resourceEndPoint = this.signUpEndPoint;
  }

  // ---------------------------------------------
  //   MÉTODO AUXILIAR: POST SIN ERROR GLOBAL (postToUrlRaw)
  // ---------------------------------------------

  /**
   * Realiza una petición POST sin aplicar el handleError global del BaseService.
   * Esto es crucial para que el método signIn capture errores 401/403 de forma limpia.
   * @param endPoint El path del recurso relativo al basePath (ej: 'iam/auth/sign-in').
   * @param item El cuerpo de la petición (objeto JS que se convierte a JSON).
   * @returns Un Observable de la respuesta tipada.
   */
  public postToUrlRaw<T>(endPoint: string, item: any): Observable<T> {

    // Lógica robusta para construir la URL, evitando dobles barras (//)
    const base = this.basePath.endsWith('/') ? this.basePath.slice(0, -1) : this.basePath;
    const path = endPoint.startsWith('/') ? endPoint.slice(1) : endPoint;
    const fullUrl = `${base}/${path}`;

    // 🛑 CORRECCIÓN: Quitamos JSON.stringify(). Angular HttpClient lo hace automáticamente.
    // A veces, el stringify manual con httpOptions causa problemas de doble serialización.
    return this.http.post<T>(fullUrl, item, this.httpOptions)
      .pipe(
        retry(2),
        // Relanzamos el error original para que sea capturado en el método signIn
        catchError((error) => throwError(() => error))
      );
  }


  // ---------------------------------------------
  //         MÉTODO DE INICIO DE SESIÓN (LOGIN)
  // ---------------------------------------------

  /**
   * Autentica al usuario con email y contraseña.
   * @param payload Objeto con email y password.
   * @returns Un Observable que emite el objeto AuthResponse (con el token) o null si falla.
   */
  signIn(payload: SignInPayload): Observable<AuthResponse | null> {

    // Usamos postToUrlRaw para que el error 401/403 llegue directamente aquí
    return this.postToUrlRaw<AuthResponse>(this.signInEndPoint, payload)
      .pipe(
        catchError((error: HttpErrorResponse) => {

          if (error.status === 401 || error.status === 403) {
            console.error('Error de autenticación 401/403 (Credenciales incorrectas):', error);
            // Si el error es de autenticación, devolvemos null, activando el mensaje en el componente
            return of(null);
          }

          // Para otros errores (400, 500, etc.), mostramos un mensaje general
          console.error('Error de API durante el inicio de sesión (otro error):', error);
          let errorMessage = (error.status === 400) ?
            'Datos de solicitud inválidos.' :
            (error.status >= 500) ?
              'Error interno del servidor. Inténtalo más tarde.' :
              'Error desconocido al iniciar sesión.';

          // Usamos alert para reportar fallos de red o servidor
          alert(`Fallo en el Inicio de Sesión: ${errorMessage}`);
          return of(null);
        })
      );
  }


  // ---------------------------------------------
  //            MÉTODO DE REGISTRO (SIGN-UP)
  // ---------------------------------------------

  /**
   * Registra un nuevo usuario en el sistema.
   * Utiliza el método create() heredado (que usa this.resourceEndPoint = 'iam/auth/sign-up').
   */
  registerUser(registerPayload: RegistroPayload): Observable<Registro | null> {
    const nuevoRegistro = new Registro(registerPayload);

    // El método create() utiliza la gestión de errores del BaseService
    return this.create(nuevoRegistro as unknown as Registro)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error de API durante el registro de usuario:', error);
          let errorMessage = (error.status === 409) ? 'Este email ya está registrado.' :
            (error.status === 400) ? 'Datos inválidos.' :
              (error.status >= 500) ? 'Error interno del servidor.' : 'Error desconocido.';

          alert(`Fallo en el Registro: ${errorMessage}`);
          return of(null);
        }),
        map(response => response ? new Registro(response) : null)
      );
  }
}
