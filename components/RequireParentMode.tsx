import { cookies } from "next/headers";
import { ParentUnlock } from "./ParentUnlock";
import { COOKIE_NAMES, isParentCookieValid } from "@/lib/auth/pins";

export async function RequireParentMode({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const parentOk = isParentCookieValid(store.get(COOKIE_NAMES.parent)?.value);

  if (!parentOk) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <ParentUnlock />
      </main>
    );
  }

  return <>{children}</>;
}
