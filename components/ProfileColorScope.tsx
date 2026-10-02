import { profileBase, profileDeep, profileTint } from "@/lib/design/profileColor";

export function ProfileColorScope({
  hex,
  children,
  className,
}: {
  hex: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={
        {
          "--profile-tint": profileTint(hex),
          "--profile-base": profileBase(hex),
          "--profile-deep": profileDeep(hex),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
