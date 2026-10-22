"use client"

import { useState } from "react"
import { Activity, ArrowLeftRight, FileText, Hash, Phone, RadioTower, Truck, UserCog, Users } from "lucide-react"
import { Card, Kv } from "@/components/passport/ui"
import { CapacityBars, Chassis, type Slot } from "@/components/passport/chassis"
import { Table } from "@/sections/nodes/tabs"
import { LinePassport } from "@/sections/lines/passport"
import { type LineCtx, type LineKind } from "@/sections/lines/detail"
import { BRANCHES, nodeRows } from "@/sections/nodes/data"
import { staffOf } from "@/sections/spd/detail"
import { MolTab, MovesTab, type Staff } from "@/sections/spd/tabs"
import { SegBar } from "@/components/passport/ui"
import { list, spec } from "./config"

/*
 * АТС в паспорте (макет 20): панель — шасси с платами абонентов, Е1 и управления; схема — ёмкость станции,
 * вкладки «Ёмкость и абоненты», «Линии и потоки», «МОЛ и ответственные», «История перемещений».
 * TODO(API): платы, ОТА МГ/МН, Е1, E&M, СТОП, установки / отключения — в /api/ats их нет.
 */

const pair = (x: LineCtx["x"]) => {
  const [a, b] = String(x.f.capacity ?? "0 / 0")
    .split(" / ")
    .map(Number)
  return { used: a || 0, total: b || 0 }
}
/** Порты станции и абоненты: монтировано / задействовано. */
const cap = (c: LineCtx) => {
  const { used, total } = pair(c.x)
  const ota = Number(c.x.f.ota) || 0
  return [
    { t: "Порты станции", m: total, z: used },
    { t: "ОТА", m: total, z: ota },
    { t: "ОТА с выходом на МГ", m: ota, z: Math.round(ota * 0.89) },
    { t: "ОТА с выходом на МН", m: ota, z: Math.round(ota * 0.33) },
  ]
}
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
const E1 = { m: 32, z: 24 }
const EM = { m: 24, z: 16 }

/** МОЛ и ответственные — свой стейт на вкладке. */
function MolPane({ c }: { c: LineCtx }) {
  const [d, set] = useState<Staff>(() => staffOf({ branch: c.x.branch, nodeCode: c.x.nodeCode, since: "12.03.2019" }, "Отдел эксплуатации"))
  return <MolTab d={d} onChange={(mol) => set({ ...d, mol })} />
}
function MovesPane({ c }: { c: LineCtx }) {
  const [d, set] = useState<Staff>(() => staffOf({ branch: c.x.branch, nodeCode: c.x.nodeCode, since: "12.03.2019" }, "Отдел эксплуатации"))
  return <MovesTab d={d} x={c.x} onChange={(moves) => set({ ...d, moves })} />
}

const SLOTS: Slot[] = [
  ...Array.from({ length: 6 }, () => ({ label: "MEA-48", led: "ok" as const })),
  { label: "CMH", led: "ok", on: true, ports: 0 },
  { label: "CMH", led: "ok" },
  { label: "SIG", led: "ok", ports: 1 },
  { label: "E1 × 32", led: "ok", ports: 1 },
  { label: "E1 × 32", led: "warn", ports: 1 },
  ...Array.from({ length: 4 }, () => ({ label: "MEA-48", led: "ok" as const })),
  { label: "" },
]

