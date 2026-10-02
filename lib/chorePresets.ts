import type { TimeOfDay } from "./domain/types";

export interface ChorePreset {
  title: string;
  emoji: string;
  stars: number;
  timeOfDay: TimeOfDay;
}

export const CHORE_PRESETS: ChorePreset[] = [
  { title: "Make bed", emoji: "🛏️", stars: 1, timeOfDay: "morning" },
  { title: "Brush teeth", emoji: "🪥", stars: 1, timeOfDay: "morning" },
  { title: "Get dressed", emoji: "👕", stars: 1, timeOfDay: "morning" },
  { title: "Pack backpack", emoji: "🎒", stars: 1, timeOfDay: "morning" },
  { title: "Feed pet", emoji: "🐕", stars: 1, timeOfDay: "morning" },
  { title: "Homework", emoji: "📚", stars: 2, timeOfDay: "afternoon" },
  { title: "Tidy room", emoji: "🧹", stars: 2, timeOfDay: "afternoon" },
  { title: "Put away laundry", emoji: "🧺", stars: 2, timeOfDay: "afternoon" },
  { title: "Water plants", emoji: "💧", stars: 1, timeOfDay: "afternoon" },
  { title: "Set the table", emoji: "🍽️", stars: 1, timeOfDay: "evening" },
  { title: "Clear the table", emoji: "🍴", stars: 1, timeOfDay: "evening" },
  { title: "Take out trash", emoji: "🗑️", stars: 2, timeOfDay: "evening" },
  { title: "Load dishwasher", emoji: "🫧", stars: 2, timeOfDay: "evening" },
  { title: "Shower", emoji: "🚿", stars: 1, timeOfDay: "evening" },
];
