import { PinUnlock } from "@/components/PinUnlock";

export default async function PinPage({ searchParams }: PageProps<"/pin">) {
  const params = await searchParams;
  const nextParam = params.next;
  const next = typeof nextParam === "string" && nextParam.startsWith("/") ? nextParam : "/";

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <PinUnlock next={next} />
    </main>
  );
}
