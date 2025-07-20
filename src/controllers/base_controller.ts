import { Request, Response } from "express";
import logger from "../utils/v1/logger";
import {
  AuthError,
  BaseError,
  DuplicateError,
  NotAuthenticatedError,
  NotAuthorizedError,
  NotFoundError,
  ValidationError,
} from "../utils/v1/error";

class BaseController {
  protected handleError(
    res: Response,
    error: any,
    statusCode: number = 500
  ): void {
    logger.error(error instanceof Error ? error.stack || error.message : error);
    let message = "Internal server error";
    let errorDetails: any;

    if (error) {
      statusCode = 400;
      message = "Validation error";
      errorDetails =
        process.env.NODE_ENV === "development" ? error.errors : undefined;
    } else if (error instanceof ValidationError) {
      statusCode = 400;
      message = error.message;
      errorDetails =
        process.env.NODE_ENV === "development"
          ? { name: error.name, stack: error.stack }
          : undefined;
    } else if (error instanceof DuplicateError) {
      statusCode = 409; // Conflict
      message = error.message;
      errorDetails =
        process.env.NODE_ENV === "development"
          ? { name: error.name, stack: error.stack }
          : undefined;
    } else if (error instanceof NotFoundError) {
      statusCode = 404;
      message = error.message;
      errorDetails =
        process.env.NODE_ENV === "development"
          ? { name: error.name, stack: error.stack }
          : undefined;
    } else if (error instanceof NotAuthenticatedError) {
      statusCode = 401;
      message = error.message;
      errorDetails =
        process.env.NODE_ENV === "development"
          ? { name: error.name, stack: error.stack }
          : undefined;
    } else if (error instanceof NotAuthorizedError) {
      statusCode = 403;
      message = error.message;
      errorDetails =
        process.env.NODE_ENV === "development"
          ? { name: error.name, stack: error.stack }
          : undefined;
    } else if (error instanceof AuthError) {
      statusCode = 400; // General auth errors default to 400
      message = error.message;
      errorDetails =
        process.env.NODE_ENV === "development"
          ? { name: error.name, stack: error.stack }
          : undefined;
    } else if (error instanceof BaseError) {
      statusCode = statusCode || 500; // Use provided statusCode or default
      message = error.message;
      errorDetails =
        process.env.NODE_ENV === "development"
          ? { name: error.name, stack: error.stack }
          : undefined;
    } else if (error instanceof Error) {
      message = error.message;
      errorDetails =
        process.env.NODE_ENV === "development"
          ? { name: error.name, stack: error.stack }
          : undefined;
    } else if (typeof error === "string") {
      message = error;
    }

    logger.error({
      message,
      error: errorDetails || error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Send response
    res.status(statusCode).json({
      success: false,
      message,
      error: errorDetails,
    });
  }

  //  common success handler
  protected handleSuccess(
    res: Response,
    data: any,
    statusCode: number = 200,
    message: string = "Success"
  ): void {
    logger.info({
      message,
      data,
    });
    res.status(statusCode).json({
      success: true,
      message,
      result: data,
    });
  }
}

export default BaseController;
