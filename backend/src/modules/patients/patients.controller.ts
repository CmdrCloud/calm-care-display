import { FastifyInstance } from "fastify";
import { authenticateToken } from "../../shared/middleware/auth.middleware";
import { patientsService } from "./patients.service";
import { z } from "zod";
import { HttpError } from "../../shared/middleware/error.middleware";

const createPatientSchema = z.object({
  name: z.string().min(2),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  room: z.string().optional(),
  notes: z.string().optional(),
  primaryDiagnosis: z.string().optional(),
  allergies: z.string().optional(),
  mobility: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  avatarInitials: z.string().max(3).optional(),
});

export async function patientsRoutes(app: FastifyInstance) {
  // Require Bearer JWT auth on all patient routes
  app.addHook("preHandler", authenticateToken);

  // Private helper to extract header
  const getFamilyId = (request: any) => {
    const familyId = request.headers["x-family-id"];
    if (!familyId || typeof familyId !== "string") {
      throw new HttpError(400, "Header 'x-family-id' is required to scope care operations");
    }
    return familyId;
  };

  // GET /patients (list)
  app.get("/", async (request, reply) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor", "viewer"]);
    return await patientsService.getPatients(familyId);
  });

  // GET /patients/:id (view)
  app.get("/:id", async (request, reply) => {
    const familyId = getFamilyId(request);
    const { id } = request.params as { id: string };
    await request.requireMembership(familyId, ["admin", "editor", "viewer"]);
    return await patientsService.getPatientById(familyId, id);
  });

  // POST /patients (create)
  app.post("/", async (request, reply) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor"]);

    const body = createPatientSchema.parse(request.body);
    const newPatient = await patientsService.createPatient(familyId, body);

    return reply.status(201).send(newPatient);
  });

  // PUT /patients/:id (update)
  app.put("/:id", async (request, reply) => {
    const familyId = getFamilyId(request);
    const { id } = request.params as { id: string };
    await request.requireMembership(familyId, ["admin", "editor"]);

    const body = createPatientSchema.partial().parse(request.body);
    const updatedPatient = await patientsService.updatePatient(familyId, id, body);

    return updatedPatient;
  });
}
