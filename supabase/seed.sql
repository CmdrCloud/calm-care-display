-- CareCircle AI Seed Data
-- Target: PostgreSQL / Supabase
-- Description: Populates tables with Eleanor Hayes, caregivers, medications, routines, devices, and notifications to match the frontend mock-data.

-- Clean existing seed data (optional, only in development)
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE ai_messages CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE device_sync_states CASCADE;
TRUNCATE TABLE devices CASCADE;
TRUNCATE TABLE routines CASCADE;
TRUNCATE TABLE medication_doses CASCADE;
TRUNCATE TABLE medications CASCADE;
TRUNCATE TABLE patients CASCADE;
TRUNCATE TABLE family_memberships CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE families CASCADE;

-- ==========================================
-- 1. SEED FAMILIES & USERS
-- ==========================================

-- Standard test family
INSERT INTO families (id, name, timezone, language)
VALUES ('11111111-1111-1111-1111-111111111111', 'Hayes Family', 'America/Los_Angeles', 'en');

-- Caregiver: Maria Lopez (Admin)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone)
VALUES (
    '22222222-2222-2222-2222-222222222222', 
    'maria@carecircle.app', 
    '$2b$12$k8g9w9lA38l7XG0Q3oQ.ieV31Pj64n48u027Sj5d.H93d0n17q1s2', -- mock hash for 'password123'
    'Maria', 
    'Lopez', 
    '(555) 123-9821'
);

-- Caregiver: David Hayes (View only)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone)
VALUES (
    '33333333-3333-3333-3333-333333333333', 
    'david@carecircle.app', 
    '$2b$12$k8g9w9lA38l7XG0Q3oQ.ieV31Pj64n48u027Sj5d.H93d0n17q1s2', 
    'David', 
    'Hayes', 
    '(555) 887-2210'
);

-- Memberships
INSERT INTO family_memberships (family_id, user_id, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'admin'),
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'viewer');

-- ==========================================
-- 2. SEED PATIENT
-- ==========================================

INSERT INTO patients (
    id, family_id, name, date_of_birth, room, notes, 
    primary_diagnosis, allergies, mobility, emergency_contact_name, 
    emergency_contact_phone, risk_level, avatar_initials
)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Eleanor Hayes',
    CURRENT_DATE - INTERVAL '78 years', -- Eleanor is 78
    'Home — Bedroom 1',
    'Mild memory loss. Prefers larger text. Drinks tea with breakfast.',
    'Hypertension, mild cognitive decline',
    'Penicillin',
    'Walks with cane',
    'David Hayes (son)',
    '(555) 887-2210',
    'low',
    'EH'
);

-- ==========================================
-- 3. SEED MEDICATIONS & DOSES
-- ==========================================

-- Medications definitions
INSERT INTO medications (id, patient_id, name, dose, scheduled_time, frequency, notes)
VALUES 
    ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444444', 'Lisinopril', '10 mg', '08:00:00', 'Daily', 'With breakfast'),
    ('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444444', 'Metformin', '500 mg', '13:00:00', 'Twice daily', 'With meal'),
    ('55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444444', 'Atorvastatin', '20 mg', '20:00:00', 'Daily', NULL),
    ('55555555-5555-5555-5555-555555555554', '44444444-4444-4444-4444-444444444444', 'Vitamin D', '1000 IU', '08:00:00', 'Daily', NULL),
    ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Aspirin', '81 mg', '08:00:00', 'Daily', NULL);

-- Medication doses for today
INSERT INTO medication_doses (medication_id, scheduled_for, status, confirmed_at, confirmed_by_user_id)
VALUES 
    -- Lisinopril: Confirmed 2 mins late
    ('55555555-5555-5555-5555-555555555551', CURRENT_DATE + TIME '08:00:00', 'confirmed', CURRENT_DATE + TIME '08:02:00', '22222222-2222-2222-2222-222222222222'),
    -- Metformin: Pending
    ('55555555-5555-5555-5555-555555555552', CURRENT_DATE + TIME '13:00:00', 'pending', NULL, NULL),
    -- Atorvastatin: Pending
    ('55555555-5555-5555-5555-555555555553', CURRENT_DATE + TIME '20:00:00', 'pending', NULL, NULL),
    -- Vitamin D: Confirmed on time
    ('55555555-5555-5555-5555-555555555554', CURRENT_DATE + TIME '08:00:00', 'confirmed', CURRENT_DATE + TIME '08:00:00', '22222222-2222-2222-2222-222222222222'),
    -- Aspirin: Missed
    ('55555555-5555-5555-5555-555555555555', CURRENT_DATE + TIME '08:00:00', 'missed', NULL, NULL);

-- ==========================================
-- 4. SEED ROUTINES
-- ==========================================

