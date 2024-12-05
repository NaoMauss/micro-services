import { env } from "node:process";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { CreateScheduleCommand, FlexibleTimeWindowMode, SchedulerClient } from "@aws-sdk/client-scheduler";
import { lendings } from "../db/schema";
import { db } from "../db";

const JWT_SECRET = env.JWT_SECRET || "your_jwt_secret";
const SCHEDULE_DELAY = 24 * 60 * 60 * 1000; // 1 day in milliseconds

const lendBookSchema = z.object({
  book_id: z.number(),
});

const {
  targetLambdaArn,
  schedulerExecutionRoleArn,
} = env;

export const handler = async (event: any) => {
  const token = event.headers.Cookie?.split("token=")[1];
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Not authenticated" }),
    };
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId;
  }
  catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid token" }),
    };
  }

  const parsedBody = lendBookSchema.safeParse(JSON.parse(event.body));
  if (!parsedBody.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: parsedBody.error.errors }),
    };
  }

  const { book_id } = parsedBody.data;

  try {
    const [ lending ] = await db.insert(lendings)
      .values({
        userId,
        bookId: book_id,
        lendingDate: new Date(),
        endLendingDate: new Date(Date.now() + SCHEDULE_DELAY),
      })
      .returning();

    const schedulerClient = new SchedulerClient({ region: "us-east-1" });

    const scheduleCommand = new CreateScheduleCommand({
      Name: `sendMail-${lending.id}`,
      ScheduleExpression: `rate(1 day)`,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        Arn: targetLambdaArn,
        RoleArn: schedulerExecutionRoleArn,
        Input: JSON.stringify({ userId, book_id }),
      },
    });
    await schedulerClient.send(scheduleCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Book lent successfully" }),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
