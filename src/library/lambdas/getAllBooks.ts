import { db } from "../../db";
import { books } from "../../db/schema";

export const handler = async () => {
  try {
    const allBooks = await db.select().from(books);
    return {
      statusCode: 200,
      body: JSON.stringify(allBooks),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
