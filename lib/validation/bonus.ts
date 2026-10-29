import { z } from "zod";

/** A deliberate cap: a bonus is a nudge, not a way to hand over a whole reward in one tap. */
const MAX_STARS = 50;

export const bonusInputSchema = z.object({
  profileId: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  stars: z
    .number()
    .int()
    .min(-MAX_STARS)
    .max(MAX_STARS)
    .refine((n) => n !== 0, { message: "must not be zero" }),
});

export type BonusInput = z.infer<typeof bonusInputSchema>;
