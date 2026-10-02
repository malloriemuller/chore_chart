import { ExitParentMode } from "@/components/ExitParentMode";
import { ManageBreadcrumb } from "@/components/ManageBreadcrumb";
import { RequireParentMode } from "@/components/RequireParentMode";

export default function ManageLayout({ children }: LayoutProps<"/manage">) {
  return (
    <RequireParentMode>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <ManageBreadcrumb />
          <ExitParentMode />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </RequireParentMode>
  );
}
