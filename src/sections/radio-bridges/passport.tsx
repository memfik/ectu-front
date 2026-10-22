"use client"

import { Activity, Contact, ConciergeBell, Radio, Ruler } from "lucide-react"
import { RadioPanel, RadioSpan } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { equipmentKind } from "@/sections/lines/equipment"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { list, spec } from "./config"

/*
 * Радиомост в паспорте (макет 26): PoE-адаптер и радиоблок, пролёт до клиента, вкладки «Частоты», «Услуги».
 * TODO(API): частоты, сигнал, РЧС, клиент, услуги — нет в /api/radio-bridges.
 */

const TX: [number, number] = [5180, 5745]
const RCS = "№ 21-РЧС/118 от 03.02.2024"
const CLIENT = "БЦ «Нурлы»"
const len = (x: GenRow) => String(x.f.len ?? "1,2")
const mbps = (x: GenRow) => parseInt(String(x.f.bw ?? "20")) || 20

const RB = equipmentKind({
  section: "radio-bridges",
  spec,
  list,
  title: (x) => `Радиомост ${x.nodeCode} → клиент`,
  pill: (x) => String(x.f.network ?? "ГАС"),
  panel: (c) => (
    <RadioPanel
      left={String(c.x.f.model)}
      right={String(c.x.f.bw)}
      indoor={{
        t: "PoE",
        sub: "Gigabit PoE 24V",
        groups: [
          { label: "LAN", ports: [true] },
          { label: "POE", ports: [true] },
        ],
      }}
      outdoor={{
        t: "Радиомост",
        sub: String(c.x.f.model),
        lines: ["SIGNAL  -56 dBm", "CCQ      98 %", `CAP      ${mbps(c.x)} Mbps`, `DIST     ${len(c.x).replace(",", ".")} km`],
        from: "УС",
        to: "клиент",
        len: "",
      }}
      notes={[{ t: "PoE-адаптер · LAN", v: "→ коммутатор узла", at: 10 }]}
    />
  ),
  schema: (c) => (
    <RadioSpan
      len={`${len(c.x)} км`}
      bw={String(c.x.f.bw)}
      label="Радиомост · пропускная способность"
      tx={TX}
      a={`${c.x.nodeCode} · ${c.x.address.replace(/^(г\.|с\.) [^,]+, /, "")}`}
      b={`${CLIENT} · клиент`}
    />
  ),
  schemaLabel: ["Трасса", Ruler],
  capTitle: "",
  cap: () => [],
  extra: (c) => [
    {
      k: "freq",
      t: "Частоты",
      icon: Radio,
      node: (
        <Card icon={Radio} title="Частоты и разрешение РЧС" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Tx1, MHz", v: TX[0].toLocaleString("ru-RU") },
              { t: "Tx2, MHz", v: TX[1].toLocaleString("ru-RU") },
              { t: "Разрешение РЧС", v: RCS },
              { t: "Пропускная способность", v: String(c.x.f.bw ?? "—") },
            ]}
          />
        </Card>
      ),
    },
    {
      k: "services",
      t: "Услуги",
      icon: ConciergeBell,
      node: (
        <Card icon={ConciergeBell} title="Предоставляемые услуги" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Интернет, кбит/с", v: (mbps(c.x) * 1024).toLocaleString("ru-RU") },
              { t: "Передача данных, кбит/с", v: (mbps(c.x) * 512).toLocaleString("ru-RU") },
              { t: "Количество голосовых каналов, шт", v: 0 },
              { t: "Примечание", v: "последняя миля до БЦ" },
            ]}
          />
        </Card>
      ),
    },
  ],
  stats: (c) => [
    { icon: Activity, t: "Пропускная", v: mbps(c.x), em: "Мбит/с" },
    { icon: Ruler, t: "Трасса", v: len(c.x), em: "км" },
    { icon: Radio, t: "Частоты", v: "5 ГГц" },
  ],
  summary: (c) => [
    {
      icon: Activity,
      title: "Пропускная",
      tab: "freq",
      v: (
        <>
          {mbps(c.x)} <em>Мбит/с</em>
        </>
      ),
    },
    { icon: Ruler, title: "Трасса", tab: "freq", v: `${len(c.x)} км` },
    {
      icon: Radio,
      title: "Tx1 / Tx2",
      tab: "freq",
      v: (
        <>
          {TX[0]} / {TX[1]} <em>MHz</em>
        </>
      ),
    },
    { icon: Contact, title: "Клиент", tab: "services", v: CLIENT },
  ],
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Вендор", v: String(x.f.vendor) === "Ubiquiti" ? "Ubiquiti Networks" : String(x.f.vendor ?? "—") },
    { t: "Модель", v: String(x.f.model ?? "—") },
    { t: "Тип сети", v: String(x.f.network ?? "—") },
    { t: "Пропускная способность радиомоста, Мбит/с", v: mbps(x) },
    { t: "Протяженность трассы, км", v: len(x) },
    { t: "Разрешение РЧС", v: RCS },
    { t: "Дата установки радиомоста", v: "2026-07-08" },
    { t: "Номер и дата распоряжения/наряда", v: "наряд в kcrm 72268-УФ/01072026/1028" },
    { t: "Номер и дата акта о вводе", v: "№ 9 от 20.02.2024" },
    { t: "Точка установки # 1", v: x.address },
  ],
  lastEdit: (x) => ["Изменена пропускная способность", "10 Мбит/с", String(x.f.bw ?? "20 Мбит/с")],
})

/** Паспорт радиомоста (макет 26). */
export function RadioBridgePassport({ id }: { id: number }) {
  return <LinePassport k={RB} id={id} />
}
