import { and, eq } from "drizzle-orm";
import { db } from "../../shared/database/db";
import { patients } from "../../shared/database/schema";
import { HttpError } from "../../shared/middleware/error.middleware";

export class PatientsService {
  async getPatients(familyId: string) {
    return await db
      .select()
      .from(patients)
      .where(eq(patients.familyId, familyId));
  }

  async getPatientById(familyId: string, id: string) {
    const [patient] = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.familyId, familyId),
          eq(patients.id, id)
        )
      )
      .limit(1);

    if (!patient) {
      throw new HttpError(404, "Patient not found or access denied");
    }
    return patient;
  }

  async createPatient(
    familyId: string, 
    data: {
      name: string;
      dateOfBirth: string; // YYYY-MM-DD
      room?: string;
      notes?: string;
      primaryDiagnosis?: string;
      allergies?: string;
      mobility?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      riskLevel?: string;
      avatarInitials?: string;
    }
  ) {
    const [newPatient] = await db
      .insert(patients)
      .values({
        ...data,
        familyId,
        riskLevel: data.riskLevel || "low",
        avatarInitials: data.avatarInitials || data.name.split(" ").map(n => n[0]).join("").substring(0, 3).toUpperCase(),
      })
      .returning();
    return newPatient;
  }

  async updatePatient(familyId: string, id: string, data: Partial<typeof patients.$inferInsert>) {
    // Verify existence in this family circle first
    await this.getPatientById(familyId, id);

    const [updatedPatient] = await db
      .update(patients)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(patients.familyId, familyId),
          eq(patients.id, id)
        )
      )
      .returning();
    return updatedPatient;
  }
}

export const patientsService = new PatientsService();
