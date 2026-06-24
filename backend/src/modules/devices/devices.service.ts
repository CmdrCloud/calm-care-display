import { and, eq } from "drizzle-orm";
import { db } from "../../shared/database/db";
import { devices, deviceSyncStates } from "../../shared/database/schema";
import { HttpError } from "../../shared/middleware/error.middleware";

export class DevicesService {
  async getDevices(familyId: string) {
    const results = await db
      .select({
        id: devices.id,
        patientId: devices.patientId,
        name: devices.name,
        model: devices.model,
        refreshMinutes: devices.refreshMinutes,
        displayTemplate: devices.displayTemplate,
        showNextMedication: devices.showNextMedication,
        showNextRoutine: devices.showNextRoutine,
        showMissedDoseAlerts: devices.showMissedDoseAlerts,
        showFamilyMessage: devices.showFamilyMessage,
        createdAt: devices.createdAt,
        updatedAt: devices.updatedAt,
        syncState: {
          status: deviceSyncStates.status,
          lastSyncAt: deviceSyncStates.lastSyncAt,
          batteryPercentage: deviceSyncStates.batteryPercentage,
          powerSource: deviceSyncStates.powerSource,
          ipAddress: deviceSyncStates.ipAddress,
          firmwareVersion: deviceSyncStates.firmwareVersion,
        },
      })
      .from(devices)
      .leftJoin(deviceSyncStates, eq(devices.id, deviceSyncStates.deviceId))
      .where(eq(devices.familyId, familyId));

    return results;
  }

  async createDevice(
    familyId: string,
    data: {
      patientId: string;
      name: string;
      deviceKeyHash: string;
      model?: string;
      refreshMinutes?: number;
      displayTemplate?: "daily_summary" | "next_reminder" | "full_schedule" | "message_card";
    },
  ) {
    const [newDevice] = await db
      .insert(devices)
      .values({
        familyId,
        ...data,
        refreshMinutes: data.refreshMinutes || 15,
        displayTemplate: data.displayTemplate || "daily_summary",
        showNextMedication: true,
        showNextRoutine: true,
        showMissedDoseAlerts: true,
        showFamilyMessage: false,
      })
      .returning();

    // Initialize default sync state
    await db.insert(deviceSyncStates).values({
      deviceId: newDevice.id,
      status: "offline",
      powerSource: "ac",
    });

    return newDevice;
  }

  async updateDevice(familyId: string, id: string, data: Partial<typeof devices.$inferInsert>) {
    const [existing] = await db
      .select()
      .from(devices)
      .where(and(eq(devices.familyId, familyId), eq(devices.id, id)))
      .limit(1);

    if (!existing) {
      throw new HttpError(404, "Device not found or access denied");
    }

    const [updatedDevice] = await db
      .update(devices)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(devices.id, id))
      .returning();

    return updatedDevice;
  }

  async forceSyncDevice(familyId: string, id: string) {
    const [existing] = await db
      .select()
      .from(devices)
      .where(and(eq(devices.familyId, familyId), eq(devices.id, id)))
      .limit(1);

    if (!existing) {
      throw new HttpError(404, "Device not found or access denied");
    }

    await db
      .insert(deviceSyncStates)
      .values({
        deviceId: id,
        forceSyncAt: new Date(),
        status: "online",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: deviceSyncStates.deviceId,
        set: {
          forceSyncAt: new Date(),
          status: "online",
          updatedAt: new Date(),
        },
      });

    return { success: true };
  }
}

export const devicesService = new DevicesService();
