"use client"

import { Activity, Layers, Rows3, Server } from "lucide-react"
import { Chassis, type Slot } from "@/components/passport/chassis"
import { glass } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { capBar, equipmentKind, type CapRow } from "@/sections/lines/equipment"
import { EditableTable } from "@/sections/lines/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { cn } from "@/lib/utils"
import { list, spec } from "./config"

/*
 * SDH в паспорте (макет 23): панель — шасси с платами, «Полка» — 15 слотов, вкладки «Ёмкость», «Платы».
 * TODO(API): платы по слотам (иерархия шасси → платы по parent_id), STM-4/16, VC-3/4, E1/E3, Ethernet — нет в /api/sdh.
 */

const pair = (v: unknown, d: number) => {
  const [a, b] = String(v ?? `0 / ${d}`)
    .split(" / ")
    .map(Number)
  return { z: a || 0, m: b || d }
}
const stm = (x: GenRow) => pair(x.f.stm, 8)
const vc = (x: GenRow) => pair(x.f.vc, 252)
const cap = (x: GenRow): CapRow[] => [
  { t: "STM-1", m: stm(x).m, z: stm(x).z },
  { t: "STM-4", m: 4, z: 2 },
  { t: "STM-16", m: 2, z: 1 },
  { t: "VC-12", m: vc(x).m, z: vc(x).z },
  { t: "VC-3", m: 6, z: 2 },
  { t: "VC-4", m: 4, z: 3 },
  { t: "E1", m: 63, z: Math.min(63, Math.round(vc(x).z * 0.27)) },
  { t: "E3", m: 3, z: 1 },
  { t: "10", m: 8, z: 2 },
  { t: "100", m: 8, z: 6 },
  { t: "1000", m: 4, z: 3 },
]
const stmAll = (x: GenRow) =>
  cap(x)
    .slice(0, 3)
    .reduce((s, r) => ({ m: s.m + r.m, z: s.z + r.z }), { m: 0, z: 0 })
/** Полка 15 слотов (sdh-04-schema): синие — оптика и кросс, зелёные — трибутарные, пустой — 12. */
const SHELF = ["SL16", "SL16", "SL4", "SL4", "SL1", "SL1", "PQ1 E1", "PQ1 E1", "PL3 E3", "EFS8", "EGS4", "", "GXCSA", "GXCSA", "SCC"]
const PANEL: Slot[] = [
  { label: "TCC2P", led: "ok" },
  { label: "XC-VXC", led: "ok" },
  { label: "MRC12", led: "ok", on: true, ports: 0 },
  { label: "MRC12", led: "ok", ports: 4 },
  { label: "CE-100T", led: "ok" },
  { label: "E1-63", led: "ok", ports: 1 },
  { label: "E1-63", led: "ok", ports: 1 },
  { label: "" },
  { label: "CE-100T", led: "warn" },
  { label: "STM-4", led: "ok", ports: 4 },
  { label: "" },
  { label: "XC-VXC", led: "ok" },
  { label: "TCC2P", led: "ok" },
  { label: "" },
  { label: "" },
]
const BOARDS = [
  { slot: "1", board: "SL16 (STM-16)", port: "1", sn: "030HJT10A7" },
  { slot: "3", board: "SL4 (STM-4)", port: "1–2", sn: "030HJT11B2" },
  { slot: "7", board: "PQ1 (63×E1)", port: "1–63", sn: "030HJT12C9" },
  { slot: "10", board: "EFS8 (FE)", port: "1–8", sn: "030HJT14E1" },
  { slot: "13", board: "GXCSA (кросс)", port: "—", sn: "030HJT15F3" },
]

function Shelf({ x }: { x: GenRow }) {
  return (
    <div className="absolute inset-x-0 top-[120px] px-[3%] max-[1279px]:top-0">
      <section className={cn(glass, "p-7")}>
        <b className="block text-base font-semibold">
          {String(x.f.model)} M12 · {x.nodeCode}
        </b>
        <span className="text-xs text-muted-foreground">Полка 1 · 15 слотов · кольцо Астана-Север</span>
        <div className="mt-6 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-2">
          {SHELF.map((b, i) => {
            const blue = /^SL|GXC/.test(b)
            return (
              <span
                key={i}
                className={cn(
                  "relative flex h-[190px] flex-col items-center justify-between rounded-lg border-2 py-2.5",
                  !b ? "border-transparent bg-[var(--chip-bg)]" : blue ? "border-[#4f8dff]" : "border-[#2bd463]",
                )}
              >
                <i className={cn("size-2 self-start ml-2.5 rounded-full", !b ? "bg-[#3a3f4b]" : blue ? "bg-[#4f8dff]" : "bg-[#2bd463]")} />
                <span className="text-[11px] font-medium whitespace-nowrap [writing-mode:vertical-rl] rotate-180">{b}</span>
                <span className="text-[10px] text-muted-foreground">{i + 1}</span>
              </span>
            )
          })}
        </div>
      </section>
      <p className="mx-auto mt-10 w-fit rounded-xl border border-[#085eff] bg-[var(--glass-card)] px-14 py-2.5 text-sm backdrop-blur-[12px]">
        STM-16 → SDH ast011 · STM-16 → SDH alm-магистраль
      </p>
    </div>
  )
}

