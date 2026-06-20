import { db } from "./db";
import {
  families,
  users,
  familyMemberships,
  patients,
  medications,
  medicationDoses,
  routines,
  devices,
  deviceSyncStates,
  notifications,
  aiMessages,
  subscriptions,
  auditLogs,
} from "./schema";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean existing tables (dependent first)
  console.log("🗑️  Cleaning existing tables...");
  await db.delete(auditLogs);
  await db.delete(subscriptions);
  await db.delete(aiMessages);
  await db.delete(notifications);
  await db.delete(deviceSyncStates);
  await db.delete(devices);
  await db.delete(routines);
  await db.delete(medicationDoses);
  await db.delete(medications);
  await db.delete(patients);
  await db.delete(familyMemberships);
  await db.delete(users);
  await db.delete(families);

  const familyId = "11111111-1111-1111-1111-111111111111";
  const mariaId = "22222222-2222-2222-2222-222222222222";
  const davidId = "33333333-3333-3333-3333-333333333333";
  const patientId = "44444444-4444-4444-4444-444444444444";

  // 2. Seed families
  console.log("➡️  Seeding families...");
  await db.insert(families).values({
    id: familyId,
    name: "Hayes Family",
    timezone: "America/Los_Angeles",
    language: "en",
  });

  // 3. Seed users (password_hash matches 'password123')
  console.log("➡️  Seeding users...");
  await db.insert(users).values([
    {
      id: mariaId,
      email: "maria@carecircle.app",
      passwordHash: "$2b$10$6B.NFgV8hAtYnlPlBYl43eKmeM0jGpHioK9g4aJ7VSxEwcsc8dIdG",
      firstName: "Maria",
      lastName: "Lopez",
      phone: "(555) 123-9821",
    },
    {
      id: davidId,
      email: "david@carecircle.app",
      passwordHash: "$2b$10$6B.NFgV8hAtYnlPlBYl43eKmeM0jGpHioK9g4aJ7VSxEwcsc8dIdG",
      firstName: "David",
      lastName: "Hayes",
      phone: "(555) 887-2210",
    },
  ]);

  // 4. Seed memberships
  console.log("➡️  Seeding memberships...");
  await db.insert(familyMemberships).values([
    {
      familyId,
      userId: mariaId,
      role: "admin",
    },
    {
      familyId,
      userId: davidId,
      role: "viewer",
    },
  ]);

  // 5. Seed patient (Eleanor Hayes is 78 years old)
  console.log("➡️  Seeding patients...");
  const date78YearsAgo = new Date();
  date78YearsAgo.setFullYear(date78YearsAgo.getFullYear() - 78);
  const dobString = date78YearsAgo.toISOString().split("T")[0];

  await db.insert(patients).values({
    id: patientId,
    familyId,
    name: "Eleanor Hayes",
    dateOfBirth: dobString,
    room: "Home — Bedroom 1",
    notes: "Mild memory loss. Prefers larger text. Drinks tea with breakfast.",
    primaryDiagnosis: "Hypertension, mild cognitive decline",
    allergies: "Penicillin",
    mobility: "Walks with cane",
    emergencyContactName: "David Hayes (son)",
    emergencyContactPhone: "(555) 887-2210",
    riskLevel: "low",
    avatarInitials: "EH",
  });

  // 6. Seed medications
  console.log("➡️  Seeding medications...");
  const medIds = {
    lisinopril: "55555555-5555-5555-5555-555555555551",
    metformin: "55555555-5555-5555-5555-555555555552",
    atorvastatin: "55555555-5555-5555-5555-555555555553",
    vitaminD: "55555555-5555-5555-5555-555555555554",
    aspirin: "55555555-5555-5555-5555-555555555555",
  };

  await db.insert(medications).values([
    {
      id: medIds.lisinopril,
      patientId,
      name: "Lisinopril",
      dose: "10 mg",
      scheduledTime: "08:00:00",
      frequency: "Daily",
      notes: "With breakfast",
      isActive: true,
    },
    {
      id: medIds.metformin,
      patientId,
      name: "Metformin",
      dose: "500 mg",
      scheduledTime: "13:00:00",
      frequency: "Twice daily",
      notes: "With meal",
      isActive: true,
    },
    {
      id: medIds.atorvastatin,
      patientId,
      name: "Atorvastatin",
      dose: "20 mg",
      scheduledTime: "20:00:00",
      frequency: "Daily",
      notes: null,
      isActive: true,
    },
    {
      id: medIds.vitaminD,
      patientId,
      name: "Vitamin D",
      dose: "1000 IU",
      scheduledTime: "08:00:00",
      frequency: "Daily",
      notes: null,
      isActive: true,
    },
    {
      id: medIds.aspirin,
      patientId,
      name: "Aspirin",
      dose: "81 mg",
      scheduledTime: "08:00:00",
      frequency: "Daily",
      notes: null,
      isActive: true,
    },
  ]);

  // 7. Seed medication doses for today
  console.log("➡️  Seeding medication doses...");
  const today = new Date();
  const getTodayAtTime = (hours: number, minutes: number = 0) => {
    const d = new Date(today);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  await db.insert(medicationDoses).values([
    {
      medicationId: medIds.lisinopril,
      scheduledFor: getTodayAtTime(8),
      status: "confirmed",
      confirmedAt: getTodayAtTime(8, 2),
      confirmedByUserId: mariaId,
    },
    {
      medicationId: medIds.metformin,
      scheduledFor: getTodayAtTime(13),
      status: "pending",
    },
    {
      medicationId: medIds.atorvastatin,
      scheduledFor: getTodayAtTime(20),
      status: "pending",
    },
    {
      medicationId: medIds.vitaminD,
      scheduledFor: getTodayAtTime(8),
      status: "confirmed",
      confirmedAt: getTodayAtTime(8),
      confirmedByUserId: mariaId,
    },
    {
      medicationId: medIds.aspirin,
      scheduledFor: getTodayAtTime(8),
      status: "missed",
    },
  ]);

  // 8. Seed routines
  console.log("➡️  Seeding routines...");
  await db.insert(routines).values([
    {
      patientId,
      title: "Breakfast",
      scheduledTime: "07:30:00",
      category: "meal",
      recurrenceRule: "DAILY",
      priority: "high",
    },
    {
      patientId,
      title: "Morning walk",
      scheduledTime: "09:30:00",
      category: "activity",
      recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
      priority: "medium",
    },
    {
      patientId,
      title: "Hydration check",
      scheduledTime: "11:00:00",
      category: "hydration",
      recurrenceRule: "INTERVAL=2;FREQ=HOURLY",
      priority: "high",
    },
    {
      patientId,
      title: "Lunch",
      scheduledTime: "12:30:00",
      category: "meal",
      recurrenceRule: "DAILY",
      priority: "high",
    },
    {
      patientId,
      title: "Physical therapy",
      scheduledTime: "15:00:00",
      category: "therapy",
      recurrenceRule: "FREQ=WEEKLY;BYDAY=TU,TH",
      priority: "high",
    },
    {
      patientId,
      title: "Dinner",
      scheduledTime: "18:30:00",
      category: "meal",
      recurrenceRule: "DAILY",
      priority: "high",
    },
    {
      patientId,
      title: "Bedtime",
      scheduledTime: "21:30:00",
      category: "sleep",
      recurrenceRule: "DAILY",
      priority: "medium",
    },
  ]);

  // 9. Seed devices
  console.log("➡️  Seeding devices...");
  const devIds = {
    bedroom: "66666666-6666-6666-6666-666666666661",
    kitchen: "66666666-6666-6666-6666-666666666662",
  };

  await db.insert(devices).values([
    {
      id: devIds.bedroom,
      patientId,
      name: "Bedroom e-ink",
      deviceKeyHash: "e987c2f0f353a39e9fc32559ccb7a9f7e5d0a631165bc674d89e5251642828b6", // sha256('bedroom_key')
      model: 'Raspberry Pi 3 + Waveshare 7.5"',
      refreshMinutes: 5,
      displayTemplate: "daily_summary",
      showNextMedication: true,
      showNextRoutine: true,
      showMissedDoseAlerts: true,
      showFamilyMessage: true,
    },
    {
      id: devIds.kitchen,
      patientId,
      name: "Kitchen e-ink",
      deviceKeyHash: "4620f3531b73b22e1b4b9fc03f9ec674e5d0a631165bc674d89e5251642828ff", // sha256('kitchen_key')
      model: 'Raspberry Pi 3 + Waveshare 4.2"',
      refreshMinutes: 15,
      displayTemplate: "next_reminder",
      showNextMedication: true,
      showNextRoutine: true,
      showMissedDoseAlerts: true,
      showFamilyMessage: false,
    },
  ]);

  // 10. Seed device sync states
  console.log("➡️  Seeding sync states...");
  const twoMinsAgo = new Date();
  twoMinsAgo.setMinutes(twoMinsAgo.getMinutes() - 2);

  const threeHoursAgo = new Date();
  threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

  await db.insert(deviceSyncStates).values([
    {
      deviceId: devIds.bedroom,
      status: "online",
      lastSyncAt: twoMinsAgo,
      powerSource: "ac",
      ipAddress: "192.168.1.104",
      firmwareVersion: "v1.0.4",
    },
    {
      deviceId: devIds.kitchen,
      status: "offline",
      lastSyncAt: threeHoursAgo,
      batteryPercentage: 42,
      powerSource: "battery",
      ipAddress: "192.168.1.112",
      firmwareVersion: "v1.0.4",
    },
  ]);

  // 11. Seed notifications
  console.log("➡️  Seeding notifications...");
  await db.insert(notifications).values([
    {
      familyId,
      patientId,
      type: "missed",
      title: "Missed dose — Aspirin 81 mg",
      message: "Eleanor Hayes did not take their Aspirin dose scheduled for 08:00.",
      isRead: false,
      createdAt: getTodayAtTime(8, 15),
    },
    {
      familyId,
      patientId,
      type: "confirmed",
      title: "Confirmed — Lisinopril 10 mg",
      message: "Maria Lopez confirmed Lisinopril 10 mg at 08:02.",
      isRead: true,
      createdAt: getTodayAtTime(8, 2),
    },
    {
      familyId,
      patientId: null,
      type: "info",
      title: "Device synced — Bedroom e-ink",
      message: "Bedroom e-ink completed full display sync and battery check.",
      isRead: true,
      createdAt: getTodayAtTime(8, 0),
    },
    {
      familyId,
      patientId,
      type: "reminder",
      title: "Upcoming — Metformin 500 mg at 13:00",
      message: "Reminder: Metformin dose is scheduled in 15 minutes.",
      isRead: false,
      createdAt: getTodayAtTime(12, 45),
    },
  ]);

  // 12. Seed AI messages & subscriptions
  console.log("➡️  Seeding AI messages & billing...");
  await db.insert(aiMessages).values({
    patientId,
    content: "Eleanor, remember to drink a glass of water with your lunch.",
    contextSource: "hydration_frequency",
    status: "approved",
  });

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await db.insert(subscriptions).values({
    familyId,
    planType: "family_premium",
    status: "active",
    stripeSubscriptionId: "sub_1Oq2z3ABC123xyz",
    expiresAt: nextMonth,
  });

  console.log("🌱 Database seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
