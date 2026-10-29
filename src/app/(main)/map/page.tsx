"use client"

import { usePageTitle } from "@/hooks/use-page-title"
import { Suspense, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  Building2,
  Cable,
  Check,
  Clock,
  Cctv,
  Download,
  Globe,
  House,
  Layers,
  Map as MapIcon,
  Minus,
  Pencil,
  Plus,
  RadioTower,
  Ruler,
  Satellite,
  Search,
  Server,
  Undo2,
  Users,
  X,
} from "lucide-react"
import { Input, Select } from "@/components/list/form-controls"
import { btn, checkBox, circ, Pill } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { BRANCHES, nodeRows, STATUS_LABEL, type NodeRow } from "@/lib/api/node-data"
import { spdRows } from "@/lib/api/spd"
import { CameraDialog } from "@/components/cameras/camera-dialog"
import { cameras, PUBLIC_CAMS, type Camera } from "@/lib/api/cameras"
import { fmt } from "@/lib/list/query"
import { cn } from "@/lib/utils"
import type { Basemap, NetLine, NetPoint, View } from "@/components/map/network-map"

const NetworkMap = dynamic(() => import("@/components/map/network-map").then((m) => m.NetworkMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--feat-bg)]" />,
})

type LayerDef = { k: string; t: string; color: string; line?: boolean; on: boolean }
type Group = { t: string; icon: typeof RadioTower; layers: LayerDef[] }

/** Слои технической карты (макет 05, map-03): узлы по типу сети, линии, оборудование. */
const TECH: Group[] = [
  {
    t: "Узлы связи",
    icon: RadioTower,
    layers: [
      { k: "ГРС", t: "ГРС", color: "#4f8dff", on: true },
      { k: "ГМС", t: "ГМС", color: "#22d3ee", on: true },
      { k: "МС", t: "МС", color: "#a78bfa", on: true },
      { k: "ГАС", t: "ГАС (АТС)", color: "#ffc24a", on: true },
    ],
  },
  {
    t: "Линии и сооружения",
    icon: Cable,
    layers: [
      { k: "vols", t: "ВОЛС", color: "#4f8dff", line: true, on: true },
      { k: "trunk", t: "ВОЛС магистральные", color: "#ffc24a", line: true, on: true },
    ],
  },
  {
    t: "Видеонаблюдение",
    icon: Cctv,
    layers: [
      { k: "cam", t: "Камеры на узлах", color: "#ff5257", on: false },
      { k: "pub", t: "Публичные веб-камеры", color: "#22d3ee", on: false },
    ],
  },
  {
    t: "Оборудование",
    icon: Server,
    layers: [
      { k: "spd", t: "СПД", color: "#085eff", on: false },
      { k: "ams", t: "АМС", color: "#2bd463", on: true },
    ],
  },
]
/** Коммерческая карта (map-05): клиенты по статусу. */
const COMM: Group[] = [
  {
    t: "Потенциальные клиенты",
    icon: Users,
    layers: [
      { k: "client", t: "Клиент", color: "#2bd463", on: true },
      { k: "processed", t: "Обработан", color: "#ffc24a", on: true },
      { k: "none", t: "Не обработан", color: "#8c919b", on: true },
    ],
  },
  { t: "Узлы связи", icon: RadioTower, layers: [{ k: "nodes", t: "Все узлы", color: "#4f8dff", on: true }] },
]

const dist = (a: [number, number], b: [number, number]) => {
  const r = Math.PI / 180
  const x = (b[1] - a[1]) * r * Math.cos(((a[0] + b[0]) / 2) * r)
  const y = (b[0] - a[0]) * r
  return Math.sqrt(x * x + y * y) * 6371
}

