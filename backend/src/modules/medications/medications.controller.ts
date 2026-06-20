import { FastifyInstance } from "fastify";
import { authenticateToken } from "../../shared/middleware/auth.middleware";
import { medicationsService } from "./medications.service";
import { z } from "zod";
import { HttpError } from "../../shared/middleware/error.middleware";

const createMedicationSchema = z.object({
  patientId: z.string().uuid(),
  name: z.string().min(1),
  dose: z.string().min(1),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be in HH:MM format"),
  frequency: z.string().min(1),
  notes: z.string().optional(),
});

export async function medicationsRoutes(app: FastifyInstance) {
  // Enforce JWT auth
  app.addHook("preHandler", authenticateToken);

  const getFamilyId = (request: any) => {
    const familyId = request.headers["x-family-id"];
    if (!familyId || typeof familyId !== "string") {
      throw new HttpError(400, "Header 'x-family-id' is required");
    }
    return familyId;
  };

  // GET /medications
  app.get("/", async (request) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor", "viewer"]);
    return await medicationsService.getMedications(familyId);
  });

  // GET /medications/doses (list today's dosing statuses)
  app.get("/doses", async (request) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor", "viewer"]);
    return await medicationsService.getDosesForToday(familyId);
  });

  // GET /medications/:id
  app.get("/:id", async (request) => {
    const familyId = getFamilyId(request);
    const { id } = request.params as { id: string };
    await request.requireMembership(familyId, ["admin", "editor", "viewer"]);
    return await medicationsService.getMedicationById(familyId, id);
  });

  // POST /medications
  app.post("/", async (request, reply) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor"]);
    const body = createMedicationSchema.parse(request.body);
    const data = await medicationsService.createMedication(familyId, body);
    return reply.status(201).send(data);
  });

  // PUT /medications/:id
  app.put("/:id", async (request) => {
    const familyId = getFamilyId(request);
    const { id } = request.params as { id: string };
    await request.requireMembership(familyId, ["admin", "editor"]);
    const body = createMedicationSchema.partial().parse(request.body);
    return await medicationsService.updateMedication(familyId, id, body);
  });

  // POST /medications/doses/:doseId/confirm
  app.post("/doses/:doseId/confirm", async (request) => {
    const familyId = getFamilyId(request);
    const { doseId } = request.params as { doseId: string };

    // Validate request user
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }

    await request.requireMembership(familyId, ["admin", "editor"]);
    return await medicationsService.confirmDose(request.user.userId, doseId);
  });
}
