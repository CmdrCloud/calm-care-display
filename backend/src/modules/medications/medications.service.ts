import { and, eq, sql } from "drizzle-orm";
import { db } from "../../shared/database/db";
import { medications, medicationDoses, patients } from "../../shared/database/schema";
import { HttpError } from "../../shared/middleware/error.middleware";

export class MedicationsService {
  async getMedications(familyId: string) {
    return await db
      .select({
        id: medications.id,
        patientId: medications.patientId,
        name: medications.name,
        dose: medications.dose,
        scheduledTime: medications.scheduledTime,
        frequency: medications.frequency,
        notes: medications.notes,
        isActive: medications.isActive,
        createdAt: medications.createdAt,
        updatedAt: medications.updatedAt,
      })
      .from(medications)
      .innerJoin(patients, eq(medications.patientId, patients.id))
      .where(eq(patients.familyId, familyId));
  }

  async getMedicationById(familyId: string, id: string) {
    const [result] = await db
      .select({
        medication: medications,
      })
      .from(medications)
      .innerJoin(patients, eq(medications.patientId, patients.id))
      .where(and(eq(patients.familyId, familyId), eq(medications.id, id)))
      .limit(1);

    if (!result) {
      throw new HttpError(404, "Medication not found or access denied");
    }
    return result.medication;
  }

  async createMedication(
    familyId: string,
    data: {
      patientId: string;
      name: string;
      dose: string;
      scheduledTime: string;
      frequency: string;
      notes?: string;
    },
  ) {
    // Check if patient belongs to family
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.familyId, familyId), eq(patients.id, data.patientId)))
      .limit(1);

    if (!patient) {
      throw new HttpError(400, "Patient not found in this family circle");
    }

    const [newMed] = await db
      .insert(medications)
      .values({
        ...data,
        isActive: true,
      })
      .returning();

    // Create a dose for today immediately
    const today = new Date();
    const [hours, minutes] = data.scheduledTime.split(":").map(Number);
    const scheduledFor = new Date(today);
    scheduledFor.setHours(hours, minutes || 0, 0, 0);

    await db.insert(medicationDoses).values({
      medicationId: newMed.id,
      scheduledFor,
      status: "pending",
    });

    return newMed;
  }

  async updateMedication(
    familyId: string,
    id: string,
    data: Partial<typeof medications.$inferInsert>,
  ) {
    await this.getMedicationById(familyId, id);

    const [updatedMed] = await db
      .update(medications)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(medications.id, id))
      .returning();

    return updatedMed;
  }

  async getDosesForToday(familyId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const results = await db
      .select({
        id: medicationDoses.id,
        medicationId: medicationDoses.medicationId,
        scheduledFor: medicationDoses.scheduledFor,
        status: medicationDoses.status,
        confirmedAt: medicationDoses.confirmedAt,
        confirmedByUserId: medicationDoses.confirmedByUserId,
        notes: medicationDoses.notes,
        medication: {
          name: medications.name,
          dose: medications.dose,
          scheduledTime: medications.scheduledTime,
          frequency: medications.frequency,
          notes: medications.notes,
        },
      })
      .from(medicationDoses)
      .innerJoin(medications, eq(medicationDoses.medicationId, medications.id))
      .innerJoin(patients, eq(medications.patientId, patients.id))
      .where(
        and(
          eq(patients.familyId, familyId),
          // We can widen/relax query in local dev to show all seeded doses
        ),
      );

    return results;
  }

  async confirmDose(userId: string, doseId: string) {
    const [dose] = await db
      .select()
      .from(medicationDoses)
      .where(eq(medicationDoses.id, doseId))
      .limit(1);

    if (!dose) {
      throw new HttpError(404, "Dose not found");
    }

    const [updatedDose] = await db
      .update(medicationDoses)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        confirmedByUserId: userId,
      })
      .where(eq(medicationDoses.id, doseId))
      .returning();

    return updatedDose;
  }
}

export const medicationsService = new MedicationsService();
