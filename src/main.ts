// main.ts (o app.config.ts si usas el enfoque de configuración del componente raíz)

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http'; // ⬅️ Importar la función

import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import {App} from './app/app'; // Asumiendo que tienes rutas

bootstrapApplication(App, {
  providers: [
    provideRouter(routes), // Si usas el Router
    provideHttpClient(),   // ⬅️ ¡Esto soluciona el error NG0201!
    // ... otros providers como provideAnimations(), etc.
  ]
}).catch(err => console.error(err));
