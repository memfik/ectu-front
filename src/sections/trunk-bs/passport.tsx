"use client"

import { Activity, Radio, RadioTower, Signal, Users } from "lucide-react"
import { Pill } from "@/components/list/ui"
import { Note } from "@/components/passport/radio"
import { LinePassport } from "@/sections/lines/passport"
import { Coverage } from "@/sections/lines/bwa"
import { equipmentKind } from "@/sections/lines/equipment"
import { EditableTable } from "@/sections/lines/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { list, spec } from "./config"

/*
 * БС Транк в паспорте (макет 30): ретранслятор с дисплеем каналов, покрытие 25 км, вкладка «Абонентские терминалы».
 * TODO(API): частоты, стандарт, высота АМС, терминалы (ISSI, владелец) — нет в /api/trunk-bs.
 */

const terminals = (x: GenRow) => Number(x.f.terminals) || 0
const state = (x: GenRow) => String(x.f.state ?? "в работе")
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const TERMINALS = [
  { type: "Motorola MTP3550", owner: "ТОО «Тенгизшевройл»", issi: "1001", st: "Активен" },
  { type: "Motorola MTP3550", owner: "АО «КазМунайГаз»", issi: "1002", st: "Активен" },
  { type: "Motorola MTM5400", owner: "Аким. Кульсары", issi: "1010", st: "Выключен" },
]

/** Ретранслятор (bc-04-panel): дисплей канала, ручки, решётка, антенные разъёмы TX / RX. */
function Panel({ x }: { x: GenRow }) {
  return (
    <div className="absolute inset-x-0 top-[50px] px-[2%] max-[1279px]:top-0">
      <div className="relative h-[100px]">
        <Note t="Канал · частоты" v="151.250 / 155.850 МГц" at={24} />
        <Note t="Антенны" v="TX / RX на АМС" at={74} />
      </div>
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>{String(x.f.model)}</span>
        <span>TETRA / SmartTrunk</span>
      </p>
      <div className="relative mt-2 flex h-[160px] items-center gap-5 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#17191f)] px-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#d9dce3)]">
        <span className="w-[300px] flex-none">
          <b className="block text-sm font-semibold">Ретранслятор</b>
          <span className="block truncate text-[11px] text-muted-foreground">{String(x.f.model)}</span>
        </span>
        <pre className="rounded-lg border border-[#a3801f] bg-[#1c1606] px-3 py-2 font-mono text-[11px] leading-[1.6] text-[#ffc53d]">
          {"CH 05  TX 151.250\n       RX 155.850\nSITE  SmartTrunk2"}
        </pre>
        {[0, 1].map((i) => (
          <i key={i} className="relative size-9 rounded-full border-2 border-[#5b606b] bg-[#2a2d35]">
            <i className="absolute top-1 left-1/2 h-3 w-0.5 -translate-x-1/2 rounded bg-white" />
          </i>
        ))}
        <span className="h-[120px] flex-1 rounded-md bg-[repeating-linear-gradient(90deg,#0b0c10_0_3px,#2a2d35_3px_6px)] opacity-80" />
        <span className="flex flex-col items-center gap-1.5">
          {["TX", "RX"].map((t) => (
            <span key={t} className="flex flex-col items-center gap-0.5">
              <i className="grid size-9 place-items-center rounded-full border-2 border-[#4f8dff] bg-[#0b0c10] shadow-[0_0_10px_rgba(79,141,255,0.5)]">
                <i className="size-3 rounded-full bg-white" />
              </i>
              <span className="text-[8px] text-muted-foreground">{t}</span>
            </span>
          ))}
          <span className="text-[8px] tracking-[0.5px] text-muted-foreground">ANT</span>
        </span>
      </div>
    </div>
  )
}

const BC = equipmentKind({
  section: "trunk-bs",
  spec,
  list,
  pill: () => "TETRA",
  panel: (c) => <Panel x={c.x} />,
  schema: (c) => <Coverage n={1} km={25} freq="410" used={terminals(c.x)} total={Math.max(64, terminals(c.x))} />,
  schemaLabel: ["Покрытие", Signal],
  capTitle: "",
  cap: () => [],
  extra: (c) => [
    {
      k: "terminals",
      t: "Абонентские терминалы",
      icon: Users,
      n: terminals(c.x),
      node: (
        <EditableTable
          icon={Users}
          title="Абонентские терминалы"
          noun="терминал"
          cols={[
            { k: "num", t: "№" },
            { k: "type", t: "Тип абонентского терминала", req: true },
            { k: "owner", t: "Владелец" },
            { k: "issi", t: "ISSI" },
            { k: "st", t: "Статус", opts: ["Активен", "Выключен"], show: (v) => <Pill tone={v === "Активен" ? "ok" : "muted"}>{v}</Pill> },
          ]}
          rows={TERMINALS.map((t, i) => ({ id: String(i), num: String(i + 1), ...t }))}
        />
      ),
    },
  ],
  stats: (c) => [
    { icon: Users, t: "Терминалов", v: terminals(c.x) },
    { icon: Activity, t: "Состояние", v: cap(state(c.x)) },
    { icon: RadioTower, t: "АМС", v: 36, em: "м" },
  ],
  summary: (c) => [
    {
      icon: Users,
      title: "Терминалы",
      tab: "terminals",
      v: (
        <>
          {terminals(c.x)} <em>Motorola MTP3550</em>
        </>
      ),
    },
    { icon: Activity, title: "Состояние БС", tab: "terminals", v: cap(state(c.x)) },
    { icon: RadioTower, title: "Место", tab: "terminals", v: "АМС 36 м" },
    { icon: Radio, title: "Стандарт", tab: "terminals", v: "TETRA" },
  ],
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Идентификатор УС", v: x.nodeCode },
    { t: "Населенный пункт", v: `г. ${x.city}` },
    { t: "Адрес узла связи", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
    { t: "Тип/модель БС", v: String(x.f.model ?? "—") },
    { t: "Место установки", v: String(x.f.place ?? "—") },
    { t: "Состояние БС", v: state(x) },
    { t: "Количество абонентских терминалов, шт.", v: terminals(x) },
    { t: "Тип абонентского терминала", v: "Motorola GP-680" },
  ],
  lastEdit: (x) => ["Изменено «Количество абонентских терминалов»", String(Math.max(0, terminals(x) - 2)), String(terminals(x))],
})

/** Паспорт БС Транк (макет 30). */
export function TrunkPassport({ id }: { id: number }) {
  return <LinePassport k={BC} id={id} />
}
