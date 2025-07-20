import { PrismaClient } from "@prisma/client";
import logger from "../utils/v1/logger";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Log the DATABASE_URL to debug
logger.info(`Prisma connecting with DATABASE_URL: ${process.env.DATABASE_URL}`);

// Connect without crashing the app
async function connectPrisma() {
  try {
    await prisma.$connect();
    logger.info("Successfully connected to database");
  } catch (error) {
    logger.error("Failed to connect to database:", error);
    // Don't throw; let the app continue running
  }
}

connectPrisma();

export default prisma;
