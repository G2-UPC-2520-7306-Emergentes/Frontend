# Deploy Food Chain to Render

Este proyecto está configurado para desplegarse en Render con el archivo `render.yaml`.

## Servicios que se crearán:

### 1. Backend API (JSON Server)
- **Nombre**: food-chain-api
- **Tipo**: Web Service
- **Puerto**: Automático (asignado por Render)
- **URL**: `https://food-chain-api.onrender.com` (o similar)

### 2. Frontend (Angular)
- **Nombre**: food-chain-frontend
- **Tipo**: Static Site
- **URL**: `https://food-chain-frontend.onrender.com` (o similar)

## Pasos para desplegar:

### Opción 1: Deploy automático con render.yaml (RECOMENDADO)

1. Ve a https://render.com/
2. Crea una cuenta o inicia sesión
3. Click en "New" → "Blueprint"
4. Conecta tu repositorio: `Ing-de-Sofware/frontend-emergentes`
5. Render detectará automáticamente el archivo `render.yaml`
6. Click en "Apply" y espera a que se desplieguen ambos servicios

### Opción 2: Deploy manual (dos servicios separados)

#### Backend API:
1. New → Web Service
2. Conecta el repositorio
3. **Root Directory**: `server`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Plan: Free

#### Frontend:
1. New → Static Site
2. Conecta el repositorio
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist/FoodChain/browser`
5. Plan: Free

## Después del deployment:

1. Copia la URL del backend API (ej: `https://food-chain-api.onrender.com`)
2. Actualiza el archivo `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: true,
     serverBasePath: 'https://food-chain-api.onrender.com'
   };
   ```
3. Haz commit y push
4. Render redesplegará automáticamente el frontend

## Notas importantes:

- El plan gratuito de Render pone los servicios en "sleep" después de 15 minutos de inactividad
- El primer request después del "sleep" puede tardar ~30 segundos
- Ambos servicios son completamente gratuitos
