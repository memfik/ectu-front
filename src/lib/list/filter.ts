/** Отбор и сортировка записей на странице списка. */

/** Значение подходит под фильтр: ничего не выбрано или выбрано это значение. */
export const picked = (sel: string[] | undefined, v: string | string[]) =>
  !sel?.length || (Array.isArray(v) ? v.some((x) => sel.includes(x)) : sel.includes(v))

/** Сортировка по значению колонки: числа — как числа, строки — по-русски с учётом цифр; пустые — в конце. */
export function sortRows<T>(rows: T[], value: ((x: T) => string | number | null) | undefined, dir: 1 | -1) {
  if (!value) return rows
  return [...rows].sort((a, b) => {
    const x = value(a)
    const y = value(b)
    if (x === y) return 0
    if (x === null) return 1
    if (y === null) return -1
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "ru", { numeric: true })) * dir
  })
}

/** Варианты фильтра с числом записей: значения → { v, label, n }. */
export function withCounts<T>(rows: T[], get: (x: T) => string | string[], opts: { v: string; label: string }[]) {
  const n = new Map<string, number>()
  for (const x of rows) for (const v of ([] as string[]).concat(get(x))) n.set(v, (n.get(v) ?? 0) + 1)
  return opts.map((o) => ({ ...o, n: n.get(o.v) ?? 0 }))
}

/** Встречающиеся значения по алфавиту (без пустых) — варианты фильтра. */
export const distinct = <T,>(rows: T[], get: (x: T) => string) =>
  [...new Set(rows.map(get))]
    .filter((v) => v && v !== "—")
    .sort()
    .map((v) => ({ v, label: v }))
