# CareCircle AI — Migraciones y datos de prueba

Este directorio contiene los esquemas iniciales de PostgreSQL y los datos de prueba para CareCircle AI, que coinciden con la estructura, las relaciones y los datos simulados de la aplicación frontend de React/TanStack.

## Estructura del directorio

* `migrations/20260620000000_init_schema.sql`: Contiene la estructura completa de las tablas, los índices, las enumeraciones, los disparadores y las claves foráneas.

* `seed.sql`: Rellena la base de datos con datos simulados dinámicos, con información de zona horaria, que representan a la paciente Eleanor Hayes, a los cuidadores Maria y David, las conexiones de dispositivos y los archivos de registro.

---

## Implementación y configuración

### Método A: Uso de la CLI de Supabase (Recomendado)

Si desarrolla localmente con la CLI de Supabase, estos archivos están estructurados para ser reconocidos automáticamente:

1. **Inicialice o inicie su instancia local de Supabase**:
```bash
supabase start
```
2. **Reinicie la base de datos** (lo que aplica automáticamente las migraciones y la inicializa):
```bash
supabase db reset
```

---

### Método B: Uso de PostgreSQL/psql

Si implementa en un servidor PostgreSQL estándar, ejecute los scripts en secuencia usando la utilidad de línea de comandos `psql`:

1. **Cree su base de datos**:
```sql
CREATE DATABASE carecircle;
2. **Ejecutar el esquema de migración**:
bash
psql -h localhost -U postgres -d carecircle -f migrations/20260620000000_init_schema.sql
3. **Ejecutar el script de datos semilla**:
bash
psql -h localhost -U postgres -d carecircle -f seed.sql

---

## Aspectos destacados de la arquitectura modular

* **Aislamiento de límites**: Los nombres de las tablas corresponden a dominios monolíticos lógicos (`identity`, `care`, `devices`, `notifications`, `ai`, `billing` y `audit`).

* **Sincronización optimizada para escritura**: Las señales de latido de los dispositivos Raspberry Pi escriben los registros de telemetría exclusivamente en `device_sync_states` para evitar conflictos de bloqueo de filas en la tabla principal `devices`. * **Fechas dinámicas en las semillas**: Para evitar que las notificaciones y programaciones simuladas muestren marcas de tiempo desactualizadas, el script de semillas calcula todas las horas de dosificación y los historiales de notificaciones de forma dinámica en relación con `CURRENT_DATE`.