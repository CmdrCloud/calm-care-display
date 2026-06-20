import { FastifyInstance } from "fastify";
import { authenticateToken } from "../../shared/middleware/auth.middleware";
import { notificationsService } from "./notifications.service";
import { HttpError } from "../../shared/middleware/error.middleware";

export async function notificationsRoutes(app: FastifyInstance) {
  // Enforce JWT auth
  app.addHook("preHandler", authenticateToken);

  const getFamilyId = (request: any) => {
    const familyId = request.headers["x-family-id"];
    if (!familyId || typeof familyId !== "string") {
      throw new HttpError(400, "Header 'x-family-id' is required");
    }
    return familyId;
  };

  // GET /notifications
  app.get("/", async (request) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor", "viewer"]);
    return await notificationsService.getNotifications(familyId);
  });

  // PUT /notifications/:id/read
  app.put("/:id/read", async (request) => {
    const familyId = getFamilyId(request);
    const { id } = request.params as { id: string };
    await request.requireMembership(familyId, ["admin", "editor", "viewer"]);
    return await notificationsService.markAsRead(familyId, id);
  });
}
