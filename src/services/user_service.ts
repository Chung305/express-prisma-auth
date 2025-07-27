import { MessageInTheWeb, PrismaClient, User } from "@prisma/client";
import { SafeUser } from "../utils/types";
import { UpdateUserParams } from "../schemas/user_schema";
import { NotFoundError } from "../utils/v1/error";

const prisma = new PrismaClient();

export class UserService {
  constructor() {
    // Initialize any dependencies if needed
  }

  public getUser = async (userId: string): Promise<SafeUser | null> => {
    const findUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        settings: true,
      },
    });
    if (!findUser) {
      return null;
    }
    const safeUser = { ...findUser, password: undefined };
    return safeUser as SafeUser;
  };

  public updateUser = async (
    body: UpdateUserParams
  ): Promise<SafeUser | null> => {
    const updatedUser = await prisma.user.update({
      where: { id: body.id },
      data: {
        ...body,
      },
      include: {
        profile: true,
      },
    });
    if (!updatedUser) {
      return null;
    }
    const safeUser = { ...updatedUser, password: undefined };
    return safeUser as SafeUser;
  };

  /**
   * MessageInTheWeb services
   */

  public getRandomMessageInTheWeb = async (
    userId: string
  ): Promise<MessageInTheWeb | null> => {
    // Pick a random unclaimed message NOT authored by the user
    const count = await prisma.messageInTheWeb.count({
      where: { authorId: { not: userId }, claimed: false },
    });
    if (count === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * count);
    const messages = await prisma.messageInTheWeb.findMany({
      where: { authorId: { not: userId }, claimed: false },
      skip: randomIndex,
      take: 1,
    });
    return messages[0] || null;
  };

  public claimMessageInTheWeb = async (
    messageInTheWebId: string,
    userId: string
  ): Promise<MessageInTheWeb | { message: string } | null> => {
    const messageInWeb = await prisma.messageInTheWeb.update({
      where: { id: messageInTheWebId },
      data: { claimerId: userId, claimed: true },
    });
    if (!messageInWeb) {
      return { message: "Failed to claim message" };
    }
    return messageInWeb;
  };

  public createMessageInTheWeb = async (
    userId: string,
    message: string
  ): Promise<MessageInTheWeb | { message: string } | null> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return null;
    }
    if (user.messageInTheWebAt) {
      const lastSent = new Date(user.messageInTheWebAt).getTime();
      const now = Date.now();
      const hoursDiff = (now - lastSent) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        return {
          message: "You can only send one message in the web every 24 hours.",
        };
      }
    }
    const newMessage = await prisma.messageInTheWeb.create({
      data: {
        authorId: user.id,
        message,
      },
    });
    if (newMessage) {
      await prisma.user.update({
        where: { id: user.id },
        data: { messageInTheWebAt: new Date() },
      });
    }
    return newMessage;
  };
}
