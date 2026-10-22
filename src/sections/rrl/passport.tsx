"use client"

import { Activity, ConciergeBell, Network, Radio, Ruler } from "lucide-react"
import { Card, Kv, glass } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { CapTable, capBar, equipmentKind, type CapRow } from "@/sections/lines/equipment"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { cn } from "@/lib/utils"
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

/** Передняя панель (rrl-04-panel): IDU с портами GE и E1, ODU на мачте с RSL / SNR / модуляцией. */
function Panel({ x }: { x: GenRow }) {
  const box =
    "relative flex items-center gap-5 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#17191f)] px-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#d9dce3)]"
  return (
    <div className="absolute inset-x-0 top-[30px] px-[2%] max-[1279px]:top-0">
      <div className="relative h-[100px]">
        <Note t="GE · LAN 1–2" v="задействовано 2 из 4" pct={50} at={10} />
        <Note t="ODU · IF кабель" v="N-type → антенна на АМС" at={70} />
      </div>
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>{String(x.f.model)}</span>
        <span>
          {String(x.f.bw)} · {String(x.f.len)} км
        </span>
      </p>
      <div className={cn(box, "mt-2 h-[100px]")}>
        <span className="w-[130px] flex-none">
          <b className="block text-sm font-semibold">IDU</b>
          <span className="block truncate text-[11px] text-muted-foreground">{String(x.f.model)}</span>
        </span>
        <span className="flex flex-col items-center gap-1">
          <span className="flex gap-1.5">
            {[1, 1, 0, 0].map((on, i) => (
              <span key={i} className="relative grid h-[38px] w-8 place-items-center rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]">
                <i className="absolute top-1 left-1 size-1.5 rounded-full" style={{ background: on ? "#2bd463" : "#3a3f4b" }} />
                <i className="absolute top-1 right-1 size-1.5 rounded-full" style={{ background: on ? "#ffc53d" : "#3a3f4b" }} />
                <i className="mt-2 h-3 w-4 rounded-[2px] bg-[#1d2027]" />
              </span>
            ))}
          </span>
          <span className="text-[8px] tracking-[0.5px] text-muted-foreground">GE · LAN</span>
        </span>
        <span className="flex flex-col items-center gap-1">
          <i className="h-[38px] w-[140px] rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]" />
          <span className="text-[8px] tracking-[0.5px] text-muted-foreground">E1 · 16×</span>
        </span>
        <span className="h-[52px] flex-1 rounded-md bg-[repeating-linear-gradient(90deg,#0b0c10_0_3px,#2a2d35_3px_6px)] opacity-80" />
        <span className="flex flex-col items-center gap-1">
          <i className="grid size-9 place-items-center rounded-full border-2 border-[#4f8dff] bg-[#0b0c10] shadow-[0_0_14px_rgba(79,141,255,0.6)]">
            <i className="size-3 rounded-full bg-white" />
          </i>
          <span className="text-[8px] tracking-[0.5px] text-muted-foreground">ODU · IF</span>
        </span>
        <span className="flex flex-col items-center gap-1">
          <i className="h-7 w-9 rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]" />
          <span className="text-[8px] text-muted-foreground">-48V</span>
        </span>
      </div>
      <div className={cn(box, "mt-4 h-[120px]")}>
        <span className="w-[150px] flex-none">
          <b className="block text-sm font-semibold">ODU · на мачте</b>
          <span className="text-[11px] text-muted-foreground">
            Tx1 {TX.tx1} · Tx2 {TX.tx2} MHz
          </span>
        </span>
        <pre className="rounded-lg border border-[#2f6bff] bg-[#0a1430] px-3 py-2 font-mono text-[11px] leading-[1.6] text-[#7fb0ff]">
          {`RSL   -41.6 dBm\nSNR    31.2 dB\nMOD   256QAM\nCAP   ${bw(x)} Mbps`}
        </pre>
        <span className="flex flex-1 items-center gap-3 text-[11px] text-muted-foreground">
          Точка #1
          <i className="h-0.5 flex-1 rounded-full bg-[#2bd463]" />
          {String(x.f.len)} км
          <i className="h-0.5 flex-1 rounded-full bg-[#2bd463]" />
          Точка #2
        </span>
      </div>
    </div>
  )
}

