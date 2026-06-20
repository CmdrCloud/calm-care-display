# CareCircle AI — Arquitectura del Sistema

Este documento describe la arquitectura general del sistema, la estructura de carpetas, las estructuras de la base de datos, los flujos de datos y los protocolos de seguridad del código fuente de **CareCircle AI**.

---

## 1. Descripción general del sistema

CareCircle AI es una plataforma de monitorización de la salud y coordinación de cuidadores diseñada para conectar a los cuidadores digitales con las personas que reciben atención domiciliaria. El sistema se compone de tres capas principales:

1. **Consola Frontend**: Una SPA responsiva basada en React que utiliza TanStack Start para el enrutamiento y la hidratación del servidor, facilitando la gestión remota de la atención.

2. **Backend Monolítico Modular**: Un backend ligero basado en Fastify + TypeScript que ofrece API REST y gestiona la sincronización del hardware.

3. **Base de datos PostgreSQL**: Configurada con límites de aislamiento multiusuario, estructurada para sincronizar horarios y registros con dispositivos de tinta electrónica remotos.

```
┌───────────────────────────────────────────────────────┐
│                 Cliente de CareCircle                 │
│      (Consola React / Aplicación para cuidadores)     │
└────────────────────────────┬──────────────────────────┘
                             │
                             │ HTTPS / REST (JSON)
                             ▼
┌───────────────────────────────────────────────────────┐
│             Backend monolítico de Fastify             │
│ (Validación JWT, verificación de roles, API endpoints)│
└───────────────────────────┬───────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
  Consultas │                               │ HTTP (flujo BMP/PNG/JSON)
  SQL       ▼                               ▼
┌──────────────────────────────────┐ ┌───────────────────┐
│     Base de datos PostgreSQL     │ │ Raspberry Pi E-Ink│
│ (Círculos de aislamiento familiar│ │ (Habitación)      │
└──────────────────────────────────┘ └───────────────────┘
```

---

## 2. Estructura de directorios

El repositorio está estructurado como un monorepo que contiene los archivos del frontend en la raíz y los archivos del servidor backend en una subcarpeta.

```
CareCircle/
├── backend/                  # Servicio de backend de Fastify
│   ├── src/
│   │   ├── infrastructure/   # Drizzle SQL Migrations
│   │   ├── modules/          # Módulos de dominio encapsulados (auth, patients, medications, routines, devices, notifications)
│   │   ├── shared/           # Código transversal (database/, middleware/)
│   │   ├── app.ts            # Enrutador de la aplicación y cargador de plugins
│   │   └── server.ts         # Enlazador de puertos del servidor
│   ├── drizzle.config.ts     # Configuraciones de Drizzle Kit
│   └── package.json          # Lista de dependencias del backend
│
├── src/                      # Frontend de inicio de TanStack (React)
│   ├── features/             # Funcionalidades de la interfaz de usuario basadas en módulos
│   ├── routes/               # Enrutamiento de páginas en tanstack basado en archivos
│   ├── shared/               # Hooks compartidos, UI base, API client y constantes
│   ├── router.tsx            # Registro de enrutamiento
│   └── server.ts             # Punto de entrada SSR
│
├── docker-compose.yml        # Orquestación de PostgreSQL local
├── ARCHITECTURE.md           # Este documento
└── package.json              # Compilador de frontend detalles
```

---

## 3. Arquitectura de Frontend (TanStack Start)

El cliente se desarrolla con React y **TanStack Start**, lo que proporciona capacidades de renderizado del lado del servidor (SSR) para el enrutamiento basado en archivos:

- **Enrutamiento (`/src/routes`)**: Utiliza las definiciones de ruta basadas en archivos de TanStack Router (`index.tsx`, `medications.tsx`, `patients.tsx`, `eink-preview.tsx`, `login.tsx`).

- **Modularidad de dominio (`/src/features`)**: El código de la interfaz de usuario se organiza por funcionalidad. Cada directorio (por ejemplo, `medications/`) contiene sus propios componentes, hooks, páginas y servicios.
- **API Client (`/src/shared/api`)**: API centralizada que gestiona la comunicación HTTP con el backend de Fastify, inyectando de forma transparente tokens JWT en los headers de autorización y el header de inquilino `x-family-id`.

---

## 4. Arquitectura de backend (monolito modular)

El backend se construye como un **monolito modular** utilizando Fastify y Drizzle ORM para simplificar las implementaciones y mantener una clara separación de dominios:

- **Módulos encapsulados (`/backend/src/modules`)**: La lógica de negocio se separa en dominios. Cada carpeta contiene su respectivo controlador y servicios dedicados.
- **Acceso a datos a través de API**: El frontend nunca accede directamente a la base de datos PostgreSQL. Toda la información y operaciones deben fluir a través de los endpoints expuestos del backend de Fastify y ser validados bajo tokens JWT y reglas de multi-inquilino.
