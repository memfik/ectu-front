"use client"

import { Contact, MapPin, Radio, Ruler, Signal, Users } from "lucide-react"
import { Card, Kv, glass } from "@/components/passport/ui"
import type { GenRow, Spec } from "@/sections/make"
import { BRANCHES } from "@/sections/nodes/data"
import type { ListConfig } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { CapTable, capBar, equipmentKind } from "./equipment"
import { EditableTable } from "./tabs"

/*
 * Паспорт БШД (макеты 27–29: WiMAX, Telrad LTE, WLL): панель — БС с GPS и антеннами, «Покрытие» — сектора
 * с абонентами, вкладки «Зона покрытия», «Абонентская ёмкость», «Абонентские станции».
 * TODO(API): азимуты, ширина полосы, РЧС, абонентские станции — нет в /api/bhd-*.
 */

export type BwaParams = { km: number; band: number; vendor: string }

const subs = (x: GenRow) => {
  const [a, b] = String(x.f.subs ?? "0 / 64")
    .split(" / ")
    .map(Number)
  return { z: a || 0, m: b || 64 }
}
const sectors = (x: GenRow) => Math.min(6, Math.max(1, Number(x.f.sectors) || 3))
const width = (x: GenRow) => Math.round(360 / sectors(x))
const azimuth = (x: GenRow) => Array.from({ length: sectors(x) }, (_, i) => (i * width(x) + (sectors(x) === 4 ? 30 : 0)) % 360).join(" / ")
const RCS = "№ 14-РЧС/0912"
const STATIONS = [
  { type: "БС", rcs: RCS, place: "ул. Сыганак, 18", client: "—" },
  { type: "АК", rcs: "—", place: "ул. Сыганак, 40, кв. 12", client: "Ахметов Б." },
  { type: "АК", rcs: "—", place: "ТОО «Тарлан», офис", client: "ТОО «Тарлан»" },
  { type: "АК", rcs: "—", place: "ИП «Сапарова А.»", client: "ИП «Сапарова А.»" },
]
const SECTOR_COLOR = ["#2f6bff", "#22d3ee", "#a78bfa", "#2bd463", "#ffc53d", "#ff8a4c"]

/** Панель БС (wimax-04-panel): порт GbE, GPS, решётка, антенные разъёмы, питание. */
function Panel({ x }: { x: GenRow }) {
  const ant = Math.max(2, Math.min(4, sectors(x) + 1))
  return (
    <div className="absolute inset-x-0 top-[50px] px-[2%] max-[1279px]:top-0">
      <div className="relative h-[100px]">
        <Note t="GbE · транспорт" v="→ коммутатор узла" at={12} />
        <Note t="Сектора · антенны" v={`${sectors(x) * width(x)}° · ${x.f.freq} MHz`} at={48} />
      </div>
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>{String(x.f.model)}</span>
        <span>РЧС №2/60-926/5474 от 24.01.2022г.</span>
      </p>
      <div className="relative mt-2 flex h-[100px] items-center gap-5 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#17191f)] px-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#d9dce3)]">
        <span className="w-[230px] flex-none">
          <b className="block text-sm font-semibold">БС</b>
          <span className="block truncate text-[11px] text-muted-foreground">{String(x.f.model)}</span>
        </span>
        <Labeled t="GBE">
          <span className="relative grid h-[38px] w-8 place-items-center rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]">
            <i className="absolute top-1 left-1 size-1.5 rounded-full bg-[#2bd463]" />
            <i className="absolute top-1 right-1 size-1.5 rounded-full bg-[#ffc53d]" />
            <i className="mt-2 h-3 w-4 rounded-[2px] bg-[#1d2027]" />
          </span>
        </Labeled>
        <Labeled t="GPS">
          <Coax />
        </Labeled>
        <span className="h-[52px] flex-1 rounded-md bg-[repeating-linear-gradient(90deg,#0b0c10_0_3px,#2a2d35_3px_6px)] opacity-80" />
        <Labeled t="RF · АНТЕННЫ">
          <span className="flex gap-3">
            {Array.from({ length: ant }, (_, i) => (
              <Coax key={i} />
            ))}
          </span>
        </Labeled>
        <Labeled t="-48V">
          <i className="block h-7 w-9 rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]" />
        </Labeled>
      </div>
    </div>
  )
}

