import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../clients/prisma";
import logger from "../utils/v1/logger";
import { Role } from "@prisma/client";

interface JwtPayload {
  userId: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, role: true },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.some((role) => req?.user?.role.includes(role))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};
