declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      username: string;
      role: string;
    };
  }
}
