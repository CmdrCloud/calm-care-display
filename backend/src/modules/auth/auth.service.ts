import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../shared/database/db";
import { users, familyMemberships, families } from "../../shared/database/schema";
import { HttpError } from "../../shared/middleware/error.middleware";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkeychangeinproduction";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "supersecretrefreshkeychangeinproduction";

export class AuthService {
  async login(email: string, password_raw: string) {
    // 1. Fetch user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    // 2. Compare bcrypt hash
    const passwordMatch = await bcrypt.compare(password_raw, user.passwordHash);
    if (!passwordMatch) {
      throw new HttpError(401, "Invalid email or password");
    }

    // 3. Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    // 4. Fetch family membership
    const [membership] = await db
      .select()
      .from(familyMemberships)
      .where(eq(familyMemberships.userId, user.id))
      .limit(1);

    return {
      accessToken,
      refreshToken,
      familyId: membership?.familyId || null,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    };
  }
  
  async register(data: {
    email: string;
    password_raw: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    // 1. Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      throw new HttpError(400, "A user with this email address already exists.");
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(data.password_raw, 10);

    // 3. Create user, family and membership in transaction
    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
        })
        .returning();

      // Create default family circle
      const [newFamily] = await tx
        .insert(families)
        .values({
          name: `${data.firstName}'s Family Circle`,
          timezone: "America/Los_Angeles",
          language: "en",
        })
        .returning();

      // Create membership as admin
      await tx.insert(familyMemberships).values({
        familyId: newFamily.id,
        userId: newUser.id,
        role: "admin",
      });

      return { newUser, newFamily };
    });

    // 4. Generate tokens
    const accessToken = this.generateAccessToken(result.newUser.id, result.newUser.email);
    const refreshToken = this.generateRefreshToken(result.newUser.id, result.newUser.email);

    return {
      accessToken,
      refreshToken,
      familyId: result.newFamily.id,
      user: {
        id: result.newUser.id,
        email: result.newUser.email,
        firstName: result.newUser.firstName,
        lastName: result.newUser.lastName,
        phone: result.newUser.phone,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; email: string };

      const accessToken = this.generateAccessToken(decoded.userId, decoded.email);
      const refreshToken = this.generateRefreshToken(decoded.userId, decoded.email);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new HttpError(401, "Invalid or expired refresh token");
    }
  }

  private generateAccessToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "15m" });
  }

  private generateRefreshToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  }
}

export const authService = new AuthService();
