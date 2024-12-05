// src/library/lambdas/addBook.ts
import { db } from "../../db";
import { books } from "../../db/schema";
import { addBookSchema } from "../schema/zod";

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
    const [ newBook ] = await db.insert(books).values({
      title,
      authorName: author_name,
      releaseDate: new Date(release_date),
    }).returning();

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
