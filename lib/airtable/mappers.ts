import type {
  Bonus,
  Chore,
  Completion,
  DayOfWeek,
  Frequency,
  Profile,
  Redemption,
  RepeatMode,
  Reward,
  Role,
  TimeOfDay,
} from "../domain/types";
import { normalizeProfileColor } from "../design/profileColor";
import type { AirtableRecord } from "./types";

export interface ProfileFields {
  Name: string;
  Role: Role;
  Color: string;
  Emoji: string;
  SortOrder: number;
  Active: boolean;
}

export interface ChoreFields {
  Title: string;
  Emoji?: string;
  Assignee: string[];
  Stars: number;
  TimeOfDay: TimeOfDay;
  DueTime?: string;
  RepeatMode: RepeatMode;
  StartDate: string;
  Frequency?: Frequency;
  Interval?: number;
  DaysOfWeek?: DayOfWeek[];
  EndDate?: string;
  DelayDays?: number;
  NextDueDate?: string;
  CarryOver?: boolean;
  Archived: boolean;
}

export interface CompletionFields {
  Key: string;
  Chore: string[];
  Profile: string[];
  OccurrenceDate: string;
  CompletedDate: string;
  StarsAwarded: number;
  Dismissed?: boolean;
}

export interface RewardFields {
  Name: string;
  Emoji?: string;
  Cost: number;
  Profile?: string[];
  Archived: boolean;
}

export interface BonusFields {
  Label: string;
  Profile: string[];
  Stars: number;
  AwardedDate: string;
}

export interface RedemptionFields {
  Label: string;
  Reward: string[];
  Profile: string[];
  Cost: number;
  RedeemedDate: string;
}

const linkId = (links: string[] | undefined): string | undefined => links?.[0];
const linkField = (id: string | undefined): string[] | undefined => (id ? [id] : undefined);

export function profileToDomain(record: AirtableRecord<ProfileFields>): Profile {
  return {
    id: record.id,
    name: record.fields.Name || "Unnamed",
    role: record.fields.Role ?? "child",
    color: normalizeProfileColor(record.fields.Color),
    emoji: record.fields.Emoji || "🙂",
    sortOrder: record.fields.SortOrder ?? 0,
    active: record.fields.Active ?? false,
  };
}

export function profileToFields(profile: Partial<Profile>): Partial<ProfileFields> {
  const fields: Partial<ProfileFields> = {};
  if (profile.name !== undefined) fields.Name = profile.name;
  if (profile.role !== undefined) fields.Role = profile.role;
  if (profile.color !== undefined) fields.Color = profile.color;
  if (profile.emoji !== undefined) fields.Emoji = profile.emoji;
  if (profile.sortOrder !== undefined) fields.SortOrder = profile.sortOrder;
  if (profile.active !== undefined) fields.Active = profile.active;
  return fields;
}

export function choreToDomain(record: AirtableRecord<ChoreFields>): Chore {
  return {
    id: record.id,
    title: record.fields.Title,
    emoji: record.fields.Emoji,
    assigneeId: linkId(record.fields.Assignee) ?? "",
    stars: record.fields.Stars ?? 0,
    timeOfDay: record.fields.TimeOfDay ?? "anytime",
    dueTime: record.fields.DueTime,
    repeatMode: record.fields.RepeatMode,
    startDate: record.fields.StartDate,
    frequency: record.fields.Frequency,
    interval: record.fields.Interval,
    daysOfWeek: record.fields.DaysOfWeek,
    endDate: record.fields.EndDate,
    delayDays: record.fields.DelayDays,
    nextDueDate: record.fields.NextDueDate,
    carryOver: record.fields.CarryOver ?? false,
    archived: record.fields.Archived ?? false,
  };
}

export function choreToFields(chore: Partial<Chore>): Partial<ChoreFields> {
  const fields: Partial<ChoreFields> = {};
  if (chore.title !== undefined) fields.Title = chore.title;
  if (chore.emoji !== undefined) fields.Emoji = chore.emoji;
  if (chore.assigneeId !== undefined) fields.Assignee = linkField(chore.assigneeId);
  if (chore.stars !== undefined) fields.Stars = chore.stars;
  if (chore.timeOfDay !== undefined) fields.TimeOfDay = chore.timeOfDay;
  if (chore.dueTime !== undefined) fields.DueTime = chore.dueTime;
  if (chore.repeatMode !== undefined) fields.RepeatMode = chore.repeatMode;
  if (chore.startDate !== undefined) fields.StartDate = chore.startDate;
  if (chore.frequency !== undefined) fields.Frequency = chore.frequency;
  if (chore.interval !== undefined) fields.Interval = chore.interval;
  if (chore.daysOfWeek !== undefined) fields.DaysOfWeek = chore.daysOfWeek;
  if (chore.endDate !== undefined) fields.EndDate = chore.endDate;
  if (chore.delayDays !== undefined) fields.DelayDays = chore.delayDays;
  if (chore.nextDueDate !== undefined) fields.NextDueDate = chore.nextDueDate;
  if (chore.carryOver !== undefined) fields.CarryOver = chore.carryOver;
  if (chore.archived !== undefined) fields.Archived = chore.archived;
  return fields;
}

