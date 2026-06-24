import { FastifyInstance } from "fastify";
import { authenticateToken } from "../../shared/middleware/auth.middleware";
import { devicesService } from "./devices.service";
import { z } from "zod";
import { HttpError } from "../../shared/middleware/error.middleware";

const createDeviceSchema = z.object({
  patientId: z.string().uuid(),
  name: z.string().min(1),
  deviceKeyHash: z.string().min(64).max(64), // SHA-256 hash expected
  model: z.string().optional(),
  refreshMinutes: z.number().int().min(1).optional(),
  displayTemplate: z
    .enum(["daily_summary", "next_reminder", "full_schedule", "message_card"])
    .optional(),
});

export async function devicesRoutes(app: FastifyInstance) {
  // Enforce JWT auth
  app.addHook("preHandler", authenticateToken);

  const getFamilyId = (request: any) => {
    const familyId = request.headers["x-family-id"];
    if (!familyId || typeof familyId !== "string") {
      throw new HttpError(400, "Header 'x-family-id' is required");
    }
    return familyId;
  };

  // GET /devices
  app.get("/", async (request) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor", "viewer"]);
    return await devicesService.getDevices(familyId);
  });

  // POST /devices
  app.post("/", async (request, reply) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor"]);
    const body = createDeviceSchema.parse(request.body);
    const data = await devicesService.createDevice(familyId, body);
    return reply.status(201).send(data);
  });

  // PUT /devices/:id
  app.put("/:id", async (request) => {
    const familyId = getFamilyId(request);
    const { id } = request.params as { id: string };
    await request.requireMembership(familyId, ["admin", "editor"]);
    const body = createDeviceSchema.partial().parse(request.body);
    return await devicesService.updateDevice(familyId, id, body);
  });

  // POST /devices/:id/force-sync
  app.post("/:id/force-sync", async (request) => {
    const familyId = getFamilyId(request);
    const { id } = request.params as { id: string };
    await request.requireMembership(familyId, ["admin", "editor"]);
    return await devicesService.forceSyncDevice(familyId, id);
  });
}
