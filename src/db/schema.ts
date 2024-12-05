import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: text("password").notNull(),
});

export const books = pgTable("book", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authorName: text("author_name").notNull(),
  releaseDate: timestamp("release_date").notNull(),
});

export const lendings = pgTable("lending", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  lendingDate: timestamp("lending_date").notNull(),
  endLendingDate: timestamp("end_lending_date").notNull(),
}, table => ({
  uniqueLending: uniqueIndex("unique_lending_idx").on(
    table.userId,
    table.bookId,
    table.lendingDate,
  ),
}));

export const usersRelations = relations(users, ({ many }) => ({
  lendings: many(lendings),
}));

export const booksRelations = relations(books, ({ many }) => ({
  lendings: many(lendings),
}));

export const lendingsRelations = relations(lendings, ({ one }) => ({
  user: one(users, {
    fields: [ lendings.userId ],
    references: [ users.id ],
  }),
  book: one(books, {
    fields: [ lendings.bookId ],
    references: [ books.id ],
  }),
}));
