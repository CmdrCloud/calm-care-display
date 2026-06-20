// Centralized mock data for CareCircle AI MVP
export const patient = {
  id: "p1",
  name: "Eleanor Hayes",
  age: 78,
  room: "Home — Bedroom 1",
  caregiver: "Maria Lopez",
  notes: "Mild memory loss. Prefers larger text. Drinks tea with breakfast.",
  avatar: "EH",
};

export const caregivers = [
  { id: "c1", name: "Maria Lopez", role: "Primary caregiver", phone: "(555) 123-9821" },
  { id: "c2", name: "David Hayes", role: "Family (son)", phone: "(555) 887-2210" },
];

export type MedStatus = "confirmed" | "pending" | "missed";
export const medications: {
  id: string;
  name: string;
  dose: string;
  time: string;
  frequency: string;
  notes?: string;
  status: MedStatus;
}[] = [
  {
    id: "m1",
    name: "Lisinopril",
    dose: "10 mg",
    time: "08:00",
    frequency: "Daily",
    notes: "With breakfast",
    status: "confirmed",
  },
  {
    id: "m2",
    name: "Metformin",
    dose: "500 mg",
    time: "13:00",
    frequency: "Twice daily",
    notes: "With meal",
    status: "pending",
  },
  {
    id: "m3",
    name: "Atorvastatin",
    dose: "20 mg",
    time: "20:00",
    frequency: "Daily",
    status: "pending",
  },
  {
    id: "m4",
    name: "Vitamin D",
    dose: "1000 IU",
    time: "08:00",
    frequency: "Daily",
    status: "confirmed",
  },
  { id: "m5", name: "Aspirin", dose: "81 mg", time: "08:00", frequency: "Daily", status: "missed" },
];

export const routines = [
  {
    id: "r1",
    title: "Breakfast",
    time: "07:30",
    category: "Meal",
    recurrence: "Daily",
    priority: "High",
  },
  {
    id: "r2",
    title: "Morning walk",
    time: "09:30",
    category: "Activity",
    recurrence: "Mon–Fri",
    priority: "Medium",
  },
  {
    id: "r3",
    title: "Hydration check",
    time: "11:00",
    category: "Hydration",
    recurrence: "Every 2h",
    priority: "High",
  },
  {
    id: "r4",
    title: "Lunch",
    time: "12:30",
    category: "Meal",
    recurrence: "Daily",
    priority: "High",
  },
  {
    id: "r5",
    title: "Physical therapy",
    time: "15:00",
    category: "Therapy",
    recurrence: "Tue, Thu",
    priority: "High",
  },
  {
    id: "r6",
    title: "Dinner",
    time: "18:30",
    category: "Meal",
    recurrence: "Daily",
    priority: "High",
  },
  {
    id: "r7",
    title: "Bedtime",
    time: "21:30",
    category: "Sleep",
    recurrence: "Daily",
    priority: "Medium",
  },
];

export const devices = [
  {
    id: "d1",
    name: "Bedroom e-ink",
    model: 'Raspberry Pi 3 + Waveshare 7.5"',
    status: "online" as const,
    lastSync: "2 minutes ago",
    power: "AC adapter",
    battery: null,
    refreshMinutes: 5,
    template: "Daily Summary",
  },
  {
    id: "d2",
    name: "Kitchen e-ink",
    model: 'Raspberry Pi 3 + Waveshare 4.2"',
    status: "offline" as const,
    lastSync: "3 hours ago",
    power: "Battery",
    battery: 42,
    refreshMinutes: 15,
    template: "Next Reminder",
  },
];

export const notifications = [
  {
    id: "n1",
    type: "missed",
    title: "Missed dose — Aspirin 81 mg",
    time: "08:15",
    patient: "Eleanor Hayes",
  },
  {
    id: "n2",
    type: "confirmed",
    title: "Confirmed — Lisinopril 10 mg",
    time: "08:02",
    patient: "Eleanor Hayes",
  },
  { id: "n3", type: "info", title: "Device synced — Bedroom e-ink", time: "08:00", patient: "—" },
  {
    id: "n4",
    type: "reminder",
    title: "Upcoming — Metformin 500 mg at 13:00",
    time: "12:45",
    patient: "Eleanor Hayes",
  },
];

export const todayDate = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function nextMedication() {
  return medications.find((m) => m.status === "pending") ?? medications[0];
}

export function nextRoutine() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return (
    routines.find((r) => {
      const [h, m] = r.time.split(":").map(Number);
      return h * 60 + m >= mins;
    }) ?? routines[0]
  );
}
