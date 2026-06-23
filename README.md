# CareCircle AI — Plataforma de Coordinación de Cuidados y Monitoreo de Salud

CareCircle AI es una plataforma moderna diseñada para conectar a círculos de cuidado familiar y cuidadores profesionales con pacientes que reciben atención domiciliaria. El sistema facilita la coordinación diaria de medicamentos, rutinas y alertas críticas, integrando una consola web de gestión en tiempo real con pantallas de tinta electrónica (E-Ink) de bajo consumo ubicadas en la habitación del paciente.

---

## 📋 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Características Principales](#-características-principales)
4. [Modelo de Datos (Esquema de Base de Datos)](#-modelo-de-datos-esquema-de-base-de-datos)
5. [Estructura del Proyecto (Monorepo)](#-estructura-del-proyecto-monorepo)
6. [Flujo de Autenticación y Multi-inquilino](#-flujo-de-autenticación-y-multi-inquilino)
7. [Endpoints de la API (REST API)](#-endpoints-de-la-api-rest-api)
8. [Configuración e Instalación Local](#-configuración-e-instalación-local)

---

## 🔍 Descripción General

CareCircle AI resuelve la brecha de comunicación entre cuidadores digitales y la vida física del paciente. A través de un portal web, la familia y los médicos configuran recordatorios, fármacos y rutinas. Dicha información se consolida en una base de datos segura y se expone a través de una API REST. Los dispositivos IoT (como una Raspberry Pi con pantalla de tinta electrónica) se sincronizan periódicamente para mostrar los datos de forma clara y de alto contraste, ideal para adultos mayores o pacientes con dificultades visuales.

---

## 🏗️ Arquitectura del Sistema

El sistema utiliza una arquitectura moderna de tres capas diseñada para la escalabilidad, consistencia y eficiencia de desarrollo:

1. **Frontend (React + TanStack Start)**:
   - Aplicación web responsiva de alto rendimiento.
   - Renderizado del lado del servidor (SSR) e hidratación rápida.
   - Enrutamiento basado en archivos con TanStack Router.
   - Autenticación mediante Tokens JWT almacenados en el cliente.
   - Diseño premium interactivo construido con Tailwind CSS v4, componentes Radix UI y animaciones suaves.

2. **Backend (Fastify + TypeScript)**:
   - Diseñado como un **Monolito Modular** estructurado en dominios lógicos.
   - Servidor ultra-rápido basado en Fastify.
   - ORM seguro y tipado con Drizzle ORM.
   - Restricciones rigurosas de aislamiento multi-inquilino (_multi-tenant_).

3. **Base de Datos (PostgreSQL)**:
   - Esquemas estructurados con relaciones, claves foráneas, índices de búsqueda rápida y triggers.
   - Alojado localmente en un contenedor de Docker para desarrollo y producción simplificados.

```
                  ┌────────────────────────────────────────┐
                  │          Cliente CareCircle            │
                  │   (Consola React / Web App)            │
                  └───────────────────┬────────────────────┘
                                      │
                                      │ HTTPS / REST (JSON)
                                      ▼
                  ┌────────────────────────────────────────┐
                  │      Backend Monolítico Fastify        │
                  │   (Tokens JWT + Multi-Tenant Scopes)   │
                  └───────────────────┬────────────────────┘
                                      │
                    ┌──────────────────┴──────────────────┐
      Consultas SQL │                                     │ HTTP (BMP/PNG/JSON)
                    ▼                                     ▼
       ┌─────────────────────────┐           ┌─────────────────────────┐
       │ Base de Datos Postgres  │           │   Dispositivo E-Ink     │
       │ (Aislamiento Familiar)  │           │   (Raspberry Pi Bedside)│
       └─────────────────────────┘           └─────────────────────────┘
```

---

## 🚀 Características Principales

### 1. Panel de Control (Dashboard)

- Visualización de la telemetría en tiempo real del paciente.
- Línea de tiempo interactiva (_feed_) de actividades y toma de medicamentos del día.
- Alertas dinámicas sobre dosis omitidas, retrasos o problemas de conexión del dispositivo.
- Acciones interactivas para marcar dosis de medicamentos como confirmadas en tiempo real.

### 2. Gestión de Pacientes (`/patients`)

- Fichas clínicas completas: diagnósticos primarios, notas de cuidado, movilidad, alergias y nivel de riesgo.
- Contactos de emergencia integrados por paciente.

### 3. Horarios de Medicamentos (`/medications`)

- Registro detallado de prescripciones, dosis y horas programadas.
- Registro de tomas con estados específicos: `pending` (pendiente), `confirmed` (confirmado) y `missed` (omitido).
- Vista visual rápida del estado de cumplimiento diario de medicamentos.

### 4. Rutinas Diarias (`/routines`)

- Programación de hábitos diarios: comidas, hidratación, siestas, fisioterapia o actividades de esparcimiento.
- Clasificación de prioridades (`low`, `medium`, `high`) y recurrencias programables.

### 5. Configuración de Dispositivos (`/devices`)

- Panel para emparejar nuevos dispositivos IoT.
- Configuración remota de plantillas de visualización en la pantalla de tinta electrónica (`daily_summary`, `next_reminder`, `full_schedule`, `message_card`).
- Monitoreo del estado de sincronización (último latido de red, nivel de batería, fuente de alimentación AC/Batería y versión del firmware).

---

## 💾 Modelo de Datos (Esquema de Base de Datos)

El esquema de la base de datos está estructurado utilizando **Drizzle ORM** y **PostgreSQL**:

- **`families`**: Representa el círculo familiar o grupo de cuidado primario (_tenant_).
- **`users`**: Registro de cuidadores o familiares, almacenamiento seguro de contraseña cifrada (`passwordHash`).
- **`family_memberships`**: Vincula usuarios a familias, otorgándoles un rol específico de acceso (`admin`, `editor`, `viewer`).
- **`patients`**: Registro de pacientes asignados a un círculo familiar (`familyId`).
- **`medications`**: Prescripción de fármacos, dosis, hora del día programada y frecuencia.
- **`medication_doses`**: Bitácora de tomas con su estado de confirmación (`pending`, `confirmed`, `missed`).
- **`routines`**: Agenda diaria de actividades recurrentes.
- **`devices`** y **`device_sync_states`**: Configuración y telemetría de las pantallas Raspberry Pi E-Ink.
- **`notifications`**: Alertas generadas por el sistema dirigidas a la familia.
- **`ai_messages`**: Recordatorios motivacionales sugeridos por IA.
- **`subscriptions`**: Suscripciones Stripe del círculo familiar.
- **`audit_logs`**: Registro inmutable de auditoría para seguridad clínica.

---

## 📂 Estructura del Proyecto (Monorepo)

```
CareCircle/
├── backend/                  # Servidor Backend (Fastify + TypeScript)
│   ├── src/
│   │   ├── modules/          # Módulos de lógica de negocio encapsulados (auth, patients, medications, routines, devices, notifications)
│   │   ├── shared/           # Recursos compartidos (database/, middleware/)
│   │   ├── app.ts            # Registro de enrutadores y plugins Fastify
│   │   └── server.ts         # Punto de entrada de Fastify
│   ├── drizzle.config.ts     # Configuración de Drizzle Kit
│   └── package.json          # Dependencias y scripts del backend (usa Node/tsx)
│
├── src/                      # Aplicación Frontend (React + TanStack Start)
│   ├── features/             # Código de UI encapsulado por características de dominio
│   ├── routes/               # Enrutamiento basado en archivos (TanStack Router)
│   ├── shared/               # Hooks, UI base (Radix), API client y estilos globales
│   ├── router.tsx            # Instancia de configuración del router
│   ├── server.ts             # Punto de entrada de renderizado SSR
│   └── package.json          # Herramientas de compilación frontend
├── docker-compose.yml        # Orquestación de PostgreSQL local
└── package.json              # Dependencias de la raíz del monorepo
```

---

## 🔒 Flujo de Autenticación y Multi-inquilino

1. **Tokens JWT**: Al iniciar sesión mediante `/auth/login`, el servidor firma un token de acceso JWT con el `userId` y el correo del cuidador.
2. **Encabezado `x-family-id`**: Cada solicitud HTTP realizada por el frontend a rutas restringidas de pacientes, medicamentos o dispositivos debe incluir el header `x-family-id` especificando qué círculo familiar se está visualizando.
3. **Guardia de Pertenencia (`requireMembership`)**:
   El middleware de Fastify (`requireMembershipHelper`) intercepta la solicitud y valida que el `userId` autenticado pertenezca a esa familia con el rol requerido (`admin`, `editor`, `viewer`) para completar la operación.

---

## 📡 Endpoints de la API (REST API)

Todas las peticiones a la API (a excepción del módulo de autenticación) deben incluir los siguientes encabezados:
- `Authorization: Bearer <JWT_ACCESS_TOKEN>`: Token de acceso obtenido al iniciar sesión.
- `x-family-id: <FAMILY_UUID>`: Identificador del círculo familiar sobre el cual se operará.

A continuación se detallan los endpoints disponibles divididos por módulos lógicos:

### 1. Autenticación (`/auth`)
- `POST /auth/login`: Autentica a un cuidador con su `email` y `password`. Devuelve los tokens JWT (`accessToken`, `refreshToken`), el `familyId` del usuario y su rol en la familia.
- `POST /auth/refresh`: Genera un nuevo token de acceso mediante el envío de un `refreshToken` válido.
- `POST /auth/logout`: Invalida la sesión (el borrado físico de tokens se maneja en el cliente).

### 2. Pacientes (`/patients`)
- `GET /patients`: Obtiene la lista de todos los pacientes configurados dentro del círculo familiar (`x-family-id`).
- `GET /patients/:id`: Obtiene la información detallada de un paciente específico por su ID.
- `POST /patients`: Registra un nuevo paciente en la familia. Requiere `name` y `dateOfBirth` (YYYY-MM-DD). Campos opcionales: `room`, `notes`, `primaryDiagnosis`, `allergies`, `mobility`, `emergencyContactName`, `emergencyContactPhone`, `riskLevel` y `avatarInitials`.
- `PUT /patients/:id`: Actualiza parcialmente la información de un paciente existente.

### 3. Medicamentos (`/medications`)
- `GET /medications`: Lista las prescripciones de medicamentos activos del círculo familiar.
- `GET /medications/doses`: Retorna las tomas de medicamentos programadas para el día de hoy, mostrando su estado (`pending`, `confirmed` o `missed`).
- `GET /medications/:id`: Obtiene el detalle de un medicamento específico.
- `POST /medications`: Registra una nueva prescripción médica. Requiere `patientId`, `name`, `dose`, `scheduledTime` (HH:MM) y `frequency`. Opcional: `notes`.
- `PUT /medications/:id`: Modifica los parámetros de un medicamento.
- `POST /medications/doses/:doseId/confirm`: Registra que una toma específica fue administrada y confirmada por el usuario autenticado.

### 4. Rutinas Diarias (`/routines`)
- `GET /routines`: Lista las rutinas diarias de cuidado y actividades programadas para la familia.
- `POST /routines`: Registra una nueva rutina. Requiere `patientId`, `title`, `scheduledTime` (HH:MM), `category` (`meal`, `activity`, `hydration`, `therapy`, `sleep`, `calendar`, `other`), `recurrenceRule` (frecuencia de repetición) y `priority` (`low`, `medium`, `high`).
- `PUT /routines/:id`: Modifica la programación o detalles de una rutina existente.

### 5. Dispositivos (`/devices`)
- `GET /devices`: Recupera el listado de dispositivos E-Ink enlazados a la familia.
- `POST /devices`: Vincula una nueva pantalla E-Ink a un paciente. Requiere `patientId`, `name` y `deviceKeyHash` (hash SHA-256 de autenticación del dispositivo). Opcional: `model`, `refreshMinutes` y `displayTemplate`.
- `PUT /devices/:id`: Actualiza los parámetros de configuración y pantalla del dispositivo IoT.

### 6. Notificaciones (`/notifications`)
- `GET /notifications`: Lista las alertas clínicas y de sistema dirigidas a la familia.
- `PUT /notifications/:id/read`: Marca una notificación como leída.

### 7. Sincronización de Dispositivos E-Ink (`/pi`)
Estos endpoints están diseñados para ser consumidos por el dispositivo Raspberry Pi con pantalla E-Ink. Se autentican mediante el header `x-device-key` con la clave secreta del dispositivo (en lugar de JWT).

- `GET /pi/sync/:deviceId`: Obtiene la carga completa de visualización para el dispositivo. Incluye configuración del dispositivo, datos del paciente, siguiente medicamento pendiente, dosis omitida, próxima rutina y mensaje familiar (según configuración).
  - Header requerido: `x-device-key: <raw_secret>`
- `PATCH /pi/sync/:deviceId/heartbeat`: Reporta el estado de salud del dispositivo a la nube. Envía telemetría como dirección IP, versión de firmware, nivel de batería (0-100) y fuente de alimentación (`ac`/`battery`).
  - Header requerido: `x-device-key: <raw_secret>`
  - Cuerpo (todos los campos opcionales): `{ "ipAddress": "...", "firmwareVersion": "...", "batteryPercentage": 85, "powerSource": "ac" }`

---

## ⚙️ Configuración e Instalación Local

### Requisitos Previos

- **Node.js** v20+ o **Bun**.
- **Docker** y **Docker Compose** instalados.

---

### Paso 1: Configurar la Base de Datos Local

1. Levanta el contenedor de PostgreSQL (mapeado al puerto `5433` de forma segura):

   ```bash
   docker-compose up -d
   ```

2. Dirígete a la carpeta del backend y ejecuta las migraciones de Drizzle para crear el esquema en la base de datos:

   ```bash
   cd backend
   npm run db:migrate
   ```

3. Llena la base de datos con los datos iniciales de prueba (paciente Eleanor Hayes, cuidadores Maria y David, recordatorios y alertas):

   ```bash
   npm run db:seed
   ```

---

### Paso 2: Inicializar el Backend

1. Estando en la carpeta `backend`, instala las dependencias:

   ```bash
   npm install
   ```

2. Configura las variables de entorno. Puedes usar el archivo `.env` ya creado por defecto con los siguientes valores para desarrollo local:

   ```env
    PORT=3011
    DATABASE_URL=postgres://postgres:postgres@localhost:5433/carecircle
    JWT_SECRET=supersecretkeychangeinproduction
    JWT_REFRESH_SECRET=supersecretrefreshkeychangeinproduction
    ```

3. Ejecuta el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   El backend se ejecutará en `http://localhost:3011`. Puedes verificar el estado en `http://localhost:3011/health`.

---

### Paso 3: Inicializar el Frontend

1. Vuelve a la raíz del monorepo e instala las dependencias del frontend:

   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo de Vite (con soporte TanStack Start SSR):

   ```bash
   npm run dev
   ```

3. Abre el navegador en la URL provista por Vite (usualmente `http://localhost:3010` o `http://localhost:5173`) para acceder a la consola.
