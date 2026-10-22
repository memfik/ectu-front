"use client"

import { Activity, Calendar, Contact, Network } from "lucide-react"
import { Unit1U } from "@/components/passport/chassis"
import { LinePassport } from "@/sections/lines/passport"
import { capBar, equipmentKind, type CapRow } from "@/sections/lines/equipment"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { list, spec } from "./config"

/*
 * PDH в паспорте (макет 22): панель 1U с портами E1 и Ethernet, ёмкость интерфейсов.
 * TODO(API): E3, Ethernet 10/100/1000, производитель, дата ввода, клиент — в /api/pdh их нет.
 */

const e1 = (x: GenRow) => {
  const [a, b] = String(x.f.e1 ?? "0 / 4")
    .split(" / ")
    .map(Number)
  return { z: a || 0, m: b || 4 }
}
const cap = (x: GenRow): CapRow[] => [
  { t: "E1", m: e1(x).m, z: e1(x).z },
  { t: "E3", m: 2, z: 1 },
  { t: "10", m: 4, z: 2 },
  { t: "100", m: 4, z: 3 },
  { t: "1000", m: 2, z: 1 },
]
const eth = (x: GenRow) =>
  cap(x)
    .slice(2)
    .reduce((s, r) => ({ m: s.m + r.m, z: s.z + r.z }), { m: 0, z: 0 })
const CLIENT = "АО «КазТрансКом»"

const PDH = equipmentKind({
  section: "pdh",
  spec,
  list,
  pill: (x) => String(x.f.vendor ?? "—"),
  panel: (c) => {
    const { z, m } = e1(c.x)
    const shown = Math.min(m, 8)
    return (
      <Unit1U
        title="PDH"
        sub={String(c.x.f.model ?? "")}
        left={`${c.x.f.model} · 1U`}
        right={`S/N ${c.x.f.serial ?? c.x.f.client ?? "—"}`}
        groups={[
          { label: "E1 · RJ-48", ports: Array.from({ length: shown }, (_, i) => (i < z ? "up" : "free")) },
          { label: "ETH 10/100", ports: ["up"] },
        ]}
        callouts={[
          { t: `E1 · порты 1–${Math.max(1, z)}`, v: `задействовано ${z} из ${m}`, pct: (z / m) * 100, at: 14 },
          { t: "Оптический линк · Tx / Rx", v: "1310 нм · одномод", at: 72 },
        ]}
      />
    )
  },
  capTitle: "Интерфейсы PDH · М. / З.",
  capTab: "Ёмкость интерфейсов",
  cap,
  stats: (c) => [
    { icon: Activity, t: "E1", v: e1(c.x).z, em: `из ${e1(c.x).m}` },
    { icon: Network, t: "Ethernet", v: eth(c.x).z, em: `из ${eth(c.x).m}` },
    { icon: Calendar, t: "В работе с", v: 2014 },
  ],
  summary: (c) => [
    { icon: Activity, title: "E1", tab: "cap", v: `${e1(c.x).z} / ${e1(c.x).m}`, bar: capBar(e1(c.x).z, e1(c.x).m) },
    { icon: Activity, title: "E3", tab: "cap", v: "1 / 2", bar: capBar(1, 2) },
    { icon: Network, title: "Ethernet 10/100/1000", tab: "cap", v: `${eth(c.x).z} / ${eth(c.x).m}`, bar: capBar(eth(c.x).z, eth(c.x).m) },
    {
      icon: Contact,
      title: "Клиент",
      tab: "cap",
      v: (
        <>
          КазТрансКом <em>АО</em>
        </>
      ),
    },
  ],
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Вендор", v: String(x.f.vendor ?? "—") },
    { t: "Модель оборудования", v: String(x.f.model ?? "—") },
    { t: "Производитель", v: x.f.vendor === "RAD" ? "RAD Data Communications" : String(x.f.vendor ?? "—") },
    { t: "Идентификатор УС", v: x.nodeCode },
    { t: "Населенный пункт", v: x.city },
    { t: "S/N оборудования", v: String(x.f.serial ?? x.f.client ?? "—") },
    { t: "Дата ввода в эксплуатацию", v: "14.06.2014" },
    { t: "Фактический адрес", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
    { t: "Наименование клиента", v: CLIENT },
    { t: "М. (E1)", v: e1(x).m },
  ],
  lastEdit: (x) => ["Изменено «З. (E1)»", String(Math.max(0, e1(x).z - 1)), String(e1(x).z)],
})

/** Паспорт PDH (макет 22). */
export function PdhPassport({ id }: { id: number }) {
  return <LinePassport k={PDH} id={id} />
}