const ATS: LineKind = {
  section: "pbx",
  spec,
  list,
  title: (x) => String(x.f.object ?? spec.name(x)),
  point: (i) => `Плата ${i + 1}`,
  color: "#4f8dff",
  sceneNode: (c) => {
    const { used, total } = pair(c.x)
    return (
      <Chassis
        title="АТС"
        sub={String(c.x.f.model ?? "")}
        left={`${c.x.f.model} · полка 1`}
        right={`ёмкость ${used} / ${total} портов`}
        slots={SLOTS}
        callouts={[
          { t: "Платы MEA-48 · абонентские", v: `${c.x.f.ota} ОТА подключено`, pct: pct(Number(c.x.f.ota), total), at: 12 },
          { t: "E1 · потоки", v: `${E1.m * 2} смонтировано · ${E1.z / 2 - 2} задействовано`, pct: 16, at: 48 },
          { t: "Плата управления CMH", v: "активная · резерв в слоте 8", at: 36, below: true },
        ]}
      />
    )
  },
  schemaNode: (c) => (
    <CapacityBars
      title="Ёмкость станции и подключения"
      rows={[
        ...cap(c).map((r) => ({ t: r.t.replace("ОТА с выходом на ", "ОТА · ").replace("Порты станции", "Порты"), a: r.z, b: r.m })),
        { t: "E1 (поток)", a: E1.z, b: E1.m },
        { t: "E&M (порт)", a: EM.z, b: EM.m },
      ]}
      note="М. — монтировано · З. — задействовано"
    />
  ),
  stageLabels: [
    ["Панель", Hash],
    ["Схема", Hash],
  ],
  strand: { tab: "", stat: "", a: ["", "#4f8dff"], b: ["", "#ffc53d"] },
  strip: "bars",
  stripTitle: () => "",
  count: () => ({ total: 0, a: 0, b: 0 }),
  pill: (x) => String(x.f.network ?? "ГМС"),
  stats: (c) => {
    const { used, total } = pair(c.x)
    return [
      { icon: Phone, t: "Ёмкость", v: used.toLocaleString("ru-RU"), em: `из ${total.toLocaleString("ru-RU")} портов` },
      { icon: Users, t: "ОТА", v: Number(c.x.f.ota).toLocaleString("ru-RU"), em: "абонентов" },
      { icon: Activity, t: "E1", v: E1.z, em: "потока" },
    ]
  },
  summary: (c) => {
    const { used, total } = pair(c.x)
    return [
      {
        icon: Phone,
        title: "Ёмкость",
        tab: "cap",
        v: (
          <>
            {pct(used, total)}%{" "}
            <em>
              {used.toLocaleString("ru-RU")} / {total.toLocaleString("ru-RU")}
            </em>
          </>
        ),
        bar: (
          <SegBar
            parts={[
              { v: used, color: "#085eff" },
              { v: total - used, color: "var(--chip-bg)" },
            ]}
          />
        ),
      },
      {
        icon: Users,
        title: "ОТА",
        tab: "cap",
        v: (
          <>
            {Number(c.x.f.ota).toLocaleString("ru-RU")} <em>абонентов</em>
          </>
        ),
      },
      { icon: Activity, title: "Потоки E1", tab: "lines", v: E1.z },
      {
        icon: ArrowLeftRight,
        title: "За период",
        tab: "lines",
        v: (
          <>
            +14 / −31 <em>установки / отключения</em>
          </>
        ),
      },
    ]
  },
  tabs: (c) => [
    {
      k: "cap",
      t: "Ёмкость и абоненты",
      icon: Hash,
      node: (
        <Card icon={Hash} title="Ёмкость и абоненты">
          <Table
            head={["Тип", "Монтировано (М.)", "Задействовано (З.)", "Свободно", "Загрузка"]}
            rows={cap(c).map((r) => ({
              key: r.t,
              cells: [
                <b key="t">{r.t}</b>,
                r.m.toLocaleString("ru-RU"),
                r.z.toLocaleString("ru-RU"),
                (r.m - r.z).toLocaleString("ru-RU"),
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
      ),
    },
    {
      k: "lines",
      t: "Линии и потоки",
      icon: Activity,
      node: (
        <Card icon={Activity} title="Линии и потоки" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "E&M (порт)", v: EM.z },
              { t: "Е1 (поток)", v: E1.z },
              { t: "Двухпроводная СЛ (СТОП), номеров", v: 30 },
              { t: "Наличие выхода в СТОП", v: "+" },
              { t: "Телефонов КТС", v: 64 },
              { t: "Установок за период", v: 14 },
              { t: "Отключений за период", v: 31 },
            ]}
          />
        </Card>
      ),
    },
    { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2, node: <MolPane c={c} /> },
  ],
  tail: (c) => [{ k: "moves", t: "История перемещений", icon: Truck, n: 3, node: <MovesPane c={c} /> }],
  ends: (x, a) => [
    { code: x.nodeCode, title: a ? a.object : x.nodeCode, nodeId: a?.id },
    { code: "—", title: "—" },
  ],
  rows: (x) => {
    const n = nodeRows().find((v) => v.id === x.nodeId)
    return [
      { t: "Нумерация", v: x.num },
      { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
      { t: "Наименование объекта связи", v: String(x.f.object ?? "—") },
      { t: "Идентификатор УС", v: x.nodeCode },
      { t: "Населенный пункт", v: `г. ${x.city}` },
      { t: "Адрес объекта связи", v: (n?.address ?? x.address).replace(/^(г\.|с\.) [^,]+, /, "") },
      { t: "Тип сети*", v: String(x.f.network ?? n?.network ?? "—") },
      { t: "Модель станции", v: String(x.f.model ?? "—") },
      { t: "Наличие выхода в СТОП (+/-)", v: "+" },
      { t: "Кол-во установок за период (АИС, ф. № 3)", v: 14 },
      { t: "Кол-во отключений за период", v: 31 },
      { t: "Ёмкость монтированная (порт)", v: pair(x).total },
    ]
  },
  related: (x) => [
    { icon: RadioTower, t: x.nodeCode, sub: "узел связи", href: `/nodes/${x.nodeId}` },
    { icon: UserCog, t: "Е. Сапаров", sub: "МОЛ" },
    { icon: FileText, t: "Паспорт оборудования", sub: "PDF" },
  ],
  strandRows: () => [],
  inputDocs: [
    { t: "Паспорт оборудования", n: "PDF" },
    { t: "Акт ввода", n: "есть" },
    { t: "Фото", n: "6" },
  ],
  docs: [
    { name: "Паспорт оборудования", req: "PDF · производитель", uploaded: true },
    { name: "Номер и дата акта о вводе в эксплуатацию", req: "№ 154 от 12.03.2019", uploaded: true },
    { name: "Распоряжение / наряд", req: "№ 007-р", uploaded: true },
    { name: "Схема подключения", req: "—", uploaded: false },
  ],
  lastEdit: (_, x) => ["Изменено «Кол-во ОТА»", String((Number(x.f.ota) || 1) - 6), String(x.f.ota)],
}

/** Паспорт АТС (макет 20). */
export function AtsPassport({ id }: { id: number }) {
  return <LinePassport k={ATS} id={id} />
}