/** Линии ВОЛС-пример: каждый узел — к ближайшему в городе; магистраль — цепочка городов филиала. TODO: геометрии трасс из API. */
function buildLines(nodes: NodeRow[]): NetLine[] {
  const out: NetLine[] = []
  const byCity = new Map<string, NodeRow[]>()
  for (const n of nodes) byCity.set(n.city, [...(byCity.get(n.city) ?? []), n])
  for (const list of byCity.values()) {
    list.forEach((n, i) => {
      let best: NodeRow | null = null
      for (const o of list.slice(0, i)) if (!best || dist(n.ll, o.ll) < dist(n.ll, best.ll)) best = o
      // ломаная «по улицам»: через угол
      if (best) out.push({ id: `v${n.id}`, coords: [n.ll, [n.ll[0], best.ll[1]], best.ll], layer: "vols", color: "#4f8dff", width: 1.6 })
    })
  }
  const centers = [...byCity.entries()].map(([city, l]) => ({ city, branch: l[0].branch, ll: l[0].ll }))
  for (const b of BRANCHES) {
    const c = centers.filter((x) => x.branch === b.v)
    for (let i = 1; i < c.length; i++)
      out.push({ id: `t${b.v}${i}`, coords: [c[i - 1].ll, c[i].ll], layer: "trunk", color: "#ffc24a", width: 2.4 })
  }
  // магистраль между филиалами — от Астаны
  const ast = centers.find((x) => x.city === "Астана")
  if (ast)
    for (const b of BRANCHES.filter((x) => x.v !== "АС")) {
      const c = centers.find((x) => x.branch === b.v)
      if (c) out.push({ id: `tm${b.v}`, coords: [ast.ll, c.ll], layer: "trunk", color: "#ffc24a", width: 2.4 })
    }
  return out
}

