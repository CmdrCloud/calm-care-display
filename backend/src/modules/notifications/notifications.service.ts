import { and, desc, eq } from "drizzle-orm";
import { db } from "../../shared/database/db";
import { notifications } from "../../shared/database/schema";
import { HttpError } from "../../shared/middleware/error.middleware";

export class NotificationsService {
  async getNotifications(familyId: string) {
    return await db
      .select({
        id: notifications.id,
        familyId: notifications.familyId,
        patientId: notifications.patientId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.familyId, familyId))
      .orderBy(desc(notifications.createdAt));
  }

  async markAsRead(familyId: string, id: string) {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.familyId, familyId), eq(notifications.id, id)))
      .limit(1);

    if (!existing) {
      throw new HttpError(404, "Notification not found or access denied");
    }

    const [updatedNotification] = await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(eq(notifications.id, id))
      .returning();

    return updatedNotification;
  }
}

export const notificationsService = new NotificationsService();
