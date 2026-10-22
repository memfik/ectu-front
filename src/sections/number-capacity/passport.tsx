"use client"

import { CircleCheck, Circle, FileText, Hash, PieChart, RadioTower, Server, Truck, UserCog, Users } from "lucide-react"
import { Card, glass, SegBar } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { type LineCtx, type LineKind } from "@/sections/lines/detail"
import { MolPane, MovesPane } from "@/sections/lines/staff"
import { EditableTable } from "@/sections/lines/tabs"
import { Table } from "@/sections/nodes/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { cn } from "@/lib/utils"
import { list, spec } from "./config"

/*
 * Номерная ёмкость в паспорте (макет 21): 3D — станции в стойках, «Ёмкость» — полоса нумерационного ресурса
 * и станции в ёмкости, вкладки «Оборудование в ёмкости», «Распределение», МОЛ, перемещения.
 * TODO(API): оборудование в ёмкости и распределение (клиенты / служебные / оператору) — нет в /api/number-capacity.
 */

const n0 = (v: number) => v.toLocaleString("ru-RU")
const code = (x: GenRow) => String(x.f.code ?? "—").split(" · ")[0]
const range = (x: GenRow) => {
  const [a = "", b = ""] = (String(x.f.code ?? "").split(" · ")[1] ?? "").split("–")
  return { a, b }
}
const nums = (x: GenRow) => {
  const [mounted, res] = String(x.f.mounted ?? "0 / 0")
    .split(" / ")
    .map(Number)
  const used = Number(x.f.used) || 0
  return { res: res || 0, mounted: mounted || 0, used, free: Math.max(0, (mounted || 0) - used) }
}
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
/** Распределение задействованных номеров (num-t2). */
const shares = (x: GenRow) => {
  const { mounted, used } = nums(x)
  return [
    { t: "Клиенты", m: Math.round(mounted * 0.75), z: Math.round(used * 0.78), color: "#0d5bff" },
    { t: "Служебные нужды", m: Math.round(mounted * 0.1), z: Math.round(used * 0.1), color: "#22d3ee" },
    { t: "Выдано оператору связи", m: Math.round(mounted * 0.15), z: Math.round(used * 0.12), color: "#a78bfa" },
  ]
}
/** Станции в ёмкости: две станции и резерв, диапазоны делят монтированное поровну. */
const stations = (x: GenRow) => {
  const { a } = range(x)
  const { mounted, used } = nums(x)
  const start = Number(a) || 220000
  const s1 = Math.round(mounted * 0.66)
  const s2 = mounted - s1
  return [
    {
      eq: "Iskratel SI 2000",
      sub: "АТС-21",
      type: "Цифровая",
      from: start,
      to: start + s1 - 1,
      z: Math.round(used * 0.73),
      owner: "QMobile",
      note: "",
    },
    {
      eq: "Huawei UA5000",
      sub: "АТС-14",
      type: "MSAN",
      from: start + s1,
      to: start + mounted - 1,
      z: used - Math.round(used * 0.73),
      owner: "QMobile",
      note: "",
    },
    {
      eq: "Резерв",
      sub: "",
      type: "—",
      from: start + mounted,
      to: start + mounted + Math.max(0, s2 - 1),
      z: 0,
      owner: "—",
      note: "резерв под SIP",
    },
  ]
}

