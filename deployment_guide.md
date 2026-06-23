# Guía Completa de Despliegue en Producción (VPS)

Esta guía detalla el análisis del estado del proyecto **CareCircle AI** y proporciona todas las configuraciones y pasos necesarios para desplegarlo en un Servidor Virtual Privado (VPS) utilizando Docker Compose y Nginx de forma robusta y segura.

---

## 🔍 Análisis de Readiness (¿Está listo para subir?)

El proyecto original estaba configurado principalmente para desarrollo local. Para que esté **listo para subir a producción**, hemos realizado e implementado las siguientes mejoras críticas:

1. **API Base URL configurable**:
   - **Problema**: La URL del backend estaba hardcodeada como `http://localhost:3001` en el cliente.
   - **Solución**: Modificamos el cliente de API para usar `import.meta.env.VITE_API_URL` con un fallback a `localhost:3001`. Ahora se puede inyectar la URL pública del backend en tiempo de compilación.

2. **Servidor SSR Standalone (Nitro)**:
   - **Problema**: La compilación de frontend por defecto estaba omitiendo el empaquetado de producción de Nitro.
   - **Solución**: Habilitamos `nitro: true` en `vite.config.ts`. Al compilar utilizando el preset `node-server` (`NITRO_PRESET=node-server`), se genera un servidor Node.js autónomo en la carpeta `.output/` optimizado para producción.

3. **Migraciones de Base de Datos automatizadas**:
   - **Problema**: `drizzle-kit` es una dependencia de desarrollo y no es óptimo ejecutarla directamente en producción.
   - **Solución**: Creamos un script de migración programática `migrate.ts` en el backend. Al iniciar el contenedor del backend, este script se ejecuta automáticamente para aplicar cualquier migración pendiente sobre PostgreSQL antes de levantar Fastify.

---

## 🛠️ Archivos de Configuración Creados

Hemos creado los siguientes archivos en la raíz del proyecto para automatizar el despliegue:

* **Dockerfile**: Compilación en múltiples etapas (multi-stage) que inyecta la URL de API de producción y expone el servidor SSR en el puerto `3000`.
* **backend/Dockerfile**: Compilación TypeScript en multi-stage y ejecución ligera con Node.js en el puerto `3001`.
* **docker-compose.prod.yml**: Orquestación de contenedores (PostgreSQL 16, Fastify Backend y TanStack Start Frontend) con persistencia de datos mediante volúmenes.
* **.env.production**: Plantilla de variables de entorno para producción (Credenciales de DB, secretos JWT y URL de la API).
* **nginx.conf**: Configuración del proxy inverso Nginx para dirigir el tráfico de dominio, gestionar SSL (HTTPS) y redirigir `/api/*` al backend de Fastify y el resto de las rutas al frontend de SSR.

---

## 🚀 Pasos para Desplegar en tu VPS

Sigue estos pasos detallados para configurar y lanzar tu proyecto en producción:

### Paso 1: Preparar el VPS
1. Accede a tu VPS mediante SSH.
2. Asegúrate de tener instalado **Docker** y **Docker Compose**:
   ```bash
   # En Debian/Ubuntu:
   sudo apt update
   sudo apt install -y docker.io docker-compose-plugin
   sudo systemctl enable --now docker
   ```
3. Instala **Nginx** si deseas usar el proxy inverso estándar:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

### Paso 2: Clonar y Configurar el Proyecto
1. Clona tu repositorio en el VPS:
   ```bash
   git clone <URL_DE_TU_REPOSITORIO> /var/www/carecircle
   cd /var/www/carecircle
   ```
2. Crea el archivo de variables de entorno definitivo:
   ```bash
   cp .env.production .env
   ```
3. Edita el archivo `.env` con tus credenciales de producción:
   ```bash
   nano .env
   ```
   > [!IMPORTANT]
   > - Cambia `DB_PASSWORD` por una contraseña segura.
   > - Genera claves seguras para `JWT_SECRET` y `JWT_REFRESH_SECRET` (puedes usar `openssl rand -hex 64`).
   > - Define `VITE_API_URL` con tu dominio definitivo seguido de `/api` (ej. `https://tudominio.com/api`).

### Paso 3: Levantar los Contenedores
Ejecuta Docker Compose para construir las imágenes y levantar la base de datos, backend y frontend en segundo plano:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Esto realizará los siguientes pasos de forma automática:
1. Iniciará PostgreSQL y creará la base de datos y volumen persistente.
2. Compilará el backend en TS, ejecutará el script de migración para estructurar las tablas, e iniciará Fastify en el puerto `3001`.
3. Compilará el frontend inyectando la URL de producción e iniciará el servidor SSR en el puerto `3000`.

### Paso 4: (Opcional) Sembrar Datos de Prueba
Si deseas rellenar la base de datos con los datos de prueba iniciales (usuarios, pacientes y configuraciones de demostración):
```bash
docker compose -f docker-compose.prod.yml exec backend node dist/shared/database/seed.js
```

### Paso 5: Configurar Nginx y Certificados SSL (HTTPS)
1. Copia la plantilla de Nginx a los sitios disponibles:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/carecircle
   ```
2. Edita la configuración de Nginx para reemplazar `yourdomain.com` con tu dominio real:
   ```bash
   sudo nano /etc/nginx/sites-available/carecircle
   ```
3. Habilita el sitio y reinicia Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/carecircle /etc/nginx/sites-enabled/
   sudo nginx -t # Verifica que la sintaxis sea correcta
   sudo systemctl restart nginx
   ```
4. Genera certificados SSL automáticos y gratuitos con Let's Encrypt:
   ```bash
   sudo certbot --nginx -d tudominio.com -d www.tudominio.com
   ```
   *Certbot modificará automáticamente tu archivo de configuración de Nginx para añadir las rutas SSL correspondientes.*

---

## 🔒 Monitoreo y Mantenimiento

- **Ver logs de los servicios**:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f
  # Logs específicos del backend:
  docker compose -f docker-compose.prod.yml logs -f backend
  ```
- **Detener los servicios**:
  ```bash
  docker compose -f docker-compose.prod.yml down
  ```
- **Actualizar el código**:
  ```bash
  git pull origin main
  docker compose -f docker-compose.prod.yml up -d --build
  ```