const Coax = () => (
  <i className="grid size-9 place-items-center rounded-full border-2 border-[#4f8dff] bg-[#0b0c10] shadow-[0_0_10px_rgba(79,141,255,0.5)]">
    <i className="size-3 rounded-full bg-white" />
  </i>
)

function Labeled({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <span className="flex flex-col items-center gap-1">
      {children}
      <span className="text-[8px] tracking-[0.5px] text-muted-foreground">{t}</span>
    </span>
  )
}

function Note({ t, v, at }: { t: string; v: string; at: number }) {
  return (
    <div className={cn(glass, "absolute bottom-2 w-fit rounded-2xl px-4 py-2.5")} style={{ left: `${at}%` }}>
      <span className="block text-[11px] text-muted-foreground">{t}</span>
      <b className="block text-sm font-semibold whitespace-nowrap">{v}</b>
    </div>
  )
}

/** Покрытие (wimax-04-schema): круг с секторами по азимутам, абоненты точками, сводка справа. */
export function Coverage({ n, km, freq, used: z, total: m }: { n: number; km: number; freq: string; used: number; total: number }) {
  const width = Math.round(360 / n)
  const r = 210
  const c = 220
  const pt = (deg: number, rr = r) => [c + rr * Math.sin((deg * Math.PI) / 180), c - rr * Math.cos((deg * Math.PI) / 180)]
  const step = 360 / n
  const start = n === 4 ? 30 - step / 2 : -step / 2
  const dots = Array.from({ length: 18 }, (_, i) => pt((i * 137) % 360, 30 + ((i * 53) % 170)))
  return (
    <div className="absolute inset-x-0 top-[80px] flex items-center justify-center gap-14 max-[1279px]:top-0 max-[1279px]:flex-col">
      <svg viewBox="0 0 490 440" className="h-[440px] w-auto flex-none" fill="none">
        {Array.from({ length: n }, (_, i) => {
          const a = start + i * step
          const [x1, y1] = pt(a)
          const [x2, y2] = pt(a + step)
          const col = SECTOR_COLOR[i % SECTOR_COLOR.length]
          const [lx, ly] = pt(a + step / 2, r * 0.62)
          return (
            <g key={i}>
              {n === 1 ? (
                <circle cx={c} cy={c} r={r} fill={col} fillOpacity="0.22" stroke={col} strokeOpacity="0.8" />
              ) : (
                <path
                  d={`M${c} ${c} L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                  fill={col}
                  fillOpacity="0.22"
                  stroke={col}
                  strokeOpacity="0.8"
                />
              )}
              <text x={lx} y={ly} textAnchor="middle" fontSize="12" fill="var(--foreground)">
                {Math.round((a + step / 2 + 360) % 360)}°
              </text>
            </g>
          )
        })}
        <circle cx={c} cy={c} r={r * 0.33} stroke="var(--border)" />
        <circle cx={c} cy={c} r={r * 0.66} stroke="var(--border)" />
        {dots.map(([dx, dy], i) => (
          <circle key={i} cx={dx} cy={dy} r="3.5" fill="#e8eaee" />
        ))}
        <rect x={c - 20} y={c - 20} width="40" height="40" rx="10" fill="#085eff" />
        <text x={c} y={c + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
          БС
        </text>
        <text x={c + r + 6} y={c + 4} fontSize="11" fill="var(--muted-foreground)">
          {km} км
        </text>
      </svg>
      <section className={cn(glass, "w-[300px] p-6")}>
        <span className="block text-xs text-muted-foreground">Секторов · ширина · дальность</span>
        <b className="mb-4 block text-xl font-semibold">
          {n} × {width}° · {km} км
        </b>
        <span className="block text-xs text-muted-foreground">Частота несущей</span>
        <b className="mb-4 block text-xl font-semibold">{freq} MHz</b>
        <span className="block text-xs text-muted-foreground">Абонентская ёмкость</span>
        <b className="block text-xl font-semibold">
          {z} / {m} лицензий
        </b>
        <div className="mt-3">{capBar(z, m)}</div>
        <span className="mt-3 block text-[11px] text-muted-foreground">{Math.round((z / m) * 100)}% лицензий занято</span>
      </section>
    </div>
  )
}

/** Описание паспорта БШД по общему шаблону; `p` — дальность, полоса и полное имя вендора раздела. */
export function bwaKind(spec: Spec, list: ListConfig<GenRow>, p: BwaParams) {
  return equipmentKind({
    section: spec.key,
    spec,
    list,
    pill: (x) => String(x.f.network ?? "ГРС"),
    panel: (c) => <Panel x={c.x} />,
    schema: (c) => <Coverage n={sectors(c.x)} km={p.km} freq={String(c.x.f.freq)} used={subs(c.x).z} total={subs(c.x).m} />,
    schemaLabel: ["Покрытие", Signal],
    capTitle: "",
    cap: () => [],
    extra: (c) => [
      {
        k: "zone",
        t: "Зона покрытия",
        icon: Signal,
        node: (
          <Card icon={Signal} title="Зона покрытия" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Секторов, шт", v: sectors(c.x) },
                { t: "Ширина сектора (°)", v: width(c.x) },
                { t: "Длина покрытия (км)", v: p.km },
                { t: "Азимут (°)", v: azimuth(c.x) },
                { t: "Частота несущей, MHz", v: String(c.x.f.freq ?? "—") },
                { t: "Ширина полосы частот, MHz", v: p.band },
                { t: "Пропускная способность сектора", v: "60 Мбит/с" },
                { t: "Разрешение РЧС", v: RCS },
              ]}
            />
          </Card>
        ),
      },
      {
        k: "subs",
        t: "Абонентская ёмкость",
        icon: Users,
        n: subs(c.x).z,
        node: <CapTable icon={Users} title="Абонентская ёмкость" rows={[{ t: "Лицензии / абоненты", m: subs(c.x).m, z: subs(c.x).z }]} />,
      },
      {
        k: "stations",
        t: "Абонентские станции",
        icon: MapPin,
        n: STATIONS.length,
        node: (
          <EditableTable
            icon={MapPin}
            title="Место установки"
            noun="станция"
            cols={[
              { k: "num", t: "№ п/п" },
              { k: "type", t: "Тип станции", opts: ["БС", "АК"] },
              { k: "rcs", t: "Разрешение РЧС" },
              { k: "place", t: "Место установки", req: true },
              { k: "client", t: "Клиент" },
            ]}
            rows={STATIONS.map((s, i) => ({ id: String(i), num: String(i + 1), ...s }))}
          />
        ),
      },
    ],
    stats: (c) => [
      { icon: Signal, t: "Секторов", v: sectors(c.x), em: `× ${width(c.x)}°` },
      { icon: Users, t: "Абонентов", v: subs(c.x).z, em: `из ${subs(c.x).m}` },
      { icon: Ruler, t: "Покрытие", v: p.km, em: "км" },
    ],
    summary: (c) => [
      { icon: Signal, title: "Сектора", tab: "zone", v: `${sectors(c.x)} × ${width(c.x)}°` },
      { icon: Users, title: "Абоненты", tab: "subs", v: `${subs(c.x).z} / ${subs(c.x).m}`, bar: capBar(subs(c.x).z, subs(c.x).m) },
      {
        icon: Radio,
        title: "Частота",
        tab: "zone",
        v: (
          <>
            {String(c.x.f.freq)} <em>MHz</em>
          </>
        ),
      },
      { icon: Ruler, title: "Покрытие", tab: "zone", v: `${p.km} км` },
    ],
    related: () => [{ icon: Contact, t: "Абонентские станции", sub: `${STATIONS.length - 1} АК` }],
    rows: (x) => [
      { t: "Нумерация", v: x.num },
      { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
      { t: "Тип сети", v: String(x.f.network ?? "—") },
      { t: "Вендор", v: p.vendor },
      { t: "Модель", v: String(x.f.model ?? "—") },
      { t: "Серийный номер ODU БС/АК", v: String(x.f.serial ?? "—") },
      { t: "Инвентарный номер", v: `05-${String(x.id).padStart(10, "0")}` },
      { t: "Секторов, шт", v: sectors(x) },
      { t: "Ширина сектора (°)", v: width(x) },
      { t: "Длина покрытия (км)", v: p.km },
      { t: "Азимут (°)", v: azimuth(x) },
      { t: "Частота несущей, MHz", v: String(x.f.freq ?? "—") },
    ],
    lastEdit: (x) => ["Изменено «Абонентов»", String(Math.max(0, subs(x).z - 6)), String(subs(x).z)],
  })
}
