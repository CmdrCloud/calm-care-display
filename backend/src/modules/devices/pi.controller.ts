import { FastifyInstance } from "fastify";
import { z } from "zod";
import { HttpError } from "../../shared/middleware/error.middleware";
import { piService } from "./pi.service";

const heartbeatSchema = z.object({
  ipAddress: z.string().optional(),
  firmwareVersion: z.string().optional(),
  batteryPercentage: z.number().int().min(0).max(100).optional(),
  powerSource: z.enum(["ac", "battery"]).optional(),
});

export async function piRoutes(app: FastifyInstance) {
  app.get("/sync/:deviceId", async (request) => {
    const { deviceId } = request.params as { deviceId: string };
    const rawKey = request.headers["x-device-key"];
    if (!rawKey || typeof rawKey !== "string") {
      throw new HttpError(401, "Missing x-device-key header");
    }
    return await piService.getSyncPayload(deviceId, rawKey);
  });

  app.patch("/sync/:deviceId/heartbeat", async (request) => {
    const { deviceId } = request.params as { deviceId: string };
    const rawKey = request.headers["x-device-key"];
    if (!rawKey || typeof rawKey !== "string") {
      throw new HttpError(401, "Missing x-device-key header");
    }
    const body = heartbeatSchema.parse(request.body);
    return await piService.updateHeartbeat(deviceId, rawKey, body);
  });
}
