import { Router, Request, Response } from "express";
import { AuthController } from "../../controllers/auth_controller";
import { authenticate, authorize } from "../../middleware/auth";
import { Role } from "@prisma/client";
import { loginLimiter, refreshLimiter } from "../../utils/limiter_config";

const router: Router = Router();
const controller = new AuthController();

router.get("/refresh-token", refreshLimiter, (req: Request, res: Response) => {
  controller.refreshToken(req, res);
});

router.post("/register", loginLimiter, (req: Request, res: Response) => {
  controller.register(req, res);
});

router.post("/login", loginLimiter, (req: Request, res: Response) => {
  controller.login(req, res);
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
