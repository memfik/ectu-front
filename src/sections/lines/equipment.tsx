"use client"

import { FileText, Gauge, RadioTower, Server, Truck, UserCog } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { CapacityBars } from "@/components/passport/chassis"
import { Card, SegBar } from "@/components/passport/ui"
import type { GenRow, Spec } from "@/sections/make"
import { Table } from "@/sections/nodes/tabs"
import type { ListConfig } from "@/lib/list/types"
import type { LineCtx, LineKind, LineStat, LineSum, LineTab } from "./detail"
import { MolPane, MovesPane } from "./staff"

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

export function equipmentKind(o: {
  section: string
  spec: Spec
  list: ListConfig<GenRow>
  title?: (x: GenRow) => string
  pill: (x: GenRow) => string
  panel: (c: LineCtx) => React.ReactNode
  /** Подпись схемы ёмкости и вкладки («Ёмкость интерфейсов») */
  capTitle: string
  capTab: string
  cap: (x: GenRow) => CapRow[]
  stats: (c: LineCtx) => LineStat[]
  summary: (c: LineCtx) => LineSum[]
  rows: (x: GenRow) => { t: string; v: React.ReactNode }[]
  /** Связано: кроме узла и МОЛ */
  related?: (x: GenRow) => { icon: LucideIcon; t: string; sub: string; href?: string }[]
  /** Вкладки после ёмкости и до МОЛ */
  extra?: (c: LineCtx) => LineTab[]
  lastEdit: (x: GenRow) => [string, string, string]
}): LineKind {
  return {
    section: o.section,
    spec: o.spec,
    list: o.list,
    title: o.title,
    point: (i) => `Плата ${i + 1}`,
    color: "#4f8dff",
    sceneNode: o.panel,
    schemaNode: (c) => (
      <CapacityBars
        title={o.capTitle}
        rows={o.cap(c.x).map((r) => ({ t: r.t, a: r.z, b: r.m }))}
        note="М. — монтировано · З. — задействовано"
      />
    ),
    stageLabels: [
      ["Панель", Server],
      ["Схема", Gauge],
    ],
    strand: { tab: "", stat: "", a: ["", "#4f8dff"], b: ["", "#ffc53d"] },
    strip: "bars",
    stripTitle: () => "",
    count: () => ({ total: 0, a: 0, b: 0 }),
    pill: o.pill,
    stats: o.stats,
    summary: o.summary,
    tabs: (c) => [
      { k: "cap", t: o.capTab, icon: Gauge, node: <CapTable icon={Gauge} title={o.capTab} rows={o.cap(c.x)} /> },
      ...(o.extra?.(c) ?? []),
      { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2, node: <MolPane x={c.x} /> },
    ],
    tail: (c) => [{ k: "moves", t: "История перемещений", icon: Truck, n: 3, node: <MovesPane x={c.x} /> }],
    ends: (x, a) => [
      { code: x.nodeCode, title: a ? a.object : x.nodeCode, nodeId: a?.id },
      { code: "—", title: "—" },
    ],
    rows: o.rows,
    related: (x) => [
      { icon: RadioTower, t: x.nodeCode, sub: "узел связи", href: `/nodes/${x.nodeId}` },
      { icon: UserCog, t: "Е. Сапаров", sub: "МОЛ" },
      ...(o.related?.(x) ?? [{ icon: FileText, t: "Паспорт оборудования", sub: "PDF" }]),
    ],
    strandRows: () => [],
    inputDocs: [
      { t: "Паспорт оборудования", n: "PDF" },
      { t: "Акт ввода", n: "есть" },
      { t: "Фото", n: "6" },
    ],
    docs: DOCS,
    lastEdit: (_, x) => o.lastEdit(x),
  }
}
