import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/*
 * Общие блоки шаблона «Паспорт» (EntityPassport, handoff §4): карточка с заголовком, строки «ключ — значение»,
 * аватар, полоса из нескольких частей. Один шаблон на узлы и всё оборудование.
 */

export const glass = "rounded-3xl border border-border bg-[var(--glass-card)] backdrop-blur-[18px]"

export function Card({
  icon: Icon,
  title,
  count,
  action,
  className,
  children,
}: {
  icon?: LucideIcon
  title: React.ReactNode
  count?: number | string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn(glass, "p-[22px]", className)}>
      <header className="mb-4 flex items-center gap-3">
        {Icon && (
          <span className="grid size-9 flex-none place-items-center rounded-[11px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
            <Icon className="size-[18px]" strokeWidth={1.75} />
          </span>
        )}
        <h3 className="min-w-0 flex-1 truncate text-base font-semibold">
          {title}
          {count !== undefined && <em className="ml-1.5 font-normal text-muted-foreground not-italic">{count}</em>}
        </h3>
        {action}
      </header>
      {children}
    </section>
  )
}

/** Строки паспорта: подпись слева, значение справа, разделитель. */
export function Kv({ rows }: { rows: { t: string; v: React.ReactNode }[] }) {
  return (
    <dl className="text-[13.5px]">
      {rows.map((r) => (
        <div key={r.t} className="flex items-baseline justify-between gap-4 border-b border-border py-[9px] last:border-0">
          <dt className="flex-none text-muted-foreground">{r.t}</dt>
          <dd className="min-w-0 truncate text-right font-medium">{r.v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Avatar({ initials, color, className }: { initials: string; color: string; className?: string }) {
  return (
    <span
      className={cn("grid size-10 flex-none place-items-center rounded-full text-[13px] font-bold text-white", className)}
      style={{ background: color }}
    >
      {initials}
    </span>
  )
}

/** Полоса из частей (занято / свободно, порты up / down / свободно). */
export function SegBar({ parts }: { parts: { v: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.v, 0) || 1
  return (
    <span className="flex h-2 gap-[3px] overflow-hidden rounded-full">
      {parts.map(
        (p, i) =>
          p.v > 0 && <i key={i} className="block h-full rounded-full" style={{ width: `${(p.v / total) * 100}%`, background: p.color }} />,
      )}
    </span>
  )
}

export function Legend({ items }: { items: { t: string; color: string }[] }) {
  return (
    <span className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((x) => (
        <span key={x.t} className="flex items-center gap-1.5">
          <i className="size-2 rounded-full" style={{ background: x.color }} />
          {x.t}
        </span>
      ))}
    </span>
  )
}
