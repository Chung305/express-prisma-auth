# Express/Prisma Authentication

> A robust and secure authentication API built with **Express**, **Prisma**, and **TypeScript**, featuring JWT-based authentication, role-based access control (RBAC), and custom error handling. This project serves as a solid foundation for building scalable web applications (e.g., blogs, e-commerce, SaaS) by providing user registration, login, token refresh, and protected routes.

## Features

- **Authentication:** User registration, login, and logout with JWT access and refresh tokens.
- **Role-Based Access Control (RBAC):** Supports `USER`, `ADMIN`, and `MODERATOR` roles with middleware for protected routes (e.g., `/admin`).
- **Secure Passwords:** Passwords hashed with Argon2.
- **Input Validation:** Uses Zod for schema validation on all inputs.
- **Custom Error Handling:** Structured errors (`AuthError`, `NotFoundError`, `ValidationError`, etc.) with appropriate HTTP status codes (`400`, `401`, `403`, `404`, `409`).
- **Prisma ORM:** Manages database operations with a PostgreSQL backend.
- **Docker Support:** Containerized setup with Docker Compose for easy deployment.
- **Logging:** Winston-based logging for debugging and monitoring.

## Prerequisites

- **Node.js:** v18 or higher
- **pnpm:** Package manager (or npm)
- **PostgreSQL:** Database
- **Docker:** For containerized deployment
- **Yaak/Postman:** For manual API testing

Made with ❤️ by ocb
