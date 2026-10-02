import { z } from "zod";

export const rewardInputSchema = z.object({
  name: z.string().min(1),
  emoji: z.string().optional(),
  cost: z.number().int().min(1),
  profileId: z.string().optional(),
  archived: z.boolean().optional().default(false),
});

export type RewardInput = z.infer<typeof rewardInputSchema>;

export const rewardPatchSchema = rewardInputSchema.partial();
