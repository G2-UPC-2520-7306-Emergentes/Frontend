import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  // Almacena el ID del usuario en memoria
  private loggedInUserId: string | null = null;

  constructor() {
    // Intenta recuperar el ID de localStorage al iniciar la aplicación
    this.loggedInUserId = localStorage.getItem('logged_user_id');
  }

  /**
   * Guarda el ID del usuario después de un inicio de sesión/registro exitoso.
   */
  setUserId(id: string): void {
    this.loggedInUserId = id;
    localStorage.setItem('logged_user_id', id); // Persistencia simple
  }

  /**
   * Proporciona el ID del usuario conectado a cualquier componente.
   */
  getUserId(): string | null {
    return this.loggedInUserId;
  }

  /**
   * Cierra la sesión.
   */
  clearSession(): void {
    this.loggedInUserId = null;
    localStorage.removeItem('logged_user_id');
  }
}
