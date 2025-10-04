import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio para gestionar el estado del tema (Claro/Oscuro) de la aplicación.
 */
@Injectable({
  // 'root' hace que el servicio esté disponible en toda la aplicación (Singleton)
  providedIn: 'root'
})
export class ThemeService {

  // Clave de almacenamiento local para persistir la preferencia del usuario
  private readonly STORAGE_KEY = 'theme';

  // 1. Inicializa el estado leyendo del localStorage. Por defecto es 'light'.
  private isDarkTheme = new BehaviorSubject<boolean>(
    localStorage.getItem(this.STORAGE_KEY) === 'dark'
  );

  // Observable público para que los componentes se suscriban a los cambios
  isDarkTheme$: Observable<boolean> = this.isDarkTheme.asObservable();

  constructor() {
    // 2. Aplica el tema inicial al cargar la aplicación
    this.applyTheme(this.isDarkTheme.value);
  }

  /**
   * Alterna el tema y actualiza el localStorage.
   */
  toggleDarkTheme(): void {
    const newThemeState = !this.isDarkTheme.value;

    this.isDarkTheme.next(newThemeState);

    localStorage.setItem(this.STORAGE_KEY, newThemeState ? 'dark' : 'light');

    this.applyTheme(newThemeState);
  }

  /**
   * Aplica o remueve la clase CSS 'dark-theme' al body del documento.
   * @param isDark Si el modo oscuro está activo (true) o no (false).
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
