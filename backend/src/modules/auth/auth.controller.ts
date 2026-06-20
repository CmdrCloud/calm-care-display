import { FastifyInstance } from "fastify";
import { authService } from "./auth.service";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6), // Relaxed slightly to match simple dev hashes
});

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post("/login", async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);
    const data = await authService.login(email, password);
    return data;
  });

  // POST /auth/register
  app.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const data = await authService.register({
      email: body.email,
      password_raw: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
    });
    return reply.status(201).send(data);
  });

  // POST /auth/refresh
  app.post("/refresh", async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);
    const data = await authService.refreshToken(refreshToken);
    return data;
  });

  // POST /auth/logout (stateless revoking client-side)
  app.post("/logout", async (request, reply) => {
    return { success: true };
  });
}
