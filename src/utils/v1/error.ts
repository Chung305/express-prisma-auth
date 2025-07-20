export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BaseError";
  }
}

export class AuthError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
export class DuplicateError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateError";
  }
}
export class NotAuthenticatedError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "NotAuthenticatedError";
  }
}
export class NotAuthorizedError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "NotAuthorizedError";
  }
}
