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
7. [Configuración e Instalación Local](#-configuración-e-instalación-local)

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

## ⚙️ Configuración e Instalación Local

### Requisitos Previos

- **Node.js** v20+ o **Bun**.
- **Docker** y **Docker Compose** instalados.

---

### Paso 1: Configurar la Base de Datos Local

1. Levanta el contenedor de PostgreSQL (mapeado al puerto `5433` de forma segura):
   ```bash
   docker compose up -d
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
   PORT=3001
   DATABASE_URL=postgres://postgres:postgres@localhost:5433/carecircle
   JWT_SECRET=supersecretkeychangeinproduction
   JWT_REFRESH_SECRET=supersecretrefreshkeychangeinproduction
   ```
3. Ejecuta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   El backend se ejecutará en `http://localhost:3001`. Puedes verificar el estado en `http://localhost:3001/health`.

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
3. Abre el navegador en la URL provista por Vite (usualmente `http://localhost:3000` o `http://localhost:5173`) para acceder a la consola.
