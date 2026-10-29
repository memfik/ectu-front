"use client"

import { createContext, useContext } from "react"
import { Pencil, Plus, QrCode, SearchX, Trash2, X } from "lucide-react"
import { Select } from "@/components/list/form-controls"
import { btn, Check, circ } from "@/components/list/ui"
import { StateScreen } from "@/components/shared/state-screen"
import { fmt } from "@/lib/list/query"
import { cn } from "@/lib/utils"
import type { ViewMode } from "./toolbar"

/*
 * Таблица списка: строки-плашки (выбранная — синей рамкой), сортировка по клику на заголовок,
 * флажки, номер, действия справа; под таблицей — «Показать N», «1–20 из 1 693» и страницы.
 */

/** Сколько записей на странице в каждом виде и варианты «Показать N». */
export const PAGE_SIZE: Record<ViewMode, number> = { table: 20, cards: 8, map: 20 }
export const PAGE_SIZES: Record<ViewMode, number[]> = { table: [10, 20, 50, 100], cards: [8, 16, 32, 64], map: [20] }

/** Сортировка: колонка ("" — исходный порядок) и направление. */
export type Sort<K extends string = string> = [K | "", 1 | -1]

export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5 text-[13.5px]">{children}</table>
    </div>
  )
}

export function HeadRow({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="text-left text-[12.5px] text-muted-foreground">{children}</tr>
    </thead>
  )
}

/** Флажок «вся страница» и «№». */
export function HeadSelect({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <>
      <th className="w-11 px-3.5 py-1 font-medium">
        <Check on={on} label="Выбрать страницу" onClick={onToggle} />
      </th>
      <th className="w-12 px-3.5 py-1 font-medium">№</th>
    </>
  )
}

/** Заголовок колонки; с `k` — сортировка по клику (числа — сначала по убыванию). */
export function Th<K extends string>({
  k,
  sort,
  onSort,
  num,
  w,
  children,
}: {
  k?: K
  sort?: Sort<K>
  onSort?: (s: Sort<K>) => void
  num?: boolean
  /** Фиксированная ширина */
  w?: string
  children: React.ReactNode
}) {
  const can = !!(k && sort && onSort)
  const sorted = can && sort[0] === k
  return (
    <th
      style={{ width: w }}
      onClick={() => can && onSort(sorted ? [k, sort[1] === 1 ? -1 : 1] : [k, num ? -1 : 1])}
      className={cn("group px-3.5 py-1 font-medium whitespace-nowrap", can && "cursor-pointer select-none")}
    >
      {children}
      {can && (
        <span className={cn("ml-1 opacity-0 transition-opacity group-hover:opacity-100", sorted && "text-[var(--link)] opacity-100")}>
          {sorted ? (sort[1] > 0 ? "↑" : "↓") : "↕"}
        </span>
      )}
    </th>
  )
}

export const ThActions = () => <th className="px-3.5 py-1 text-right font-medium">Действия</th>

const RowOn = createContext(false)

/** Строка-плашка; `on` — выбранная (превью справа). */
export function Row({ on, onClick, onDoubleClick, children }: { on: boolean; onClick: () => void; onDoubleClick: () => void; children: React.ReactNode }) {
  return (
    <RowOn.Provider value={on}>
      <tr onClick={onClick} onDoubleClick={onDoubleClick} className={cn("group/r cursor-pointer", on && "on")}>
        {children}
      </tr>
    </RowOn.Provider>
  )
}

/** Ячейка строки-плашки; выбранная строка — синяя рамка (tr.active в макете). */
const td = (on: boolean, edge?: "first" | "last") =>
  cn(
    "bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-3.5 py-3 align-middle transition-colors group-hover/r:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
    edge === "first" && "rounded-l-[14px]",
    edge === "last" && "rounded-r-[14px]",
    on &&
      "bg-[rgba(8,94,255,0.1)] shadow-[inset_0_1px_rgba(8,94,255,0.4),inset_0_-1px_rgba(8,94,255,0.4)] group-hover/r:bg-[rgba(8,94,255,0.12)]",
    on && edge === "first" && "shadow-[inset_1px_1px_rgba(8,94,255,0.4),inset_0_-1px_rgba(8,94,255,0.4)]",
    on && edge === "last" && "shadow-[inset_-1px_1px_rgba(8,94,255,0.4),inset_0_-1px_rgba(8,94,255,0.4)]",
  )

/** Ячейка: `num` — цифры моноширинно. Текст в одну строку. */
export function Td({ num, children }: { num?: boolean; children: React.ReactNode }) {
  const on = useContext(RowOn)
  return <td className={cn(td(on), "whitespace-nowrap", num && "tabular-nums")}>{children}</td>
}

