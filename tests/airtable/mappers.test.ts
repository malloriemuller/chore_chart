import { describe, expect, it } from "vitest";
import {
  bonusToDomain,
  bonusToFields,
  choreToDomain,
  choreToFields,
  completionToDomain,
  profileToDomain,
  redemptionToDomain,
  rewardToDomain,
  type BonusFields,
  type ChoreFields,
  type CompletionFields,
  type ProfileFields,
  type RedemptionFields,
  type RewardFields,
} from "../../lib/airtable/mappers";
import type { AirtableRecord } from "../../lib/airtable/types";

describe("profileToDomain", () => {
  it("maps a fixture Profiles record", () => {
    const record: AirtableRecord<ProfileFields> = {
      id: "recProfile1",
      fields: {
        Name: "Ada",
        Role: "child",
        Color: "#8DB596",
        Emoji: "🦄",
        SortOrder: 1,
        Active: true,
      },
    };
    expect(profileToDomain(record)).toEqual({
      id: "recProfile1",
      name: "Ada",
      role: "child",
      color: "#8DB596",
      emoji: "🦄",
      sortOrder: 1,
      active: true,
    });
  });
});

describe("chore mappers", () => {
  const record: AirtableRecord<ChoreFields> = {
    id: "recChore1",
    fields: {
      Title: "Feed the cat",
      Emoji: "🐱",
      Assignee: ["recProfile1"],
      Stars: 2,
      TimeOfDay: "morning",
      RepeatMode: "schedule",
      StartDate: "2026-01-01",
      Frequency: "daily",
      Interval: 1,
      DaysOfWeek: ["MO", "WE", "FR"],
      Archived: false,
    },
  };

  it("maps a fixture Chores record, taking the first linked Assignee id", () => {
    expect(choreToDomain(record)).toEqual({
      id: "recChore1",
      title: "Feed the cat",
      emoji: "🐱",
      assigneeId: "recProfile1",
      stars: 2,
      timeOfDay: "morning",
      dueTime: undefined,
      repeatMode: "schedule",
      startDate: "2026-01-01",
      frequency: "daily",
      interval: 1,
      daysOfWeek: ["MO", "WE", "FR"],
      endDate: undefined,
      delayDays: undefined,
      nextDueDate: undefined,
      carryOver: false,
      archived: false,
    });
  });

  it("round-trips a single-link Assignee back into an array field", () => {
    const fields = choreToFields({ assigneeId: "recProfile2" });
    expect(fields.Assignee).toEqual(["recProfile2"]);
  });

  it("omits the Assignee field entirely when assigneeId is not provided in a patch", () => {
    const fields = choreToFields({ title: "Renamed" });
    expect(fields.Assignee).toBeUndefined();
    expect(fields.Title).toBe("Renamed");
  });
});

describe("completionToDomain", () => {
  it("maps a fixture Completions record", () => {
    const record: AirtableRecord<CompletionFields> = {
      id: "recCompletion1",
      fields: {
        Key: "recChore1:2026-01-01",
        Chore: ["recChore1"],
        Profile: ["recProfile1"],
        OccurrenceDate: "2026-01-01",
        CompletedDate: "2026-01-02",
        StarsAwarded: 2,
      },
    };
    expect(completionToDomain(record)).toEqual({
      id: "recCompletion1",
      key: "recChore1:2026-01-01",
      choreId: "recChore1",
      profileId: "recProfile1",
      occurrenceDate: "2026-01-01",
      completedDate: "2026-01-02",
      starsAwarded: 2,
      dismissed: false,
    });
  });

  it("reads a skipped occurrence as dismissed, and a record predating the field as not", () => {
    const base = {
      Key: "recChore1:2026-01-01",
      Chore: ["recChore1"],
      Profile: ["recProfile1"],
      OccurrenceDate: "2026-01-01",
      CompletedDate: "2026-01-02",
      StarsAwarded: 0,
    };
    const skipped: AirtableRecord<CompletionFields> = {
      id: "recCompletion2",
      fields: { ...base, Dismissed: true },
    };
    expect(completionToDomain(skipped).dismissed).toBe(true);
    expect(completionToDomain({ id: "recCompletion3", fields: base }).dismissed).toBe(false);
  });
});

describe("bonusToDomain", () => {
  it("maps a fixture Bonuses record, including a negative amount", () => {
    const record: AirtableRecord<BonusFields> = {
      id: "recBonus1",
      fields: {
        Label: "Nice to her brother",
        Profile: ["recProfile1"],
        Stars: 1,
        AwardedDate: "2026-10-29",
      },
    };
    expect(bonusToDomain(record)).toEqual({
      id: "recBonus1",
      label: "Nice to her brother",
      profileId: "recProfile1",
      stars: 1,
      awardedDate: "2026-10-29",
    });

    const taken = bonusToDomain({ ...record, fields: { ...record.fields, Stars: -2 } });
    expect(taken.stars).toBe(-2);
  });

  it("writes the Profile link as a single-element array", () => {
    const fields = bonusToFields({ profileId: "recProfile1", stars: 3, label: "Helped with dinner" });
    expect(fields.Profile).toEqual(["recProfile1"]);
    expect(fields.Stars).toBe(3);
  });
});

describe("rewardToDomain", () => {
  it("maps a fixture Rewards record with no Profile link (available to all children)", () => {
    const record: AirtableRecord<RewardFields> = {
      id: "recReward1",
      fields: {
        Name: "Movie night",
        Emoji: "🎬",
        Cost: 20,
        Archived: false,
      },
    };
    expect(rewardToDomain(record)).toEqual({
      id: "recReward1",
      name: "Movie night",
      emoji: "🎬",
      cost: 20,
      profileId: undefined,
      archived: false,
    });
  });
});

describe("redemptionToDomain", () => {
  it("maps a fixture Redemptions record", () => {
    const record: AirtableRecord<RedemptionFields> = {
      id: "recRedemption1",
      fields: {
        Label: "Movie night – Ada",
        Reward: ["recReward1"],
        Profile: ["recProfile1"],
        Cost: 20,
        RedeemedDate: "2026-01-10",
      },
    };
    expect(redemptionToDomain(record)).toEqual({
      id: "recRedemption1",
      label: "Movie night – Ada",
      rewardId: "recReward1",
      profileId: "recProfile1",
      cost: 20,
      redeemedDate: "2026-01-10",
    });
  });
});
