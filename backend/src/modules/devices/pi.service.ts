import { and, eq, gte, lte, desc, asc } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "../../shared/database/db";
import {
  devices,
  deviceSyncStates,
  patients,
  medications,
  medicationDoses,
  routines,
  aiMessages,
} from "../../shared/database/schema";
import { HttpError } from "../../shared/middleware/error.middleware";

export class PiService {
  async getSyncPayload(deviceId: string, rawKey: string) {
    const [device] = await db
      .select()
      .from(devices)
      .where(eq(devices.id, deviceId))
      .limit(1);

    if (!device) {
      throw new HttpError(404, "Device not found");
    }

    const hashedKey = createHash("sha256").update(rawKey).digest("hex");
    if (hashedKey !== device.deviceKeyHash) {
      throw new HttpError(401, "Invalid device key");
    }

    if (!device.patientId) {
      return {
        device: {
          id: device.id,
          name: device.name,
          refreshMinutes: device.refreshMinutes,
          displayTemplate: device.displayTemplate,
          showNextMedication: device.showNextMedication,
          showNextRoutine: device.showNextRoutine,
          showMissedDoseAlerts: device.showMissedDoseAlerts,
          showFamilyMessage: device.showFamilyMessage,
        },
        patient: null,
        nextMedication: null,
        missedDose: null,
        nextRoutine: null,
        familyMessage: null,
      };
    }

    let patient = null;
    [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, device.patientId))
      .limit(1);

    const now = new Date();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const endOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
    );

    const todayDoses = await db
      .select({
        id: medicationDoses.id,
        status: medicationDoses.status,
        scheduledFor: medicationDoses.scheduledFor,
        medicationName: medications.name,
        medicationDose: medications.dose,
      })
      .from(medicationDoses)
      .innerJoin(medications, eq(medicationDoses.medicationId, medications.id))
      .where(
        and(
          eq(medications.patientId, device.patientId),
          gte(medicationDoses.scheduledFor, startOfDay),
          lte(medicationDoses.scheduledFor, endOfDay),
        ),
      )
      .orderBy(asc(medicationDoses.scheduledFor));

    const nextMedication = todayDoses.find((d) => d.status === "pending") || null;
    const missedDose = todayDoses.find((d) => d.status === "missed") || null;

    const activeRoutines = await db
      .select()
      .from(routines)
      .where(
        and(eq(routines.patientId, device.patientId), eq(routines.isActive, true)),
      )
      .orderBy(asc(routines.scheduledTime));

    // Uses server local time; long-term fix: join patients -> families.timezone with date-fns-tz
    const localNow = new Date();
    const hh = String(localNow.getHours()).padStart(2, "0");
    const mm = String(localNow.getMinutes()).padStart(2, "0");
    const ss = String(localNow.getSeconds()).padStart(2, "0");
    const currentTimeStr = `${hh}:${mm}:${ss}`;
    let nextRoutine = null;
    for (const r of activeRoutines) {
      if (r.scheduledTime > currentTimeStr) {
        nextRoutine = r;
        break;
      }
    }
    if (!nextRoutine && activeRoutines.length > 0) {
      nextRoutine = activeRoutines[0];
    }

    let familyMessage: string | null = null;
    if (device.showFamilyMessage) {
      const [message] = await db
        .select()
        .from(aiMessages)
        .where(
          and(
            eq(aiMessages.patientId, device.patientId),
            eq(aiMessages.status, "approved"),
          ),
        )
        .orderBy(desc(aiMessages.createdAt))
        .limit(1);
      if (message) {
        familyMessage = message.content;
      }
    }

    await db
      .insert(deviceSyncStates)
      .values({
        deviceId: device.id,
        status: "online",
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: deviceSyncStates.deviceId,
        set: {
          status: "online",
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      });

    return {
      device: {
        id: device.id,
        name: device.name,
        refreshMinutes: device.refreshMinutes,
        displayTemplate: device.displayTemplate,
        showNextMedication: device.showNextMedication,
        showNextRoutine: device.showNextRoutine,
        showMissedDoseAlerts: device.showMissedDoseAlerts,
        showFamilyMessage: device.showFamilyMessage,
      },
      patient: patient
        ? {
            id: patient.id,
            name: patient.name,
            room: patient.room,
          }
        : null,
      nextMedication: nextMedication
        ? {
            id: nextMedication.id,
            name: nextMedication.medicationName,
            dose: nextMedication.medicationDose,
            scheduledFor: nextMedication.scheduledFor.toISOString(),
          }
        : null,
      missedDose: missedDose
        ? {
            id: missedDose.id,
            name: missedDose.medicationName,
            dose: missedDose.medicationDose,
            scheduledFor: missedDose.scheduledFor.toISOString(),
          }
        : null,
      nextRoutine: nextRoutine
        ? {
            id: nextRoutine.id,
            title: nextRoutine.title,
            scheduledTime: nextRoutine.scheduledTime.slice(0, 5),
            category: nextRoutine.category,
            priority: nextRoutine.priority,
          }
        : null,
      familyMessage,
    };
  }

  async updateHeartbeat(
    deviceId: string,
    rawKey: string,
    data: {
      ipAddress?: string;
      firmwareVersion?: string;
      batteryPercentage?: number;
      powerSource?: "ac" | "battery";
    },
  ) {
    const [device] = await db
      .select()
      .from(devices)
      .where(eq(devices.id, deviceId))
      .limit(1);

    if (!device) {
      throw new HttpError(404, "Device not found");
    }

    const hashedKey = createHash("sha256").update(rawKey).digest("hex");
    if (hashedKey !== device.deviceKeyHash) {
      throw new HttpError(401, "Invalid device key");
    }

    const updateFields: Record<string, any> = {
      status: "online",
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    };
    if (data.ipAddress !== undefined) updateFields.ipAddress = data.ipAddress;
    if (data.firmwareVersion !== undefined) updateFields.firmwareVersion = data.firmwareVersion;
    if (data.batteryPercentage !== undefined) updateFields.batteryPercentage = data.batteryPercentage;
    if (data.powerSource !== undefined) updateFields.powerSource = data.powerSource;

    await db
      .insert(deviceSyncStates)
      .values({
        deviceId: device.id,
        ...updateFields,
      })
      .onConflictDoUpdate({
        target: deviceSyncStates.deviceId,
        set: updateFields,
      });

    return { success: true };
  }
}

export const piService = new PiService();
