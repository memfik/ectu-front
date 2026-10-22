"use client"

import { RadioTower, Server } from "lucide-react"
import { LinePassport } from "@/sections/lines/passport"
import { lineStats, lineSummary, lineTabs, low } from "@/sections/lines/defaults"
import { usTitle, type LineKind } from "@/sections/lines/detail"
import { BRANCHES } from "@/sections/nodes/data"
import { list, spec } from "./config"

/** ВОЛС в паспорте линии (макет 07): волокна занято / резерв, муфты, аренда КК, тип прокладки участков. */
const VOLS: LineKind = {
  section: "fiber-lines",
  spec,
  list,
  point: (i) => `Муфта М-${i + 1}`,
  color: "#4f8dff",
  scene: "/nodes/vols-3d.png",
  strand: { tab: "Волокна", stat: "Волокон", a: ["Занято", "#4f8dff"], b: ["Резерв", "#ffc53d"] },
  strip: "bars",
  stripTitle: (c) =>
    `Волокна кабеля ${c.x.f.cable ?? ""} · ${low(c.k.strand.a[0])} ${c.a} · ${low(c.k.strand.b[0])} ${c.b} · свободно ${c.d.strands.length - c.a - c.b}`,
  pill: (x) => String(x.f.network ?? "ГРС"),
  stats: (c) => lineStats(c, "points"),
  summary: (c) => lineSummary(c, "points"),
  tabs: (c) => lineTabs(c, true),
  count: (x) => {
    const m = String(x.f.fibers).match(/(\d+|—) \/ (\d+)/)
    const total = m ? +m[2] : 8
    const a = m && m[1] !== "—" ? Math.min(+m[1], total) : 0
    return { total, a, b: a < total ? 1 : 0 }
  },
  laying: true,
  ends: (x, a, b) => [
    { code: a?.code ?? x.nodeCode, title: a ? usTitle(a) : "муфта", nodeId: a?.id },
    { code: b?.code ?? "—", title: b ? usTitle(b) : "УС «РТПЦ»", nodeId: b?.id },
  ],
  rows: (x, d) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Наименование трассы", v: String(x.f.name ?? "—") },
    { t: "Протяжённость трассы, км", v: String(x.f.len ?? "—") },
    { t: "Суммарная длина кабеля, км", v: String(x.f.total ?? x.f.len ?? "—") },
    { t: "Начало участка", v: d.segments[0]?.from ?? "—" },
    { t: "УС начала участка", v: d.start.code },
    { t: "Конец участка", v: d.segments[d.segments.length - 1]?.to ?? "—" },
    { t: "УС конца участка", v: d.end.code },
    { t: "Собственник ВОК", v: String(x.f.owner ?? "—") },
    { t: "Тип сети", v: String(x.f.network ?? "—") },
    { t: "Тип кабеля", v: String(x.f.cable ?? "—") },
  ],
  related: (x, d) => [
    {
      icon: RadioTower,
      t: d.start.code,
      sub: `УС начала · ${d.start.title}`,
      href: d.start.nodeId ? `/nodes/${d.start.nodeId}` : undefined,
    },
    { icon: RadioTower, t: d.end.code, sub: `УС конца · ${d.end.title}`, href: d.end.nodeId ? `/nodes/${d.end.nodeId}` : undefined },
    { icon: Server, t: "ODF-1", sub: `порты 1–${d.strands.length}`, href: "/odf" },
  ],
  strandRows: (x, d) => {
    const own = String(x.f.owner ?? "").includes("QMobile")
    const busy = d.strands.filter((f) => f === "a").length
    return [
      { t: "Кол-во волокон всего", v: d.strands.length },
      { t: "Принадлежит JM", v: own ? d.strands.length : 0 },
      { t: "Арендуемых", v: own ? 0 : d.strands.length },
      { t: "Занятых", v: busy ? `${busy} · ${d.note}` : 0 },
      { t: "Свободных", v: d.strands.filter((f) => f !== "a").length },
    ]
  },
  inputDocs: [
    { t: "Ввод в эксплуатацию", n: "№ 77 от 03.12.2025" },
    { t: "Акт приёмной комиссии", n: "№ 77-п от 01.12.2025" },
    { t: "ТУ", n: "№ 1203 от 10.10.2025" },
  ],
  docs: [
    { name: "№, дата документа о вводе в эксплуатацию", req: "№ 77 от 03.12.2025", uploaded: true },
    { name: "№, дата акта приёмной комиссии", req: "№ 77-п от 01.12.2025", uploaded: true },
    { name: "Реквизиты технических условий (ТУ)", req: "№ 1203 от 10.10.2025", uploaded: true },
    { name: "Основание аренды КК (договор)", req: "—", uploaded: false },
    { name: "Исполнительная схема", req: "PDF", uploaded: true },
  ],
  lastEdit: (c) => ["Изменено «Кол-во волокон занятых»", String(Math.max(0, c.a - 1)), String(c.a)],
}

/** Паспорт ВОЛС (макет 07). */
export function VolsPassport({ id }: { id: number }) {
  return <LinePassport k={VOLS} id={id} />
}
