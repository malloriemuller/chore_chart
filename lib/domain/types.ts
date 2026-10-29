export type Role = "parent" | "child";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";
export type RepeatMode = "none" | "schedule" | "after_completion";
export type Frequency = "daily" | "weekly" | "monthly";
export type DayOfWeek = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";
export type OccurrenceStatus = "done" | "dismissed" | "due" | "upcoming" | "overdue" | "missed";

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
  /**
   * When a scheduled occurrence is missed, whether it follows the kid forward as overdue.
   * Defaults to false: a recurring chore like brushing teeth is tied to its own day, and a
   * missed one is simply gone rather than something to catch up on.
   */
  carryOver?: boolean;
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
  /**
   * The occurrence was waved off rather than done: it stops being due or overdue, and
   * `starsAwarded` is 0. Settling it with a record (instead of deleting the occurrence) is what
   * keeps a recurring chore's later days intact while this one day stops coming back.
   */
  dismissed: boolean;
}

export interface Reward {
  id: string;
  name: string;
  emoji?: string;
  cost: number;
  profileId?: string;
  archived: boolean;
}

/**
 * Stars given (or taken back) outside the chore list — "was kind to her brother" — so one-off
 * credit doesn't have to be dressed up as a chore nobody wants on the board.
 */
export interface Bonus {
  id: string;
  /** Why it was given; shown in the stars ledger. */
  label: string;
  profileId: string;
  /** Negative to take stars away, e.g. to correct a mistake. Never 0. */
  stars: number;
  awardedDate: string;
}

export interface Redemption {
  id: string;
  label: string;
  rewardId: string;
  profileId: string;
  cost: number;
  redeemedDate: string;
}
