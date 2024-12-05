import bcrypt from "bcrypt";
import { db } from "../db";
import { users } from "../db/schema";
import { addUserSchema } from "./schema/zod";

export const handler = async (event: any) => {
  const parsedBody = addUserSchema.safeParse(JSON.parse(event.body));

  if (!parsedBody.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: parsedBody.error.errors }),
    };
  }

  const { email, password } = parsedBody.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [ newUser ] = await db.insert(users)
      .values({
        email,
        password: hashedPassword,
      })
      .returning();

    return {
      statusCode: 200,
      body: JSON.stringify(newUser),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
