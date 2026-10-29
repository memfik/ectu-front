"use client"

import { usePageTitle } from "@/hooks/use-page-title"
import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  Activity,
  ArrowRight,
  CircleCheck,
  Download,
  Globe,
  Maximize2,
  Move,
  Router,
  RotateCcw,
  Save,
  Server,
  Share2,
  TriangleAlert,
  X,
} from "lucide-react"
import { btn } from "@/components/list/ui"
import { Modal } from "@/components/passport/modal"
import { glass } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { cn } from "@/lib/utils"
import {
  ALARMS,
  CITIES,
  CITY_CARDS,
  KPIS,
  LINKS,
  NODES,
  dayCurve,
  linkKey,
  linkLabel,
  loadColor,
  type CityCard,
  type CoreLink,
} from "@/lib/api/core"

/*
 * Ядро сети (макет 43, перенос вкладки из KTicket): карта ядра с каналами по направлениям, редактирование раскладки,
 * трафик ядра, аварии на магистралях, интерфейсы по городам, шторка канала (core-02).
 * TODO(API): Orion `/api/monitoring/orion/core/*` (kticket-back), раскладка `core_map_positions` — сейчас localStorage.
 */

type Pos = Record<string, { x: number; y: number }>
const STORE = "ectu.core-map-positions"
const HOME: Pos = Object.fromEntries(NODES.map((n) => [n.id, { x: n.x, y: n.y }]))

const subscribe = (on: () => void) => {
  addEventListener("storage", on)
  addEventListener(STORE, on)
  return () => {
    removeEventListener("storage", on)
    removeEventListener(STORE, on)
  }
}
const rawPos = () => {
  try {
    return localStorage.getItem(STORE) ?? "{}"
  } catch {
    return "{}"
  }
}
function parsePos(raw: string): Pos {
  try {
    return { ...HOME, ...JSON.parse(raw) }
  } catch {
    return HOME
  }
}

const LEGEND: [string, string, boolean?][] = [
  ["< 50%", "#10b981"],
  ["50–70%", "#eab308"],
  ["70–85%", "#f97316"],
  ["≥ 85%", "#dc2626"],
  ["без трафика", "#94a3b8"],
  ["аренда / резерв", "#94a3b8", true],
]

