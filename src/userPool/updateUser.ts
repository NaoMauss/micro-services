import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { updateUserSchema } from "./schema/zod";

const prisma = new PrismaClient();

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
    const updatedUser = await prisma.user.update({
      where: { id: Number.parseInt(id) },
      data: updateData,
    });
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
