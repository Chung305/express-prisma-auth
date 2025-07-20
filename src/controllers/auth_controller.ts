import { Request, Response } from "express";
import { AuthService } from "../services/auth_service";
import {
  loginSchema,
  refreshTokenSchema,
  RegisterParams,
  registerSchema,
} from "../schemas/auth_schema";
import BaseController from "./base_controller";
import logger from "../utils/v1/logger";

export class AuthController extends BaseController {
  private authService: AuthService;

  constructor() {
    super();
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedInput = registerSchema.safeParse(req.body);
      if (!parsedInput.success) {
        this.handleError(res, parsedInput.error, 400);
        return;
      }
      const input: RegisterParams = parsedInput.data;
      const result = await this.authService.register(input);
      this.handleSuccess(res, result, 201, "User registered successfully");
    } catch (error) {
      this.handleError(res, error);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedInput = loginSchema.safeParse(req.body);
      if (!parsedInput.success) {
        this.handleError(res, parsedInput.error, 400);
        return;
      }
      const { credential, password } = parsedInput.data;
      const result = await this.authService.login(credential, password);
      this.handleSuccess(res, result, 200, "Login successful");
      logger.info({
        result,
        message: "User logged in successfully",
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedInput = refreshTokenSchema.safeParse(req.body);
      logger.info({
        message: "Refreshing token",
      });
      if (!parsedInput.success) {
        this.handleError(res, parsedInput.error, 400);
        return;
      }
      const { refreshToken } = parsedInput.data;
      const result = await this.authService.refreshToken(refreshToken);
      this.handleSuccess(res, result, 200, "Token refreshed successfully");
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.authService.getUsers();
      this.handleSuccess(res, users, 200, "Users retrieved successfully");
    } catch (error) {
      this.handleError(res, error, 500);
    }
  };
}
