import { z } from "zod";

export const addUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const deleteUserSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});

export const updateUserSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const getUserSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});
