import { env } from "node:process";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const sesClient = new SESClient({ region: "us-east-1" });

export const handler = async (event: any) => {
  const { userId, book_id } = JSON.parse(event.body);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const book = await prisma.book.findUnique({
      where: { id: book_id },
    });

    if (!book) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Book not found" }),
      };
    }

    const params = {
      Destination: {
        ToAddresses: [ user.email ],
      },
      Message: {
        Body: {
          Text: {
            Data: `Dear ${user.email},\n\nThis is a reminder to return the book "${book.title}" by ${book.author_name}.\n\nThank you!`,
          },
        },
        Subject: {
          Data: "Reminder to return the book",
        },
      },
      Source: env.SES_EMAIL_SOURCE,
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Reminder email sent successfully" }),
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