/** Флажок строки и её номер на странице. */
export function RowSelect({ on: checked, n, onToggle }: { on: boolean; n: number; onToggle: () => void }) {
  const on = useContext(RowOn)
  return (
    <>
      <td className={td(on, "first")} onClick={(e) => e.stopPropagation()}>
        <Check on={checked} label="Выбрать" onClick={onToggle} />
      </td>
      <td className={cn(td(on), "text-muted-foreground tabular-nums")}>{n}</td>
    </>
  )
}

/** QR · изменить · удалить. */
export function RowActions({ onQr, onEdit, onDelete }: { onQr?: () => void; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex justify-end gap-1.5">
      {onQr && (
        <button type="button" className={cn(circ, "size-8")} title="QR-код" onClick={onQr}>
          <QrCode />
        </button>
      )}
      {onEdit && (
        <button type="button" className={cn(circ, "size-8")} title="Изменить" onClick={onEdit}>
          <Pencil />
        </button>
      )}
      {onDelete && (
        <button type="button" className={cn(circ, "size-8 hover:border-[#ff3b30] hover:bg-[#ff3b30]")} title="Удалить" onClick={onDelete}>
          <Trash2 />
        </button>
      )}
    </div>
  )
}

/** Последняя ячейка строки — действия. */
export function TdActions(p: React.ComponentProps<typeof RowActions>) {
  const on = useContext(RowOn)
  return (
    <td className={td(on, "last")} onClick={(e) => e.stopPropagation()}>
      <RowActions {...p} />
    </td>
  )
}

/** Пустая таблица: загрузка, ошибка API или «Ничего не найдено». */
export function EmptyRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="py-2 text-center text-muted-foreground">
        {children}
      </td>
    </tr>
  )
}

/** st-empty: ничего не найдено — сбросить фильтры или создать запись. */
export function NothingFound({ search, onReset, onCreate }: { search: string; onReset: () => void; onCreate?: () => void }) {
  return (
    <StateScreen
      icon={SearchX}
      title="Ничего не найдено"
      text={`${search.trim() ? `По запросу «${search.trim()}»` : "С текущими фильтрами"} записей нет. Попробуйте изменить запрос или сбросить фильтры.`}
      className="py-12"
    >
      <button type="button" className={btn()} onClick={onReset}>
        <X />
        Сбросить фильтры
      </button>
      {onCreate && (
        <button type="button" className={btn({ primary: true })} onClick={onCreate}>
          <Plus />
          Создать
        </button>
      )}
    </StateScreen>
  )
}

export function Pager({
  total,
  page,
  pages,
  size,
  sizes,
  onSize,
  onPage,
}: {
  total: number
  page: number
  pages: number
  size: number
  sizes: number[]
  onSize: (s: number) => void
  onPage: (p: number) => void
}) {
  // 1 2 3 … 70 — как в макете: первые, текущая с соседями, последняя
  const nums = [...new Set([0, 1, 2, page - 1, page, page + 1, pages - 1])].filter((i) => i >= 0 && i < pages).sort((a, b) => a - b)
  const b =
    "grid h-[38px] min-w-[38px] cursor-pointer place-items-center rounded-full border border-border bg-[var(--chip-bg)] px-2.5 text-[13px] text-[var(--nav-text)] tabular-nums disabled:cursor-default disabled:opacity-40"
  const from = total ? page * size + 1 : 0
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-1.5 text-[13px] text-muted-foreground">
      <Select
        value={String(size)}
        opts={sizes.map((n) => ({ v: String(n), label: `Показать ${n}` }))}
        onChange={(v) => onSize(Number(v))}
        className="h-[38px] w-[160px] rounded-full"
      />
      <span className="tabular-nums">
        {fmt(from)}–{fmt(Math.min(total, (page + 1) * size))} из {fmt(total)}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" className={b} disabled={!page} onClick={() => onPage(page - 1)} aria-label="Назад">
          ←
        </button>
        {nums.map((i, k) => (
          <span key={i} className="contents">
            {k > 0 && i - nums[k - 1] > 1 && <span className={cn(b, "cursor-default")}>…</span>}
            <button type="button" className={cn(b, i === page && "border-[#085eff] bg-[#085eff] text-white")} onClick={() => onPage(i)}>
              {fmt(i + 1)}
            </button>
          </span>
        ))}
        <button type="button" className={b} disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label="Вперёд">
          →
        </button>
      </div>
    </div>
  )
}
