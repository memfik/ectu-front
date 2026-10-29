import { Bar, Tag } from "@/components/list/ui"
import { pair, type Val } from "@/lib/api/equipment"
import { fmt } from "@/lib/list/query"

/** Ячейки таблиц разделов 07–37: обычный текст, выделенное название, приглушённый, тег, «занято / всего» с полосой. */

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

export const Text = ({ v }: { v: Val }) => <span className="block max-w-[300px] truncate">{typeof v === "number" ? fmt(v) : String(v)}</span>

export const Bold = ({ v }: { v: Val }) => <b className="font-semibold text-[var(--link)]">{String(v)}</b>

export const Muted = ({ v }: { v: Val }) => <span className="block max-w-[260px] truncate text-muted-foreground">{String(v)}</span>

export const TagCell = ({ v }: { v: Val }) => <Tag>{String(v)}</Tag>

/** «8 / 24» с полосой (красная — больше 90%). */
export function PairCell({ v }: { v: Val }) {
  const p = pair(v)
  if (!p) return <>{String(v)}</>
  const k = pct(p[0], p[1])
  return (
    <span className="flex items-center gap-2">
      <Bar pct={k} color={k > 90 ? "#ff5257" : undefined} className="h-1 w-[56px]" />
      {String(v)}
    </span>
  )
}

/** Значение для сортировки «занято / всего» — доля занятого. */
export const pairValue = (v: Val) => {
  const p = pair(v)
  return p ? p[0] / (p[1] || 1) : typeof v === "number" ? v : String(v)
}

/** Полоса карточки «Волокна 3/32». */
export const pairBar = (t: string, v: Val) => {
  const p = pair(String(v).replace(/\s/g, ""))
  return p ? { t, v: `${p[0]}/${p[1]}`, pct: pct(p[0], p[1]) } : undefined
}
