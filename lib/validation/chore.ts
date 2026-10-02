import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

export const choreInputSchema = z
  .object({
    title: z.string().min(1),
    emoji: z.string().optional(),
    assigneeId: z.string().min(1),
    stars: z.number().int().min(0),
    timeOfDay: z.enum(["morning", "afternoon", "evening", "anytime"]),
    dueTime: z.string().optional(),
    repeatMode: z.enum(["none", "schedule", "after_completion"]),
    startDate: dateString,
    frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
    interval: z.number().int().min(1).optional(),
    daysOfWeek: z.array(z.enum(["SU", "MO", "TU", "WE", "TH", "FR", "SA"])).optional(),
    endDate: dateString.optional(),
    delayDays: z.number().int().min(0).optional(),
    archived: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.repeatMode === "schedule") {
      if (!data.frequency) {
        ctx.addIssue({ code: "custom", message: "Frequency is required for a repeating schedule.", path: ["frequency"] });
      }
      if (data.interval === undefined || data.interval < 1) {
        ctx.addIssue({ code: "custom", message: "Interval must be at least 1.", path: ["interval"] });
      }
      if (data.endDate && data.endDate < data.startDate) {
        ctx.addIssue({ code: "custom", message: "EndDate must be on or after StartDate.", path: ["endDate"] });
      }
    }
    if (data.repeatMode === "after_completion" && data.delayDays === undefined) {
      ctx.addIssue({ code: "custom", message: "DelayDays is required for repeat-after-completion.", path: ["delayDays"] });
    }
  });

export type ChoreInput = z.infer<typeof choreInputSchema>;

export const chorePatchSchema = z.object({
  title: z.string().min(1).optional(),
  emoji: z.string().optional(),
  assigneeId: z.string().min(1).optional(),
  stars: z.number().int().min(0).optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "anytime"]).optional(),
  dueTime: z.string().optional(),
  repeatMode: z.enum(["none", "schedule", "after_completion"]).optional(),
  startDate: dateString.optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  interval: z.number().int().min(1).optional(),
  daysOfWeek: z.array(z.enum(["SU", "MO", "TU", "WE", "TH", "FR", "SA"])).optional(),
  endDate: dateString.optional(),
  delayDays: z.number().int().min(0).optional(),
  nextDueDate: dateString.optional(),
  archived: z.boolean().optional(),
});
