"use client"

import { Cable, Circle, CircleCheck, EthernetPort, RadioTower, Server } from "lucide-react"
import { Pill } from "@/components/list/ui"
import { glass } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { docsSum, strandBar } from "@/sections/lines/defaults"
import { usTitle, type LineCtx, type LineKind } from "@/sections/lines/detail"
import { EditableTable } from "@/sections/lines/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import { cn } from "@/lib/utils"
import { list, spec } from "./config"

/*
 * ODF в паспорте линии (макет 10): сцена — передняя панель кросса, схема — порты, вкладка «Порты» (кроссировка).
 * Направление кабеля — узел Б и ВОЛС, которая заходит в кросс.
 */

const STATE = { a: ["Занят", "ok"], b: ["Резерв", "warn"], free: ["Свободен", "muted"] } as const
const USED = "#2bd463"
const VOLS = "ВОЛС №49"

/** Передняя панель кросса (odf-04-panel): корпус 19" с портами, подпись ёмкости и направления. */
function Panel({ c }: { c: LineCtx }) {
  const shown = c.d.strands.slice(0, 24)
  return (
    <div className="absolute inset-x-0 top-[120px] px-[3%] max-[1279px]:top-6">
      <div className={cn(glass, "mx-auto w-fit px-5 py-3")}>
        <span className="block text-[11px] text-muted-foreground">Порты кросса</span>
        <b className="text-sm font-semibold">
          {c.a} из {c.d.strands.length} · {String(c.x.f.conn ?? "SC/UPC")}
        </b>
        <span className="mt-2 block h-1 w-40 overflow-hidden rounded-full bg-[var(--chip-bg)]">
          <i className="block h-full bg-[#085eff]" style={{ width: `${(c.a / c.d.strands.length) * 100}%` }} />
        </span>
      </div>
      <p className="mt-6 flex justify-between text-[11px] text-muted-foreground">
        <span>{c.x.nodeCode} · SM G.652D</span>
        <span>{c.d.strands.length} портов</span>
      </p>
      <div className="relative mt-2 flex items-center gap-6 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#1a1c22)] px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#dfe2e8)]">
        <i className="absolute top-1/2 -left-3 h-8 w-2 -translate-y-1/2 rounded bg-[var(--chip-bg)]" />
        <i className="absolute top-1/2 -right-3 h-8 w-2 -translate-y-1/2 rounded bg-[var(--chip-bg)]" />
        <span className="w-[110px] flex-none">
          <b className="block text-sm font-semibold">ODF</b>
          <span className="text-[11px] text-muted-foreground">{String(c.x.f.mount ?? 'Стоечный, 19"')}</span>
        </span>
        <span className="flex flex-1 flex-wrap justify-around gap-3">
          {shown.map((f, i) => (
            <i
              key={i}
              title={`Порт ${i + 1} · ${STATE[f][0]}`}
              className="grid size-[26px] place-items-center rounded-full border-2 border-[#5b606b] bg-[#0b0c10]"
            >
              {f !== "free" && <i className="size-2.5 rounded-full" style={{ background: f === "a" ? "#ffc53d" : USED }} />}
            </i>
          ))}
        </span>
      </div>
      <div className={cn(glass, "mt-16 ml-auto mr-[18%] w-fit px-5 py-3")}>
        <span className="block text-[11px] text-muted-foreground">Направление</span>
        <b className="text-sm font-semibold">{String(c.x.f.nodeB ?? "—")}</b>
      </div>
    </div>
  )
}

/** Схема портов (odf-04-schema): все порты рядами по 24, занятые, резерв, свободные; куда идёт кабель. */
function Ports({ c }: { c: LineCtx }) {
  const color = (f: string) => (f === "a" ? USED : f === "b" ? "#ffc53d" : "transparent")
  return (
    <div className="absolute inset-x-0 top-[150px] px-[3%] max-[1279px]:top-6">
      <section className={cn(glass, "p-7")}>
        <b className="block text-base font-semibold">ODF-1 · {c.x.nodeCode}</b>
        <span className="text-xs text-muted-foreground">
          {c.d.strands.length} × {String(c.x.f.conn ?? "SC/UPC")} · одномодовое G.652D · {String(c.x.f.mount ?? "").toLowerCase()}
        </span>
        <div className="mt-6 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-x-1.5 gap-y-3">
          {c.d.strands.map((f, i) => (
            <span key={i} className="flex flex-col items-center gap-1">
              <i
                title={`Порт ${i + 1} · ${STATE[f][0]}`}
                className="grid h-[34px] w-full max-w-[30px] place-items-center rounded-md border-2"
                style={{ borderColor: f === "free" ? "var(--chip-bg)" : color(f) }}
              >
                <i className="h-4 w-2.5 rounded-sm" style={{ background: f === "free" ? "var(--chip-bg)" : color(f) }} />
              </i>
              <span className="text-[9px] text-muted-foreground tabular-nums">{i + 1}</span>
            </span>
          ))}
        </div>
      </section>
      <p className="mt-10 ml-[40%] w-fit rounded-xl border border-[#085eff] bg-[var(--glass-card)] px-5 py-2.5 text-sm backdrop-blur-[12px]">
        Порты 1–{c.a} → {VOLS} → {c.d.end.title}
      </p>
    </div>
  )
}

