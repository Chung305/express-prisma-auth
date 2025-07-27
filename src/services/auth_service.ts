import prisma from "../clients/prisma";
import { RegisterParams } from "../schemas/auth_schema";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import logger from "../utils/v1/logger";
import { Role, User } from "@prisma/client";
import { SafeUser } from "../utils/types";
import {
  AuthError,
  DuplicateError,
  NotAuthenticatedError,
  NotAuthorizedError,
  NotFoundError,
  ValidationError,
} from "../utils/v1/error";

const CONFIG = {
  ARGON2_MEMORY: 64 * 1024, // 64 MB
  ARGON2_ITERATIONS: 3,
  ARGON2_PARALLELISM: 4,
  ARGON2_TYPE: argon2.argon2id,
  JWT_TOKEN_EXPIRY: "1h",
  REFRESH_TOKEN_EXPIRY: "7d",
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
};

interface AuthResponse {
  user: SafeUser;
  token: string;
  refreshToken: string;
}

export class AuthService {
  constructor() {
    // Initialize any dependencies if needed
  }

  public register = async (
    params: RegisterParams
  ): Promise<{ user: any; token: string; refreshToken: string }> => {
    const { email, password, username } = params;
    const [existingByEmail, existingByUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ]);

    if (existingByEmail) throw new DuplicateError("Email already registered");
    if (existingByUsername) throw new DuplicateError("Username already taken");

    const hashedPassword = await argon2.hash(password, {
      type: CONFIG.ARGON2_TYPE,
      memoryCost: CONFIG.ARGON2_MEMORY,
      timeCost: CONFIG.ARGON2_ITERATIONS,
      parallelism: CONFIG.ARGON2_PARALLELISM,
    });

    // Create user and token in transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            email,
            password: hashedPassword,
            role: [Role.USER],
          },
        });
        const token = jwt.sign({ userId: user.id }, this.getJwtSecret(), {
          expiresIn: CONFIG.JWT_TOKEN_EXPIRY,
        } as jwt.SignOptions);
        const refreshToken = jwt.sign(
          { userId: user.id },
          this.getRefreshSecret(),
          { expiresIn: CONFIG.REFRESH_TOKEN_EXPIRY } as jwt.SignOptions
        );
        await tx.token.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + CONFIG.REFRESH_TOKEN_EXPIRY_MS),
          },
        });
        return { user, token, refreshToken };
      });

      const { password: _, ...safeUser } = result.user;
      logger.info(`User registered: ${email} (${username})`);
      return {
        user: safeUser,
        token: result.token,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      logger.error("Registration error:", error);
      throw new AuthError("Failed to register user");
    }
  };

  public login = async (
    credential: string,
    password: string
  ): Promise<AuthResponse> => {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: credential }, { username: credential }] },
    });
    if (!user) {
      throw new NotAuthenticatedError("Invalid email or username");
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new NotAuthenticatedError("Invalid credentials");
    }

    try {
      const token = jwt.sign({ userId: user.id }, this.getJwtSecret(), {
        expiresIn: CONFIG.JWT_TOKEN_EXPIRY,
      } as jwt.SignOptions);
      const refreshToken = jwt.sign(
        { userId: user.id },
        this.getRefreshSecret(),
        { expiresIn: CONFIG.REFRESH_TOKEN_EXPIRY } as jwt.SignOptions
      );
      await prisma.token.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + CONFIG.REFRESH_TOKEN_EXPIRY_MS),
        },
      });

      const { password: _, ...safeUser } = user;
      logger.info(`User logged in: ${credential}`);
      return { user: safeUser, token, refreshToken };
    } catch (error) {
      logger.error("Login error:", error);
      throw new AuthError("Failed to log in");
    }
  };

  /**
   * Refreshes access token using a refresh token.
   * @throws Error for invalid or expired token.
   */
  public refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
    if (!refreshToken) throw new ValidationError("No refresh token provided");

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, this.getRefreshSecret()) as {
        userId: string;
      };
    } catch (error) {
      logger.error("Invalid refresh token:", error);
      throw new Error("Invalid refresh token");
    }

    const storedToken = await prisma.token.findUnique({
      where: { token: refreshToken },
    });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new NotAuthenticatedError("Invalid or expired refresh token");
    }

    const blacklisted = await prisma.blacklist.findUnique({
      where: { token: refreshToken },
    });
    if (blacklisted) {
      throw new ValidationError("Refresh token revoked");
    }

    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.token.delete({ where: { token: refreshToken } });
        const newToken = jwt.sign({ userId: user.id }, this.getJwtSecret(), {
          expiresIn: CONFIG.JWT_TOKEN_EXPIRY,
        } as jwt.SignOptions);
        const newRefreshToken = jwt.sign(
          { userId: user.id },
          this.getRefreshSecret(),
          { expiresIn: CONFIG.REFRESH_TOKEN_EXPIRY } as jwt.SignOptions
        );
        await tx.token.create({
          data: {
            token: newRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + CONFIG.REFRESH_TOKEN_EXPIRY_MS),
          },
        });
        return { user, token: newToken, refreshToken: newRefreshToken };
      });

      const { password: _, ...safeUser } = result.user;
      logger.info(`Token refreshed for user: ${user.email}`);
      return {
        user: safeUser,
        token: result.token,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      logger.error("Refresh token error:", error);
      throw new Error("Failed to refresh token");
    }
  };

  public logout = async (
    refreshToken: string,
    accessToken?: string
  ): Promise<void> => {
    if (!refreshToken) throw new Error("No refresh token provided");
    try {
      await prisma.$transaction(async (tx) => {
        await tx.token.deleteMany({ where: { token: refreshToken } });
        if (accessToken) {
          await tx.blacklist.create({
            data: {
              token: accessToken,
              createdAt: new Date(),
            },
          });
        }
      });
      logger.info("User logged out, refresh token revoked");
    } catch (error) {
      logger.error("Logout error:", error);
      throw new Error("Failed to log out");
    }
  };

  private getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is not set");
    }
    return secret || "secret";
  };

  /**
   * Gets REFRESH_SECRET, throwing an error if not set in production.
   */
  private getRefreshSecret = (): string => {
    const secret = process.env.REFRESH_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("REFRESH_SECRET is not set");
    }
    return secret || "refresh_secret";
  };

  /**
   * Cleans up expired tokens and blacklist entries.
   */
  public cleanupExpiredTokens = async (): Promise<void> => {
    try {
      await prisma.$transaction([
        prisma.token.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        }),
        prisma.blacklist.deleteMany({
          where: {
            createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          }, // Delete after 30 days
        }),
      ]);
      logger.info("Expired tokens and blacklist entries cleaned up");
    } catch (error) {
      logger.error("Cleanup error:", error);
    }
  };

  public getUsers = async (): Promise<SafeUser[]> => {
    const users = await prisma.user.findMany();
    const safeUsers = users.map(({ password, ...safeUser }) => safeUser);
    return safeUsers;
  };
}
