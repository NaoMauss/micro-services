/* eslint-disable no-console */
// src/db/seed.ts
import { exit } from "node:process";
import bcrypt from "bcrypt";
import { books, users } from "./schema";
import { db } from "./index";

const BOOKS = [
  // Fantasy
  { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", date: "1997-06-26" },
  { title: "A Game of Thrones", author: "George R.R. Martin", date: "1996-08-01" },
  { title: "American Gods", author: "Neil Gaiman", date: "2001-06-19" },
  { title: "The Color of Magic", author: "Terry Pratchett", date: "1983-11-24" },

  // Horror/Thriller
  { title: "The Shining", author: "Stephen King", date: "1977-01-28" },
  { title: "Murder on the Orient Express", author: "Agatha Christie", date: "1934-01-01" },
  { title: "It", author: "Stephen King", date: "1986-09-15" },

  // Literary Fiction
  { title: "The Handmaid's Tale", author: "Margaret Atwood", date: "1985-06-14" },
  { title: "Norwegian Wood", author: "Haruki Murakami", date: "1987-08-04" },
  { title: "The Alchemist", author: "Paulo Coelho", date: "1988-01-01" },
  { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", date: "1967-05-30" },

  // More Recent Books
  { title: "The Silent Patient", author: "Alex Michaelides", date: "2019-02-05" },
  { title: "Project Hail Mary", author: "Andy Weir", date: "2021-05-04" },
  { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", date: "2022-07-05" },
];

const USERS = [
  { email: "admin@library.com", password: "admin123", role: "ADMIN" },
  { email: "librarian@library.com", password: "lib123", role: "LIBRARIAN" },
  { email: "john.doe@example.com", password: "user123", role: "USER" },
  { email: "jane.smith@example.com", password: "user456", role: "USER" },
  { email: "reader@example.com", password: "read789", role: "USER" },
];

async function main() {
  // Clear existing data
  await db.delete(books);
  await db.delete(users);

  // Insert users
  const hashedUsers = await Promise.all(
    USERS.map(async user => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    })),
  );

  await db.insert(users).values(hashedUsers);
  console.log(`✓ Created ${USERS.length} users`);

  // Insert books
  const booksToInsert = BOOKS.map(book => ({
    title: book.title,
    authorName: book.author,
    releaseDate: new Date(book.date),
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(books).values(booksToInsert);
  console.log(`✓ Created ${BOOKS.length} books`);

  console.log("✓ Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    exit(1);
  })
  .finally(() => {
    exit(0);
  });
