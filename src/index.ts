import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import Http from "http";
import helmet from "helmet";
import logger from "./utils/v1/logger";
import loadRoutes from "./routeLoader";
import path from "path";
import "dotenv/config";

const app: Express = express();
const server = Http.createServer(app);

// Adjust server timeout settings
server.keepAliveTimeout = 61 * 1000;
server.headersTimeout = 65 * 1000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000", // Adjust as needed for production
    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// root route for debugging
app.get("/", (req: Request, res: Response) => {
  logger.info("Hit root route");
  res.status(200).json({ message: "Server is running" });
});

// Load routes
async function startServer(): Promise<void> {
  try {
    logger.info("Starting server...");
    await loadRoutes(app, path.join(__dirname, "routes"));
    const PORT: number =
      process.env.NODE_ENV === "production"
        ? parseInt(process.env.PORT || "3333", 10)
        : 3333;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
