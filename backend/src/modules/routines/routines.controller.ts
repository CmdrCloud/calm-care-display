import { FastifyInstance } from "fastify";
import { authenticateToken } from "../../shared/middleware/auth.middleware";
import { routinesService } from "./routines.service";
import { z } from "zod";
import { HttpError } from "../../shared/middleware/error.middleware";

const createRoutineSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(1),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be in HH:MM format"),
  category: z.enum(["meal", "activity", "hydration", "therapy", "sleep", "calendar", "other"]),
  recurrenceRule: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
});

export async function routinesRoutes(app: FastifyInstance) {
  // Enforce JWT auth
  app.addHook("preHandler", authenticateToken);

  const getFamilyId = (request: any) => {
    const familyId = request.headers["x-family-id"];
    if (!familyId || typeof familyId !== "string") {
      throw new HttpError(400, "Header 'x-family-id' is required");
    }
    return familyId;
  };

  // GET /routines
  app.get("/", async (request) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor", "viewer"]);
    return await routinesService.getRoutines(familyId);
  });

  // POST /routines
  app.post("/", async (request, reply) => {
    const familyId = getFamilyId(request);
    await request.requireMembership(familyId, ["admin", "editor"]);
    const body = createRoutineSchema.parse(request.body);
    const data = await routinesService.createRoutine(familyId, body);
    return reply.status(201).send(data);
  });

  // PUT /routines/:id
  app.put("/:id", async (request) => {
    const familyId = getFamilyId(request);
    const { id } = request.params as { id: string };
    await request.requireMembership(familyId, ["admin", "editor"]);
    const body = createRoutineSchema.partial().parse(request.body);
    return await routinesService.updateRoutine(familyId, id, body);
  });
}
