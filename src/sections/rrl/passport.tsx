"use client"

import { Activity, ConciergeBell, Network, Radio, Ruler } from "lucide-react"
import { RadioPanel, RadioSpan } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { CapTable, capBar, equipmentKind, type CapRow } from "@/sections/lines/equipment"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { list, spec } from "./config"

/*
 * РРЛ в паспорте (макет 25): панель — IDU и ODU с уровнем сигнала, «Трасса» — пролёт между мачтами,
 * вкладки «Частоты», «Потоки Е1 и Ethernet», «Услуги». TODO(API): Tx1/Tx2, RSL/SNR, РЧС, Е1, услуги — нет в /api/rrl.
 */

const ends = (x: GenRow) => String(x.f.route ?? "").split(" — ")
const bw = (x: GenRow) => parseInt(String(x.f.bw ?? "100")) || 100
const TX = { tx1: 18340, tx2: 19350 }
const RCS = "№ 2/43-926/60786 от 19.01.2022"
const cap = (): CapRow[] => [
  { t: "Потоки Е1", m: 16, z: 8 },
  { t: "Порты Ethernet", m: 4, z: 2 },
]

const RRL = equipmentKind({
  section: "rrl",
  spec,
  list,
  title: (x) => `РРЛ ${x.f.route}`,
  pill: () => "ГРС",
  panel: (c) => (
    <RadioPanel
      left={String(c.x.f.model)}
      right={`${c.x.f.bw} · ${c.x.f.len} км`}
      indoor={{
        t: "IDU",
        sub: String(c.x.f.model),
        groups: [{ label: "GE · LAN", ports: [true, true, false, false] }],
        e1: true,
        odu: true,
      }}
      outdoor={{
        t: "ODU · на мачте",
        sub: `Tx1 ${TX.tx1} · Tx2 ${TX.tx2} MHz`,
        lines: ["RSL   -41.6 dBm", "SNR    31.2 dB", "MOD   256QAM", `CAP   ${bw(c.x)} Mbps`],
        from: "Точка #1",
        to: "Точка #2",
        len: `${c.x.f.len} км`,
      }}
      notes={[
        { t: "GE · LAN 1–2", v: "задействовано 2 из 4", pct: 50, at: 10 },
        { t: "ODU · IF кабель", v: "N-type → антенна на АМС", at: 70 },
      ]}
    />
  ),
  schema: (c) => (
    <RadioSpan
      len={`${c.x.f.len} км`}
      bw={String(c.x.f.bw)}
      label="РРЛ · пропускная способность"
      tx={[TX.tx1, TX.tx2]}
      a={`${ends(c.x)[0] ?? c.x.nodeCode} · ${c.x.address.replace(/^(г\.|с\.) [^,]+, /, "")}`}
      b={ends(c.x)[1] ?? "—"}
    />
  ),
  schemaLabel: ["Трасса", Ruler],
  capTitle: "",
  cap,
  extra: (c) => [
    {
      k: "freq",
      t: "Частоты",
      icon: Radio,
      node: (
        <Card icon={Radio} title="Частоты и разрешение РЧС" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Tx1, MHz", v: TX.tx1.toLocaleString("ru-RU") },
              { t: "Tx2, MHz", v: TX.tx2.toLocaleString("ru-RU") },
              { t: "Разрешение РЧС", v: RCS },
              { t: "Пропускная способность", v: String(c.x.f.bw ?? "—") },
              { t: "Протяжённость трассы", v: `${c.x.f.len} км` },
            ]}
          />
        </Card>
      ),
    },
    {
      k: "cap",
      t: "Потоки Е1 и Ethernet",
      icon: Activity,
      node: <CapTable icon={Activity} title="Потоки Е1 и порты Ethernet" rows={cap()} />,
    },
    {
      k: "services",
      t: "Услуги",
      icon: ConciergeBell,
      node: (
        <Card icon={ConciergeBell} title="Предоставляемые услуги" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Интернет, кбит/с", v: "102 400" },
              { t: "Передача данных, кбит/с", v: "51 200" },
              { t: "Количество голосовых каналов, шт", v: 30 },
              { t: "Номер распоряжения/наряда", v: "№ 044-р" },
              { t: "Примечание", v: "резерв ВОЛС на Косшы" },
            ]}
          />
        </Card>
      ),
    },
  ],
  stats: (c) => [
    { icon: Activity, t: "Пропускная", v: bw(c.x), em: "Мбит/с" },
    { icon: Ruler, t: "Трасса", v: String(c.x.f.len ?? "—"), em: "км" },
    { icon: Network, t: "Ethernet", v: 2, em: "из 4" },
  ],
  summary: (c) => [
    {
      icon: Activity,
      title: "Пропускная",
      tab: "freq",
      v: (
        <>
          {bw(c.x)} <em>Мбит/с</em>
        </>
      ),
    },
    { icon: Ruler, title: "Трасса", tab: "freq", v: `${c.x.f.len} км` },
    { icon: Activity, title: "E1", tab: "cap", v: "8 / 16", bar: capBar(8, 16) },
    { icon: Network, title: "Ethernet", tab: "cap", v: "2 / 4", bar: capBar(2, 4) },
  ],
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Тип сети", v: "ГРС" },
    { t: "Вендор", v: String(x.f.vendor ?? "—") },
    { t: "Модель", v: String(x.f.model ?? "—") },
    { t: "Пропускная способность, Мбит/с", v: bw(x) },
    { t: "Протяженность трассы РРЛ, км", v: String(x.f.len ?? "—") },
    { t: "Разрешение РЧС", v: RCS },
    { t: "Дата установки РРЛ", v: "2014-07-29" },
    { t: "Номер и дата распоряжения/наряда", v: "Наряд № 3221 от 18.09.2014" },
    { t: "Номер и дата акта о вводе", v: "ВП-430 от 05.08.2014 г" },
    { t: "Точка установки # 1", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
  ],
  lastEdit: (x) => ["Изменена пропускная способность", "50 Мбит/с", String(x.f.bw ?? "100 Мбит/с")],
})

/** Паспорт РРЛ (макет 25). */
export function RrlPassport({ id }: { id: number }) {
  return <LinePassport k={RRL} id={id} />
}
