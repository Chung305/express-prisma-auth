import { updateUserSchema } from "../schemas/user_schema";
import { UserService } from "../services/user_service";
import { NotAuthenticatedError, NotFoundError } from "../utils/v1/error";
import BaseController from "./base_controller";
import { Request, Response } from "express";

export class UserController extends BaseController {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  getUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        this.handleError(
          res,
          new NotAuthenticatedError("User not authenticated"),
          401
        );
        return;
      }
      const user = await this.userService.getUser(req.user.id);
      if (!user) {
        this.handleError(res, new NotFoundError("User not found"), 404);
        return;
      }
      this.handleSuccess(res, user, 200, "User retrieved successfully");
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        this.handleError(
          res,
          new NotAuthenticatedError("User not authenticated"),
          401
        );
        return;
      }
      const parsedInput = updateUserSchema.parse(req.body);
      if (!parsedInput) {
        this.handleError(res, new Error("Invalid input"), 400);
        return;
      }
      const updatedUser = await this.userService.updateUser({
        ...parsedInput,
        id: req.user.id,
      });
      if (!updatedUser) {
        this.handleError(res, new NotFoundError("User not found"), 404);
        return;
      }
      this.handleSuccess(res, updatedUser, 200, "User updated successfully");
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * MessageInTheWeb services
   */
  createMessageInTheWeb = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        this.handleError(
          res,
          new NotAuthenticatedError("User not authenticated"),
          401
        );
        return;
      }
      const userId = req.user.id;
      const { message } = req.body;
      const result = await this.userService.createMessageInTheWeb(
        userId,
        message
      );
      if (!result) {
        this.handleError(res, new Error("Failed to create message"), 500);
        return;
      }
      this.handleSuccess(res, result, 200, "Successful request");
    } catch (error) {
      this.handleError(res, error);
    }
  };
}
