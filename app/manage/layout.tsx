import { ExitParentMode } from "@/components/ExitParentMode";
import { RequireParentMode } from "@/components/RequireParentMode";

export default function ManageLayout({ children }: LayoutProps<"/manage">) {
  return (
    <RequireParentMode>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h1 className="text-[24px] font-extrabold">Manage</h1>
          <ExitParentMode />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </RequireParentMode>
  );
}
