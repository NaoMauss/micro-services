import { PrismaClient } from "@prisma/client";
import { getUserSchema } from "./schema/zod";

const prisma = new PrismaClient();

export const handler = async (event: any) => {
  const parsedBody = getUserSchema.safeParse(JSON.parse(event.body));

  if (!parsedBody.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: parsedBody.error.errors }),
    };
  }

  const { id } = parsedBody.data;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number.parseInt(id),
      },
    });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