export function completionToDomain(record: AirtableRecord<CompletionFields>): Completion {
  return {
    id: record.id,
    key: record.fields.Key,
    choreId: linkId(record.fields.Chore) ?? "",
    profileId: linkId(record.fields.Profile) ?? "",
    occurrenceDate: record.fields.OccurrenceDate,
    completedDate: record.fields.CompletedDate,
    starsAwarded: record.fields.StarsAwarded ?? 0,
    dismissed: record.fields.Dismissed ?? false,
  };
}

export function completionToFields(completion: Partial<Completion>): Partial<CompletionFields> {
  const fields: Partial<CompletionFields> = {};
  if (completion.key !== undefined) fields.Key = completion.key;
  if (completion.choreId !== undefined) fields.Chore = linkField(completion.choreId);
  if (completion.profileId !== undefined) fields.Profile = linkField(completion.profileId);
  if (completion.occurrenceDate !== undefined) fields.OccurrenceDate = completion.occurrenceDate;
  if (completion.completedDate !== undefined) fields.CompletedDate = completion.completedDate;
  if (completion.starsAwarded !== undefined) fields.StarsAwarded = completion.starsAwarded;
  if (completion.dismissed !== undefined) fields.Dismissed = completion.dismissed;
  return fields;
}

export function bonusToDomain(record: AirtableRecord<BonusFields>): Bonus {
  return {
    id: record.id,
    label: record.fields.Label,
    profileId: linkId(record.fields.Profile) ?? "",
    stars: record.fields.Stars ?? 0,
    awardedDate: record.fields.AwardedDate,
  };
}

export function bonusToFields(bonus: Partial<Bonus>): Partial<BonusFields> {
  const fields: Partial<BonusFields> = {};
  if (bonus.label !== undefined) fields.Label = bonus.label;
  if (bonus.profileId !== undefined) fields.Profile = linkField(bonus.profileId);
  if (bonus.stars !== undefined) fields.Stars = bonus.stars;
  if (bonus.awardedDate !== undefined) fields.AwardedDate = bonus.awardedDate;
  return fields;
}

export function rewardToDomain(record: AirtableRecord<RewardFields>): Reward {
  return {
    id: record.id,
    name: record.fields.Name,
    emoji: record.fields.Emoji,
    cost: record.fields.Cost ?? 0,
    profileId: linkId(record.fields.Profile),
    archived: record.fields.Archived ?? false,
  };
}

export function rewardToFields(reward: Partial<Reward>): Partial<RewardFields> {
  const fields: Partial<RewardFields> = {};
  if (reward.name !== undefined) fields.Name = reward.name;
  if (reward.emoji !== undefined) fields.Emoji = reward.emoji;
  if (reward.cost !== undefined) fields.Cost = reward.cost;
  if (reward.profileId !== undefined) fields.Profile = linkField(reward.profileId);
  if (reward.archived !== undefined) fields.Archived = reward.archived;
  return fields;
}

export function redemptionToDomain(record: AirtableRecord<RedemptionFields>): Redemption {
  return {
    id: record.id,
    label: record.fields.Label,
    rewardId: linkId(record.fields.Reward) ?? "",
    profileId: linkId(record.fields.Profile) ?? "",
    cost: record.fields.Cost ?? 0,
    redeemedDate: record.fields.RedeemedDate,
  };
}

export function redemptionToFields(redemption: Partial<Redemption>): Partial<RedemptionFields> {
  const fields: Partial<RedemptionFields> = {};
  if (redemption.label !== undefined) fields.Label = redemption.label;
  if (redemption.rewardId !== undefined) fields.Reward = linkField(redemption.rewardId);
  if (redemption.profileId !== undefined) fields.Profile = linkField(redemption.profileId);
  if (redemption.cost !== undefined) fields.Cost = redemption.cost;
  if (redemption.redeemedDate !== undefined) fields.RedeemedDate = redemption.redeemedDate;
  return fields;
}