const SDH = equipmentKind({
  section: "sdh",
  spec,
  list,
  pill: (x) => (String(x.f.vendor) === "CISCO" ? "Cisco" : String(x.f.vendor ?? "—")),
  panel: (c) => (
    <Chassis
      title="SDH"
      sub={String(c.x.f.model ?? "")}
      left={`${c.x.f.model} · полка 1`}
      right="STM-16 · VC-12 · E1"
      slots={PANEL}
      callouts={[
        { t: "Слот 6 · MRC12 · STM-16", v: "кольцо Уральск — Аксай", pct: 100, at: 14 },
        { t: "E1-63", v: "VC-12: 71 из 71", pct: 100, at: 50 },
        { t: "Слот 14 · CE-100T", v: "Ethernet over SDH · 2 из 8", at: 34, below: true },
      ]}
    />
  ),
  schema: (c) => <Shelf x={c.x} />,
  schemaLabel: ["Полка", Layers],
  capTitle: "Ёмкость SDH · М. / З.",
  capTab: "Ёмкость",
  cap,
  extra: () => [
    {
      k: "boards",
      t: "Платы",
      icon: Server,
      n: 11,
      node: (
        <EditableTable
          icon={Server}
          title="Платы"
          noun="плата"
          cols={[
            { k: "num", t: "№ п/п" },
            { k: "slot", t: "№ Слота", req: true },
            { k: "board", t: "Плата", req: true },
            { k: "port", t: "№ Порта" },
            { k: "sn", t: "S/N" },
          ]}
          rows={BOARDS.map((b, i) => ({ id: String(i), num: String(i + 1), ...b }))}
        />
      ),
    },
  ],
  stats: (c) => [
    { icon: Activity, t: "STM-1", v: stm(c.x).z, em: `из ${stm(c.x).m}` },
    { icon: Rows3, t: "VC-12", v: vc(c.x).z, em: `из ${vc(c.x).m}` },
    { icon: Server, t: "Плат", v: 11 },
  ],
  summary: (c) => {
    const s = stmAll(c.x)
    const e1 = cap(c.x)[6]
    return [
      { icon: Activity, title: "STM-1/4/16", tab: "cap", v: `${s.z} / ${s.m}`, bar: capBar(s.z, s.m) },
      { icon: Rows3, title: "VC-12", tab: "cap", v: `${vc(c.x).z} / ${vc(c.x).m}`, bar: capBar(vc(c.x).z, vc(c.x).m) },
      { icon: Activity, title: "E1", tab: "cap", v: `${e1.z} / ${e1.m}`, bar: capBar(e1.z, e1.m) },
      {
        icon: Server,
        title: "Платы",
        tab: "boards",
        v: (
          <>
            11 <em>из 15 слотов</em>
          </>
        ),
        bar: capBar(11, 15),
      },
    ]
  },
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Идентификатор УС", v: x.nodeCode },
    { t: "Населенный пункт", v: `г. ${x.city}` },
    { t: "Адрес узла связи", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
    { t: "Производитель", v: String(x.f.vendor ?? "—") },
    { t: "Модель оборудования", v: String(x.f.model ?? "—") },
    { t: "S/N оборудования", v: "FOX1305G104" },
    { t: "Дата ввода в эксплуатацию", v: "2010-12-27" },
    { t: "М. (STM-1)", v: stm(x).m },
    { t: "З. (STM-1)", v: stm(x).z },
    { t: "М. (STM-4)", v: 4 },
  ],
  lastEdit: (x) => ["Изменено «З. (VC-12)»", String(Math.max(0, vc(x).z - 4)), String(vc(x).z)],
})

/** Паспорт SDH (макет 23). */
export function SdhPassport({ id }: { id: number }) {
  return <LinePassport k={SDH} id={id} />
}
