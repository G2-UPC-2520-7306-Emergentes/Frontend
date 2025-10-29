import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private loggedInUserId: string | null = null;

  constructor() {

    this.loggedInUserId = localStorage.getItem('logged_user_id');
  }

  /**
   * Guarda el ID del usuario después de un inicio de sesión/registro exitoso.
   */
  setUserId(id: string): void {
    this.loggedInUserId = id;
    localStorage.setItem('logged_user_id', id);
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
