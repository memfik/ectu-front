"use client"

import { Phone, RadioTower, Waypoints } from "lucide-react"
import { LinePassport } from "@/sections/lines/passport"
import type { LineKind } from "@/sections/lines/detail"
import { BRANCHES } from "@/sections/nodes/data"
import { list, spec } from "./config"

/** КЛС в паспорте линии (макет 08): медные пары JM / аренда, боксы, без аренды КК и типа прокладки. */
const KLS: LineKind = {
  section: "cable-lines",
  spec,
  list,
  point: "Бокс",
  color: "#ffc53d",
  scene: "/nodes/kls-3d.png",
  strand: { tab: "Медные пары", stat: "Медных пар", a: ["JM", "#ffc53d"], b: ["Аренда", "#a78bfa"], dots: true },
  count: (x) => {
    const total = Number(x.f.pairs) || 10
    const a = Math.round(total * 0.68)
    return { total, a, b: Math.round(total * 0.12) }
  },
  busyB: true,
  third: "segments",
  ends: (x, a) => {
    const [from = x.nodeCode, to = "РШ-14"] = String(x.f.route ?? "").split(" → ")
    return [
      { code: a?.code ?? x.nodeCode, title: from, nodeId: a?.id },
      { code: "—", title: to },
    ]
  },
  rows: (x, d) => {
    const c = KLS.count(x)
    return [
      { t: "Нумерация", v: x.num },
      { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
      { t: "Наименование трассы КЛС", v: String(x.f.name ?? "—") },
      { t: "Протяжённость трассы, км", v: String(x.f.len ?? "—") },
      { t: "Суммарная длина кабеля, км", v: String(d.segments.reduce((s, v) => s + v.cable, 0).toFixed(2)).replace(".", ",") },
      { t: "Начало участка", v: d.start.title },
      { t: "Конец участка", v: d.end.title },
      { t: "Тип сети", v: String(x.f.network ?? "ГРС") },
      { t: "Принадлежность кабеля", v: String(x.f.owner ?? "—") },
      { t: "Общее кол-во медных пар", v: c.total },
      { t: "Пар принадл. JM", v: c.a },
      { t: "Арендуемых пар", v: c.b },
    ]
  },
  related: (x) => [
    { icon: RadioTower, t: x.nodeCode, sub: "АТС-21", href: `/nodes/${x.nodeId}` },
    { icon: Phone, t: "АТС Iskratel SI 2000", sub: "станция", href: "/pbx" },
    { icon: Waypoints, t: "КК №44", sub: "канализация", href: "/cable-ducts" },
  ],
  strandRows: (x, d) => {
    const a = d.strands.filter((f) => f === "a").length
    const b = d.strands.filter((f) => f === "b").length
    return [
      { t: "Общее количество медных пар", v: d.strands.length },
      { t: "Принадлежит JM", v: a },
      { t: "Арендуемых", v: b },
      { t: "Свободно", v: d.strands.length - a - b },
    ]
  },
  inputDocs: [
    { t: "Ввод в эксплуатацию", n: "№ 12 от 2011" },
    { t: "Акт приёмочной комиссии", n: "№ 12-п" },
    { t: "Схема кабеля", n: "PDF" },
  ],
  docs: [
    { name: "№, дата документа о вводе в эксплуатацию", req: "№ 12 от 14.06.2011", uploaded: true },
    { name: "№, дата акта приёмной комиссии", req: "№ 12-п от 10.06.2011", uploaded: true },
    { name: "Схема распределения пар", req: "PDF", uploaded: false },
  ],
  lastEdit: (c) => ["Изменено «Арендуемых медных пар»", String(Math.max(0, c.b - 2)), String(c.b)],
}

/** Паспорт КЛС (макет 08). */
export function KlsPassport({ id }: { id: number }) {
  return <LinePassport k={KLS} id={id} />
}
