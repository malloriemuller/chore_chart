import { describe, expect, it } from "vitest";
import { buildCrumbs } from "../../components/ManageBreadcrumb";

describe("buildCrumbs", () => {
  it("is a single non-link crumb on the dashboard itself", () => {
    expect(buildCrumbs("/manage")).toEqual([{ href: "/manage", label: "Manage" }]);
  });

  it("links back to the dashboard from a section", () => {
    expect(buildCrumbs("/manage/chores")).toEqual([
      { href: "/manage", label: "Manage" },
      { href: "/manage/chores", label: "Chores" },
    ]);
  });

  it("shows an Edit crumb for a chore record id rather than the raw id", () => {
    expect(buildCrumbs("/manage/chores/recEsmRNZadN8aqiR")).toEqual([
      { href: "/manage", label: "Manage" },
      { href: "/manage/chores", label: "Chores" },
      { href: "/manage/chores/recEsmRNZadN8aqiR", label: "Edit" },
    ]);
  });

  it("labels the new-chore route", () => {
    expect(buildCrumbs("/manage/chores/new")).toEqual([
      { href: "/manage", label: "Manage" },
      { href: "/manage/chores", label: "Chores" },
      { href: "/manage/chores/new", label: "New" },
    ]);
  });

  it("prepends the dashboard crumb for /styleguide, which sits outside /manage", () => {
    expect(buildCrumbs("/styleguide")).toEqual([
      { href: "/manage", label: "Manage" },
      { href: "/styleguide", label: "Styleguide" },
    ]);
  });
});
