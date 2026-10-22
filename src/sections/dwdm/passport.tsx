"use client"

import { Activity, CircleAlert, Layers, Rows3, Server } from "lucide-react"
import { Chassis, Shelf, type Slot } from "@/components/passport/chassis"
import { Pill } from "@/components/list/ui"
import { Card } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { capBar, equipmentKind } from "@/sections/lines/equipment"
import { EditableTable } from "@/sections/lines/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { cn } from "@/lib/utils"
import { list, spec } from "./config"

/*
 * DWDM в паспорте (макет 24): панель — шасси, полка — 16 слотов, вкладки «Платы и трансиверы», «Длины волн».
 * TODO(API): платы, трансиверы, ошибки LOS, длины волн C-band — нет в /api/dwdm.
 */

const lambda = (x: GenRow) => {
  const [a, b] = String(x.f.lambda ?? "0 / 40")
    .split(" / ")
    .map(Number)
  return { z: a || 0, m: b || 40 }
}
/** Сетка C-band, шаг 0,8 нм: 40 каналов от 1529,0 нм. */
const GRID = Array.from({ length: 40 }, (_, i) => (1529 + i * 0.8).toFixed(1))
const SHELF = ["FIU", "M40V", "D40", "OAU1", "OBU1", "N402", "N402", "N402", "TN54", "TN54", "TN54", "", "XCH", "XCH", "SCC", "PIU"]
const PANEL: Slot[] = [
  { label: "TNC", led: "ok" },
  { label: "OPT-AMP", led: "ok", ports: 4 },
  { label: "10X10G", led: "ok", on: true, ports: 0 },
  { label: "10X10G", led: "ok", ports: 4 },
  { label: "OTU2-XP", led: "ok", ports: 4 },
  { label: "100G", led: "bad", ports: 4 },
  { label: "QSFP28", led: "ok", ports: 4 },
  { label: "" },
  { label: "" },
  { label: "TNC", led: "ok" },
  { label: "" },
  { label: "" },
  { label: "" },
  { label: "" },
  { label: "" },
]
const BOARDS = [
  { slot: "2", board: "M40V (мультиплексор)", sfp: "—", sn: "030RKT11A1", port: "—" },
  { slot: "6", board: "N402 (2×100G)", sfp: "CFP2 100G LR4", sn: "FNS2101AB1", port: "1–2" },
  { slot: "9", board: "TN54 (10×10G)", sfp: "SFP+ 10G LR", sn: "FNS2101CD4", port: "1–10" },
  { slot: "11", board: "TN54 (10×10G)", sfp: "SFP+ 10G ZR", sn: "FNS2101EF7", port: "3 — ошибка" },
]

