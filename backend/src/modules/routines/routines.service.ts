import { and, eq } from "drizzle-orm";
import { db } from "../../shared/database/db";
import { routines, patients } from "../../shared/database/schema";
import { HttpError } from "../../shared/middleware/error.middleware";

export class RoutinesService {
  async getRoutines(familyId: string) {
    return await db
      .select({
        id: routines.id,
        patientId: routines.patientId,
        title: routines.title,
        scheduledTime: routines.scheduledTime,
        category: routines.category,
        recurrenceRule: routines.recurrenceRule,
        priority: routines.priority,
        isActive: routines.isActive,
        createdAt: routines.createdAt,
        updatedAt: routines.updatedAt,
      })
      .from(routines)
      .innerJoin(patients, eq(routines.patientId, patients.id))
      .where(eq(patients.familyId, familyId));
  }

  async createRoutine(
    familyId: string,
    data: {
      patientId: string;
      title: string;
      scheduledTime: string;
      category: "meal" | "activity" | "hydration" | "therapy" | "sleep" | "calendar" | "other";
      recurrenceRule: string;
      priority: "low" | "medium" | "high";
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

    const [newRoutine] = await db
      .insert(routines)
      .values({
        ...data,
        isActive: true,
      })
      .returning();

    return newRoutine;
  }

  async updateRoutine(familyId: string, id: string, data: Partial<typeof routines.$inferInsert>) {
    const [existing] = await db
      .select()
      .from(routines)
      .innerJoin(patients, eq(routines.patientId, patients.id))
      .where(and(eq(patients.familyId, familyId), eq(routines.id, id)))
      .limit(1);

    if (!existing) {
      throw new HttpError(404, "Routine not found or access denied");
    }

    const [updatedRoutine] = await db
      .update(routines)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(routines.id, id))
      .returning();

    return updatedRoutine;
  }
}

export const routinesService = new RoutinesService();
