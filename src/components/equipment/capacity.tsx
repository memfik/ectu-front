"use client"

import { FileText, Gauge, RadioTower, Server, Truck, UserCog } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { CapacityBars } from "@/components/passport/chassis"
import { Card, SegBar } from "@/components/passport/ui"
import { Table } from "@/components/nodes/tabs"

/*
 * Паспорт оборудования на шаблоне линии (макеты 22–24: PDH, SDH, DWDM): панель, схема ёмкости,
 * вкладки «Ёмкость …», «МОЛ и ответственные», «Документация», «История перемещений».
 */

export type CapRow = { t: string; m: number; z: number }
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

/** Полоса «занято / всего» для карточки сводки. */
export const capBar = (a: number, b: number) => (
  <SegBar
    parts={[
      { v: a, color: "#085eff" },
      { v: Math.max(0, b - a), color: "var(--chip-bg)" },
    ]}
  />
)

/** Таблица ёмкости: монтировано, задействовано, свободно, загрузка. */
export function CapTable({ icon, title, rows }: { icon: LucideIcon; title: string; rows: CapRow[] }) {
  return (
    <Card icon={icon} title={title}>
      <Table
        head={["Тип", "Монтировано (М.)", "Задействовано (З.)", "Свободно", "Загрузка"]}
        rows={rows.map((r) => ({
          key: r.t,
          cells: [
            <b key="t">{r.t}</b>,
            r.m,
            r.z,
            r.m - r.z,
            <span key="p" className="flex items-center gap-3">
              <span className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${pct(r.z, r.m)}%` }} />
              </span>
              {pct(r.z, r.m)}%
            </span>,
          ],
        }))}
      />
    </Card>
  )
}

const DOCS = [
  { name: "Паспорт оборудования", req: "PDF · производитель", uploaded: true },
  { name: "Номер и дата акта о вводе в эксплуатацию", req: "№ 154 от 12.03.2019", uploaded: true },
  { name: "Распоряжение / наряд", req: "№ 007-р", uploaded: true },
  { name: "Схема подключения", req: "—", uploaded: false },
]