const ODF: LineKind = {
  section: "odf",
  spec,
  list,
  point: (i) => `Муфта М-${i + 1}`,
  color: "#4f8dff",
  sceneNode: (c) => <Panel c={c} />,
  schemaNode: (c) => <Ports c={c} />,
  stageLabels: [
    ["Панель", Server],
    ["Схема", EthernetPort],
  ],
  strand: { tab: "Порты", stat: "Портов", a: ["Занято", USED], b: ["Резерв", "#ffc53d"] },
  strip: "bars",
  stripTitle: () => "",
  count: (x) => {
    const m = String(x.f.ports).match(/(\d+) \/ (\d+)/)
    const total = m ? +m[2] : 8
    const a = m ? Math.min(+m[1], total) : 0
    return { total, a, b: a + 2 <= total ? 2 : 0 }
  },
  pill: (x) => String(x.f.conn ?? "SC/UPC"),
  stats: (c) => [
    { icon: EthernetPort, t: "Портов", v: c.d.strands.length, em: "всего" },
    { icon: CircleCheck, t: "Задействовано", v: c.a },
    { icon: Circle, t: "Свободно", v: c.d.strands.length - c.a - c.b },
  ],
  summary: (c) => [
    {
      icon: EthernetPort,
      title: "Порты",
      tab: "ports",
      v: (
        <>
          {c.a} / {c.d.strands.length} <em>задействовано</em>
        </>
      ),
      bar: strandBar(c),
    },
    {
      icon: Cable,
      title: "ВОЛС",
      tab: "ports",
      v: (
        <>
          №49 <em>→ {c.d.end.title}</em>
        </>
      ),
    },
    {
      icon: Server,
      title: "Коннектор",
      tab: "ports",
      v: (
        <>
          {String(c.x.f.conn ?? "SC/UPC")} <em>G.652D</em>
        </>
      ),
    },
    docsSum(c),
  ],
  tabs: (c) => [
    {
      k: "ports",
      t: "Порты",
      icon: EthernetPort,
      n: c.d.strands.length,
      node: (
        <EditableTable
          icon={EthernetPort}
          title="Кроссировка портов"
          noun="порт"
          cols={[
            { k: "num", t: "Порт", req: true },
            {
              k: "state",
              t: "Состояние",
              opts: ["Занят", "Резерв", "Свободен"],
              show: (v) => <Pill tone={v === "Занят" ? "ok" : v === "Резерв" ? "warn" : "muted"}>{v}</Pill>,
            },
            { k: "fiber", t: "Волокно" },
            { k: "to", t: "Куда" },
            { k: "desc", t: "Описание" },
          ]}
          rows={c.d.strands
            .map((f, i) => ({ f, i }))
            .filter(({ f, i }) => f !== "free" || i === c.a + c.b)
            .slice(0, 12)
            .map(({ f, i }) => ({
              id: String(i),
              num: String(i + 1),
              state: STATE[f][0],
              fiber: f === "free" ? "" : `${f === "b" ? "ВОЛС №52" : VOLS} · ${i + 1}`,
              to: f === "a" ? ["sw1.ast009 Gi1/0/25", "sw1.ast009 Gi1/0/26", "ID-00231"][i % 3] : "",
              desc: f === "a" ? ["uplink", "uplink-2", "FTTB клиент"][i % 3] : f === "b" ? "под ID-канал" : "",
            }))}
        />
      ),
    },
  ],
  ends: (x, a, b) => [
    { code: x.nodeCode, title: a ? usTitle(a) : x.nodeCode, nodeId: a?.id },
    { code: String(x.f.nodeB ?? "—"), title: b ? usTitle(b) : "УС «РТПЦ»", nodeId: b?.id },
  ],
  rows: (x, d) => {
    const a = d.strands.filter((f) => f === "a").length
    return [
      { t: "Нумерация", v: x.num },
      { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
      { t: "Узел А (размещение кросса)", v: x.nodeCode },
      { t: "Узел Б (направление кабеля)", v: String(x.f.nodeB ?? "—") },
      { t: "Тип монтажа", v: String(x.f.mount ?? "—") },
      { t: "Всего портов", v: d.strands.length },
      { t: "Задействовано портов", v: a },
      { t: "Свободных портов", v: d.strands.length - a },
      { t: "Тип коннектора", v: String(x.f.conn ?? "—") },
      { t: "Тип волокна", v: "SM G.652D" },
    ]
  },
  related: (x, d) => [
    { icon: RadioTower, t: x.nodeCode, sub: "Узел А · размещение", href: `/nodes/${x.nodeId}` },
    {
      icon: RadioTower,
      t: String(x.f.nodeB ?? "—"),
      sub: "Узел Б · направление",
      href: d.end.nodeId ? `/nodes/${d.end.nodeId}` : undefined,
    },
    { icon: Cable, t: VOLS, sub: `волокна 1–${d.strands.length}`, href: "/fiber-lines/49" },
  ],
  strandRows: () => [],
  inputDocs: [
    { t: "Форма учёта ODF", n: "XLSX" },
    { t: "Схема кросса", n: "PDF" },
    { t: "Фото", n: "3" },
  ],
  docs: [
    { name: "Форма учёта оптических кроссов (ODF)", req: "XLSX · 06.10.2026", uploaded: true },
    { name: "Схема кроссировки", req: "PDF", uploaded: true },
    { name: "Паспорт оборудования", req: "—", uploaded: false },
  ],
  lastEdit: (c) => ["Изменено «Задействовано портов»", String(Math.max(0, c.a - 1)), String(c.a)],
}

/** Паспорт ODF (макет 10). */
export function OdfPassport({ id }: { id: number }) {
  return <LinePassport k={ODF} id={id} />
}
