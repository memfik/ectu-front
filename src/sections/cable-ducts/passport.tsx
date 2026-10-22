"use client"

import { Building2, Cable, Rows3, Ruler, Square, RadioTower } from "lucide-react"
import { Card, Kv } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { strandBar } from "@/sections/lines/defaults"
import { parseKm, usTitle, type LineCtx, type LineKind } from "@/sections/lines/detail"
import { EditableTable } from "@/sections/lines/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import { list, spec } from "./config"

/*
 * Кабельная канализация в паспорте линии (макет 09): колодцы вместо муфт, каналы вместо жил, длины в метрах,
 * вкладки «Колодцы», «Каналы», «Сторонним организациям».
 */

const m = (km: number) => Math.round(km * 1000)
const well = (i: number) => `К-${110 + i * 2}`
/** Колодцы трассы: у начала, между участками, у конца. */
const wells = (c: LineCtx) => [c.d.route[0], ...c.d.pointLl, c.d.route[c.d.route.length - 1]]
const THIRD = { len: "120", basis: "Договор № 2024/14 с ТОО «Казтелепорт»", tu: "№ 88 от 2011" }

const KK: LineKind = {
  section: "cable-ducts",
  spec,
  list,
  point: (i) => well(i + 1),
  square: true,
  color: "#22d3ee",
  scene: "/nodes/kk-3d.png",
  meters: true,
  pointsOf: (x) => Math.min(6, Math.max(1, (Number(x.f.wells) || 6) - 2)),
  length: (x) => parseKm(x.f.len) / 1000,
  segLabel: (s) => `${s.channels} канала`,
  strand: { tab: "Каналы", stat: "Каналов", a: ["Занято", "#22d3ee"], b: ["Аренда", "#a78bfa"] },
  strip: "duct",
  stripTitle: (c) => `Сечение канализации · ${c.d.strands.length} канала · занято ${c.busy}`,
  count: (x) => {
    const total = Math.max(4, Number(x.f.channels) || 4)
    return { total, a: total - 1, b: 0 }
  },
  pill: () => "2–4 канала",
  stats: (c) => [
    { icon: Ruler, t: "Длина трассы", v: m(c.len), em: "м" },
    { icon: Rows3, t: "Каналов", v: c.d.strands.length, em: `${c.busy} занято` },
    { icon: Square, t: "Колодцев", v: wells(c).length },
  ],
  summary: (c) => [
    {
      icon: Ruler,
      title: "Длина трассы",
      tab: "wells",
      v: (
        <>
          {m(c.len)} <em>м · общая {m(c.cable)} м</em>
        </>
      ),
    },
    {
      icon: Rows3,
      title: "Каналы",
      tab: "channels",
      v: (
        <>
          {c.busy} / {c.d.strands.length} <em>занято</em>
        </>
      ),
      bar: strandBar(c),
    },
    {
      icon: Square,
      title: "Колодцы",
      tab: "wells",
      v: (
        <>
          {wells(c).length}{" "}
          <em>
            {well(0)} … {well(wells(c).length - 1)}
          </em>
        </>
      ),
    },
    {
      icon: Building2,
      title: "Сторонним",
      tab: "third",
      v: (
        <>
          {THIRD.len} <em>м · 1 договор</em>
        </>
      ),
    },
  ],
  tabs: (c) => [
    {
      k: "wells",
      t: "Колодцы",
      icon: Square,
      n: wells(c).length,
      node: (
        <EditableTable
          icon={Square}
          title="Колодцы"
          noun="колодец"
          cols={[
            { k: "num", t: "№", req: true },
            { k: "type", t: "Тип", opts: ["ККС-2", "ККС-3", "ККС-4", "ККС-5"] },
            { k: "ll", t: "Координаты" },
            { k: "channels", t: "Каналов" },
            { k: "pass", t: "Что проходит" },
          ]}
          rows={wells(c).map((ll, i) => ({
            id: String(i),
            num: well(i),
            type: i % 2 ? "ККС-2" : "ККС-3",
            ll: `${ll[0].toFixed(4)}, ${ll[1].toFixed(4)}`,
            channels: String(c.d.segments[Math.min(i, c.d.segments.length - 1)]?.channels ?? 4),
            pass: ["ВОЛС №49, КЛС №18", "ВОЛС №49", "КЛС №18", ""][i % 4],
          }))}
        />
      ),
    },
    {
      k: "channels",
      t: "Каналы",
      icon: Rows3,
      n: c.d.strands.length,
      node: (
        <EditableTable
          icon={Rows3}
          title="Каналы"
          noun="канал"
          cols={[
            { k: "num", t: "Канал", req: true },
            { k: "busy", t: "Занят", opts: ["Да", "Нет"] },
            { k: "cable", t: "Кабель" },
            { k: "owner", t: "Владелец" },
          ]}
          rows={c.d.strands.map((f, i) => ({
            id: String(i),
            num: String(i + 1),
            busy: f === "free" ? "Нет" : "Да",
            cable: f === "free" ? "" : ["ВОЛС №49 · ОКЛ-0,22-32", "КЛС №18 · ТПП 50×2", "ВОК ТОО «Казтелепорт»"][i % 3],
            owner: f === "free" ? "" : i % 3 === 2 ? `Аренда · ${THIRD.len} м` : "QMobile",
          }))}
        />
      ),
    },
    {
      k: "third",
      t: "Сторонним организациям",
      icon: Building2,
      n: 1,
      node: (
        <Card icon={Building2} title="Предоставление сторонним организациям" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Протяжённость КК предоставляемой сторонним организациям, м", v: THIRD.len },
              { t: "Основание (номер договора, письмо)", v: THIRD.basis },
              { t: "Реквизиты технических условий (ТУ)", v: THIRD.tu },
            ]}
          />
        </Card>
      ),
    },
  ],
  ends: (x, a, b) => [
    { code: a?.code ?? x.nodeCode, title: a ? usTitle(a) : "колодец", nodeId: a?.id },
    { code: b?.code ?? "—", title: b ? usTitle(b) : "УС «РТПЦ»", nodeId: b?.id },
  ],
  rows: (x, d) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Наименование участка", v: String(x.f.name ?? "—") },
    { t: "Описание", v: String(x.f.desc ?? "Одноканальная кабельная канализация") },
    { t: "Прокол", v: x.f.puncture === "Да" ? "Да, под пр. Республики" : "Нет" },
    { t: "Кол-во колодцев", v: String(x.f.wells ?? d.segments.length + 1) },
    { t: "Дата ввода в эксплуатацию", v: "14.06.2011" },
    { t: "Документ о вводе", v: "Акт № 33" },
    { t: "Длина трассы, м", v: String(x.f.len ?? "—") },
    { t: "Общая протяжённость трассы, м", v: m(d.segments.reduce((s, v) => s + v.cable, 0)) },
    { t: "Кол-во каналов", v: String(x.f.channels ?? "—") },
    {
      t: "канал/км",
      v: (((Number(x.f.channels) || 1) * parseKm(x.f.len)) / 1000 || 0).toFixed(2).replace(".", ","),
    },
  ],
  related: (x) => [
    { icon: Cable, t: "ВОЛС №49", sub: "проходит по КК", href: "/fiber-lines/49" },
    { icon: Cable, t: "КЛС №18", sub: "проходит по КК", href: "/cable-lines/18" },
    { icon: RadioTower, t: x.nodeCode, sub: "ввод в КСО", href: `/nodes/${x.nodeId}` },
  ],
  strandRows: () => [],
  inputDocs: [
    { t: "Документ о вводе", n: "Акт № 33" },
    { t: "ТУ", n: "№ 88 от 2011" },
    { t: "Договор аренды", n: "ТОО «Казтелепорт»" },
  ],
  docs: [
    { name: "Документ о вводе в эксплуатацию", req: "Акт № 33 от 14.06.2011", uploaded: true },
    { name: "Реквизиты технических условий (ТУ)", req: "№ 88 от 2011", uploaded: true },
    { name: "Основание (номер договора, письмо)", req: "Договор № 2024/14", uploaded: true },
  ],
  lastEdit: (_, x) => {
    const n = Number(x.f.wells) || 6
    return ["Изменено «Кол-во колодцев»", String(n - 1), String(n)]
  },
}

/** Паспорт кабельной канализации (макет 09). */
export function KkPassport({ id }: { id: number }) {
  return <LinePassport k={KK} id={id} />
}