export default function CorePage() {
  usePageTitle("Ядро сети")
  const [link, setLink] = useState<CoreLink | null>(null)
  const mapRef = useRef<HTMLElement>(null)
  const report = async () => {
    const { default: write } = await import("write-excel-file/browser")
    const head = ["Город", "Интерфейс", "Куда", "IN", "IN %", "OUT", "OUT %"]
    await write(
      [
        head.map((value) => ({ value, fontWeight: "bold" as const })),
        ...CITY_CARDS.flatMap((c) =>
          c.rows.map((r) =>
            [c.t, r[0], r[1], r[2], r[3], r[4], r[5]].map((value) => ({
              value,
            })),
          ),
        ),
      ],
      { sheet: "Ядро сети", columns: head.map(() => ({ width: 22 })) },
    ).toFile("Ядро сети.xlsx")
  }
  return (
    <div className="px-(--page-gutter) pb-10">
      <section className="flex flex-wrap items-end gap-5 pt-8 pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Сеть / Мониторинг</p>
          <h1 className="mt-1.5 text-[52px] leading-[1.05] font-semibold tracking-[-1.4px] max-sm:text-[32px]">
            Ядро сети <em className="text-[32px] font-normal text-muted-foreground not-italic">8 городов</em>
          </h1>
          <p className="mt-2 text-[15px] text-[var(--nav-text)]">
            Магистральные каналы ядра по городам · данные Orion · обновление каждые 30 сек
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <i className="size-2 rounded-full bg-[var(--status-ok)] shadow-[0_0_8px_var(--status-ok)]" />
            Orion на 18:24 · следующий опрос через 6 мин
          </span>
          <button type="button" className={btn()} onClick={report}>
            <Download />
            Скачать отчёт
          </button>
          <button type="button" className={btn({ primary: true })} onClick={() => mapRef.current?.requestFullscreen?.()}>
            <Maximize2 />
            Во весь экран
          </button>
        </div>
      </section>

      <div className="grid grid-cols-5 gap-3.5 max-[1279px]:grid-cols-3 max-sm:grid-cols-2">
        {KPIS.map(([t, v, em, c, p]) => (
          <div key={t} className={cn(glass, "px-5 py-[18px]")}>
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <i className="size-[7px] rounded-full" style={{ background: c }} />
              {t}
            </span>
            <b className="mt-2 block text-[30px] font-medium tabular-nums">
              {v} <em className="text-xs font-normal text-muted-foreground not-italic">{em}</em>
            </b>
            <span className="mt-3 block h-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
              <i className="block h-full rounded-full" style={{ width: `${p}%`, background: c }} />
            </span>
          </div>
        ))}
      </div>

      <CoreMap ref={mapRef} onLink={setLink} />

      <div className="mt-[18px] grid grid-cols-[1.4fr_1fr] items-start gap-[18px] max-[1279px]:grid-cols-1">
        <section className={cn(glass, "p-4")}>
          <TrafficChart title="Трафик ядра" cap={1510} inPeak={690} outPeak={700} periods />
        </section>
        <section className={cn(glass, "p-4")}>
          <header className="mb-3 flex items-center gap-3">
            <Ico icon={TriangleAlert} />
            <b className="text-[15px] font-semibold">Аварии на магистралях</b>
            <button type="button" className={cn(btn({ sm: true }), "ml-auto")} onClick={() => toast("Все аварии — в KTicket")}>
              <ArrowRight />
              Все
            </button>
          </header>
          {ALARMS.map((a) => (
            <div key={a.sub} className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
              <span className="grid size-7 flex-none place-items-center rounded-lg bg-[rgba(43,212,99,0.14)] text-[var(--status-ok)]">
                <CircleCheck className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[12.5px] font-semibold">{a.t}</b>
                <span className="text-[11.5px] text-muted-foreground">{a.sub}</span>
              </span>
              <span className="flex-none text-[11px] text-muted-foreground">{a.at}</span>
            </div>
          ))}
        </section>
      </div>

      <div className="mt-[18px] grid grid-cols-4 gap-[18px] max-[1500px]:grid-cols-2 max-sm:grid-cols-1">
        {CITY_CARDS.map((c, i) => (
          <City key={c.t} c={c} seed={i} />
        ))}
      </div>

      {link && <LinkDrawer l={link} onClose={() => setLink(null)} />}
    </div>
  )
}

/* ---------- Карта ядра (core-01, core-03) ---------- */

