import { PrismaClient } from "@prisma/client";
import { deleteBookSchema } from "../schema/zod";

const prisma = new PrismaClient();

export const handler = async (event: any) => {
  const parsedParams = deleteBookSchema.safeParse(event.pathParameters);

  if (!parsedParams.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: parsedParams.error.errors }),
    };
  }

  const { id } = parsedParams.data;

  try {
    await prisma.book.delete({
      where: { id: Number.parseInt(id) },
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Book deleted successfully" }),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
