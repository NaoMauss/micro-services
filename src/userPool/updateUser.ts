import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "../db";
import { users } from "../db/schema";
import { updateUserSchema } from "./schema/zod";

export const handler = async (event: any) => {
  const parsedBody = updateUserSchema.safeParse(JSON.parse(event.body));

  if (!parsedBody.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: parsedBody.error.errors }),
    };
  }

  const { id, email, password } = parsedBody.data;
  const updateData: any = {};

  if (email)
    updateData.email = email;
  if (password)
    updateData.password = await bcrypt.hash(password, 10);

  try {
    const [ updatedUser ] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, Number.parseInt(id)))
      .returning();

    if (!updatedUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(updatedUser),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
