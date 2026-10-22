import type { Column, ListConfig, Row } from "./types"

/** Отбор записей: поиск, фильтры (значение → выбранные варианты) и сортировка. */
export type Query = {
  q: string
  f: Record<string, string[]>
  sort: [string, 1 | -1]
}

export const emptyQuery = <T extends Row>(cfg: ListConfig<T>): Query => ({ q: "", f: {}, sort: cfg.sort })

const has = (v: string | string[], picked: string[]) => (Array.isArray(v) ? v.some((x) => picked.includes(x)) : picked.includes(v))

export function applyQuery<T extends Row>(cfg: ListConfig<T>, rows: T[], q: Query): T[] {
  const needle = q.q.trim().toLowerCase()
  const filters = cfg.filters.filter((f) => q.f[f.k]?.length)
  const col = cfg.cols.find((c) => c.k === q.sort[0])
  const out = rows.filter(
    (x) => (!needle || cfg.text(x).toLowerCase().includes(needle)) && filters.every((f) => has(f.get(x), q.f[f.k]))
  )
  return col ? sortBy(out, col, q.sort[1]) : out
}

function sortBy<T>(rows: T[], col: Column<T>, dir: 1 | -1) {
  return [...rows].sort((a, b) => {
    const x = col.value(a)
    const y = col.value(b)
    if (x === y) return 0
    if (x === null) return 1
    if (y === null) return -1
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "ru", { numeric: true })) * dir
  })
}

/** Число с пробелами: 1 387. */
export const fmt = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ")

/** Выгрузка видимых колонок в CSV (Excel открывает). TODO: xlsx с сервера. */
export function exportCsv<T extends Row>(cfg: ListConfig<T>, rows: T[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const lines = [cfg.cols.map((c) => esc(c.t)), ...rows.map((x) => cfg.cols.map((c) => esc(c.value(x))))]
  const blob = new Blob(["\ufeff" + lines.map((l) => l.join(";")).join("\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `${cfg.key}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Склонение: plural(32, ["волокно", "волокна", "волокон"]) → «волокна». */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const d = n % 10
  const dd = n % 100
  if (d === 1 && dd !== 11) return one
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few
  return many
}
