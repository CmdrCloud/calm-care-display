import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  date,
  time,
  text,
  boolean,
  integer,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

// ==========================================
// 1. ENUMS
// ==========================================

export const membershipRoleEnum = pgEnum("membership_role", ["admin", "editor", "viewer"]);
export const doseStatusEnum = pgEnum("dose_status", ["pending", "confirmed", "missed"]);
export const routineCategoryEnum = pgEnum("routine_category", [
  "meal",
  "activity",
  "hydration",
  "therapy",
  "sleep",
  "calendar",
  "other",
]);
export const routinePriorityEnum = pgEnum("routine_priority", ["low", "medium", "high"]);
export const devicePowerSourceEnum = pgEnum("device_power_source", ["ac", "battery"]);
export const displayTemplateEnum = pgEnum("display_template", [
  "daily_summary",
  "next_reminder",
  "full_schedule",
  "message_card",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "missed",
  "confirmed",
  "info",
  "reminder",
]);
export const messageStatusEnum = pgEnum("message_status", [
  "draft",
  "approved",
  "displayed",
  "archived",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);

// ==========================================
// 2. IDENTITY MODULE TABLES
// ==========================================

export const families = pgTable("families", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const familyMemberships = pgTable(
  "family_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqFamilyUser: unique("unique_family_user").on(t.familyId, t.userId),
    userIdIdx: index("idx_family_memberships_user").on(t.userId),
    familyIdIdx: index("idx_family_memberships_family").on(t.familyId),
  }),
);

// ==========================================
// 3. CARE MODULE TABLES
// ==========================================

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    room: varchar("room", { length: 100 }),
    notes: text("notes"),
    primaryDiagnosis: varchar("primary_diagnosis", { length: 255 }),
    allergies: text("allergies"),
    mobility: varchar("mobility", { length: 100 }),
    emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
    riskLevel: varchar("risk_level", { length: 20 }).default("low"),
    avatarInitials: varchar("avatar_initials", { length: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    familyIdIdx: index("idx_patients_family").on(t.familyId),
  }),
);

export const medications = pgTable(
  "medications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    dose: varchar("dose", { length: 50 }).notNull(),
    scheduledTime: time("scheduled_time").notNull(),
    frequency: varchar("frequency", { length: 50 }).notNull(),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    patientIdIdx: index("idx_medications_patient").on(t.patientId),
  }),
);

export const medicationDoses = pgTable(
  "medication_doses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    medicationId: uuid("medication_id")
      .notNull()
      .references(() => medications.id, { onDelete: "cascade" }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    status: doseStatusEnum("status").notNull().default("pending"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedByUserId: uuid("confirmed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    medDosesLookupIdx: index("idx_med_doses_lookup").on(t.medicationId, t.scheduledFor),
    statusTimeIdx: index("idx_med_doses_status_time").on(t.status, t.scheduledFor),
  }),
);

export const routines = pgTable(
  "routines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 100 }).notNull(),
    scheduledTime: time("scheduled_time").notNull(),
    category: routineCategoryEnum("category").notNull().default("other"),
    recurrenceRule: varchar("recurrence_rule", { length: 100 }).notNull(),
    priority: routinePriorityEnum("priority").notNull().default("medium"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    patientIdIdx: index("idx_routines_patient").on(t.patientId),
  }),
);

// ==========================================
// 4. DEVICE MODULE TABLES
// ==========================================

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
    name: varchar("name", { length: 100 }).notNull(),
    deviceKeyHash: varchar("device_key_hash", { length: 64 }).unique().notNull(),
    pairingCode: varchar("pairing_code", { length: 6 }),
    pairingExpiresAt: timestamp("pairing_expires_at", { withTimezone: true }),
    model: varchar("model", { length: 100 }),
    refreshMinutes: integer("refresh_minutes").notNull().default(15),
    displayTemplate: displayTemplateEnum("display_template").notNull().default("daily_summary"),
    showNextMedication: boolean("show_next_medication").notNull().default(true),
    showNextRoutine: boolean("show_next_routine").notNull().default(true),
    showMissedDoseAlerts: boolean("show_missed_dose_alerts").notNull().default(true),
    showFamilyMessage: boolean("show_family_message").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    patientIdIdx: index("idx_devices_patient").on(t.patientId),
  }),
);

export const deviceSyncStates = pgTable(
  "device_sync_states",
  {
    deviceId: uuid("device_id")
      .primaryKey()
      .references(() => devices.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("offline"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }).notNull().defaultNow(),
    batteryPercentage: integer("battery_percentage"),
    powerSource: devicePowerSourceEnum("power_source").notNull().default("ac"),
    ipAddress: varchar("ip_address", { length: 45 }),
    firmwareVersion: varchar("firmware_version", { length: 30 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("idx_device_sync_status").on(t.status),
  }),
);

// ==========================================
// 5. NOTIFICATION MODULE TABLES
// ==========================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
    type: notificationTypeEnum("type").notNull().default("info"),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    familyReadIdx: index("idx_notifications_family_read").on(t.familyId, t.isRead),
    createdAtIdx: index("idx_notifications_created_at").on(t.createdAt),
  }),
);

// ==========================================
// 6. AI MODULE TABLES
// ==========================================

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    contextSource: varchar("context_source", { length: 100 }),
    status: messageStatusEnum("status").notNull().default("draft"),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    patientStatusIdx: index("idx_ai_messages_patient_status").on(t.patientId, t.status),
  }),
);

// ==========================================
// 7. BILLING MODULE TABLES
// ==========================================

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .unique()
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  planType: varchar("plan_type", { length: 50 }).notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("incomplete"),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==========================================
// 8. AUDIT MODULE TABLES
// ==========================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id").references(() => families.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id"),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    familyIdIdx: index("idx_audit_logs_family").on(t.familyId),
    createdAtIdx: index("idx_audit_logs_created_at").on(t.createdAt),
  }),
);
