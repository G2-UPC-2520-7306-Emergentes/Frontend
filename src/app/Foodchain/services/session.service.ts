import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  // Nombres de clave para localStorage
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_ID_KEY = 'logged_user_id';

  // Propiedad para cachear el ID de usuario en memoria
  private loggedInUserId: string | null = null;

  constructor() {
    // Intenta inicializar el ID de usuario desde localStorage al iniciar
    this.loggedInUserId = localStorage.getItem(this.USER_ID_KEY);
  }

  // --- Métodos para el Token de Autenticación (JWT) ---

  /**
   * 🔑 Guarda el Token JWT recibido del backend.
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * 🔑 Proporciona el Token JWT (usado típicamente por los Interceptores HTTP).
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // --- Métodos para el ID del Usuario ---

  /**
   * Guarda el ID del usuario después de un inicio de sesión/registro exitoso.
   */
  setUserId(id: string): void {
    this.loggedInUserId = id;
    localStorage.setItem(this.USER_ID_KEY, id);
  }

  /**
   * Proporciona el ID del usuario conectado a cualquier componente.
   */
  getUserId(): string | null {
    return this.loggedInUserId;
  }

  // --- Método para Cerrar Sesión ---

  /**
   * 🚪 Cierra la sesión eliminando el ID del usuario y el Token JWT.
   */
  clearSession(): void {
    this.loggedInUserId = null;
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.TOKEN_KEY); // 🛑 Limpia el Token
  }
}
