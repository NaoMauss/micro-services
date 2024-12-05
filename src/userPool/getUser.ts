import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { getUserSchema } from "./schema/zod";

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
    const [ user ] = await db.select()
      .from(users)
      .where(eq(users.id, Number.parseInt(id)))
      .limit(1);

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
