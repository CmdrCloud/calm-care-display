import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../shared/database/db";
import { users } from "../../shared/database/schema";
import { HttpError } from "../../shared/middleware/error.middleware";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkeychangeinproduction";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "supersecretrefreshkeychangeinproduction";

export class AuthService {
  async login(email: string, password_raw: string) {
    // 1. Fetch user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

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

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
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
