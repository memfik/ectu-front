"use client"

import { useMemo, useState } from "react"
import { Dialog, Popover } from "radix-ui"
import { Check as CheckIcon, ChevronsUpDown, ListFilter, X } from "lucide-react"
import { applyQuery, fmt, plural, type Query } from "@/lib/list/query"
import type { Filter, ListConfig, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { DROPDOWN_GLASS, TagInput } from "./form-controls"
import { LiquidGlass } from "@/components/ui/opaline/liquid-glass"
import { btn, checkBox, circ } from "./ui"

const count = <T,>(f: Filter<T>, rows: T[], v: string) =>
  rows.filter((x) => {
    const got = f.get(x)
    return Array.isArray(got) ? got.includes(v) : got === v
  }).length

/**
 * Шторка «Фильтры» (экран n-03): все фильтры раздела, черновик применяется кнопкой «Показать N …».
 * Число в кнопке считается по черновику сразу.
 */
export function FilterDrawer<T extends Row>({
  cfg,
  rows,
  q,
  open,
  onOpenChange,
  onApply,
}: {
  cfg: ListConfig<T>
  rows: T[]
  q: Query
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (q: Query) => void
}) {
  const [draft, setDraft] = useState(q.f)
  const found = useMemo(() => applyQuery(cfg, rows, { ...q, f: draft }).length, [cfg, rows, q, draft])
  const set = (k: string, v: string[]) => setDraft((d) => ({ ...d, [k]: v }))
  const flags = cfg.filters.filter((f) => f.ui === "flag")

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(q.f)
        onOpenChange(o)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[rgba(5,6,9,0.55)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-2.5 right-2.5 bottom-2.5 z-[101] flex w-[min(520px,calc(100vw-20px))] flex-col overflow-hidden rounded-[28px] border border-border bg-background text-[var(--mg-text)] shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:slide-in-from-right-8 max-sm:inset-0 max-sm:w-screen max-sm:rounded-none"
        >
          <header className="flex items-center gap-3 border-b border-[var(--dd-line)] px-7 py-5">
            <span className="grid size-10 place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              <ListFilter className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-xl font-semibold">Фильтры</Dialog.Title>
              <p className="text-[13px] text-muted-foreground">
                {cfg.title} · найдено {fmt(found)} из {fmt(rows.length)}
              </p>
            </div>
            <Dialog.Close className={circ} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-auto px-7 py-5">
            {cfg.filters
              .filter((f) => f.ui !== "flag")
              .map((f) => (
                <div key={f.k} className="mb-[18px]">
                  <div className="mb-2 text-[13.5px] font-medium">{f.t}</div>
                  {f.ui === "tags" ? (
                    <TagInput opts={f.opts} short={f.short} value={draft[f.k] ?? []} onChange={(v) => set(f.k, v)} />
                  ) : (
                    <MultiField filter={f} rows={rows} value={draft[f.k] ?? []} onChange={(v) => set(f.k, v)} />
                  )}
                </div>
              ))}

            {flags.length > 0 && (
              <>
                <div className="mt-6 mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">
                  Дополнительно
                  <i className="h-px flex-1 bg-[var(--dd-line)]" />
                </div>
                {flags.map((f) => {
                  const on = (draft[f.k] ?? []).includes("1")
                  return (
                    <button
                      key={f.k}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => set(f.k, on ? [] : ["1"])}
                      className="flex w-full items-center gap-3 py-1.5 text-left text-sm"
                    >
                      <span className={checkBox(on)} />
                      <span className="flex-1">{f.t}</span>
                      <span className="text-[13px] text-muted-foreground tabular-nums">{fmt(count(f, rows, "1"))}</span>
                    </button>
                  )
                })}
              </>
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-[var(--dd-line)] px-7 py-4">
            <button type="button" className={btn()} onClick={() => setDraft({})}>
              <X />
              Сбросить всё
            </button>
            <button
              type="button"
              className={btn({ primary: true })}
              onClick={() => {
                onApply({ ...q, f: draft })
                onOpenChange(false)
              }}
            >
              <CheckIcon />
              Показать {fmt(found)} {plural(found, cfg.unit)}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Выпадающий список с флажками и числом записей (Тип сети, Статус…). */
function MultiField<T>({
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
  const label = value.map((v) => f.opts.find((o) => o.v === v)?.label ?? v).join(", ")
  return (
    <Popover.Root>
      <LiquidGlass asChild className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl pr-3 pl-4 text-sm text-foreground">
        <Popover.Trigger>
          <span className={cn("flex-1 truncate text-left", !value.length && "opacity-55")}>{label || (f.any ?? "Любое")}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Popover.Trigger>
      </LiquidGlass>
      <Popover.Content sideOffset={8} align="start" className={cn(DROPDOWN_GLASS, "w-[var(--radix-popover-trigger-width)] outline-none")}>
        <LiquidGlass variant="frosted" className="max-h-[320px] overflow-auto rounded-2xl p-1.5">
          {f.opts.map((o) => {
            const on = value.includes(o.v)
            return (
              <button
                key={o.v}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onChange(on ? value.filter((v) => v !== o.v) : [...value, o.v])}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left text-sm hover:bg-[var(--glass-highlight)]",
                  on && "bg-[rgba(8,94,255,0.14)]",
                )}
              >
                <span className={checkBox(on)} />
                <span className="flex-1">{o.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{fmt(count(f, rows, o.v))}</span>
              </button>
            )
          })}
        </LiquidGlass>
      </Popover.Content>
    </Popover.Root>
  )
}
