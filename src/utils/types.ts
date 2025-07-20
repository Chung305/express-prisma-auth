import { User } from "@prisma/client";

export interface SafeUser extends Omit<User, "password"> {}
