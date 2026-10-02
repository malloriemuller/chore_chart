import { RequireParentMode } from "@/components/RequireParentMode";

export default function StyleguideLayout({ children }: LayoutProps<"/styleguide">) {
  return <RequireParentMode>{children}</RequireParentMode>;
}
