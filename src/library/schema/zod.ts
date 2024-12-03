import { z } from "zod";

export const addBookSchema = z.object({
  title: z.string(),
  author_name: z.string(),
  release_date: z.string().refine(date => !Number.isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});

export const deleteBookSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});