function CoreMap({ ref, onLink }: { ref: React.Ref<HTMLElement>; onLink: (l: CoreLink) => void }) {
  // Сохранённая раскладка — из localStorage (на сервере — схема), черновик — пока идёт редактирование
  const raw = useSyncExternalStore(subscribe, rawPos, () => "{}")
  const saved = useMemo(() => parsePos(raw), [raw])
  const [draft, setDraft] = useState<Pos | null>(null)
  const pos = draft ?? saved
  const edit = draft !== null
  const [reserve, setReserve] = useState(false)
  const [drag, setDrag] = useState<string | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const moved = NODES.filter((n) => pos[n.id].x !== saved[n.id].x || pos[n.id].y !== saved[n.id].y)

  const toSvg = (e: React.PointerEvent) => {
    const m = svg.current!.getScreenCTM()!.inverse()
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
    return { x: Math.round(p.x), y: Math.round(p.y) }
  }
  const finish = (keep: boolean) => {
    if (keep) {
      try {
        localStorage.setItem(STORE, JSON.stringify(pos))
      } catch {}
      dispatchEvent(new Event(STORE))
      toast("Раскладка сохранена")
    }
    setDraft(null)
  }

  return (
    <section
      ref={ref}
      className={cn(glass, "mt-[18px] overflow-hidden p-4 fullscreen:overflow-auto fullscreen:rounded-none fullscreen:bg-background")}
    >
      <header className="flex flex-wrap items-center gap-3">
        <Ico icon={Share2} />
        <b className="text-[15px] font-semibold">Карта ядра сети</b>
        <span className="ml-auto flex flex-wrap gap-3.5 text-[11px] text-muted-foreground">
          {LEGEND.map(([t, c, dash]) => (
            <span key={t} className="flex items-center gap-1.5">
              <i
                className="h-[3px] w-3.5 rounded-full"
                style={{
                  background: dash ? `repeating-linear-gradient(90deg,${c} 0 4px,transparent 4px 7px)` : c,
                }}
              />
              {t}
            </span>
          ))}
        </span>
      </header>
      {edit ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-[#085eff]/40 bg-[rgba(8,94,255,0.08)] px-4 py-2.5">
          <Move className="size-4" />
          <b className="text-[13px] font-semibold">Редактирование раскладки</b>
          <span className="text-[12px] text-muted-foreground">Перетащите узлы мышью · подвинуто узлов: {moved.length}</span>
          <span className="ml-auto flex gap-2">
            <button type="button" className={btn({ sm: true })} onClick={() => setDraft(HOME)}>
              <RotateCcw />
              Сбросить к схеме
            </button>
            <button type="button" className={btn({ sm: true })} onClick={() => finish(false)}>
              <X />
              Отмена
            </button>
            <button type="button" className={btn({ sm: true, primary: true })} onClick={() => finish(true)}>
              <Save />
              Сохранить
            </button>
          </span>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
            <input type="checkbox" checked={reserve} onChange={(e) => setReserve(e.target.checked)} className="accent-[#085eff]" />
            подписи резервных каналов
          </label>
          <button type="button" className={cn(btn({ sm: true }), "ml-auto")} onClick={() => setDraft(saved)}>
            <Move />
            Редактировать раскладку
          </button>
        </div>
      )}
      <p className="mt-2 text-[11.5px] text-muted-foreground">
        {edit &&
          "Раскладка общая для всех: после сохранения карта у всех пользователей обновится. Сброс вернёт расположение по схеме CORE. "}
        Канал — две полосы, по одной на направление: цвет — загрузка направления, точки бегут по потоку. Нажмите на канал — откроется его
        график.
      </p>

      <div className="overflow-x-auto">
        <svg
          ref={svg}
          viewBox="0 30 1230 680"
          className={cn("mt-2 w-full min-w-[960px] select-none", drag && "cursor-grabbing")}
          onPointerMove={(e) => drag && setDraft((p) => ({ ...(p ?? saved), [drag]: toSvg(e) }))}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
        >
          {CITIES.map((c) => (
            <g key={c.t}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="18" fill="var(--chip-bg)" opacity="0.55" />
              <text x={c.tx} y={c.ty} fontSize="13" fontWeight="600" letterSpacing="1.2" fill="var(--muted-foreground)">
                {c.t.toUpperCase()}
              </text>
            </g>
          ))}
          <text x="914" y="236" fontSize="13" fontWeight="600" letterSpacing="1.2" fill="var(--muted-foreground)">
            КАРАГАНДА · ВНЕШНИЙ
          </text>
          {edit &&
            moved.map((n) => (
              <g key={n.id}>
                <rect
                  x={saved[n.id].x - 59}
                  y={saved[n.id].y - 15}
                  width="118"
                  height="30"
                  rx="9"
                  fill="none"
                  stroke="#4f8dff"
                  strokeDasharray="5 4"
                />
                <text x={saved[n.id].x} y={saved[n.id].y - 22} textAnchor="middle" fontSize="11" fill="#4f8dff">
                  было здесь
                </text>
              </g>
            ))}
          {LINKS.map((l) => (
            <Channel key={linkKey(l)} l={l} a={pos[l.a]} b={pos[l.b]} onClick={() => !edit && onLink(l)} />
          ))}
          {LINKS.filter((l) => !l.inner && (reserve || l.ab || l.ba)).map((l) => {
            const t = l.at ?? 0.5
            const x = pos[l.a].x + (pos[l.b].x - pos[l.a].x) * t
            const y = pos[l.a].y + (pos[l.b].y - pos[l.a].y) * t
            const label = linkLabel(l)
            const w = label.length * 6.3 + 26
            return (
              <g key={linkKey(l)} className="cursor-pointer" onClick={() => !edit && onLink(l)}>
                <rect x={x - w / 2} y={y - 11} width={w} height="22" rx="11" fill="var(--glass-card-solid)" stroke="var(--border)" />
                <circle cx={x - w / 2 + 10} cy={y} r="3.5" fill={loadColor(Math.max(l.ab, l.ba), !l.ab && !l.ba)} />
                <text x={x - w / 2 + 19} y={y + 4} fontSize="11" fontWeight="600" fill="var(--foreground)">
                  {label}
                </text>
              </g>
            )
          })}
          {NODES.map((n) => {
            const p = pos[n.id]
            const Icon = n.kind === "router" ? Router : n.kind === "external" ? Globe : Server
            return (
              <g
                key={n.id}
                className={edit ? "cursor-grab" : undefined}
                onPointerDown={(e) => {
                  if (!edit) return
                  ;(e.target as Element).setPointerCapture?.(e.pointerId)
                  setDrag(n.id)
                }}
              >
                <rect
                  x={p.x - 59}
                  y={p.y - 15}
                  width="118"
                  height="30"
                  rx="9"
                  fill="var(--glass-card-solid)"
                  stroke={n.kind === "router" ? "#085eff" : n.kind === "external" ? "#4f8dff" : "var(--border)"}
                  strokeDasharray={n.kind === "external" ? "4 3" : undefined}
                />
                <Icon x={p.x - 50} y={p.y - 7} width="14" height="14" color="var(--muted-foreground)" />
                <text x={p.x - 30} y={p.y + 4} fontSize="12" fontWeight="600" fontFamily="ui-monospace,monospace" fill="var(--foreground)">
                  {n.id}
                </text>
                {edit && (
                  <g>
                    <circle cx={p.x + 59} cy={p.y - 15} r="7" fill="#085eff" />
                    <Move x={p.x + 54} y={p.y - 20} width="10" height="10" color="#fff" />
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-3 max-sm:grid-cols-2">
        {(
          [
            ["Самый загруженный", "Уральск — Алматы · 86%", ""],
            ["С потерей ёмкости", "Атырау — Уральск · −100G", "text-[#f97316]"],
            ["Без трафика (резерв)", "2 канала", ""],
            ["Узлов ядра", "17 в 8 городах", ""],
          ] as const
        ).map(([t, v, c]) => (
          <div key={t} className="rounded-2xl bg-[var(--chip-bg)] px-4 py-3">
            <span className="block text-[11px] text-muted-foreground">{t}</span>
            <b className={cn("text-[13px] font-semibold", c)}>{v}</b>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Канал — две полосы со смещением, по одной на направление; точки бегут по потоку. */
function Channel({ l, a, b, onClick }: { l: CoreLink; a: { x: number; y: number }; b: { x: number; y: number }; onClick: () => void }) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const off = l.inner ? 3.2 : 3.2
  const nx = (-dy / len) * off
  const ny = (dx / len) * off
  const idle = !l.ab && !l.ba
  const w = l.inner ? 2.2 : 3.4
  const lanes = [
    {
      x1: a.x + nx,
      y1: a.y + ny,
      x2: b.x + nx,
      y2: b.y + ny,
      c: l.lost ? "#f97316" : loadColor(l.ab, idle),
      rev: false,
    },
    {
      x1: a.x - nx,
      y1: a.y - ny,
      x2: b.x - nx,
      y2: b.y - ny,
      c: l.lost ? "#f97316" : loadColor(l.ba, idle),
      rev: true,
    },
  ]
  return (
    <g opacity={l.inner ? 0.45 : 1} className={l.inner ? undefined : "cursor-pointer"} onClick={l.inner ? undefined : onClick}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="14" />
      {lanes.map((s, i) => (
        <g key={i}>
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth={w} strokeDasharray={l.rent || idle ? "7 6" : undefined} />
          {!idle && !l.inner && (
            <line
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke="#fff"
              strokeWidth="2.2"
              opacity=".55"
              strokeDasharray="2 14"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from={s.rev ? "0" : "32"}
                to={s.rev ? "32" : "0"}
                dur="1.4s"
                repeatCount="indefinite"
              />
            </line>
          )}
        </g>
      ))}
    </g>
  )
}

/* ---------- Трафик ---------- */

const PERIODS = ["1 час", "24 часа", "7 дней", "30 дней", "Период"]
const TICKS: Record<string, string[]> = {
  "1 час": ["17:24", "17:36", "17:48", "18:00", "18:12", "сейчас"],
  "24 часа": ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "сейчас"],
  "7 дней": ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
  "30 дней": ["08.09", "15.09", "22.09", "29.09", "06.10"],
  Период: ["01.09", "15.09", "01.10", "сейчас"],
}

function TrafficChart({
  title,
  cap,
  inPeak,
  outPeak,
  periods,
}: {
  title: string
  cap: number
  inPeak: number
  outPeak: number
  periods?: boolean
}) {
  const [p, setP] = useState("24 часа")
  const gid = `core-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const seed = PERIODS.indexOf(p) + 1
  const inn = useMemo(() => dayCurve(inPeak, 0, seed), [inPeak, seed])
  const out = useMemo(() => dayCurve(outPeak, 0.6, seed + 4), [outPeak, seed])
  const W = 600
  const H = 200
  const top = Math.ceil((cap * 1.1) / 100) * 100
  const y = (v: number) => H - (v / top) * H
  const path = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"}${((i / (vs.length - 1)) * W).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  const grid = [0, 0.3, 0.6, 0.9].map((k) => Math.round((top * k) / 10) * 10)
  return (
    <>
      {periods && (
        <header className="mb-3 flex flex-wrap items-center gap-3">
          <Ico icon={Activity} />
          <b className="text-[15px] font-semibold">{title}</b>
          <span className="ml-auto flex flex-wrap gap-1.5">
            {PERIODS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => (t === "Период" ? toast("Выбор периода — после подключения Orion") : setP(t))}
                className={cn(
                  "h-8 rounded-full border border-border px-3 text-[12px]",
                  p === t ? "border-[#085eff] bg-[rgba(8,94,255,0.18)]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </span>
        </header>
      )}
      <div className="mb-1 flex gap-3 text-[11px] text-muted-foreground">
        {(
          [
            ["IN", "#4f8dff"],
            ["OUT", "#10b981"],
            ["ёмкость", "#dc2626"],
          ] as const
        ).map(([t, c]) => (
          <span key={t} className="flex items-center gap-1.5">
            <i className="h-0.5 w-3" style={{ background: c }} />
            {t}
          </span>
        ))}
      </div>
      <svg viewBox={`-40 -14 ${W + 50} ${H + 34}`} className="w-full">
        <text x="-34" y="-4" fontSize="9" fill="var(--muted-foreground)">
          Gb/s
        </text>
        {grid.map((g) => (
          <g key={g}>
            <line x1="0" x2={W} y1={y(g)} y2={y(g)} stroke="var(--border)" />
            <text x="-6" y={y(g) + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
              {g}
            </text>
          </g>
        ))}
        <line x1="0" x2={W} y1={y(cap)} y2={y(cap)} stroke="#dc2626" strokeDasharray="4 4" />
        <text x={W} y={y(cap) - 4} textAnchor="end" fontSize="9" fill="#ff5257">
          ёмкость {cap} Gb
        </text>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#085eff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#085eff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={`${path(inn)} L${W},${H} L0,${H} Z`} fill={`url(#${gid})`} />
        <path d={path(inn)} fill="none" stroke="#4f8dff" strokeWidth="1.6" />
        <path d={path(out)} fill="none" stroke="#10b981" strokeWidth="1.6" />
        {TICKS[p].map((t, i, a) => (
          <text key={t} x={(i / (a.length - 1)) * W} y={H + 16} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
            {t}
          </text>
        ))}
      </svg>
    </>
  )
}

/* ---------- Города ---------- */

function City({ c, seed }: { c: CityCard; seed: number }) {
  const spark = useMemo(() => dayCurve(1, 0, seed + 1), [seed])
  const spark2 = useMemo(() => dayCurve(0.9, 0.5, seed + 7), [seed])
  const line = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"}${(i / (vs.length - 1)) * 300},${40 - v * 32}`).join(" ")
  const busy = Math.max(...c.rows.map((r) => Math.max(r[3], r[5])), 0)
  return (
    <section className={cn(glass, "flex flex-col p-4")}>
      <header className="flex items-start gap-2">
        <span className="min-w-0">
          <b className="block text-[14px] font-semibold">
            {c.t} ядро — <span className={c.lost ? "text-[#ff5257]" : undefined}>{c.cap}</span>
            {c.lost && <span className="font-normal text-muted-foreground"> из {c.lost}</span>}
          </b>
          <span className="font-mono text-[11px] text-muted-foreground">{c.nodes}</span>
        </span>
        <span className="ml-auto flex flex-none items-center gap-1.5 text-[11px] text-muted-foreground">
          <i className="size-1.5 rounded-full" style={{ background: c.lost ? "#f97316" : "#10b981" }} />
          {c.channels} каналов
        </span>
      </header>
      <div className="my-3 grid grid-cols-2 gap-4">
        {(
          [
            ["↓ IN", c.inGb, c.inPct],
            ["↑ OUT", c.outGb, c.outPct],
          ] as const
        ).map(([t, v, p]) => (
          <span key={t}>
            <span className="block text-[11px] text-muted-foreground">{t}</span>
            <b className="text-[22px] font-medium tabular-nums">{v}</b>
            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
              <i className="block h-full rounded-full" style={{ width: `${p}%`, background: loadColor(p) }} />
            </span>
          </span>
        ))}
      </div>
      <table className="w-full text-[10.5px] tabular-nums [&_td+td]:pl-2 [&_th+th]:pl-2">
        <thead>
          <tr className="text-muted-foreground">
            <th className="py-1 text-left font-medium">Интерфейс</th>
            <th className="py-1 text-right font-medium">IN</th>
            <th className="py-1 text-right font-medium">%</th>
            <th className="py-1 text-right font-medium">OUT</th>
            <th className="py-1 text-right font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {c.rows.map((r) => {
            const inner = r[1] === "внутри"
            return (
              <tr key={r[0]} className={cn("border-t border-border", inner && "text-muted-foreground")}>
                <td className="w-full py-1.5 pr-2 font-mono whitespace-nowrap">
                  {r[0]} → {r[1]}
                </td>
                <td className="py-1.5 text-right whitespace-nowrap">{r[2]}</td>
                <td className="py-1.5 text-right" style={{ color: inner ? undefined : loadColor(r[3]) }}>
                  {r[3]}%
                </td>
                <td className="py-1.5 text-right whitespace-nowrap">{r[4]}</td>
                <td className="py-1.5 text-right whitespace-nowrap" style={{ color: inner ? undefined : loadColor(r[5]) }}>
                  {r[5]}%{" "}
                  {r[5] === busy && busy >= 50 && (
                    <i className="inline-block size-1.5 rounded-full" style={{ background: loadColor(busy) }} />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {c.note && <p className="mt-2 font-mono text-[11px] text-muted-foreground">{c.note}</p>}
      <svg viewBox="0 0 300 44" preserveAspectRatio="none" className="mt-auto h-11 w-full pt-2">
        <path d={`${line(spark)} L300,44 L0,44 Z`} fill="rgba(8,94,255,0.18)" />
        <path d={line(spark)} fill="none" stroke="#4f8dff" strokeWidth="1.2" />
        <path d={line(spark2)} fill="none" stroke="#10b981" strokeWidth="1.2" />
      </svg>
    </section>
  )
}

/* ---------- Шторка канала (core-02) ---------- */

function LinkDrawer({ l, onClose }: { l: CoreLink; onClose: () => void }) {
  const [a, b] = l.city
  const load = Math.max(l.ab, l.ba)
  const cap = l.lost ? l.cap - l.lost : l.cap
  const gb = (p: number) => `${Math.round((cap * p) / 100)} Gb`
  return (
    <Modal
      side
      title={`${a} — ${b}`}
      sub={`${l.a} ↔ ${l.b} · ${l.rent ? "аренда / резерв" : "магистраль"} · ${load}% загрузки`}
      icon={Share2}
      width={720}
      onClose={onClose}
    >
      <div className="flex-1 overflow-y-auto px-7 py-5">
        <div className="grid grid-cols-4 gap-2.5 max-sm:grid-cols-2">
          {(
            [
              ["Ёмкость", `${cap} Gb`],
              ["Загрузка", `${load}%`],
              [`${a} → ${b}`, gb(l.ab)],
              [`${b} → ${a}`, gb(l.ba)],
            ] as const
          ).map(([t, v]) => (
            <div key={t} className="rounded-xl border border-border px-3.5 py-3">
              <span className="block truncate text-[11px] text-muted-foreground">{t}</span>
              <b className="text-[15px] font-semibold">{v}</b>
            </div>
          ))}
        </div>
        <Label>Трафик за 24 часа</Label>
        <TrafficChart title={`${l.a}-${l.b}`} cap={cap} inPeak={(cap * l.ba) / 100} outPeak={(cap * l.ab) / 100} />
        <Label>
          Линки в LAG {a}-{b} · 1
        </Label>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[11.5px] text-muted-foreground">
              <th className="py-1.5 font-medium">Сторона A</th>
              <th className="py-1.5 font-medium">Сторона B</th>
              <th className="py-1.5 font-medium">Скорость</th>
              <th className="py-1.5 font-medium">Состояние</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="py-2.5 font-mono">{l.a}:100GE1/0/13</td>
              <td className="py-2.5 font-mono">{l.b}:100GE1/0/13</td>
              <td className="py-2.5">{cap}G</td>
              <td className="py-2.5">
                <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2.5 py-1 text-[11px] text-[var(--status-ok)]">● Работает</span>
              </td>
            </tr>
          </tbody>
        </table>
        <Label>История аварий</Label>
        <p className="text-[12.5px] text-muted-foreground">
          {l.lost ? `Потеряно ${l.lost}G ёмкости · линк упал 07.10 15:56` : "За 30 дней аварий не было"}
        </p>
      </div>
      <footer className="flex justify-between gap-3 border-t border-[var(--dd-line)] px-7 py-4">
        <button type="button" className={btn()} onClick={() => toast("Orion — после подключения kticket-back")}>
          <Activity />
          Открыть в Orion
        </button>
        <button type="button" className={btn({ primary: true })} onClick={() => toast("Создание заявки — в KTicket")}>
          <TriangleAlert />
          Создать заявку
        </button>
      </footer>
    </Modal>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase after:h-px after:flex-1 after:bg-border">
      {children}
    </p>
  )
}

function Ico({ icon: I }: { icon: typeof Activity }) {
  return (
    <span className="grid size-8 flex-none place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
      <I className="size-4" />
    </span>
  )
}
