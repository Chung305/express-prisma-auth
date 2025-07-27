import { z } from "zod";

export const updateUserSchema = z.object({
  id: z.string().min(1, { message: "User ID is required" }),
  email: z.email().optional(),
  username: z.string().min(2).max(100).optional(),
});

export type UpdateUserParams = z.infer<typeof updateUserSchema>;
