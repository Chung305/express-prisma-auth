import { rateLimit } from "express-rate-limit";

/**
 * Rate limit configuration for login and register routes
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // Limit to 6 login attempts per IP
  message: "Too many login attempts, please try again later.",
});

/**
 *  Rate limit configuration for refresh token route
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  message: "Too many refresh attempts, please try again later.",
});
