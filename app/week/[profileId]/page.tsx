import { WeekView } from "./WeekView";

export default async function WeekPage({ params, searchParams }: PageProps<"/week/[profileId]">) {
  const { profileId } = await params;
  const sp = await searchParams;
  const startParam = sp.start;
  const initialWeekStart = typeof startParam === "string" ? startParam : undefined;

  return <WeekView profileId={profileId} initialWeekStart={initialWeekStart} />;
}