function Waves({ x }: { x: GenRow }) {
  const { z } = lambda(x)
  return (
    <Card icon={Rows3} title="Длины волн C-band" count={GRID.length}>
      <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-2 max-[1279px]:grid-cols-10">
        {GRID.map((w, i) => (
          <span
            key={w}
            title={`${w} нм · ${i < z ? "занято" : "свободно"}`}
            className={cn(
              "grid h-10 place-items-center rounded-lg border text-[11px] tabular-nums",
              i < z ? "border-[#2f5fd0] bg-[rgba(8,94,255,0.22)] text-foreground" : "border-border text-muted-foreground",
            )}
          >
            {w}
          </span>
        ))}
      </div>
      <p className="mt-4 flex gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-[#085eff]" />
          Занято {z}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-[#5b606b]" />
          Свободно {GRID.length - z}
        </span>
      </p>
    </Card>
  )
}

const DWDM = equipmentKind({
  section: "dwdm",
  spec,
  list,
  pill: (x) => (/cisco/i.test(String(x.f.model)) ? "Cisco" : String(x.f.model).split(" ")[0]),
  panel: (c) => (
    <Chassis
      title="DWDM"
      sub={String(c.x.f.model ?? "")}
      left={`${c.x.f.model} · полка 1`}
      right="OTU4 · 100GE · C-band"
      slots={PANEL}
      callouts={[
        { t: "10X10G-LC · 10 × 10G", v: "10G-LR-1310nm · 3 из 10", pct: 30, at: 14 },
        { t: "QSFP28-100G", v: `trunk OTU4 → ${String(c.x.f.dir ?? "").split(" — ")[1] ?? "Аксай"}`, pct: 100, at: 46 },
        { t: "Слот 6 · трансивер", v: "ошибка LOS · проверить", at: 37, below: true },
      ]}
    />
  ),
  schema: (c) => (
    <Shelf
      title={`Cisco NCS 2006 · ${c.x.nodeCode}`}
      sub={`40 λ × 100G · C-band · магистраль ${c.x.f.dir ?? "Астана — Караганда"} (212 км)`}
      slots={SHELF.map((b, i) => ({ label: b, tone: !b ? "off" : i === 10 ? "bad" : /^M40|D40|XCH/.test(b) ? "blue" : "ok" }))}
      note={`${lambda(c.x).z} из ${lambda(c.x).m} длин волн · 1 трансивер с ошибкой (слот 11)`}
    />
  ),
  schemaLabel: ["Полка", Layers],
  capTitle: "",
  cap: () => [],
  extra: (c) => [
    {
      k: "boards",
      t: "Платы и трансиверы",
      icon: Server,
      n: 14,
      node: (
        <EditableTable
          icon={Server}
          title="Платы"
          noun="плата"
          cols={[
            { k: "num", t: "№ п/п" },
            { k: "slot", t: "№ Слота", req: true },
            { k: "board", t: "Плата", req: true },
            { k: "sfp", t: "Тип трансивера" },
            { k: "sn", t: "S/N" },
            { k: "port", t: "№ Порта", show: (v) => (/ошибка/.test(v) ? <Pill tone="bad">{v}</Pill> : v || "—") },
          ]}
          rows={BOARDS.map((b, i) => ({ id: String(i), num: String(i + 1), ...b }))}
        />
      ),
    },
    { k: "waves", t: "Длины волн", icon: Rows3, n: 40, node: <Waves x={c.x} /> },
  ],
  stats: (c) => [
    { icon: Rows3, t: "Длин волн", v: lambda(c.x).z, em: `из ${lambda(c.x).m}` },
    { icon: Server, t: "Плат", v: 14 },
    { icon: Activity, t: "Ёмкость", v: (lambda(c.x).z / 10).toFixed(1).replace(".", ","), em: "Тбит/с" },
  ],
  summary: (c) => [
    {
      icon: Rows3,
      title: "Длины волн",
      tab: "waves",
      v: `${lambda(c.x).z} / ${lambda(c.x).m}`,
      bar: capBar(lambda(c.x).z, lambda(c.x).m),
    },
    { icon: Activity, title: "Ёмкость", tab: "waves", v: `${(lambda(c.x).z / 10).toFixed(1).replace(".", ",")} Тбит/с` },
    { icon: Server, title: "Платы", tab: "boards", v: "14 / 16", bar: capBar(14, 16) },
    {
      icon: CircleAlert,
      title: "Ошибки",
      tab: "boards",
      v: (
        <>
          1 <em>трансивер</em>
        </>
      ),
    },
  ],
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Идентификатор УС", v: x.nodeCode },
    { t: "Населенный пункт", v: `г. ${x.city}` },
    { t: "Адрес узла связи", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
    { t: "Производитель", v: /cisco/i.test(String(x.f.model)) ? "Cisco" : String(x.f.model).split(" ")[0] },
    { t: "Модель оборудования", v: String(x.f.model ?? "—") },
    { t: "S/N оборудования", v: "SAL1834Z17Y" },
    { t: "Дата ввода в эксплуатацию", v: "2013-12-31" },
  ],
  lastEdit: (x) => ["Изменено «Длин волн занято»", String(Math.max(0, lambda(x).z - 2)), String(lambda(x).z)],
})

/** Паспорт DWDM (макет 24). */
export function DwdmPassport({ id }: { id: number }) {
  return <LinePassport k={DWDM} id={id} />
}
