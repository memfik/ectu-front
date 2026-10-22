"use client"

import { Popover } from "radix-ui"
import { ChevronDown, X } from "lucide-react"
import type { Query } from "@/lib/list/query"
import { fmt } from "@/lib/list/query"
import type { Filter, ListConfig, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { checkBox } from "./ui"

/** Кнопка фильтра в панели (.sel): выпадающий список вариантов с флажками и числом записей. */
export function FilterChip<T extends Row>({
  filter: f,
  rows,
  value,
  onChange,
}: {
  filter: Filter<T>
  rows: T[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const label = value.length === 0 ? (f.all ?? f.t) : value.length === 1 ? `${f.t}: ${short(f, value[0])}` : `${f.t}: ${value.length}`
  const count = (v: string) =>
    rows.filter((x) => {
      const got = f.get(x)
      return Array.isArray(got) ? got.includes(v) : got === v
    }).length

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "flex h-11 flex-none cursor-pointer items-center gap-2.5 rounded-full border border-border bg-[var(--chip-bg)] px-4 text-sm whitespace-nowrap text-[var(--nav-text)] data-[state=open]:border-[#085eff] max-sm:h-10 max-sm:text-[13px]",
          value.length > 0 && "border-[rgba(8,94,255,0.45)] bg-[rgba(8,94,255,0.1)] text-foreground"
        )}
      >
        {label}
        <ChevronDown className="size-4 opacity-60" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-[90] max-h-[min(420px,60vh)] w-[280px] overflow-auto rounded-[20px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-2 text-[var(--mg-text)] shadow-[var(--dd-shadow)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in"
        >
          {f.opts.map((o) => {
            const on = value.includes(o.v)
            return (
              <button
                key={o.v}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onChange(on ? value.filter((v) => v !== o.v) : [...value, o.v])}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-[var(--mg-on)]"
              >
                <span className={checkBox(on)} />
                <span className="flex-1">{o.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{fmt(count(o.v))}</span>
              </button>
            )
          })}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full border-t border-[var(--dd-line)] px-2.5 pt-2.5 pb-1 text-left text-[13px] text-[var(--link)]"
            >
              Сбросить
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const short = <T,>(f: Filter<T>, v: string) => f.short?.(v) ?? f.opts.find((o) => o.v === v)?.label ?? v

/** Строка «Фильтры: [Филиал: АС, ЮФ ×] [Технология: FTTH ×] Сбросить». */
export function ActiveChips<T extends Row>({ cfg, q, setQ }: { cfg: ListConfig<T>; q: Query; setQ: (q: Query) => void }) {
  const active = cfg.filters.filter((f) => q.f[f.k]?.length)
  if (!active.length) return null
  return (
    <div className="mx-1.5 mt-1.5 mb-1 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
      Фильтры:
      {active.map((f) => (
        <span
          key={f.k}
          className="flex h-[30px] items-center gap-1.5 rounded-full border border-[rgba(8,94,255,0.3)] bg-[rgba(8,94,255,0.1)] pr-2 pl-3 text-[12.5px] whitespace-nowrap text-[var(--link)]"
        >
          {f.t}: {q.f[f.k].map((v) => short(f, v)).join(", ")}
          <button type="button" aria-label={`Убрать фильтр «${f.t}»`} onClick={() => setQ({ ...q, f: { ...q.f, [f.k]: [] } })}>
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <button type="button" onClick={() => setQ({ ...q, f: {} })} className="ml-1 text-[var(--link)]">
        Сбросить
      </button>
    </div>
  )
}