/** «Ёмкость» (num-04-schema): полоса ресурса по назначению и станции с диапазонами. */
function Resource({ c }: { c: LineCtx }) {
  const { res } = nums(c.x)
  const sh = shares(c.x)
  const { a, b } = range(c.x)
  const free = Math.max(0, res - sh.reduce((s, v) => s + v.z, 0))
  return (
    <div className="absolute inset-x-0 top-[120px] px-[6%] max-[1279px]:top-0">
      <p className="mb-4 text-[13px] text-muted-foreground">
        Нумерационный ресурс · код {code(c.x)} · {a}–{b}
      </p>
      <div className="flex h-14 gap-1 overflow-hidden rounded-xl bg-[var(--chip-bg)]">
        {sh.map((s) => (
          <i key={s.t} className="block h-full first:rounded-l-xl" style={{ width: `${pct(s.z, res)}%`, background: s.color }} />
        ))}
      </div>
      <p className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {sh.map((s) => (
          <span key={s.t} style={{ color: s.color === "#0d5bff" ? "#4f8dff" : s.color }}>
            {s.t} {n0(s.z)}
          </span>
        ))}
        <span className="text-muted-foreground">Свободно {n0(free)}</span>
      </p>
      <p className="mt-10 mb-3 text-[13px] text-muted-foreground">Станции в ёмкости</p>
      <div className="flex flex-col gap-2.5">
        {stations(c.x).map((s) => {
          const all = s.to - s.from + 1
          return (
            <div key={s.eq} className={cn(glass, "flex items-center gap-4 rounded-2xl px-5 py-3")}>
              <span className="min-w-0 flex-1">
                <b className="block text-sm font-semibold">
                  {s.eq}
                  {s.sub && ` · ${s.sub}`}
                </b>
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  {s.from}–{s.to}
                </span>
              </span>
              <span className="h-1.5 w-60 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${pct(s.z, all)}%` }} />
              </span>
              <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">
                {s.z} / {all}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const NUM: LineKind = {
  section: "number-capacity",
  spec,
  list,
  title: (x) => `Код ${code(x)}`,
  point: (i) => `Станция ${i + 1}`,
  color: "#4f8dff",
  scene: "/nodes/num-3d.png",
  schemaNode: (c) => <Resource c={c} />,
  stageLabels: [
    ["3D", Server],
    ["Ёмкость", PieChart],
  ],
  strand: { tab: "", stat: "", a: ["", "#4f8dff"], b: ["", "#ffc53d"] },
  strip: "bars",
  stripTitle: () => "",
  count: () => ({ total: 0, a: 0, b: 0 }),
  pill: () => "ГМС",
  stats: (c) => {
    const v = nums(c.x)
    return [
      { icon: Hash, t: "Ресурс", v: n0(v.res), em: "номеров" },
      { icon: CircleCheck, t: "Задействовано", v: n0(v.used) },
      { icon: Circle, t: "Свободно", v: n0(v.free) },
    ]
  },
  summary: (c) => {
    const v = nums(c.x)
    const bar = (a: number, b: number) => (
      <SegBar
        parts={[
          { v: a, color: "#085eff" },
          { v: b - a, color: "var(--chip-bg)" },
        ]}
      />
    )
    return [
      {
        icon: Hash,
        title: "Ресурс",
        tab: "eq",
        v: (
          <>
            {n0(v.res)} <em>номеров</em>
          </>
        ),
      },
      {
        icon: CircleCheck,
        title: "Монтировано",
        tab: "eq",
        v: (
          <>
            {n0(v.mounted)} <em>{pct(v.mounted, v.res)}%</em>
          </>
        ),
        bar: bar(v.mounted, v.res),
      },
      {
        icon: Users,
        title: "Задействовано",
        tab: "share",
        v: (
          <>
            {n0(v.used)} <em>{pct(v.used, v.res)}% ресурса</em>
          </>
        ),
        bar: bar(v.used, v.res),
      },
      { icon: Circle, title: "Свободно", tab: "share", v: n0(v.free) },
    ]
  },
  tabs: (c) => [
    {
      k: "eq",
      t: "Оборудование в ёмкости",
      icon: Server,
      n: 3,
      node: (
        <EditableTable
          icon={Server}
          title="Оборудование"
          noun="оборудование"
          cols={[
            { k: "eq", t: "Оборудование", req: true },
            { k: "net", t: "Тип сети", opts: ["ГМС", "ГРС", "ГАС", "МС"] },
            { k: "type", t: "Тип станции" },
            { k: "range", t: "Монтировано (нумерационный диапазон)" },
            { k: "z", t: "Задействовано" },
            { k: "owner", t: "Собственник оборудования" },
            { k: "note", t: "Пояснения" },
          ]}
          rows={stations(c.x).map((s, i) => ({
            id: String(i),
            eq: s.eq === "Резерв" ? "—" : s.eq,
            net: s.eq === "Резерв" ? "—" : "ГМС",
            type: s.type === "—" ? "Резерв" : s.type,
            range: `${s.from}–${s.to}`,
            z: n0(s.z),
            owner: s.owner,
            note: s.note,
          }))}
        />
      ),
    },
    {
      k: "share",
      t: "Распределение",
      icon: Users,
      node: (
        <Card icon={PieChart} title="Распределение номеров">
          <Table
            head={["Тип", "Монтировано (М.)", "Задействовано (З.)", "Свободно", "Загрузка"]}
            rows={shares(c.x).map((r) => ({
              key: r.t,
              cells: [
                <b key="t">{r.t}</b>,
                n0(r.m),
                n0(r.z),
                n0(r.m - r.z),
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
    { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2, node: <MolPane x={c.x} /> },
  ],
  tail: (c) => [{ k: "moves", t: "История перемещений", icon: Truck, n: 3, node: <MovesPane x={c.x} /> }],
  ends: (x, a) => [
    { code: x.nodeCode, title: a ? a.object : x.nodeCode, nodeId: a?.id },
    { code: "—", title: "—" },
  ],
  rows: (x) => {
    const v = nums(x)
    const r = range(x)
    return [
      { t: "Нумерация", v: x.num },
      { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
      { t: "Город / область", v: String(x.f.town ?? x.city) },
      { t: "Реквизиты ТУ и Приказа Регулятора", v: String(x.f.tu ?? "—") },
      { t: "Идентификатор УС", v: x.nodeCode },
      { t: "Код", v: code(x) },
      { t: "Начало", v: r.a || "—" },
      { t: "Окончание", v: r.b || "—" },
      { t: "Ресурс номеров", v: n0(v.res) },
      { t: "Монтировано номеров", v: n0(v.mounted) },
      { t: "Задействовано номеров", v: n0(v.used) },
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
  lastEdit: (_, x) => ["Изменено «Задействовано номеров»", n0(nums(x).used - 40), n0(nums(x).used)],
}

/** Паспорт номерной ёмкости (макет 21). */
export function NumberPassport({ id }: { id: number }) {
  return <LinePassport k={NUM} id={id} />
}
