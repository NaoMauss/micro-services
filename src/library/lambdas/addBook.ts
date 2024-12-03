import { PrismaClient } from "@prisma/client";
import { addBookSchema } from "../schema/zod";

const prisma = new PrismaClient();

export const handler = async (event: any) => {
  const parsedBody = addBookSchema.safeParse(JSON.parse(event.body));

  if (!parsedBody.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: parsedBody.error.errors }),
    };
  }

  const { title, author_name, release_date } = parsedBody.data;

  try {
    const newBook = await prisma.book.create({
      data: {
        title,
        author_name,
        release_date: new Date(release_date),
      },
    });
    return {
      statusCode: 200,
      body: JSON.stringify(newBook),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
