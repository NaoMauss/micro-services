import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const handler = async () => {
  try {
    const books = await prisma.book.findMany();
    return {
      statusCode: 200,
      body: JSON.stringify(books),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
