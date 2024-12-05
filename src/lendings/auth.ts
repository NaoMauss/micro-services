import { env } from "node:process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const prisma = new PrismaClient();
const JWT_SECRET = env.JWT_SECRET || "your_jwt_secret";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const handler = async (event: any) => {
  const parsedBody = authSchema.safeParse(JSON.parse(event.body));

  if (!parsedBody.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: parsedBody.error.errors }),
    };
  }

  const { email, password } = parsedBody.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid email or password" }),
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid email or password" }),
      };
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=3600`,
      },
      body: JSON.stringify({ message: "Authentication successful" }),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
