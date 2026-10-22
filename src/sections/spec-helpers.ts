import type { NodeRow } from "@/sections/nodes/data"

/** Помощники описаний разделов: случайный выбор, числа, «занято / всего», общие KPI. */

export const pick = <T>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)]
export const num = (r: () => number, a: number, b: number) => Math.round(a + r() * (b - a))
export const km = (r: () => number, a: number, b: number) => (a + r() * (b - a)).toFixed(2).replace(".", ",")
export const used = (r: () => number, total: number, k = 0.75) => `${Math.max(0, Math.round(total * (0.2 + r() * k)))} / ${total}`
export const obj = (n: NodeRow) => n.object

export const LINES = "Линии и сооружения"
export const STD_KPI = (a: string, b: string, c: string) => [
  { t: a, color: "#a78bfa", value: b, note: c },
  { t: "Без документов", color: "#22d3ee", value: "22%", note: "", pct: 22 },
  { t: "На карте", color: "var(--status-ok)", value: "96%", note: "", pct: 96 },
]
export const WIRELESS = "Оборудование / Беспроводные технологии"
export const SAT = "Оборудование / Спутниковые технологии"
