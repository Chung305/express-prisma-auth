import { Router, Request, Response } from "express";
import { UserController } from "../../controllers/user_controller";
import { authenticate, authorize } from "../../middleware/auth";
import { Role } from "@prisma/client";

const router: Router = Router();
const controller = new UserController();

//GET start
router.get(
  "/user",
  authenticate,
  authorize([Role.USER]),
  (req: Request, res: Response) => {
    controller.getUser(req, res);
  }
);

//POST start
router.post(
  "/user/message-in-web",
  authenticate,
  authorize([Role.USER]),
  (req: Request, res: Response) => {
    controller.createMessageInTheWeb(req, res);
  }
);
//PUT start
router.put(
  "/user",
  authenticate,
  authorize([Role.USER]),
  (req: Request, res: Response) => {
    controller.updateUser(req, res);
  }
);

export default router;