function Note({ t, v, pct, at }: { t: string; v: string; pct?: number; at: number }) {
  return (
    <div className={cn(glass, "absolute bottom-2 w-fit rounded-2xl px-4 py-2.5")} style={{ left: `${at}%` }}>
      <span className="block text-[11px] text-muted-foreground">{t}</span>
      <b className="block text-sm font-semibold whitespace-nowrap">{v}</b>
      {pct !== undefined && (
        <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-[var(--chip-bg)]">
          <i className="block h-full bg-[#085eff]" style={{ width: `${pct}%` }} />
        </span>
      )}
    </div>
  )
}

/** Мачта для схемы пролёта. */
function Mast({ x, top }: { x: number; top: number }) {
  const w = 34
  return (
    <g stroke="#c8ccd4" strokeWidth="2" fill="none">
      <path d={`M${x - w} 430 L${x - 6} ${top} M${x + w} 430 L${x + 6} ${top}`} />
      {Array.from({ length: Math.floor((430 - top) / 34) }, (_, i) => {
        const a = 430 - i * 34
        const b = a - 34
        const half = (y: number) => 6 + ((y - top) / (430 - top)) * (w - 6)
        return (
          <g key={i}>
            <line x1={x - half(a)} y1={a} x2={x + half(b)} y2={b} />
            <line x1={x + half(a)} y1={a} x2={x - half(b)} y2={b} />
          </g>
        )
      })}
      <circle cx={x} cy={top + 6} r="20" fill="#e8eaee" stroke="#9aa0ab" />
    </g>
  )
}

/** Трасса (rrl-04-schema): две мачты, пролёт с частотами, пропускная способность. */
function Span({ x }: { x: GenRow }) {
  const [a, b] = ends(x)
  return (
    <div className="absolute inset-x-0 top-[60px] flex justify-center max-[1279px]:top-0">
      <svg viewBox="0 0 900 500" className="h-[500px] w-auto max-w-full" fill="none" fontFamily="inherit">
        <path d="M120 170 Q450 40 780 220" stroke="#4f8dff" strokeWidth="3" strokeDasharray="10 8" />
        <rect x="390" y="78" width="180" height="34" rx="17" fill="var(--glass-card-solid)" stroke="var(--border)" />
        <text x="480" y="100" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--foreground)">
          {String(x.f.len)} км
        </text>
        <text x="190" y="128" fontSize="12" fill="#22d3ee">
          Tx1 {TX.tx1.toLocaleString("ru-RU")} MHz →
        </text>
        <text x="610" y="170" fontSize="12" fill="#a78bfa">
          ← Tx2 {TX.tx2.toLocaleString("ru-RU")} MHz
        </text>
        <Mast x={120} top={150} />
        <Mast x={780} top={200} />
        <rect x="350" y="290" width="220" height="80" rx="18" fill="var(--glass-card-solid)" stroke="var(--border)" />
        <text x="460" y="318" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
          РРЛ · пропускная способность
        </text>
        <text x="460" y="350" textAnchor="middle" fontSize="24" fontWeight="600" fill="var(--foreground)">
          {String(x.f.bw)}
        </text>
        {(
          [
            [120, "Точка #1", `${a ?? x.nodeCode} · ${x.address.replace(/^(г\.|с\.) [^,]+, /, "")}`],
            [780, "Точка #2", `${b ?? "—"}`],
          ] as const
        ).map(([cx, t, sub]) => (
          <g key={t}>
            <text x={cx} y="462" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--foreground)">
              {t}
            </text>
            <text x={cx} y="482" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
              {sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

const RRL = equipmentKind({
  section: "rrl",
  spec,
  list,
  title: (x) => `РРЛ ${x.f.route}`,
  pill: () => "ГРС",
  panel: (c) => <Panel x={c.x} />,
  schema: (c) => <Span x={c.x} />,
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
