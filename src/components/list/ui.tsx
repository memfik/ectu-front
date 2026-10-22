import type { Tone } from "@/lib/list/types"
import { cn } from "@/lib/utils"

/** Мелкие элементы шаблона «Список» из макетов: плашка статуса, круглая кнопка, полоса, тег, флажок. */

const TONE: Record<Tone, string> = {
  ok: "bg-[color-mix(in_srgb,var(--status-ok)_14%,transparent)] text-[var(--status-ok)]",
  warn: "bg-[color-mix(in_srgb,var(--status-nolink)_14%,transparent)] text-[var(--status-nolink)]",
  bad: "bg-[color-mix(in_srgb,var(--status-alarm)_14%,transparent)] text-[var(--status-alarm)]",
  info: "bg-[color-mix(in_srgb,var(--status-reserve)_14%,transparent)] text-[var(--status-reserve)]",
  muted: "bg-[var(--chip-bg)] text-muted-foreground",
}

export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-[26px] flex-none items-center gap-1.5 rounded-full px-[11px] text-xs font-semibold whitespace-nowrap", TONE[tone], className)}>
      <i className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

/** Круглая кнопка-иконка (.circ в макетах). */
export const circ =
  "grid size-9 flex-none cursor-pointer place-items-center rounded-full border border-border bg-[var(--chip-bg)] text-[var(--nav-text)] transition-colors hover:border-[#085eff] hover:bg-[#085eff] hover:text-white [&_svg]:size-4"

/** Кнопка-пилюля (.btn): обычная, основная (синяя) и «опасная». */
export function btn({ primary, danger, sm }: { primary?: boolean; danger?: boolean; sm?: boolean } = {}) {
  return cn(
    "inline-flex flex-none cursor-pointer items-center gap-2 rounded-full border px-[18px] text-sm font-semibold whitespace-nowrap transition-[background-color,filter,opacity] [&_svg]:size-[17px] disabled:cursor-default disabled:opacity-50",
    sm ? "h-9 px-3.5 text-[13px]" : "h-11",
    primary
      ? "border-[#085eff] bg-[#085eff] text-white shadow-[0_8px_24px_rgba(8,94,255,0.32)] hover:brightness-110"
      : "border-border bg-[var(--chip-bg)] text-foreground hover:bg-[var(--nav-hover)]",
    danger && "text-[#ff7a7e]"
  )
}

export function Bar({ pct, color, className }: { pct: number; color?: string; className?: string }) {
  return (
    <span className={cn("block h-1.5 overflow-hidden rounded-full bg-[var(--chip-bg)]", className)}>
      <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </span>
  )
}

/** Тег технологии (FTTH, xDSL…). */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[22px] items-center rounded-full border border-[rgba(8,94,255,0.4)] px-2 text-[11px] font-medium text-[var(--link)]">
      {children}
    </span>
  )
}

/** Вид флажка — для своей кнопки-строки (флажок внутри другой кнопки нельзя). */
export const checkBox = (on: boolean) =>
  cn(
    "grid size-[18px] flex-none cursor-pointer place-items-center rounded-[5px] border-[1.5px] border-[color-mix(in_srgb,var(--foreground)_25%,transparent)]",
    on &&
      "border-[#085eff] bg-[#085eff] after:h-1 after:w-2 after:translate-x-px after:-translate-y-px after:-rotate-45 after:border-b-2 after:border-l-2 after:border-white"
  )

export function Check({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={checkBox(on)}
    />
  )
}
