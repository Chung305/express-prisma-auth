import { promises as fs } from "fs";
import path from "path";
import { Express, Router } from "express";
import logger from "./utils/v1/logger";

async function loadRoutes(
  app: Express,
  routesDir: string = "./routes"
): Promise<void> {
  try {
    const routesPath = path.resolve(routesDir);
    logger.info(`Attempting to load routes from: ${routesPath}`);
    try {
      await fs.access(routesPath);
    } catch {
      logger.warn(`Routes directory does not exist: ${routesPath}`);
      return;
    }

    // Read all subdirectories (e.g., v1, v2)
    const versionDirs = await fs.readdir(routesPath);
    logger.info(`Found version directories: ${versionDirs.join(", ")}`);

    for (const versionDir of versionDirs) {
      const versionPath = path.join(routesPath, versionDir);
      const stat = await fs.stat(versionPath);

      if (stat.isDirectory()) {
        const versionRouter: Router = Router();
        const versionPrefix = `/api/${versionDir}`;

        // Read files in version directory
        const files = await fs.readdir(versionPath);
        logger.info(`Found files in ${versionDir}: ${files.join(", ")}`);

        for (const file of files) {
          if (file.endsWith(".ts") || file.endsWith(".js")) {
            const routePath = path.join(versionPath, file);
            logger.info(`Loading route file: ${routePath}`);

            const routeModule = await import(routePath);
            const route: Router = routeModule.default;
            versionRouter.use(route);
            logger.info(`Loaded routes from: ${file} under ${versionPrefix}`);
          }
        }

        if (files.length === 0) {
          logger.warn(`No files found in ${versionDir} directory`);
        }

        // Mount version router (e.g., /api/v1)
        app.use(versionPrefix, versionRouter);
        logger.info(`Mounted all routes under ${versionPrefix}`);
      }
    }

    if (versionDirs.length === 0) {
      logger.warn("No version directories found in routes directory");
    }
  } catch (error) {
    logger.error("Error loading routes:", error);
    throw error instanceof Error ? error : new Error("Failed to load routes");
  }
}

export default loadRoutes;
