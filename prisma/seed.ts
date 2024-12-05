import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create users
  const users = [
    {
      email: "john.doe@example.com",
      password: await bcrypt.hash("password123", 10),
    },
    {
      email: "jane.smith@example.com",
      password: await bcrypt.hash("password456", 10),
    },
    {
      email: "bob.wilson@example.com",
      password: await bcrypt.hash("password789", 10),
    },
  ];

  // Create books
  const books = [
    {
      title: "The Great Gatsby",
      author_name: "F. Scott Fitzgerald",
      release_date: new Date("1925-04-10"),
    },
    {
      title: "1984",
      author_name: "George Orwell",
      release_date: new Date("1949-06-08"),
    },
    {
      title: "To Kill a Mockingbird",
      author_name: "Harper Lee",
      release_date: new Date("1960-07-11"),
    },
    {
      title: "The Hobbit",
      author_name: "J.R.R. Tolkien",
      release_date: new Date("1937-09-21"),
    },
    {
      title: "Pride and Prejudice",
      author_name: "Jane Austen",
      release_date: new Date("1813-01-28"),
    },
  ];

  // Insert users
  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }

  // Insert books
  for (const book of books) {
    await prisma.book.create({
      data: book,
    });
  }

  // eslint-disable-next-line no-console
  console.log("Database has been seeded with test data");
}

main()
  .catch((e) => {
    console.error(e);
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
