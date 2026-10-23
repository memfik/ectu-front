import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* Общие части страниц профиля, настроек, уведомлений и помощи (своих макетов нет — в стиле разделов ЕСТУ). */

export function AccountHero({ crumb, title, sub, children }: { crumb: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <section className="flex flex-wrap items-end gap-5 pt-8 pb-6">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{crumb}</p>
        <h1 className="mt-1.5 text-[52px] leading-[1.05] font-semibold tracking-[-1.4px] max-sm:text-[32px]">{title}</h1>
        {sub && <p className="mt-2 text-[15px] text-[var(--nav-text)]">{sub}</p>}
      </div>
      {children && <div className="ml-auto flex flex-wrap gap-2.5">{children}</div>}
    </section>
  )
}

/** Боковое меню разделов страницы (якоря). */
export function SideNav({ items, active }: { items: { id: string; t: string; icon: LucideIcon }[]; active?: string }) {
  return (
    <nav className="sticky top-6 flex flex-col gap-0.5 max-[1279px]:static max-[1279px]:flex-row max-[1279px]:flex-wrap">
      {items.map((x) => (
        <a
          key={x.id}
          href={`#${x.id}`}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] text-[var(--nav-text)] hover:bg-[var(--nav-hover)]",
            active === x.id && "bg-[var(--nav-on-bg)] font-semibold text-[var(--nav-on)]",
          )}
        >
          <x.icon className="size-4" />
          {x.t}
        </a>
      ))}
    </nav>
  )
}

/** Блок с цветной шапкой (настройки, профиль): значок в тоне блока, заголовок, подпись, действие справа. */
export function ToneBlock({
  id,
  icon: Icon,
  tone,
  title,
  sub,
  action,
  children,
  bodyClassName,
}: {
  id?: string
  icon: LucideIcon
  tone: string
  title: React.ReactNode
  sub?: string
  action?: React.ReactNode
  children: React.ReactNode
  bodyClassName?: string
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 overflow-hidden rounded-3xl border border-border bg-[var(--glass-card)] backdrop-blur-[18px]"
    >
      <header
        className="flex items-center gap-3.5 border-b border-border px-6 py-4"
        style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${tone} 10%, transparent), transparent 55%)` }}
      >
        <span className="grid size-10 flex-none place-items-center rounded-xl" style={{ color: tone, background: `color-mix(in srgb, ${tone} 16%, transparent)` }}>
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[16px] font-semibold">{title}</b>
          {sub && <span className="text-[12.5px] text-muted-foreground">{sub}</span>}
        </span>
        {action}
      </header>
      <div className={cn("px-6 py-2", bodyClassName)}>{children}</div>
    </section>
  )
}
