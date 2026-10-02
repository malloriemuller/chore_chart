export type Role = "parent" | "child";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";
export type RepeatMode = "none" | "schedule" | "after_completion";
export type Frequency = "daily" | "weekly" | "monthly";
export type DayOfWeek = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";
export type OccurrenceStatus = "done" | "due" | "upcoming" | "overdue";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  color: string;
  emoji: string;
  sortOrder: number;
  active: boolean;
}

export interface Chore {
  id: string;
  title: string;
  emoji?: string;
  assigneeId: string;
  stars: number;
  timeOfDay: TimeOfDay;
  dueTime?: string;
  repeatMode: RepeatMode;
  /** YYYY-MM-DD. The due date when `none`, the anchor when `schedule`, the creation anchor when `after_completion`. */
  startDate: string;
  frequency?: Frequency;
  interval?: number;
  daysOfWeek?: DayOfWeek[];
  endDate?: string;
  delayDays?: number;
  nextDueDate?: string;
  archived: boolean;
}

export interface Completion {
  id: string;
  key: string;
  choreId: string;
  profileId: string;
  occurrenceDate: string;
  completedDate: string;
  starsAwarded: number;
}

export interface Reward {
  id: string;
  name: string;
  emoji?: string;
  cost: number;
  profileId?: string;
  archived: boolean;
}

export interface Redemption {
  id: string;
  label: string;
  rewardId: string;
  profileId: string;
  cost: number;
  redeemedDate: string;
}
