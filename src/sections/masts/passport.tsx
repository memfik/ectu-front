"use client"

import { FileText, Layers, RadioTower, Ruler, Signal, Waves } from "lucide-react"
import { SegBar } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { strandBar } from "@/sections/lines/defaults"
import { type LineCtx, type LineKind } from "@/sections/lines/detail"
import { EditableTable } from "@/sections/lines/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import { list, spec } from "./config"

/*
 * АМС в паспорте линии (макет 11): сцена — мачта, схема — площадки по высоте с нагрузкой,
 * вкладки «Площадки и нагрузка», «Разрешительные документы». Жилы — площадки (a — занята).
 */

const H = (c: LineCtx) => Number(c.x.f.height) || 40
/** Высоты площадок: 20 / 30 / 40 м для 42-метровой мачты. */
const levels = (c: LineCtx) => c.d.strands.map((_, i) => Math.round((H(c) * (0.48 + i * 0.24)) / 5) * 5)
/** Что стоит на площадках снизу вверх; занятые — верхние. */
const LOAD = ["БС GSM · 3 сектора", "РРЛ Ø0,6 → УС-8", "4 сектора LTE · 2 РРЛ"]

/** Схема мачты (ams-04-schema): шкала высоты, решётка, площадки и что на них стоит. */
function Tower({ c }: { c: LineCtx }) {
  const h = H(c)
  const lv = levels(c)
  const y = (m: number) => 470 - (m / h) * 450
  const ticks = [...[0, 10, 20, 30, 40, 50, 60].filter((t) => t < h - 3), h]
  return (
    <div className="absolute inset-x-0 top-[70px] flex justify-center max-[1279px]:top-0">
      <svg viewBox="0 0 640 500" className="h-[540px] w-auto max-w-full" fill="none">
        <line x1="70" y1={y(h)} x2="70" y2="470" stroke="var(--border)" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1="62" x2="100" y1={y(t)} y2={y(t)} stroke="var(--border)" />
            <text x="40" y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
              {t} м
            </text>
          </g>
        ))}
        {/* решётка: ноги сходятся к верху, раскосы между поясами */}
        <path d={`M140 470 L195 ${y(h) + 10} M250 470 L205 ${y(h) + 10}`} stroke="#8a93a6" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = 470 - i * 36
          const b = a - 36
          const w = (yy: number) => 55 - ((470 - yy) / 450) * 45
          return (
            <g key={i} stroke="#6b7385" strokeWidth="1.2">
              <line x1={195 - w(a)} y1={a} x2={195 + w(b)} y2={b} />
              <line x1={195 + w(a)} y1={a} x2={195 - w(b)} y2={b} />
              <line x1={195 - w(b)} y1={b} x2={195 + w(b)} y2={b} />
            </g>
          )
        })}
        <rect x="120" y="470" width="150" height="9" rx="2" fill="#3a3f4b" />
        <circle cx="200" cy={y(h) - 4} r="5" fill="#ff3b3b" />
        <circle cx="200" cy={y(h) - 4} r="11" fill="#ff3b3b" opacity="0.25" />
        {lv.map((m, i) => (
          <g key={i}>
            <rect x="150" y={y(m) - 4} width="100" height="8" rx="2" fill="#2f6bff" />
            <line x1="252" x2="345" y1={y(m)} y2={y(m)} stroke="#4f8dff" strokeDasharray="3 4" />
            <rect x="345" y={y(m) - 24} width="250" height="48" rx="12" fill="var(--glass-card-solid)" stroke="var(--border)" />
            <text x="361" y={y(m) - 6} fontSize="10.5" fill="var(--muted-foreground)">
              Площадка {i + 1} · {m} м
            </text>
            <text x="361" y={y(m) + 12} fontSize="13" fontWeight="600" fill="var(--foreground)">
              {c.d.strands[c.d.strands.length - 1 - i] === "free" ? "свободна" : LOAD[Math.min(i, LOAD.length - 1)]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

const AMS: LineKind = {
  section: "masts",
  spec,
  list,
  point: (i) => `Опора ${i + 1}`,
  color: "#4f8dff",
  scene: "/nodes/ams-3d.png",
  schemaNode: (c) => <Tower c={c} />,
  strand: { tab: "Площадки", stat: "Площадок", a: ["Занята", "#4f8dff"], b: ["Резерв", "#ffc53d"] },
  strip: "bars",
  stripTitle: () => "",
  count: () => ({ total: 3, a: 2, b: 0 }),
  docsTab: "Разрешительные документы",
  pill: (x) => `${x.f.type ?? "Мачта"} · ${x.f.height ?? "—"} м`,
  stats: (c) => [
    { icon: Ruler, t: "Высота", v: H(c), em: "м" },
    { icon: Layers, t: "Площадок", v: c.d.strands.length, em: `${c.d.strands.length - c.a} свободна` },
    { icon: FileText, t: "Документы", v: `${c.docsUp} / ${c.d.docs.length}` },
  ],
  summary: (c) => [
    {
      icon: Ruler,
      title: "Высота",
      tab: "load",
      v: (
        <>
          {H(c)} <em>м · {String(c.x.f.type ?? "мачта").toLowerCase()}</em>
        </>
      ),
    },
    {
      icon: Layers,
      title: "Площадки",
      tab: "load",
      v: (
        <>
          {c.a} / {c.d.strands.length} <em>заняты</em>
        </>
      ),
      bar: strandBar(c),
    },
    {
      icon: Signal,
      title: "Нагрузка",
      tab: "load",
      v: (
        <>
          6 <em>антенн</em>
        </>
      ),
    },
    {
      icon: FileText,
      title: "Документы",
      tab: "docs",
      v: (
        <>
          {c.docsUp} / {c.d.docs.length} <em>нет экспертизы</em>
        </>
      ),
      bar: (
        <SegBar
          parts={[
            { v: c.docsUp, color: "var(--status-ok)" },
            { v: c.d.docs.length - c.docsUp, color: "#ff5257" },
          ]}
        />
      ),
    },
  ],
  tabs: (c) => [
    {
      k: "load",
      t: "Площадки и нагрузка",
      icon: Layers,
      n: c.d.strands.length,
      node: (
        <EditableTable
          icon={Layers}
          title="Существующая нагрузка (установленное оборудование)"
          noun="оборудование"
          cols={[
            { k: "pl", t: "Площадка", req: true },
            { k: "h", t: "Высота" },
            { k: "eq", t: "Оборудование" },
            { k: "az", t: "Азимут" },
            { k: "owner", t: "Владелец" },
          ]}
          rows={[
            { id: "1", pl: "3", h: `${levels(c)[2]} м`, eq: "БС LTE · 4 сектора", az: "0 / 90 / 180 / 270°", owner: "QMobile" },
            { id: "2", pl: "2", h: `${levels(c)[1]} м`, eq: `РРЛ Ø0,6 → ${c.d.end.title}`, az: "62°", owner: "QMobile" },
            { id: "3", pl: "2", h: `${levels(c)[1]} м`, eq: "РРЛ Ø0,3 → ast011", az: "214°", owner: "QMobile" },
            { id: "4", pl: "1", h: `${levels(c)[0]} м`, eq: "", az: "", owner: "свободна" },
          ]}
        />
      ),
    },
  ],
  ends: (x, a) => [
    { code: x.nodeCode, title: a ? a.object : x.nodeCode, nodeId: a?.id },
    { code: "—", title: "УС «РТПЦ»" },
  ],
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Идентификатор УС (БС)", v: x.nodeCode },
    { t: "Населённый пункт", v: String(x.f.town ?? `г. ${x.city}`) },
    { t: "Адрес узла связи", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
    { t: "Адрес установки", v: String(x.f.place ?? "—") },
    { t: "Собственник площадки", v: String(x.f.owner ?? "—") },
    { t: "Тип АМС", v: String(x.f.type ?? "—") },
    { t: "Модель / производитель", v: "МАР-40/ Брянский завод металлоконструкций" },
    { t: "Высота, м", v: String(x.f.height ?? "—") },
    { t: "Площадок для оборудования", v: 3 },
    { t: "Широта (N)", v: x.ll[0].toFixed(8) },
  ],
  related: (x, d) => [
    { icon: RadioTower, t: x.nodeCode, sub: "узел связи", href: `/nodes/${x.nodeId}` },
    { icon: Waves, t: `РРЛ → ${d.end.title}`, sub: "площадка 2", href: "/rrl" },
    { icon: Signal, t: "БС LTE · 4 сектора", sub: "площадка 3", href: "/bwa-lte" },
  ],
  strandRows: () => [],
  inputDocs: [
    { t: "Право землепользования", n: "есть" },
    { t: "Рабочий проект", n: "есть" },
    { t: "Экспертное заключение", n: "нет" },
  ],
  docs: [
    { name: "Право землепользования с соответствующим целевым назначением", req: "Акт № 4410", uploaded: true },
    { name: "Рабочий проект с расчётами несущей способности фундаментов и металлоконструкции", req: "PDF · 42 МБ", uploaded: true },
    { name: "Экспертное заключение в области строительства на проектную документацию", req: "—", uploaded: false },
    { name: "Исполнительная документация с сертификатами качества", req: "PDF", uploaded: true },
    { name: "Документы по приёмке АМС в эксплуатацию", req: "—", uploaded: false },
  ],
  lastEdit: () => ["Изменено «Существующая нагрузка»", "2 РРЛ", "4 сектора LTE + 2 РРЛ"],
}

/** Паспорт АМС (макет 11). */
export function AmsPassport({ id }: { id: number }) {
  return <LinePassport k={AMS} id={id} />
}
