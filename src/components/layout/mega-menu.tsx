"use client"

import Link from "next/link"
import { ChevronRight, Lock } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Feature, MenuItem, NavGroup } from "@/config/nav"
import { cn } from "@/lib/utils"

/** Мега-меню группы: колонки разделов · карточка справа · подсказка с ⌘K. Позиция — под пунктом навигации. */
export function MegaMenu({
  group,
  anchor,
  onClose,
  onSearch,
}: {
  group: NavGroup
  anchor: DOMRect
  onClose: () => void
  onSearch: () => void
}) {
  const width = Math.min(group.width, window.innerWidth - 24)
  const left = Math.max(12, Math.min(window.innerWidth - width - 12, anchor.left - 40))
  const cols = group.columns.length

  return (
    <>
      <div className="fixed inset-0 z-[59] bg-[var(--dd-dim)] animate-in fade-in duration-150" onClick={onClose} />
      <div
        role="menu"
        className="fixed z-[70] max-h-[calc(100vh-110px)] overflow-auto rounded-[26px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-[22px] shadow-[var(--dd-shadow)] animate-in fade-in slide-in-from-top-1.5 duration-150"
        style={{ width, left, top: anchor.bottom + 12 }}
      >
        <div
          className="grid gap-x-[18px] gap-y-2"
          style={{ gridTemplateColumns: `repeat(${cols}, auto) ${cols > 2 ? "minmax(220px, 1fr)" : "minmax(300px, 1.1fr)"}` }}
        >
          {group.columns.map((col, i) => (
            <div key={i}>
              {col.map((b) => (
                <div key={b.title} className="mb-2">
                  <GroupTitle>{b.title}</GroupTitle>
                  {b.items.map((x) => (
                    <MenuLink key={x.href} item={x} onClick={onClose} />
                  ))}
                </div>
              ))}
            </div>
          ))}
          <div>
            <FeatureCard feature={group.feature} onClick={onClose} />
            {group.recent && (
              <div className="mt-3">
                <GroupTitle>Недавние</GroupTitle>
                {group.recent.map((x) => (
                  <MenuLink key={x.title} item={x} onClick={onClose} />
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="mt-2 flex w-full items-center gap-1 border-t border-[var(--dd-line)] px-3 pt-3.5 text-left text-[12.5px] text-muted-foreground"
        >
          <span className="mr-auto">{group.footer}</span>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </button>
      </div>
    </>
  )
}

export function GroupTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h5
      className={cn(
        "mx-2.5 mt-1.5 mb-2 text-[11.5px] font-semibold tracking-[1px] whitespace-nowrap text-[var(--mg-dim)] uppercase",
        className,
      )}
    >
      {children}
    </h5>
  )
}

export function Thumb({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)] transition-colors duration-200",
        className,
      )}
    >
      <Icon className="size-[17px]" strokeWidth={1.75} />
    </span>
  )
}

export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border border-[var(--kbd-line)] px-2 py-[3px] text-[11px] whitespace-nowrap text-[var(--nav-text)]",
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Счётчик записей и плашка с замком (раздел только для ролей). */
export function ItemBadges({ item: x }: { item: MenuItem }) {
  return (
    <>
      {x.count && (
        <span className="ml-auto flex-none rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">
          {x.count}
        </span>
      )}
      {x.roles && (
        <span
          title={`Доступно ролям: ${x.roles}`}
          className={cn(
            "flex flex-none items-center gap-1 rounded-full bg-[rgba(255,194,74,0.12)] px-2 py-0.5 text-[10.5px] whitespace-nowrap text-[var(--lock)]",
            x.count ? "ml-1.5" : "ml-auto",
          )}
        >
          <Lock className="size-[11px]" strokeWidth={2.2} />
          {x.roles}
        </span>
      )}
    </>
  )
}

export function MenuLink({ item: x, onClick, className }: { item: MenuItem; onClick?: () => void; className?: string }) {
  const badges = !!(x.count || x.roles)
  return (
    <Link
      href={x.href}
      role="menuitem"
      onClick={onClick}
      className={cn(
        "group/mi flex items-center gap-3 rounded-[14px] p-2.5 text-sm text-[var(--mg-text)] transition-[background-color,transform] duration-150 hover:bg-[var(--mg-on)] active:scale-[0.97]",
        className,
      )}
    >
      <Thumb icon={x.icon} className="group-hover/mi:border-[#085eff] group-hover/mi:bg-[#085eff] group-hover/mi:text-white" />
      <span>
        {x.title}
        {x.hint && <span className="mt-px block text-[11.5px] text-muted-foreground">{x.hint}</span>}
      </span>
      <ItemBadges item={x} />
      <ChevronRight
        className={cn(
          "size-4 flex-none -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover/mi:translate-x-0 group-hover/mi:opacity-100",
          badges ? "ml-1" : "ml-auto",
        )}
      />
    </Link>
  )
}

/** Карточка справа в мега-меню и в мобильном меню. Цифры — TODO: из API. */
export function FeatureCard({ feature: f, onClick, className }: { feature: Feature; onClick?: () => void; className?: string }) {
  const box = cn("block overflow-hidden rounded-[18px] border border-[var(--dd-line)] bg-[var(--feat-bg)]", className)

  if (f.kind === "photo")
    return (
      <Link
        href={f.href}
        onClick={onClick}
        className={cn(box, "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5")}
      >
        <span className="block h-[180px] bg-cover bg-center" style={{ backgroundImage: `url(${f.src})` }} />
        <span className="block px-4 py-3.5">
          <b className="block text-sm">{f.title}</b>
          <span className="mt-[3px] block text-xs leading-[1.45] text-muted-foreground">{f.text}</span>
        </span>
      </Link>
    )

  if (f.kind === "bars")
    return (
      <div className={box}>
        <div className="flex h-[120px] items-end gap-2 px-4 pt-4">
          {f.bars.map((h, i) => (
            <i
              key={i}
              className={cn("flex-1 rounded-t-md", h < 35 ? "bg-[var(--chip-bg)]" : "bg-[linear-gradient(180deg,#3b82ff,#085eff)]")}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="px-4 py-3.5">
          <b className="block text-sm">{f.title}</b>
          <span className="mt-[3px] block text-xs leading-[1.45] text-muted-foreground">{f.text}</span>
        </div>
      </div>
    )

  return (
    <div className={cn(box, "p-4")}>
      <b className="mb-2 block text-sm">{f.title}</b>
      {f.kind === "funnel"
        ? f.rows.map((r) => (
            <div key={r.label} className="mt-2.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">{r.label}</span>
                <b className="font-semibold tabular-nums">{r.value}</b>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                <i className="block h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
              </div>
            </div>
          ))
        : f.rows.map((r) => (
            <div key={r.label} className="flex justify-between py-1 text-[13px]">
              <span className="text-muted-foreground">{r.label}</span>
              <b
                className={cn(
                  "font-semibold tabular-nums",
                  r.tone === "ok" && "text-[var(--status-ok)]",
                  r.tone === "bad" && "text-[var(--status-alarm)]",
                )}
              >
                {r.value}
              </b>
            </div>
          ))}
    </div>
  )
}