/** Карта сети (макет 05): слои, поиск, техническая / коммерческая, подложки, линейка, карточка выбранного узла. */
function MapPageContent() {
  const params = useSearchParams()
  const nodes = useMemo(() => nodeRows().filter((n) => n.onMap), [])
  const startNode = nodes.find((n) => n.code === params.get("node"))
  const [mode, setMode] = useState<"tech" | "comm">(params.get("layer") === "clients" ? "comm" : "tech")
  const [layers, setLayers] = useState<Record<string, boolean>>(() => ({
    ...Object.fromEntries([...TECH, ...COMM].flatMap((g) => g.layers.map((l) => [l.k, l.on]))),
    ...(params.get("layer") === "cameras" ? { cam: true } : {}),
  }))
  const [branch, setBranch] = useState(startNode?.branch ?? "")
  const [basemap, setBasemap] = useState<Basemap>("city")
  const [sel, setSel] = useState<string | null>(startNode ? `n${startNode.id}` : null)
  const [focus, setFocus] = useState<{ ll: [number, number]; zoom: number; n: number } | null>(
    startNode ? { ll: startNode.ll, zoom: 15, n: 0 } : null,
  )
  const [view, setView] = useState<View>({ lat: 51.16, lng: 71.43, zoom: 11, inView: {} })
  const [q, setQ] = useState("")
  const [ruler, setRuler] = useState<[number, number][] | null>(null)
  // map-13: режим редактора — новая трасса по кликам, сохранённые трассы добавляются к слою ВОЛС
  const [draw, setDraw] = useState<[number, number][] | null>(null)
  const [drawKind, setDrawKind] = useState<"vols" | "trunk">("vols")
  const [drawn, setDrawn] = useState<NetLine[]>([])
  const [cam, setCam] = useState<Camera | null>(null)
  const groups = mode === "tech" ? TECH : COMM
  const fly = (ll: [number, number], zoom: number) => setFocus((f) => ({ ll, zoom, n: (f?.n ?? 0) + 1 }))

  const inBranch = useMemo(() => nodes.filter((n) => !branch || n.branch === branch), [nodes, branch])
  const lines = useMemo(() => [...buildLines(inBranch), ...drawn], [inBranch, drawn])
  const cams = useMemo(() => cameras().filter((c) => !branch || c.branch === branch), [branch])
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const n of inBranch) c[n.network] = (c[n.network] ?? 0) + 1
    c.vols = lines.filter((l) => l.layer === "vols").length
    c.trunk = lines.filter((l) => l.layer === "trunk").length
    c.spd = spdRows("switch").length + spdRows("router").length
    c.ams = inBranch.filter((n) => n.network === "МС" || n.id % 4 === 0).length
    c.nodes = inBranch.length
    c.cam = cams.length
    c.pub = PUBLIC_CAMS.length
    c.client = Math.round(inBranch.length * 2.9)
    c.processed = Math.round(inBranch.length * 4.8)
    c.none = Math.round(inBranch.length * 23.3)
    return c
  }, [inBranch, lines, cams])

  const points = useMemo<NetPoint[]>(() => {
    const on = (k: string) => layers[k]
    if (mode === "comm") {
      const out: NetPoint[] = on("nodes")
        ? inBranch.map((n) => ({ id: `n${n.id}`, ll: n.ll, layer: "nodes", color: "#4f8dff", title: n.code }))
        : []
      // TODO: потенциальные клиенты из API (раздел 12); сейчас пример — точки вокруг узлов
      inBranch.forEach((n) => {
        for (let i = 0; i < 6; i++) {
          const st = i === 0 && n.id % 3 === 0 ? "client" : i === 1 ? "processed" : "none"
          if (!on(st)) continue
          const a = (n.id * 7 + i * 61) % 360
          const k = 0.0012 + ((n.id + i) % 5) * 0.0004
          out.push({
            id: `c${n.id}-${i}`,
            ll: [n.ll[0] + Math.sin(a) * k, n.ll[1] + Math.cos(a) * k * 1.6],
            layer: st,
            color: COMM[0].layers.find((l) => l.k === st)!.color,
            title: `Клиент ${n.code}-${i + 1}`,
          })
        }
      })
      return out
    }
    const out: NetPoint[] = inBranch
      .filter((n) => on(n.network))
      .map((n) => ({
        id: `n${n.id}`,
        ll: n.ll,
        layer: n.network,
        color: TECH[0].layers.find((l) => l.k === n.network)!.color,
        title: n.code,
      }))
    if (on("ams"))
      inBranch
        .filter((n) => n.network === "МС" || n.id % 4 === 0)
        .forEach((n) =>
          out.push({
            id: `a${n.id}`,
            ll: [n.ll[0] + 0.0006, n.ll[1] + 0.0009],
            layer: "ams",
            color: "#2bd463",
            title: `АМС ${n.code.split(".")[0]}`,
          }),
        )
    if (on("cam")) cams.forEach((c) => out.push({ id: `k${c.id}`, ll: c.ll, layer: "cam", color: c.online ? "#ff5257" : "#8c919b", title: c.id }))
    if (on("pub")) PUBLIC_CAMS.forEach((c) => out.push({ id: `k${c.id}`, ll: c.ll, layer: "pub", color: "#22d3ee", title: c.title }))
    if (on("spd"))
      [...spdRows("switch"), ...spdRows("router")]
        .filter((x) => !branch || x.branch === branch)
        .forEach((x) =>
          out.push({ id: `s${x.kind}${x.id}`, ll: [x.ll[0] - 0.0005, x.ll[1] - 0.0007], layer: "spd", color: "#085eff", title: x.host }),
        )
    return out
  }, [mode, layers, inBranch, branch, cams])
  // Один массив линий на рендер: новый массив при каждом рендере зацикливает onView карты
  const shownLines = useMemo(() => {
    const out = mode === "tech" ? lines.filter((l) => layers[l.layer]) : []
    return draw && draw.length > 1 ? [...out, { id: "draft", coords: draw, layer: "draft", color: "#2bd463", width: 3 }] : out
  }, [mode, lines, layers, draw])

  const found = q.trim()
    ? nodes.filter((n) => `${n.code} ${n.object} ${n.address}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : []
  const node = sel?.startsWith("n") ? nodes.find((n) => `n${n.id}` === sel) : undefined
  const rulerKm = ruler && ruler.length > 1 ? ruler.slice(1).reduce((a, p, i) => a + dist(ruler[i], p), 0) : 0
  const scaleM = Math.round(((40075016 * Math.cos((view.lat * Math.PI) / 180)) / 2 ** (view.zoom + 8)) * 100)
  const scale = scaleM >= 1000 ? `${Math.round(scaleM / 1000)} км` : `${Math.round(scaleM / 50) * 50 || 50} м`

  const glassBox = "rounded-2xl border border-border bg-[var(--glass-card)] backdrop-blur-[18px]"

  return (
    <div className="fixed inset-0 z-0">
      <NetworkMap
        points={points}
        lines={shownLines}
        basemap={basemap}
        selected={sel}
        focus={focus}
        onSelect={(id) => {
          if (ruler || draw) return
          const k = id?.startsWith("k") ? [...cams, ...PUBLIC_CAMS].find((c) => `k${c.id}` === id) : undefined
          if (k) return setCam(k)
          setSel(id)
        }}
        onView={setView}
        onMapClick={(ll) => (draw ? setDraw([...draw, ll]) : ruler && setRuler([...ruler, ll]))}
        className="absolute inset-0"
      />

      {/* верхняя строка: поиск, режим карты, фильтры */}
      <div className="absolute top-[104px] left-(--page-gutter) z-[2] flex flex-wrap items-center gap-2.5 max-sm:right-3 max-sm:left-3">
        <div className="relative w-[440px] max-sm:w-full">
          <Input
            icon={<Search />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск узлов, ВОЛС, адресов, координат…"
            className="rounded-full"
          />
          {found.length > 0 && (
            <div className={cn(glassBox, "absolute top-[52px] right-0 left-0 p-1.5")}>
              {found.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setSel(`n${n.id}`)
                    fly(n.ll, 15.5)
                    setQ("")
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[var(--nav-hover)]"
                >
                  <RadioTower className="size-4 text-[var(--link)]" />
                  <span className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold">{n.code}</b>
                    <span className="block truncate text-xs text-muted-foreground">{n.address}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={cn(glassBox, "flex gap-1 rounded-full p-1")}>
          {(
            [
              ["tech", "Техническая карта", Server],
              ["comm", "Коммерческая карта", Users],
            ] as const
          ).map(([k, t, I]) => (
            <button
              key={k}
              type="button"
              aria-pressed={mode === k}
              onClick={() => setMode(k)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-4 text-[13.5px] whitespace-nowrap text-[var(--nav-text)]",
                mode === k && "bg-[#085eff] font-semibold text-white",
              )}
            >
              <I className="size-4" />
              {t}
            </button>
          ))}
        </div>
        <Select
          value={branch}
          opts={[{ v: "", label: "Все филиалы" }, ...BRANCHES.map((b) => ({ v: b.v, label: `Филиал: ${b.v}` }))]}
          onChange={(v) => {
            setBranch(v)
            const n = nodes.find((x) => x.branch === v)
            if (n) fly(n.ll, 11)
          }}
          className="h-11 w-[190px] rounded-full"
        />
      </div>

      {/* слои */}
      <aside
        className={cn(
          glassBox,
          "absolute top-[166px] bottom-[110px] left-(--page-gutter) z-[2] w-[330px] overflow-auto rounded-3xl p-4 max-lg:hidden",
        )}
      >
        <header className="mb-3 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
            <Layers className="size-[17px]" />
          </span>
          <b className="flex-1 text-base font-semibold">Слои</b>
          <button
            type="button"
            className="text-[13px] text-[var(--link)]"
            onClick={() => setLayers(Object.fromEntries([...TECH, ...COMM].flatMap((g) => g.layers.map((l) => [l.k, l.on]))))}
          >
            Сбросить
          </button>
        </header>
        {groups.map((g) => (
          <section key={g.t} className="mb-2.5 rounded-2xl border border-border bg-[var(--chip-bg)] p-3">
            <h4 className="mb-1.5 flex items-center gap-2 text-[13.5px] font-semibold">
              <g.icon className="size-4" />
              {g.t}
              <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
                {fmt(g.layers.reduce((a, l) => a + (counts[l.k] ?? 0), 0))}
              </span>
            </h4>
            {g.layers.map((l) => (
              <button
                key={l.k}
                type="button"
                role="checkbox"
                aria-checked={layers[l.k]}
                onClick={() => setLayers({ ...layers, [l.k]: !layers[l.k] })}
                className="flex w-full items-center gap-2.5 py-1 text-left text-[13px]"
              >
                <span className={checkBox(layers[l.k])} />
                {l.line ? (
                  <i className="h-0.5 w-3.5 rounded" style={{ background: l.color }} />
                ) : (
                  <i className="size-2.5 rounded-full border-2" style={{ borderColor: l.color }} />
                )}
                <span className="flex-1">{l.t}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{fmt(counts[l.k] ?? 0)}</span>
              </button>
            ))}
          </section>
        ))}
      </aside>

      {/* инструменты справа */}
      <div className="absolute top-[166px] right-(--page-gutter) z-[2] flex flex-col gap-2.5">
        <div className={cn(glassBox, "flex flex-col p-1")}>
          {(
            [
              [Plus, "Приблизить", () => fly([view.lat, view.lng], view.zoom + 1)],
              [Minus, "Отдалить", () => fly([view.lat, view.lng], view.zoom - 1)],
              [House, "Казахстан", () => fly([48.2, 67.5], 4.6)],
            ] as const
          ).map(([I, t, f]) => (
            <button
              key={t}
              type="button"
              title={t}
              onClick={f}
              className="grid size-11 place-items-center rounded-xl hover:bg-[var(--nav-hover)]"
            >
              <I className="size-[18px]" />
            </button>
          ))}
        </div>
        <div className={cn(glassBox, "flex flex-col p-1")}>
          <button
            type="button"
            title="Линейка"
            aria-pressed={!!ruler}
            onClick={() => (setRuler(ruler ? null : []), setSel(null))}
            className={cn(
              "grid size-11 place-items-center rounded-xl hover:bg-[var(--nav-hover)]",
              ruler && "bg-[#085eff] text-white hover:bg-[#085eff]",
            )}
          >
            <Ruler className="size-[18px]" />
          </button>
          <button
            type="button"
            title="Редактор трасс"
            aria-pressed={!!draw}
            onClick={() => {
              setRuler(null)
              setDraw(draw ? null : node ? [node.ll] : [])
            }}
            className={cn("grid size-11 place-items-center rounded-xl hover:bg-[var(--nav-hover)]", draw && "bg-[#085eff] text-white hover:bg-[#085eff]")}
          >
            <Pencil className="size-[18px]" />
          </button>
          {/* TODO: выгрузка видимой области (map-12) — на сервере */}
          <button
            type="button"
            title="Отчёт по области"
            onClick={() => toast("Отчёт по видимой области — после подключения API")}
            className="grid size-11 place-items-center rounded-xl hover:bg-[var(--nav-hover)]"
          >
            <Download className="size-[18px]" />
          </button>
        </div>
      </div>

      {/* карточка узла */}
      {node && (
        <section
          className={cn(
            glassBox,
            "absolute top-[166px] right-[calc(var(--page-gutter)+70px)] z-[2] w-[360px] rounded-3xl p-5 max-sm:right-3 max-sm:left-3 max-sm:w-auto",
          )}
        >
          <header className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              <RadioTower className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-lg font-semibold">{node.code}</b>
              <span className="block truncate text-[13px] text-muted-foreground">{node.object}</span>
            </span>
            <button type="button" className={cn(circ, "size-8")} aria-label="Закрыть" onClick={() => setSel(null)}>
              <X />
            </button>
          </header>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pill tone={node.status === "work" ? "ok" : node.status === "rebuild" ? "warn" : "bad"}>{STATUS_LABEL[node.status]}</Pill>
            <span className="rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-xs font-semibold">{node.network}</span>
            <span className="rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-xs font-semibold">{node.branch}</span>
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">{node.address}</p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {node.ll[0].toFixed(5)}, {node.ll[1].toFixed(5)}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["Волокон", node.fibers?.[1] ?? "—"],
              ["Оборуд.", node.equipment],
              ["Клиенты", node.clients],
            ].map(([t, v]) => (
              <span key={t} className="rounded-xl border border-border bg-[var(--chip-bg)] py-2">
                <b className="block text-lg font-medium tabular-nums">{v}</b>
                <span className="text-[11px] text-muted-foreground">{t}</span>
              </span>
            ))}
          </div>
          <Link href={`/nodes/${node.id}`} className={cn(btn({ primary: true }), "mt-4 w-full justify-center")}>
            Паспорт узла
            <ArrowRight />
          </Link>
        </section>
      )}

      {ruler && (
        <div
          className={cn(
            glassBox,
            "absolute top-[166px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 text-sm",
          )}
        >
          <Ruler className="size-4 text-[var(--link)]" />
          {ruler.length < 2
            ? "Кликните точки на карте"
            : `${rulerKm < 1 ? `${Math.round(rulerKm * 1000)} м` : `${rulerKm.toFixed(2).replace(".", ",")} км`} · ${ruler.length} точки`}
          <button type="button" className="text-[var(--link)]" onClick={() => setRuler([])}>
            Сбросить
          </button>
        </div>
      )}

      {draw && (
        <div className={cn(glassBox, "absolute top-[166px] left-1/2 z-[3] flex -translate-x-1/2 flex-wrap items-center gap-3 rounded-2xl border-[#2bd463]/40 px-3 py-2 text-[13px]")}>
          <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2.5 py-1 text-[11px] text-[var(--status-ok)]">● Режим редактора</span>
          <b className="font-semibold">Новая {drawKind === "trunk" ? "магистральная" : "ВОЛС"} трасса</b>
          <span className="text-muted-foreground">
            {node ? `от ${node.code} · ` : ""}
            {draw.length} {draw.length === 1 ? "точка" : draw.length < 5 ? "точки" : "точек"} ·{" "}
            {(() => {
              const km = draw.slice(1).reduce((a, p, i) => a + dist(draw[i], p), 0)
              return km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(2).replace(".", ",")} км`
            })()}
          </span>
          <Select
            value={drawKind}
            opts={[
              { v: "vols", label: "Тип: ВОЛС" },
              { v: "trunk", label: "Тип: магистраль" },
            ]}
            onChange={(v) => setDrawKind(v as "vols" | "trunk")}
            className="h-9 w-[170px] rounded-full"
          />
          <button type="button" className={btn({ sm: true })} onClick={() => setDraw(draw.slice(0, -1))} disabled={!draw.length}>
            <Undo2 />
            Отменить
          </button>
          <button
            type="button"
            className={btn({ sm: true, primary: true })}
            disabled={draw.length < 2}
            onClick={() => {
              // TODO(API): сохранить геометрию трассы (создание ВОЛС с координатами участков)
              setDrawn([
                ...drawn,
                { id: `d${drawn.length}`, coords: draw, layer: drawKind, color: drawKind === "trunk" ? "#ffc24a" : "#4f8dff", width: drawKind === "trunk" ? 2.4 : 1.6 },
              ])
              setDraw(null)
              toast("Трасса сохранена на карте — запись ВОЛС создайте в разделе «ВОЛС»")
            }}
          >
            <Check />
            Сохранить трассу
          </button>
          <span className="w-full text-[11.5px] text-muted-foreground">Клик по карте — следующая точка · «Отменить» убирает последнюю</span>
        </div>
      )}
      {cam && <CameraDialog cam={cam} onClose={() => setCam(null)} />}

      {/* подложки */}
      <div className={cn(glassBox, "absolute bottom-[58px] left-1/2 z-[2] flex -translate-x-1/2 gap-1 rounded-full p-1 max-sm:bottom-3")}>
        {(
          [
            ["globe", "3D глобус", Globe],
            ["kz", "Казахстан 2D", MapIcon],
            ["city", "Город", Building2],
            ["city3d", "Город 3D", Building2],
            ["sat", "Спутник", Satellite],
          ] as const
        ).map(([k, t, I]) => (
          <button
            key={k}
            type="button"
            aria-pressed={basemap === k}
            onClick={() => setBasemap(k)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] whitespace-nowrap text-[var(--nav-text)]",
              basemap === k && "bg-[var(--nav-on-bg)] font-semibold text-[var(--nav-on)]",
            )}
          >
            <I className="size-4" />
            {t}
          </button>
        ))}
      </div>

      {/* строка состояния */}
      <div className="absolute bottom-3 left-(--page-gutter) z-[2] flex flex-wrap gap-2 text-xs max-sm:hidden">
        <span className={cn(glassBox, "flex items-end gap-1.5 rounded-xl px-3 py-1.5")}>
          <i className="mb-1 block h-1 w-16 border-x border-b border-current" />
          {scale}
        </span>
        <span className={cn(glassBox, "rounded-xl px-3 py-1.5 font-mono tabular-nums")}>
          {view.lat.toFixed(5)}, {view.lng.toFixed(5)} · z{Math.round(view.zoom)}
        </span>
        <span className={cn(glassBox, "rounded-xl px-3 py-1.5")}>
          {mode === "tech"
            ? `${fmt(["ГРС", "ГМС", "МС", "ГАС"].reduce((a, k) => a + (view.inView[k] ?? 0), 0))} узлов · ${fmt(view.inView.vols ?? 0)} ВОЛС · ${fmt(view.inView.ams ?? 0)} АМС в видимой области`
            : `${fmt((view.inView.client ?? 0) + (view.inView.processed ?? 0) + (view.inView.none ?? 0))} клиентов в видимой области`}
        </span>
        {mode === "tech" && layers.cam && (
          <Link href="/cameras" className={cn(glassBox, "rounded-xl px-3 py-1.5 hover:text-foreground")}>
            {fmt(cams.filter((c) => c.online).length)} камеры online · {fmt(cams.filter((c) => !c.online).length)} offline
          </Link>
        )}
      </div>
      <span
        className={cn(
          glassBox,
          "absolute right-(--page-gutter) bottom-3 z-[2] flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs max-sm:hidden",
        )}
      >
        <Clock className="size-3.5" />
        Данные обновлены сегодня 06:30
      </span>
    </div>
  )
}

/** Параметры адреса читаются в Suspense (cacheComponents). */
export default function MapPage() {
  usePageTitle("Карта сети")
  return (
    <Suspense>
      <MapPageContent />
    </Suspense>
  )
}
