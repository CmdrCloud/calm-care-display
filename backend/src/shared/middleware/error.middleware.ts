import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function globalErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  // Handle custom HTTP errors
  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
      details: error.details,
    });
  }

  // Handle Zod Validation Errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: "ValidationError",
      message: "Input validation failed",
      details: error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Handle Fastify Validation Errors
  if (error.validation) {
    return reply.status(400).send({
      error: "ValidationError",
      message: error.message,
      details: error.validation,
    });
  }

  // Handle standard PostgreSQL/Drizzle unique constraints or foreign key violations
  if ((error as any).code === "23505") {
    return reply.status(409).send({
      error: "ConflictError",
      message: "A resource with these details already exists.",
    });
  }

  if ((error as any).code === "23503") {
    return reply.status(400).send({
      error: "ForeignKeyError",
      message: "Referenced resource does not exist.",
    });
  }

  // Default to 500
  const isProd = process.env.NODE_ENV === "production";
  return reply.status(error.statusCode || 500).send({
    error: "InternalServerError",
    message: isProd ? "An unexpected server error occurred." : error.message,
    stack: isProd ? undefined : error.stack,
  });
}
