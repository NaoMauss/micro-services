import { PrismaClient } from "@prisma/client";
import { DeleteScheduleCommand, SchedulerClient } from "@aws-sdk/client-scheduler";
import { z } from "zod";

const prisma = new PrismaClient();
const schedulerClient = new SchedulerClient({ region: "us-east-1" });

const giveBackBookSchema = z.object({
  lending_id: z.number(),
});

export const handler = async (event: any) => {
  const parsedBody = giveBackBookSchema.safeParse(JSON.parse(event.body));

  if (!parsedBody.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: parsedBody.error.errors }),
    };
  }

  const { lending_id } = parsedBody.data;

  try {
    const lending = await prisma.lending.findUnique({
      where: { id: lending_id },
    });

    if (!lending) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Lending not found" }),
      };
    }

    // Delete the Scheduler schedule if it exists
    const scheduleName = `sendMail-${lending_id}`;
    try {
      await schedulerClient.send(new DeleteScheduleCommand({
        Name: scheduleName,
      }));
    }
    catch (error) {
      console.error(`Failed to delete Scheduler schedule: ${error.message}`);
    }

    // Delete the lending record from the database
    await prisma.lending.delete({
      where: { id: lending_id },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Book returned successfully" }),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