INSERT INTO routines (patient_id, title, scheduled_time, category, recurrence_rule, priority)
VALUES 
    ('44444444-4444-4444-4444-444444444444', 'Breakfast', '07:30:00', 'meal', 'DAILY', 'high'),
    ('44444444-4444-4444-4444-444444444444', 'Morning walk', '09:30:00', 'activity', 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', 'medium'),
    ('44444444-4444-4444-4444-444444444444', 'Hydration check', '11:00:00', 'hydration', 'INTERVAL=2;FREQ=HOURLY', 'high'),
    ('44444444-4444-4444-4444-444444444444', 'Lunch', '12:30:00', 'meal', 'DAILY', 'high'),
    ('44444444-4444-4444-4444-444444444444', 'Physical therapy', '15:00:00', 'therapy', 'FREQ=WEEKLY;BYDAY=TU,TH', 'high'),
    ('44444444-4444-4444-4444-444444444444', 'Dinner', '18:30:00', 'meal', 'DAILY', 'high'),
    ('44444444-4444-4444-4444-444444444444', 'Bedtime', '21:30:00', 'sleep', 'DAILY', 'medium');

-- ==========================================
-- 5. SEED DEVICES & SYNC STATE
-- ==========================================

-- Bedroom e-ink device (SHA-256 for key 'bedroom_key')
INSERT INTO devices (
    id, patient_id, name, device_key_hash, pairing_code, 
    model, refresh_minutes, display_template, 
    show_next_medication, show_next_routine, show_missed_dose_alerts, show_family_message
)
VALUES (
    '66666666-6666-6666-6666-666666666661',
    '44444444-4444-4444-4444-444444444444',
    'Bedroom e-ink',
    'e987c2f0f353a39e9fc32559ccb7a9f7e5d0a631165bc674d89e5251642828b6', -- sha256('bedroom_key')
    NULL,
    'Raspberry Pi 3 + Waveshare 7.5"',
    5,
    'daily_summary',
    TRUE, TRUE, TRUE, TRUE
);

INSERT INTO device_sync_states (device_id, status, last_sync_at, battery_percentage, power_source, ip_address, firmware_version)
VALUES (
    '66666666-6666-6666-6666-666666666661',
    'online',
    NOW() - INTERVAL '2 minutes',
    NULL,
    'ac',
    '192.168.1.104',
    'v1.0.4'
);

-- Kitchen e-ink device (SHA-256 for key 'kitchen_key')
INSERT INTO devices (
    id, patient_id, name, device_key_hash, pairing_code, 
    model, refresh_minutes, display_template, 
    show_next_medication, show_next_routine, show_missed_dose_alerts, show_family_message
)
VALUES (
    '66666666-6666-6666-6666-666666666662',
    '44444444-4444-4444-4444-444444444444',
    'Kitchen e-ink',
    '4620f3531b73b22e1b4b9fc03f9ec674e5d0a631165bc674d89e5251642828ff', -- sha256('kitchen_key')
    NULL,
    'Raspberry Pi 3 + Waveshare 4.2"',
    15,
    'next_reminder',
    TRUE, TRUE, TRUE, FALSE
);

INSERT INTO device_sync_states (device_id, status, last_sync_at, battery_percentage, power_source, ip_address, firmware_version)
VALUES (
    '66666666-6666-6666-6666-666666666662',
    'offline',
    NOW() - INTERVAL '3 hours',
    42,
    'battery',
    '192.168.1.112',
    'v1.0.4'
);

-- ==========================================
-- 6. SEED NOTIFICATIONS
-- ==========================================

INSERT INTO notifications (family_id, patient_id, type, title, message, is_read, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'missed', 'Missed dose — Aspirin 81 mg', 'Eleanor Hayes did not take their Aspirin dose scheduled for 08:00.', FALSE, CURRENT_DATE + TIME '08:15:00'),
    ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'confirmed', 'Confirmed — Lisinopril 10 mg', 'Maria Lopez confirmed Lisinopril 10 mg at 08:02.', TRUE, CURRENT_DATE + TIME '08:02:00'),
    ('11111111-1111-1111-1111-111111111111', NULL, 'info', 'Device synced — Bedroom e-ink', 'Bedroom e-ink completed full display sync and battery check.', TRUE, CURRENT_DATE + TIME '08:00:00'),
    ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'reminder', 'Upcoming — Metformin 500 mg at 13:00', 'Reminder: Metformin dose is scheduled in 15 minutes.', FALSE, CURRENT_DATE + TIME '12:45:00');

-- ==========================================
-- 7. SEED AI MESSAGES & SUBSCRIPTIONS
-- ==========================================

INSERT INTO ai_messages (patient_id, content, context_source, status)
VALUES ('44444444-4444-4444-4444-444444444444', 'Eleanor, remember to drink a glass of water with your lunch.', 'hydration_frequency', 'approved');

INSERT INTO subscriptions (family_id, plan_type, status, stripe_subscription_id, expires_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'family_premium', 'active', 'sub_1Oq2z3ABC123xyz', NOW() + INTERVAL '1 month');
