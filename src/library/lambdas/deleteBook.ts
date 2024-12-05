import { eq } from "drizzle-orm";
import { db } from "../../db";
import { books } from "../../db/schema";
import { deleteBookSchema } from "../schema/zod";

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
    const [ deletedBook ] = await db
      .delete(books)
      .where(eq(books.id, Number.parseInt(id)))
      .returning();

    if (!deletedBook) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Book not found" }),
      };
    }

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
