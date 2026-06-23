# Guía Completa de Despliegue en Producción (VPS)

Esta guía detalla el análisis del estado del proyecto **CareCircle AI** y proporciona todas las configuraciones y pasos necesarios para desplegarlo en tu Servidor Virtual Privado (VPS) utilizando Docker Compose y Nginx bajo el dominio **prueba.sisganadero.online**.

---

## 🔍 Correcciones y Análisis de Readiness

Para que el proyecto esté **listo para subir a producción**, hemos implementado correcciones críticas basadas en los errores comunes de despliegue:

1. **Resolución de Módulos Node (Docker Fix)**:
   - **Problema**: El backend utilizaba `"type": "module"` en `package.json` pero los archivos importaban código sin extensiones explícitas (ej. `import { app } from "./app"` en lugar de `./app.js`). Esto compilaba correctamente con TypeScript pero generaba el error `ERR_MODULE_NOT_FOUND` al ejecutarlo con Node.js en Docker.
   - **Solución**: Configuramos el compilador de TypeScript para emitir **CommonJS** y eliminamos `"type": "module"` en el backend. Ahora las importaciones se resuelven de forma nativa a nivel de archivo compilado sin romper rutas.

2. **API Base URL configurable**:
   - **Solución**: El cliente frontend utiliza `import.meta.env.VITE_API_URL` con un fallback. Inyectamos la URL pública de producción (`https://prueba.sisganadero.online/api`) durante la etapa de construcción de la imagen Docker de frontend.

3. **Migraciones de Base de Datos automatizadas**:
   - **Solución**: El contenedor del backend ejecuta automáticamente el script de migración programática `migrate.js` antes de iniciar Fastify para asegurar que las tablas en PostgreSQL existan y estén actualizadas.

---

## 🚀 Pasos para Desplegar en tu VPS

Sigue estos pasos detallados para configurar y lanzar tu proyecto en producción:

### Paso 1: Preparar el VPS y Dependencias
1. Accede a tu VPS mediante SSH desde tu terminal local:
   ```bash
   ssh fernando@62.84.184.67
   # Ingresa tu contraseña: Blaydor_2001
   ```
2. Asegúrate de tener instalado **Docker** y **Docker Compose**:
   ```bash
   # En Debian/Ubuntu:
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo systemctl enable --now docker
   ```
3. Instala **Nginx** y **Certbot** para la gestión del dominio y certificados SSL:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

### Paso 2: Configurar el Repositorio en tu VPS
1. Si aún no has clonado el repositorio en el VPS:
   ```bash
   git clone https://github.com/CmdrCloud/calm-care-display /var/www/carecircle
   cd /var/www/carecircle
   ```
2. Si ya lo tenías clonado, simplemente actualízalo con las correcciones de CommonJS y dominio:
   ```bash
   cd /var/www/carecircle
   git pull origin main
   ```

### Paso 3: Configurar las Variables de Entorno (.env)
1. Crea el archivo de variables definitivo a partir del de producción:
   ```bash
   cp .env.production .env
   ```
2. Edítalo para asegurarte de que las contraseñas e identificadores sean seguros y de que la URL de la API apunte a tu dominio:
   ```bash
   nano .env
   ```
   *Verifica que contenga el dominio correcto para la API:*
   ```env
   VITE_API_URL=https://prueba.sisganadero.online/api
   ```

### Paso 4: Levantar los Contenedores Docker
Construye las imágenes con la configuración CommonJS y levanta los servicios en segundo plano:
```bash
# Si había contenedores previos activos, detenlos
docker-compose -f docker-compose.prod.yml down

# Construye e inicia los contenedores
docker-compose -f docker-compose.prod.yml up -d --build
```

Esto realizará automáticamente:
1. Inicio de PostgreSQL (`carecircle-prod-db`).
2. Compilación del Backend y ejecución de migraciones de la DB, levantando Fastify en el puerto `3011`.
3. Compilación del Frontend inyectando la URL de producción y levantando el servidor SSR en el puerto `3010`.

Para revisar que el backend y las migraciones se hayan iniciado sin errores de módulos:
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

*(Opcional) Si necesitas sembrar datos de prueba iniciales:*
```bash
docker-compose -f docker-compose.prod.yml exec backend node dist/shared/database/seed.js
```

### Paso 5: Configurar el Proxy Inverso Nginx y SSL (HTTPS)
1. Copia el archivo `nginx.conf` actualizado al directorio de Nginx:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/carecircle
   ```
2. Crea el enlace simbólico para habilitar el sitio:
   ```bash
   sudo ln -s /etc/nginx/sites-available/carecircle /etc/nginx/sites-enabled/
   ```
3. Verifica la sintaxis de la configuración de Nginx:
   ```bash
   sudo nginx -t
   ```
4. Si la prueba es correcta, recarga Nginx:
   ```bash
   sudo systemctl reload nginx
   ```
5. Obtén y configura el certificado SSL automáticamente para tu dominio con Let's Encrypt:
   ```bash
   sudo certbot --nginx -d prueba.sisganadero.online
   ```
   *Certbot modificará automáticamente tu archivo de Nginx para redirigir todo el tráfico HTTP a HTTPS de forma segura y configurar los certificados.*

---

## 🔒 Monitoreo y Mantenimiento

- **Ver logs de todos los servicios**:
  ```bash
  docker-compose -f docker-compose.prod.yml logs -f
  ```
- **Detener la aplicación**:
  ```bash
  docker-compose -f docker-compose.prod.yml down
  ```
- **Actualizar código y redesplegar**:
  ```bash
  git pull origin main
  docker-compose -f docker-compose.prod.yml up -d --build
  ```
