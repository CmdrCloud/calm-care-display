-- CareCircle AI Database Schema Migration
-- Target: PostgreSQL / Supabase
-- Description: Sets up the initial modular monolithic database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS & CUSTOM TYPES
-- ==========================================

CREATE TYPE membership_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE dose_status AS ENUM ('pending', 'confirmed', 'missed');
CREATE TYPE routine_category AS ENUM ('meal', 'activity', 'hydration', 'therapy', 'sleep', 'calendar', 'other');
CREATE TYPE routine_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE device_power_source AS ENUM ('ac', 'battery');
CREATE TYPE display_template AS ENUM ('daily_summary', 'next_reminder', 'full_schedule', 'message_card');
CREATE TYPE notification_type AS ENUM ('missed', 'confirmed', 'info', 'reminder');
CREATE TYPE message_status AS ENUM ('draft', 'approved', 'displayed', 'archived');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');

-- ==========================================
-- 2. TRIGGER FUNCTIONS
-- ==========================================

-- Function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. IDENTITY MODULE TABLES
-- ==========================================

-- families: The tenant boundaries
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_families_updated_at
BEFORE UPDATE ON families
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- users: Caregivers and administrators
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- family_memberships: caregiver permissions in families
CREATE TABLE family_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role membership_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_family_user UNIQUE (family_id, user_id)
);

CREATE INDEX idx_family_memberships_user ON family_memberships(user_id);
CREATE INDEX idx_family_memberships_family ON family_memberships(family_id);

-- ==========================================
-- 4. CARE MODULE TABLES
-- ==========================================

-- patients: Care recipients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    room VARCHAR(100),
    notes TEXT,
    primary_diagnosis VARCHAR(255),
    allergies TEXT,
    mobility VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    risk_level VARCHAR(20) DEFAULT 'low',
    avatar_initials VARCHAR(3),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_patients_family ON patients(family_id);

-- medications: Prescription scheduler definitions
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    dose VARCHAR(50) NOT NULL,
    scheduled_time TIME NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_medications_updated_at
BEFORE UPDATE ON medications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_medications_patient ON medications(patient_id);

-- medication_doses: Specific daily instances of medications
CREATE TABLE medication_doses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status dose_status NOT NULL DEFAULT 'pending',
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_medication_doses_updated_at
BEFORE UPDATE ON medication_doses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_med_doses_lookup ON medication_doses(medication_id, scheduled_for);
CREATE INDEX idx_med_doses_status_time ON medication_doses(status, scheduled_for);

-- routines: Daily rhythms
CREATE TABLE routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    scheduled_time TIME NOT NULL,
    category routine_category NOT NULL DEFAULT 'other',
    recurrence_rule VARCHAR(100) NOT NULL,
    priority routine_priority NOT NULL DEFAULT 'medium',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_routines_updated_at
BEFORE UPDATE ON routines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_routines_patient ON routines(patient_id);

-- ==========================================
-- 5. DEVICE MODULE TABLES
-- ==========================================

-- devices: Raspberry Pi config
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    device_key_hash VARCHAR(64) UNIQUE NOT NULL,
    pairing_code VARCHAR(6),
    pairing_expires_at TIMESTAMP WITH TIME ZONE,
    model VARCHAR(100),
    refresh_minutes INTEGER NOT NULL DEFAULT 15,
    display_template display_template NOT NULL DEFAULT 'daily_summary',
    show_next_medication BOOLEAN NOT NULL DEFAULT TRUE,
    show_next_routine BOOLEAN NOT NULL DEFAULT TRUE,
    show_missed_dose_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    show_family_message BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_devices_updated_at
BEFORE UPDATE ON devices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_devices_patient ON devices(patient_id);

-- device_sync_states: Telemetry logs
CREATE TABLE device_sync_states (
    device_id UUID PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offline',
    last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    battery_percentage INTEGER CHECK (battery_percentage >= 0 AND battery_percentage <= 100),
    power_source device_power_source NOT NULL DEFAULT 'ac',
    ip_address VARCHAR(45),
    firmware_version VARCHAR(30),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_device_sync_states_updated_at
BEFORE UPDATE ON device_sync_states
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_device_sync_status ON device_sync_states(status);

-- ==========================================
-- 6. NOTIFICATION MODULE TABLES
-- ==========================================

-- notifications: Activity logs and alerts
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    type notification_type NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_family_read ON notifications(family_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ==========================================
-- 7. AI MESSAGE MODULE TABLES
-- ==========================================

-- ai_messages: Contextual reminders
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    context_source VARCHAR(100),
    status message_status NOT NULL DEFAULT 'draft',
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_ai_messages_updated_at
BEFORE UPDATE ON ai_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_ai_messages_patient_status ON ai_messages(patient_id, status);

-- ==========================================
-- 8. BILLING MODULE TABLES
-- ==========================================

-- subscriptions: Billing plans
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID UNIQUE NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'incomplete',
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 9. AUDIT MODULE TABLES
-- ==========================================

-- audit_logs: System logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_family ON audit_logs(family_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
