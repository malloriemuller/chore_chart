"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  manage: "Manage",
  profiles: "Profiles",
  chores: "Chores",
  rewards: "Rewards",
  stars: "Stars",
  styleguide: "Styleguide",
  new: "New",
};

type Crumb = { href: string; label: string };

/**
 * Builds the trail from the URL itself, so a new section under /manage gets a working
 * breadcrumb without being registered anywhere. An unrecognised segment is a record id
 * (the chore edit route), which reads as "Edit" rather than showing `recXXXX` to a parent.
 */
export function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  // /styleguide is reached from the Manage dashboard but lives outside /manage, so it needs the
  // root crumb prepended or it would render as a single dead-end label.
  const crumbs: Crumb[] = segments[0] === "manage" ? [] : [{ href: "/manage", label: "Manage" }];
  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    crumbs.push({ href, label: SEGMENT_LABELS[segment] ?? "Edit" });
  }
  return crumbs;
}

export function ManageBreadcrumb() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 && <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-text-muted" />}
              {isLast ? (
                <span aria-current="page" className="px-1 text-[24px] font-extrabold">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="flex min-h-11 items-center rounded-card px-2 text-[24px] font-extrabold text-text-muted"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
