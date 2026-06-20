import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { HttpError } from "./error.middleware";
import { db } from "../database/db";
import { familyMemberships } from "../database/schema";
import { and, eq, inArray } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkeychangeinproduction";

export interface UserPayload {
  userId: string;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: UserPayload;
    requireMembership: (
      familyId: string,
      allowedRoles?: ("admin" | "editor" | "viewer")[],
    ) => Promise<typeof familyMemberships.$inferSelect>;
  }
}

// Hook to verify JWT Access Token
export async function authenticateToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "Access token is missing or malformed");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

    request.user = decoded;
  } catch (error: any) {
    throw new HttpError(401, error.message || "Invalid or expired access token");
  }
}

// Decorator to enforce multi-tenant family boundary checks
export async function requireMembershipHelper(
  this: FastifyRequest,
  familyId: string,
  allowedRoles: ("admin" | "editor" | "viewer")[] = ["admin", "editor", "viewer"],
) {
  if (!this.user) {
    throw new HttpError(401, "Authentication required");
  }

  // Find membership
  const [membership] = await db
    .select()
    .from(familyMemberships)
    .where(
      and(eq(familyMemberships.familyId, familyId), eq(familyMemberships.userId, this.user.userId)),
    )
    .limit(1);

  if (!membership) {
    throw new HttpError(403, "You do not belong to this family circle");
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
    throw new HttpError(403, "Insufficient permissions inside this family circle");
  }

  return membership;
}
