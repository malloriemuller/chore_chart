"use client";

import { ChoreCard } from "@/components/ChoreCard";
import { ColumnHeader } from "@/components/ColumnHeader";
import { ProfileColorScope } from "@/components/ProfileColorScope";
import { RewardCard } from "@/components/RewardCard";
import { SectionLabel } from "@/components/SectionLabel";
import { StarBadge } from "@/components/StarBadge";
import { Toast } from "@/components/Toast";
import { PROFILE_COLOR_PRESETS, profileBase, profileDeep, profileTint } from "@/lib/design/profileColor";
import { LiveCheckboxDemo } from "./LiveCheckboxDemo";

const SEMANTIC_TOKENS = [
  { name: "--bg", className: "bg-bg" },
  { name: "--surface", className: "bg-surface" },
  { name: "--surface-2", className: "bg-surface-2" },
  { name: "--text", className: "bg-text" },
  { name: "--text-muted", className: "bg-text-muted" },
  { name: "--line", className: "bg-line" },
  { name: "--star", className: "bg-star" },
  { name: "--danger", className: "bg-danger" },
  { name: "--success", className: "bg-success" },
];

const TYPE_SCALE = [
  { label: "Date header", className: "text-[32px] font-extrabold" },
  { label: "Column name", className: "text-[24px] font-extrabold" },
  { label: "Item title", className: "text-[22px] font-semibold" },
  { label: "Section label", className: "text-[14px] font-bold uppercase tracking-[0.06em] text-text-muted" },
  { label: "Star badge", className: "text-[16px] font-extrabold" },
];

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 w-full rounded-card border border-line ${className}`} />
      <code className="text-sm text-text-muted">{name}</code>
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 p-8 pb-32">
      <h1 className="text-[32px] font-extrabold">Styleguide</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-extrabold">Semantic tokens</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {SEMANTIC_TOKENS.map((t) => (
            <Swatch key={t.name} {...t} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-extrabold">Profile presets (tint / base / deep)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PROFILE_COLOR_PRESETS.map((preset) => (
            <div key={preset.name} className="flex flex-col gap-2 rounded-card border border-line p-3">
              <div
                className="flex h-20 items-center justify-center rounded-card text-sm font-bold"
                style={{ backgroundColor: profileTint(preset.hex), color: profileDeep(preset.hex) }}
              >
                tint + deep text
              </div>
              <div
                className="h-10 rounded-card"
                style={{ backgroundColor: profileBase(preset.hex) }}
              />
              <code className="text-sm text-text-muted">
                {preset.name} {preset.hex}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-extrabold">Typography</h2>
        <div className="flex flex-col gap-3">
          {TYPE_SCALE.map((t) => (
            <div key={t.label} className="flex items-baseline gap-4">
              <span className={t.className}>{t.label}</span>
              <code className="text-sm text-text-muted">{t.className}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-extrabold">Shape and depth</h2>
        <div className="flex flex-wrap gap-6">
          <div className="h-24 w-24 rounded-column bg-surface-2" />
          <div className="h-24 w-24 rounded-card bg-surface shadow-card" />
          <div className="flex h-12 items-center rounded-full bg-surface-2 px-6 font-bold">Pill</div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-[24px] font-extrabold">Column header</h2>
        <ProfileColorScope hex="#7FB2D9" className="max-w-sm">
          <ColumnHeader emoji="🦄" name="Ada" balance={42} />
        </ProfileColorScope>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-[24px] font-extrabold">Chore card states</h2>
        <ProfileColorScope hex="#7FB2D9" className="flex max-w-sm flex-col gap-3">
          <ChoreCard emoji="🍽️" title="Set the table" dueTime="5:30pm" stars={2} done={false} onToggle={() => {}} />
          <ChoreCard emoji="🧹" title="Sweep the kitchen" stars={3} done={true} onToggle={() => {}} />
          <ChoreCard emoji="🐱" title="Feed the cat" stars={1} done={false} overdueLabel="Tue" onToggle={() => {}} />
          <div className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card">
            <span className="text-lg">Live checkbox:</span>
            <LiveCheckboxDemo />
          </div>
        </ProfileColorScope>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-extrabold">Section label</h2>
        <SectionLabel>Overdue</SectionLabel>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-[24px] font-extrabold">Reward card</h2>
        <ProfileColorScope hex="#D98BA0" className="grid max-w-2xl grid-cols-2 gap-4">
          <RewardCard emoji="🎬" name="Movie night" cost={20} balance={25} onRedeem={() => {}} />
          <RewardCard emoji="🍦" name="Ice cream trip" cost={30} balance={10} onRedeem={() => {}} />
        </ProfileColorScope>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-extrabold">Star badge</h2>
        <div className="flex gap-3">
          <StarBadge value={7} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-extrabold">Toast</h2>
        <Toast message="Fed the cat 🐱" actionLabel="Undo" onAction={() => {}} />
      </section>
    </main>
  );
}
