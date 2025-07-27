import { Router, Request, Response } from "express";
import { AuthController } from "../../controllers/auth_controller";
import { authenticate, authorize } from "../../middleware/auth";
import { Role } from "@prisma/client";
import { loginLimiter, refreshLimiter } from "../../utils/limiter_config";

const router: Router = Router();
const controller = new AuthController();

router.get(
  "/auth/refresh-token",
  refreshLimiter,
  (req: Request, res: Response) => {
    controller.refreshToken(req, res);
  }
);

router.post("/auth/register", loginLimiter, (req: Request, res: Response) => {
  controller.register(req, res);
});

router.post("/auth/login", loginLimiter, (req: Request, res: Response) => {
  controller.login(req, res);
});

router.post("/auth/logout", (req: Request, res: Response) => {
  controller.logout(req, res);
});

// Protected route example
router.get(
  "/users",
  authenticate,
  authorize([Role.USER]),
  (req: Request, res: Response) => {
    controller.getUsers(req, res);
  }
);

export default router;
