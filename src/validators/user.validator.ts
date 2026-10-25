import { z } from "zod";

export const updateProfileSchema = z.strictObject({
  name: z.string().trim().min(2).max(100).optional(),
  profilePic: z.url().max(2_000).optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

export const searchUsersSchema = z.strictObject({
  keyword: z.string().trim().max(100).default(""),
});