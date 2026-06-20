# CareCircle AI — System Architecture

This document describes the high-level system architecture, folder layouts, database structures, data flows, and security protocols of the **CareCircle AI** codebase.

---

## 1. System Overview

CareCircle AI is a health monitoring and caregiver coordination platform designed to bridge the gap between digital caregivers and in-home care recipients. The system is composed of three primary layers:
1.  **Frontend Console**: A responsive React SPA using TanStack Start for server-side routing and hydration, facilitating remote care management.
2.  **Modular Monolith Backend**: A lightweight Fastify + TypeScript backend serving REST APIs and managing hardware synchronizations.
3.  **PostgreSQL Database**: Configured with multi-tenant isolation boundaries, structured to sync schedules and logs with remote e-ink devices.

```
       ┌────────────────────────────────────────────────────────┐
       │                   CareCircle Client                    │
       │            (React Console / Caregiver App)             │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   │ HTTPS / REST (JSON)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │               Fastify Monolith Backend                 │
       │   (JWT Validation, Role Verification, SSR Renderer)    │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ├────────────────────────────┐
                         SQL Queries│                            │ HTTP (BMP/PNG Stream)
                                   ▼                            ▼
       ┌───────────────────────────────────┐          ┌───────────────────┐
       │        PostgreSQL Database        │          │ Raspberry Pi E-Ink│
       │ (Care Circles & Tenant Isolation) │          │  (Patient Room)   │
       └───────────────────────────────────┘          └───────────────────┘
```

---

## 2. Directory Structure

The repository is structured as a monorepo containing both the frontend compiler files at the root and the backend server files in a sub-folder.

```
CareCircle/
├── backend/                    # Fastify Backend Service
│   ├── src/
│   │   ├── modules/            # Encapsulated Domain Modules
│   │   │   ├── auth/           # Login & Token management
│   │   │   ├── patients/       # Patient records & diagnostics
│   │   │   └── ...             # Devices, medications, sync
│   │   ├── shared/             # Cross-cutting code
│   │   │   ├── database/       # Drizzle connector & schemas
│   │   │   └── middleware/     # Global error & auth checkers
│   │   ├── app.ts              # App router & plugin loader
│   │   └── server.ts           # Server port binder
│   ├── drizzle.config.ts       # Migration configurations
│   └── package.json            # Backend dependency list
│
├── src/                        # TanStack Start Frontend (React)
│   ├── features/               # Module-based UI Features
│   │   ├── dashboard/          # Dashboard analytics & feed
│   │   ├── medications/        # Medicine scheduler components
│   │   ├── routines/           # Daily timetable blocks
│   │   └── ...                 # Settings, Eink, patients
│   ├── routes/                 # File-based tanstack page routing
│   ├── shared/                 # Shared hooks, UI, and constants
│   ├── router.tsx              # Routing registration
│   └── server.ts               # SSR entry point
│
├── supabase/                   # Database Migration Files
│   ├── migrations/             # SQL schema scripts
│   └── seed.sql                # Timezone-aware mock seed data
│
├── ARCHITECTURE.md             # This document
└── package.json                # Frontend compiler details
```

---

## 3. Frontend Architecture (TanStack Start)

The client is built using React and **TanStack Start**, bringing SSR capabilities to file-based routing:
*   **Routing (`/src/routes`)**: Uses TanStack Router's file-based route definitions (`index.tsx`, `medications.tsx`, `patients.tsx`, `eink-preview.tsx`).
*   **Domain Modularity (`/src/features`)**: UI code is organized by feature rather than type. Each directory (e.g. `medications/`) contains its own sub-folders for `components`, `hooks`, `pages`, and `services` to keep components highly focused and cohesive.
*   **Shared UI Elements (`/src/shared/components/ui`)**: Predefined styling tokens (buttons, alerts, tables, sidebars) configured via Tailwind CSS to ensure interface consistency.

---

## 4. Backend Architecture (Modular Monolith)

The backend is built as a **Modular Monolith** using Fastify and Drizzle ORM to keep deployments simple while maintaining a clean boundary for future microservice splits:
*   **Encapsulated Modules (`/backend/src/modules`)**: Business logic is separated into domains. Each folder contains its own route controller and service layer. Dependencies between modules occur at the service layer, keeping route controllers isolated.
*   **Drizzle ORM Schema (`/backend/src/shared/database/schema.ts`)**: Reflects the database schema directly. Types are inferred from schema definitions, guaranteeing complete type safety from the repository layer to the controller.
*   **Request Pipeline**:
    1.  **Auth Verification**: JWT tokens are decoded. The authenticated user payload is attached to the request.
    2.  **Tenant Scope Check**: A custom Fastify decorator (`request.requireMembership(familyId, roles)`) verifies that the caregiver belongs to the target family scope with appropriate permission credentials before executing queries.
    3.  **Validation**: Raw payloads are sanitized and validated using **Zod** models.
    4.  **Error Propagation**: Any thrown errors (unauthorized, validation, DB foreign key violations) bubble up to `error.middleware.ts` to return uniform client responses.

---

## 5. Database Architecture & Multi-Tenancy

The target database is **PostgreSQL**, partitioned around a multi-tenant isolation scheme:
*   **The Family Tenant Boundary**: The core tenant is the `Family` (Care Circle). All data (patients, devices, medications, routines) references a `family_id`. 
*   **Decoupled Telemetry**: Connection status and battery logs from Raspberry Pi terminals are isolated into `device_sync_states`. This write-heavy status tracking is kept separate from the read-heavy configuration table `devices` to avoid locking rows or bloating indexes.
*   **Occurrences Scheduling**: Baseline care rules are stored as templates in `medications` and `routines`. Concrete logs (e.g., whether Eleanor Hayes took Lisinopril today at 08:00) are stored in `medication_doses`, pre-generated 48 hours in advance by a background worker using the family's target timezone.

---

## 6. E-Ink Display Synchronization Protocol

Synchronization between the server and the local Raspberry Pi 3 hardware utilizes a secure, low-overhead REST protocol:
1.  **Pairing Handshake**: 
    *   Caregiver registers a device and receives a 6-digit `pairing_code`.
    *   The Pi pings the server with the code, retrieves a persistent hashed connection key (`DeviceKey`), and saves it locally.
2.  **Heartbeat Telemetry**: 
    *   The Pi polls the server periodically (every 5-15 minutes).
    *   The request logs IP address, power source, and battery levels into `device_sync_states`.
3.  **Server-Side Layout Rendering (SSR)**:
    *   Rather than parsing JSON on the Pi, the backend renders layouts server-side.
    *   The backend pulls current schedules, renders the `/eink-preview` component via a headless browser engine, converts it to a high-contrast 1-bit BMP/PNG stream, and sends it to the Pi.
    *   This reduces the Pi script to a basic download-and-print routine, eliminating firmware updates when changing layouts.

---

## 7. Security & Compliance (HIPAA Ready)

To protect sensitive health information, the architecture incorporates the following safeguards:
*   **Row-Level Tenant Isolation**: Database access requires a validated `x-family-id` header matching the user's validated membership.
*   **Stateless JWT Authentication**: Implements short-lived access tokens (15 minutes) with rotating refresh tokens (7 days) stored securely.
*   **Cryptographic Key Hashing**: Pi sync keys are stored as SHA-256 hashes (`device_key_hash`). If the database is compromised, hardware keys cannot be extracted.
*   **Detailed Audit Logging**: An `audit_logs` ledger tracks administrative actions (schedule changes, caregiver invites, profile changes) with before-and-after JSON state snapshots.
