import { z } from "zod";

export const profileInputSchema = z.object({
  name: z.string().min(1),
  role: z.enum(["parent", "child"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  emoji: z.string().min(1),
  sortOrder: z.number().int(),
  active: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export const profilePatchSchema = profileInputSchema.partial();
