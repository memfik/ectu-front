"use client"

import { Popover } from "radix-ui"
import { ChevronDown, Filter, Layers, LayoutGrid, List, Map as MapIcon, Search, Trash2, X } from "lucide-react"
import { Input, Select } from "@/components/list/form-controls"
import { btn, checkBox } from "@/components/list/ui"
import { fmt } from "@/lib/list/query"
import { cn } from "@/lib/utils"

/*
 * Панель над списком: поиск, кнопки фильтров, «Ещё фильтры», «Удалить (N)», вид Таблица / Карточки / Карта;
 * под ней — плашки включённых фильтров. Страница сама собирает панель из этих блоков.
 */

/** Вариант фильтра; `n` — сколько записей с этим значением. */
export type Opt = { v: string; label: string; n?: number }

export type ViewMode = "table" | "cards" | "map"

/** Стеклянная панель вокруг панели и таблицы. `flush` — без нижнего отступа (над картой и карточками). */
export function ListPanel({ flush, className, children }: { flush?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border bg-[var(--glass-card)] px-3 backdrop-blur-[18px] max-sm:px-2",
        flush ? "py-3" : "pt-4 pb-3",
        className,
      )}
    >
      {children}
    </section>
  )
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="mx-1.5 mb-2 flex flex-wrap items-center gap-2.5 max-sm:gap-2">{children}</div>
}

export const ToolbarSpacer = () => <span className="flex-1 max-sm:hidden" />

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Input
      icon={<Search />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-11 min-w-[200px] flex-[1_1_220px] rounded-full max-sm:h-10 max-sm:flex-[1_1_100%]"
    />
  )
}

/** Кнопка фильтра в панели (.sel): выпадающий список вариантов с флажками и числом записей. */
export function FilterChip({
  label,
  all,
  options,
  value,
  onChange,
  short,
}: {
  label: string
  /** Подпись, когда ничего не выбрано («Все филиалы»); по умолчанию — label */
  all?: string
  options: Opt[]
  value: string[]
  onChange: (v: string[]) => void
  /** Короткая подпись значения на кнопке («АС» вместо «Астана (АС)») */
  short?: (v: string) => string
}) {
  const name = (v: string) => short?.(v) ?? options.find((o) => o.v === v)?.label ?? v
  const text = value.length === 0 ? (all ?? label) : value.length === 1 ? `${label}: ${name(value[0])}` : `${label}: ${value.length}`
  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "flex h-11 flex-none cursor-pointer items-center gap-2.5 rounded-full border border-border bg-[var(--chip-bg)] px-4 text-sm whitespace-nowrap text-[var(--nav-text)] data-[state=open]:border-[#085eff] max-sm:h-10 max-sm:text-[13px]",
          value.length > 0 && "border-[rgba(8,94,255,0.45)] bg-[rgba(8,94,255,0.1)] text-foreground",
        )}
      >
        {text}
        <ChevronDown className="size-4 opacity-60" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-[90] max-h-[min(420px,60vh)] w-[280px] overflow-auto rounded-[20px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-2 text-[var(--mg-text)] shadow-[var(--dd-shadow)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in"
        >
          {options.map((o) => {
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
                {o.n !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{fmt(o.n)}</span>}
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

/** «Ещё фильтры» — открывает шторку; `active` — сколько включено фильтров без своей кнопки. */
export function MoreButton({ active, onClick }: { active: number; onClick: () => void }) {
  return (
    <button type="button" className={cn(btn(), "font-normal text-[var(--nav-text)] max-sm:h-10")} onClick={onClick}>
      <Filter />
      Ещё фильтры
      {active > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#085eff] px-1.5 text-[11px] font-bold text-white">{active}</span>
      )}
    </button>
  )
}

export function RemoveSelected({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" disabled={!count} className={cn(btn({ danger: true }), "max-sm:h-10")} onClick={onClick}>
      <Trash2 />
      Удалить ({count})
    </button>
  )
}

/** «Слои» в виде «Карта». */
export function LayersButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={cn(btn(), "font-normal text-[var(--nav-text)] max-sm:h-10")} onClick={onClick}>
      <Layers />
      Слои
    </button>
  )
}

/** Таблица / Карточки / Карта (без `map` — две кнопки). */
export function ViewSwitch({ mode, onChange, map }: { mode: ViewMode; onChange: (m: ViewMode) => void; map?: boolean }) {
  const items: [ViewMode, string, typeof List][] = [
    ["table", "Таблица", List],
    ["cards", "Карточки", LayoutGrid],
    ...(map ? [["map", "Карта", MapIcon] as [ViewMode, string, typeof List]] : []),
  ]
  return (
    <div className="flex gap-0.5 rounded-full border border-border bg-[var(--chip-bg)] p-1">
      {items.map(([k, t, Icon]) => (
        <button
          key={k}
          type="button"
          title={t}
          aria-pressed={mode === k}
          className={cn(
            "grid size-[34px] cursor-pointer place-items-center rounded-full text-muted-foreground [&_svg]:size-[17px]",
            mode === k && "bg-[var(--nav-hover)] text-foreground",
          )}
          onClick={() => onChange(k)}
        >
          <Icon />
        </button>
      ))}
    </div>
  )
}

/** «Сортировка: ID» в виде карточек: по возрастанию и убыванию каждой колонки. */
export function SortSelect<K extends string>({
  value,
  columns,
  onChange,
}: {
  value: [K | "", 1 | -1]
  columns: { k: K; t: string }[]
  onChange: (v: [K | "", 1 | -1]) => void
}) {
  return (
    <Select
      value={value[0] ? `${value[0]}:${value[1]}` : ""}
      opts={[
        { v: "", label: "Сортировка: ID" },
        ...columns.flatMap((c) => [
          { v: `${c.k}:1`, label: `${c.t} ↑` },
          { v: `${c.k}:-1`, label: `${c.t} ↓` },
        ]),
      ]}
      onChange={(v) => {
        const [k, d] = v.split(":")
        onChange([(k ?? "") as K | "", d === "-1" ? -1 : 1])
      }}
      className="h-11 w-[230px] flex-none rounded-full max-sm:h-10"
    />
  )
}

export type ActiveChip = { label: string; clear: () => void }

/** Строка «Фильтры: [Филиал: АС, ЮФ ×] [Технология: FTTH ×] Сбросить». */
export function ActiveChips({ chips, onClearAll }: { chips: ActiveChip[]; onClearAll: () => void }) {
  if (!chips.length) return null
  return (
    <div className="mx-1.5 mt-1.5 mb-1 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
      Фильтры:
      {chips.map((c) => (
        <span
          key={c.label}
          className="flex h-[30px] items-center gap-1.5 rounded-full border border-[rgba(8,94,255,0.3)] bg-[rgba(8,94,255,0.1)] pr-2 pl-3 text-[12.5px] whitespace-nowrap text-[var(--link)]"
        >
          {c.label}
          <button type="button" aria-label={`Убрать фильтр «${c.label}»`} onClick={c.clear}>
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <button type="button" onClick={onClearAll} className="ml-1 text-[var(--link)]">
        Сбросить
      </button>
    </div>
  )
}
