# CareCircle AI — Arquitectura del Sistema

Este documento describe la arquitectura general del sistema, la estructura de carpetas, las estructuras de la base de datos, los flujos de datos y los protocolos de seguridad del código fuente de **CareCircle AI**.

--

## 1. Descripción general del sistema

CareCircle AI es una plataforma de monitorización de la salud y coordinación de cuidadores diseñada para conectar a los cuidadores digitales con las personas que reciben atención domiciliaria. El sistema se compone de tres capas principales:
1. **Consola Frontend**: Una SPA responsiva basada en React que utiliza TanStack Start para el enrutamiento y la hidratación del servidor, facilitando la gestión remota de la atención.

2. **Backend Monolítico Modular**: Un backend ligero basado en Fastify + TypeScript que ofrece API REST y gestiona la sincronización del hardware.

3. **Base de datos PostgreSQL**: Configurada con límites de aislamiento multiusuario, estructurada para sincronizar horarios y registros con dispositivos de tinta electrónica remotos.

```

┌───────────────────────────────────────────────────────┐

│ Cliente de CareCircle │

│ (Consola React / Aplicación para cuidadores) │
└────────────────────────────┬───────────────────────────┘

│

│ HTTPS / REST (JSON)

▼
┌───────────────────────────────────────────────────────┐

│ Backend monolítico de Fastify │

│ (Validación JWT, verificación de roles, renderizador SSR) │
└───────────────────────────┬───────────────────────────┘

│
├────────────────────────────┐

Consultas SQL│ │ HTTP (flujo BMP/PNG)

▼ ▼

┌──────────────────────────────────┐ ┌───────────────────┐

│ Base de datos PostgreSQL │ │ Raspberry Pi E-Ink│

│ (Círculos de atención y aislamiento de inquilinos) │ │ (Habitación del paciente) │

└──────────────────────────────────┘ └───────────────────┘
```

---

## 2. Estructura de directorios

El repositorio está estructurado como un monorepo que contiene los archivos del compilador del frontend en la raíz y los archivos del servidor backend en una subcarpeta.

```
CareCircle/
├── backend/ # Servicio de backend de Fastify
│ ├── src/
│ │ ├── modules/ # Módulos de dominio encapsulados
│ │ │ ├── auth/ # Gestión de inicio de sesión y tokens
│ │ │ ├── patients/ # Registros y diagnósticos de pacientes
│ │ │ └── ... # Dispositivos, medicamentos, sincronización
│ │ ├── shared/ # Código transversal
│ │ │ ├── database/ # Conector y esquemas de Drizzle
│ │ │ └── middleware/ # Verificadores globales de errores y autenticación
│ │ ├── app.ts # Enrutador de la aplicación y cargador de plugins
│ │ └── server.ts # Enlazador de puertos del servidor
│ ├── drizzle.config.ts # Configuraciones de migración
│ └── package.json # Lista de dependencias del backend
│
├── src/ # Frontend de inicio de TanStack (React)
│ ├── features/ # Funcionalidades de la interfaz de usuario basadas en módulos
│ │ ├── dashboard/ # Análisis y feed del panel de control
│ │ ├── drugs/ # Componentes del programador de medicamentos
│ │ ├── rutinas/ # Bloques de horario diario
│ │ └── ... # Configuración, Eink, pacientes
│ ├── rutas/ # Enrutamiento de páginas en tanstack basado en archivos
│ ├── compartido/ # Ganchos compartidos, interfaz de usuario y constantes
│ ├── router.tsx # Registro de enrutamiento
│ └── server.ts # Punto de entrada SSR
│
├── supabase/ # Archivos de migración de base de datos
│ ├── migraciones/ # Scripts de esquema SQL
│ └── seed.sql # Datos de semilla simulados con información de zona horaria
│
├── ARCHITECTURE.md # Este documento
└── package.json # Compilador de frontend Detalles
```

---

## 3. Arquitectura de Frontend (TanStack Start)

El cliente se desarrolla con React y **TanStack Start**, lo que proporciona capacidades de renderizado del lado del servidor (SSR) para el enrutamiento basado en archivos:
* **Enrutamiento (`/src/routes`)**: Utiliza las definiciones de ruta basadas en archivos de TanStack Router (`index.tsx`, `medications.tsx`, `patients.tsx`, `eink-preview.tsx`).

* **Modularidad de dominio (`/src/features`)**: El código de la interfaz de usuario se organiza por funcionalidad en lugar de por tipo. Cada directorio (por ejemplo, `medications/`) contiene sus propias subcarpetas para `componentes`, `hooks`, `páginas` y `servicios` para mantener los componentes altamente enfocados y cohesivos.
* **Elementos de interfaz de usuario compartidos (`/src/shared/components/ui`)**: Tokens de estilo predefinidos (botones, alertas, tablas, barras laterales) configurados mediante Tailwind CSS para garantizar la coherencia de la interfaz.

--

## 4. Arquitectura de backend (monolito modular)

El backend se construye como un **monolito modular** utilizando Fastify y Drizzle ORM para simplificar las implementaciones y mantener una clara separación para futuras divisiones de microservicios:
* **Módulos encapsulados (`/backend/src/modules`)**: La lógica de negocio se separa en dominios. Cada carpeta