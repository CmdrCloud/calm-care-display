import Fastify from "fastify";
import cors from "@fastify/cors";
import { globalErrorHandler } from "./shared/middleware/error.middleware";
import { requireMembershipHelper } from "./shared/middleware/auth.middleware";
import { authRoutes } from "./modules/auth/auth.controller";
import { patientsRoutes } from "./modules/patients/patients.controller";
import { medicationsRoutes } from "./modules/medications/medications.controller";
import { routinesRoutes } from "./modules/routines/routines.controller";
import { devicesRoutes } from "./modules/devices/devices.controller";
import { notificationsRoutes } from "./modules/notifications/notifications.controller";
import { piRoutes } from "./modules/devices/pi.controller";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // CORS Configuration
  app.register(cors, {
    origin: true, // Echo back request origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-family-id", "x-device-key"],
    credentials: true,
  });

  // Register global error handler
  app.setErrorHandler(globalErrorHandler);

  // Decorate fastify request with tenant scope checkers
  app.decorateRequest("requireMembership", requireMembershipHelper);

  // Healthcheck Route
  app.get("/health", async () => {
    return { status: "OK", timestamp: new Date() };
  });

  // Register Auth and Care Module Routers
  app.register(authRoutes, { prefix: "/auth" });
  app.register(patientsRoutes, { prefix: "/patients" });
  app.register(medicationsRoutes, { prefix: "/medications" });
  app.register(routinesRoutes, { prefix: "/routines" });
  app.register(devicesRoutes, { prefix: "/devices" });
  app.register(piRoutes, { prefix: "/pi" });
  app.register(notificationsRoutes, { prefix: "/notifications" });

  return app;
}
