"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Box,
  Cable,
  ChevronLeft,
  Copy,
  Cpu,
  DatabaseBackup,
  Download,
  FileText,
  History,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  Maximize2,
  Pencil,
  QrCode,
  RadioTower,
  Rows3,
  Server,
  Shield,
  Trash2,
  Truck,
  UserCog,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { DeleteDialog } from "@/components/list/delete-dialog"
import { FormDrawer } from "@/components/list/form-drawer"
import { QrDialog } from "@/components/list/qr-dialog"
import { btn, circ, Pill } from "@/components/list/ui"
import { DocsTab } from "@/sections/nodes/tabs"
import { Gallery } from "@/components/passport/gallery"
import { Avatar, Card, glass, Kv, Legend, SegBar } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { routersList, switchesList } from "@/sections/spd/config"
import { nodeRows } from "@/sections/nodes/data"
import { branchFull, type SpdRow } from "@/sections/spd/data"
import { spdDetail, type Port, type SpdDetail } from "@/sections/spd/detail"
import { useRemoteRecord } from "@/lib/list/remote"
import { useRows } from "@/lib/list/store"
import type { Tone } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { CapacityTab, ChildrenTab, MolTab, MovesTab, PortDialog, PortsTab, ServiceTab } from "./tabs"

type Stage = "3d" | "panel" | "rack" | "photo"
export type SpdTab = "overview" | "ports" | "capacity" | "children" | "mol" | "docs" | "service" | "moves"

const STATUS: Record<SpdRow["status"], [string, Tone]> = { work: ["В работе", "ok"], repair: ["Ремонт", "warn"], off: ["Выведен", "bad"] }

/** Паспорт оборудования СПД (макет 03: экраны sw-01b 3D, sw-02 панель, sw-03 стойка, sw-04 фото и вкладки sw-05…sw-11). */
export function SpdPassport({ kind, id }: { kind: SpdRow["kind"]; id: number }) {
  const cfg = kind === "switch" ? switchesList : routersList
  const router = useRouter()
  const local = useRows(cfg).find((r) => r.id === id)
  const { row: x, loading } = useRemoteRecord(cfg, id, local)
  // Содержимое вкладок — пример по записи (TODO(API): порты, ёмкость, под-оборудование, МОЛ, перемещения)
  const [edits, setD] = useState<SpdDetail | null>(null)
  const d = edits ?? (x ? spdDetail(x) : null)
  const [stage, setStage] = useState<Stage>("3d")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  const [port, setPort] = useState<Port | "new" | null>(null)

  if (loading) return <div className="px-(--page-gutter) py-24 text-center text-muted-foreground">Загрузка паспорта…</div>
  if (!x || !d)
    return (
      <div className="px-(--page-gutter) py-24 text-center">
        <p className="text-lg font-semibold">Оборудование не найдено</p>
        <Link href={`/${cfg.key}`} className={cn(btn(), "mt-4")}>
          <ChevronLeft />К списку
        </Link>
      </div>
    )

  const node = nodeRows().find((n) => n.id === x.nodeId)
  const used = d.ports.filter((p) => p.oper === "up").length
  const down = d.ports.filter((p) => p.admin === "up" && p.oper === "down" && p.desc !== "—").length
  const sfp = d.ports.filter((p) => p.sfp && p.oper === "up").length
  const free = d.ports.length - used - down
  const full = tab === "overview"
  const update = (fn: (d: SpdDetail) => SpdDetail) => setD((s) => fn(s ?? d))
  const tabs: { k: SpdTab; t: string; icon: LucideIcon; n?: number }[] = [
    { k: "overview", t: "Обзор", icon: LayoutGrid },
    { k: "ports", t: "Порты", icon: Server, n: d.ports.length },
    { k: "capacity", t: "Портовая ёмкость", icon: Activity },
    { k: "children", t: "Под-оборудование", icon: Layers, n: d.children.length },
    { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: d.people.length },
    { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
    { k: "service", t: "Ввод и сервис", icon: Shield },
    { k: "moves", t: "История перемещений", icon: Truck, n: d.moves.length },
  ]
  const typeName = kind === "switch" ? "Коммутаторы" : "Маршрутизаторы"

  return (
    <div className="relative isolate">
      <section
        className={cn(
          "relative -mt-[96px] overflow-hidden pt-[112px]",
          full ? "min-h-[910px] max-[1279px]:min-h-0 max-[1279px]:pb-6" : "pb-6",
        )}
      >
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(900px_400px_at_55%_45%,rgba(8,94,255,0.16),transparent_70%)]" />
        {full && stage === "photo" && (
          <div aria-hidden className="absolute inset-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${d.media[0].src})` }} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,14,0.92)_0,rgba(10,11,14,0.35)_30%,rgba(10,11,14,0.1)_50%,rgba(10,11,14,0.35)_70%,rgba(10,11,14,0.92)_100%),linear-gradient(180deg,rgba(10,11,14,0.9)_0,transparent_25%,transparent_70%,var(--background)_100%)]" />
          </div>
        )}

        <header className="relative z-[2] flex flex-wrap items-center gap-x-[18px] gap-y-4 px-(--page-gutter)">
          <button
            type="button"
            onClick={() => router.push(`/${cfg.key}`)}
            className={cn(circ, "size-[54px] [&_svg]:size-5")}
            aria-label="Назад к списку"
          >
            <ChevronLeft />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-[var(--nav-text)]">
              Оборудование / СПД /{" "}
              <Link href={`/${cfg.key}`} className="hover:text-foreground">
                {typeName}
              </Link>{" "}
              / Паспорт оборудования
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-3 text-4xl font-semibold tracking-[-0.6px] max-sm:text-[26px]">
              {x.host}
              <button
                type="button"
                aria-label="Скопировать hostname"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigator.clipboard?.writeText(x.host).then(() => toast("Hostname скопирован"))}
              >
                <Copy className="size-5" />
              </button>
              <Pill tone={STATUS[x.status][1]}>{STATUS[x.status][0]}</Pill>
              <span className="inline-flex h-[26px] items-center rounded-full bg-[var(--chip-bg)] px-2.5 text-xs font-semibold">
                {kind}
              </span>
              <span className="inline-flex h-[26px] items-center rounded-full bg-[var(--chip-bg)] px-2.5 text-xs font-semibold">
                {x.network}
              </span>
            </h1>
          </div>
          <div className="ml-12 flex flex-wrap gap-x-[34px] gap-y-3 max-[1500px]:ml-0">
            <Stat icon={Server} t="Порты" v={used} em={`из ${d.ports.length} задействовано`} />
            <Stat icon={Layers} t="Под-оборудование" v={d.children.length} />
            {d.service.smartnet && <Stat icon={Shield} t="SmartNET" v={d.service.days} em="дня до конца" />}
          </div>
          <div className="ml-auto flex gap-2.5">
            <button type="button" className={cn(circ, "size-11")} title="QR-код" onClick={() => setQr(true)}>
              <QrCode />
            </button>
            <Link href={`/map?node=${x.nodeCode}`} className={btn()}>
              <MapIcon />
              На карту сети
            </Link>
            <button type="button" className={btn({ primary: true })} onClick={() => setEdit(true)}>
              <Pencil />
              Редактировать
            </button>
            <button
              type="button"
              aria-label="Удалить"
              onClick={() => setDel(true)}
              className={cn(circ, "size-11 text-[#ff5257] hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
            >
              <Trash2 />
            </button>
          </div>
        </header>

        {full && (
          <div className="pointer-events-none relative z-[2] mt-7 grid grid-cols-[400px_1fr_400px] gap-[18px] px-(--page-gutter) max-[1500px]:grid-cols-[360px_1fr_360px] max-[1279px]:grid-cols-1 [&>*]:pointer-events-auto">
            <Card
              icon={Server}
              title="Паспорт оборудования"
              className="self-start"
              action={
                <button type="button" className={circ} title="Все поля" onClick={() => setEdit(true)}>
                  <Maximize2 />
                </button>
              }
            >
              <Kv
                rows={[
                  { t: "Нумерация", v: x.num },
                  { t: "Филиал", v: branchFull(x.branch) },
                  { t: "Идентификатор УС", v: x.nodeCode },
                  { t: "Населённый пункт", v: x.city },
                  { t: "Адрес узла связи", v: x.address },
                  { t: "Тип сети", v: x.network },
                  { t: "Тип оборудования", v: kind },
                  { t: "Hostname", v: x.host },
                  { t: "IP-адрес управления", v: x.ip },
                  { t: "Тип ОС / прошивка", v: x.os },
                  { t: "Модель оборудования", v: x.model },
                  { t: "S/N оборудования", v: x.serial },
                ]}
              />
            </Card>

            <div className="relative min-h-[660px] max-[1279px]:min-h-[480px]">
              {stage === "3d" && (
                <div className="absolute inset-x-0 top-0 bottom-16">
                  <div
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: "url(/equipment/rack-scene.png)" }}
                  />
                </div>
              )}
              {stage === "panel" && <FrontPanel x={x} d={d} onPort={setPort} />}
              {stage === "rack" && <Rack d={d} />}
              {stage === "photo" && (
                <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-4">
                  <button type="button" className={btn({ primary: true })} onClick={() => setGallery(0)}>
                    <Maximize2 />
                    Открыть галерею
                  </button>
                  <div className="flex gap-2.5">
                    {d.media.map((m, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setGallery(i)}
                        aria-label={m.title}
                        className={cn(
                          "relative h-[62px] w-[86px] rounded-xl border-2 border-transparent bg-cover bg-center",
                          i === 0 && "border-[#085eff]",
                        )}
                        style={{ backgroundImage: `url(${m.src})` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <StageSwitch value={stage} onChange={setStage} />
            </div>

            <div className="flex flex-col gap-[18px]">
              <Card
                icon={RadioTower}
                title="Узел связи"
                action={
                  <Link href={`/nodes/${x.nodeId}`} className={circ} aria-label="Паспорт узла">
                    <ArrowUpRight />
                  </Link>
                }
              >
                <div className="h-[120px] rounded-2xl bg-cover bg-center" style={{ backgroundImage: "url(/nodes/clients.jpg)" }} />
                <Link href={`/nodes/${x.nodeId}`} className="mt-3 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                    <RadioTower className="size-[17px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold">{x.nodeCode}</b>
                    <span className="block truncate text-xs text-muted-foreground">{node?.address ?? `${x.city}, ${x.address}`}</span>
                  </span>
                  <Pill tone="ok">В работе</Pill>
                </Link>
              </Card>
              <Card icon={Cpu} title="Комплектация">
                <Kv
                  rows={[
                    { t: "№ порта", v: d.children[0]?.port ?? "—" },
                    { t: "Тип модуля", v: "1000BaseLX SFP" },
                    { t: "S/N модуля", v: d.children[0]?.serial ?? "—" },
                  ]}
                />
              </Card>
              <button
                type="button"
                onClick={() => setTab("mol")}
                className={cn(glass, "flex items-center gap-3 px-[18px] py-3.5 text-left")}
              >
                <Avatar initials={d.people[0].initials} color={d.people[0].color} className="size-11" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">МОЛ · ответственный</span>
                  <b className="block truncate text-sm font-semibold">{d.people[0].name}</b>
                </span>
                {d.people[1] && <Avatar initials={d.people[1].initials} color={d.people[1].color} className="size-8 text-[11px]" />}
              </button>
            </div>
          </div>
        )}
      </section>

      <nav className="relative z-[2] mx-(--page-gutter) mt-1 flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-[var(--glass-card)] p-1.5 backdrop-blur-[18px] [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.k}
            type="button"
            aria-pressed={tab === t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              "flex h-[42px] flex-none items-center gap-2 rounded-full px-3.5 text-[13.5px] whitespace-nowrap text-[var(--nav-text)] transition-colors hover:bg-[var(--nav-hover)]",
              tab === t.k && "bg-[var(--nav-on-bg)] font-semibold text-[var(--nav-on)] hover:bg-[var(--nav-on-bg)]",
            )}
          >
            <t.icon className="size-4" strokeWidth={1.75} />
            {t.t}
            {t.n !== undefined && (
              <em className={cn("rounded-full bg-[var(--chip-bg)] px-[7px] py-px text-[11.5px] not-italic", tab === t.k && "bg-black/10")}>
                {t.n}
              </em>
            )}
          </button>
        ))}
        <span className="flex-1" />
        {/* TODO: экспорт паспорта оборудования в PDF — на сервере */}
        <button type="button" className={btn({ sm: true })} onClick={() => toast("Экспорт паспорта — после подключения API")}>
          <Download />
          Экспорт
        </button>
      </nav>

      <div className="mt-[18px] px-(--page-gutter)">
        {tab === "overview" && <Overview d={d} used={used} down={down} free={free} sfp={sfp} onTab={setTab} />}
        {tab === "ports" && <PortsTab d={d} onEdit={setPort} />}
        {tab === "capacity" && <CapacityTab d={d} onSave={(capacity) => update((s) => ({ ...s, capacity }))} />}
        {tab === "children" && <ChildrenTab d={d} onChange={(children) => update((s) => ({ ...s, children }))} />}
        {tab === "mol" && <MolTab d={d} onChange={(mol) => update((s) => ({ ...s, mol }))} />}
        {tab === "docs" && <DocsTab d={d} onUpload={() => toast("Загрузка документов оборудования — после подключения API")} />}
        {tab === "service" && <ServiceTab d={d} onChange={(service) => update((s) => ({ ...s, service }))} />}
        {tab === "moves" && <MovesTab d={d} x={x} onChange={(moves) => update((s) => ({ ...s, moves }))} />}
      </div>

      {port && (
        <PortDialog
          port={port === "new" ? null : port}
          next={d.ports.length + 1}
          onClose={() => setPort(null)}
          onSave={(p) =>
            update((s) => ({
              ...s,
              ports: s.ports.some((o) => o.id === p.id) ? s.ports.map((o) => (o.id === p.id ? p : o)) : [...s.ports, p],
            }))
          }
          onDelete={(p) => update((s) => ({ ...s, ports: s.ports.filter((o) => o.id !== p.id) }))}
        />
      )}
      {gallery !== null && (
        <Gallery
          title={`Фото и видео · ${x.host}`}
          sub={`${x.model} · ${x.nodeCode}`}
          media={d.media}
          start={gallery}
          onClose={() => setGallery(null)}
        />
      )}
      {qr && cfg.qr && <QrDialog {...cfg.qr(x)} onClose={() => setQr(false)} />}
      {edit && <FormDrawer cfg={cfg} id={x.id} onClose={() => setEdit(false)} onDelete={() => (setEdit(false), setDel(true))} />}
      {del && <DeleteDialog cfg={cfg} rows={[x]} onClose={() => setDel(false)} onDone={() => router.push(`/${cfg.key}`)} />}
    </div>
  )
}

type TabKey = SpdTab

function Stat({ icon: Icon, t, v, em }: { icon: LucideIcon; t: string; v: number; em?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn(circ, "size-11 cursor-default hover:border-border hover:bg-[var(--chip-bg)] hover:text-[var(--nav-text)]")}>
        <Icon />
      </span>
      <span>
        <span className="block text-[12.5px] whitespace-nowrap text-[var(--nav-text)]">{t}</span>
        <b className="text-[28px] leading-tight font-medium tracking-[-0.5px] tabular-nums">
          {v}
          {em && <em className="ml-1.5 text-xs font-normal text-muted-foreground not-italic">{em}</em>}
        </b>
      </span>
    </div>
  )
}

function StageSwitch({ value, onChange }: { value: Stage; onChange: (s: Stage) => void }) {
  const items = [
    ["3d", "3D", Box],
    ["panel", "Передняя панель", Server],
    ["rack", "Стойка", Rows3],
    ["photo", "Фото", ImageIcon],
  ] as const
  return (
    <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-[rgba(18,20,25,0.84)] p-[5px] backdrop-blur-[12px] not-dark:bg-white/90">
      {items.map(([k, t, I]) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => onChange(k)}
          className={cn(
            "flex h-[38px] items-center gap-[7px] rounded-full px-4 text-[13.5px] whitespace-nowrap text-[var(--nav-text)]",
            value === k && "bg-[#085eff] font-semibold text-white",
          )}
        >
          <I className="size-4" />
          {t}
        </button>
      ))}
    </div>
  )
}

/* ---------- Передняя панель (sw-02) ---------- */

const PORT_CLS = {
  up: "border-[rgba(43,212,99,0.5)] [&>i]:bg-[#2bd463]",
  down: "border-[rgba(255,59,59,0.7)] [&>i]:bg-[#ff3b3b]",
  free: "border-white/10 [&>i]:bg-white/15",
}

/** Передняя панель 1U: медные порты в два ряда (нечётные сверху), SFP справа; клик — карточка порта. */
function FrontPanel({ x, d, onPort }: { x: SpdRow; d: SpdDetail; onPort: (p: Port) => void }) {
  const copper = d.ports.filter((p) => !p.sfp)
  const sfp = d.ports.filter((p) => p.sfp)
  const state = (p: Port) => (p.oper === "up" ? "up" : p.desc !== "—" && p.admin === "up" ? "down" : "free")
  const callouts = [copper[0], sfp[0], copper.find((p) => state(p) === "down")].filter(Boolean) as Port[]
  const portBtn = (p: Port) => (
    <button
      key={p.id}
      type="button"
      title={`${p.name} · ${p.desc}`}
      onClick={() => onPort(p)}
      className={cn(
        "relative flex h-[52px] w-[38px] flex-col items-center justify-end rounded-md border bg-[#0b0c10] pb-1 text-[9px] text-white/60 hover:border-[#4f8dff]",
        PORT_CLS[state(p)],
      )}
    >
      <i className="absolute top-1 left-1 size-1.5 rounded-full" />
      <span className="mb-1 h-4 w-6 rounded-sm bg-[#16181d]" />
      {p.id}
    </button>
  )
  return (
    <div className="absolute inset-x-0 top-0 bottom-16 flex flex-col justify-center">
      <div className="mb-3 flex justify-between px-2 text-[11px] text-muted-foreground">
        <span>
          {x.vendor} {x.model} · 1U
        </span>
        <span>
          {copper.length} × 1000BASE-T · {sfp.length} × SFP
        </span>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#22252d,#16181d)] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div className="w-[110px] flex-none text-white">
          <b className="block text-sm">{x.host}</b>
          <span className="text-[10px] text-white/50">
            {x.vendor} {x.model}
          </span>
          <span className="mt-2 flex gap-1.5 text-[9px] text-white/50">
            {["SYST", "RPS", "MAST", "STCK"].map((l, i) => (
              <span key={l} className="flex flex-col items-center gap-0.5">
                <i className={cn("size-1.5 rounded-full", i === 2 ? "bg-[#ffc24a]" : i === 3 ? "bg-white/20" : "bg-[#2bd463]")} />
                {l}
              </span>
            ))}
          </span>
        </div>
        <div className="grid flex-none grid-flow-col grid-rows-2 gap-1.5">{copper.map(portBtn)}</div>
        <div className="grid flex-none grid-flow-col grid-rows-2 gap-1.5">{sfp.map(portBtn)}</div>
        <span className="grid h-8 w-12 flex-none place-items-center rounded border border-white/10 bg-[#0b0c10] text-[8px] text-white/40">
          CONSOLE
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {callouts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPort(p)}
            className={cn(
              "rounded-2xl border border-border bg-[var(--glass-card)] px-4 py-2.5 text-left backdrop-blur",
              state(p) === "down" && "border-[rgba(255,59,59,0.5)]",
            )}
          >
            <span className="block text-[11px] text-muted-foreground">
              Порт {p.id} · {p.sfp ? "SFP · uplink" : state(p) === "down" ? "down" : p.speed}
            </span>
            <b className="block text-[13.5px] font-semibold">{state(p) === "down" ? `Нет линка с ${p.changed}` : p.desc}</b>
          </button>
        ))}
      </div>
      <Legend
        items={[
          { t: `Up ${d.ports.filter((p) => state(p) === "up").length}`, color: "var(--status-ok)" },
          { t: `Down ${d.ports.filter((p) => state(p) === "down").length}`, color: "var(--status-alarm)" },
          { t: `SFP-модуль ${sfp.filter((p) => p.module).length}`, color: "#4f8dff" },
          { t: `Свободно ${d.ports.filter((p) => state(p) === "free").length}`, color: "#8c919b" },
          { t: "Кликните на порт — откроется его карточка", color: "transparent" },
        ]}
      />
      <div className="mt-4 grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
        {(
          [
            [Cable, `Uplink ${sfp[0]?.name ?? ""}`, sfp[0]?.link?.sub ?? "—"],
            [Zap, "PoE 186 / 370 Вт", "12 портов с питанием"],
            [DatabaseBackup, `Бэкап конфига · ${x.backup ? "сегодня 03:00" : "нет"}`, `${x.host}.cfg · 14 КБ`],
          ] as const
        ).map(([I, t, s]) => (
          <div key={t} className={cn(glass, "flex items-center gap-3 rounded-2xl px-4 py-3")}>
            <span className="grid size-9 place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
              <I className="size-[17px]" />
            </span>
            <span className="min-w-0">
              <b className="block truncate text-[13.5px] font-semibold">{t}</b>
              <span className="block truncate text-xs text-muted-foreground">{s}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Стойка (sw-03) ---------- */

/** Шкаф 42U: занятые юниты, текущее устройство подсвечено. TODO: раскладка стойки из API. */
function Rack({ d }: { d: SpdDetail }) {
  const U = 34
  const filled = d.rack.reduce((a, r) => a + r.size, 0)
  return (
    <div className="absolute inset-x-0 top-0 bottom-16 flex justify-center gap-6">
      <div className={cn(glass, "self-start rounded-2xl px-4 py-3")}>
        <span className="block text-[11px] text-muted-foreground">Шкаф 1 · 42U · ряд A</span>
        <b className="text-[15px] font-semibold">Заполнен на {Math.round((filled / 42) * 100 + 30)}%</b>
      </div>
      <div className="flex w-[400px] flex-col rounded-xl border border-white/10 bg-[#121419] px-7 py-3">
        {Array.from({ length: U }, (_, i) => U - i).map((u) => {
          const r = d.rack.find((x) => x.unit === u)
          const inside = d.rack.some((x) => u < x.unit && u > x.unit - x.size)
          if (inside) return null
          return (
            <div key={u} className="relative flex items-stretch" style={{ height: `${(r?.size ?? 1) * 16}px` }}>
              <span className="absolute -left-6 w-5 text-right text-[8px] leading-4 text-white/30">{u % 5 === 0 || r ? u : ""}</span>
              {r ? (
                <span
                  className={cn(
                    "my-px flex flex-1 items-center justify-between rounded-[3px] border border-white/10 bg-[#1b1e25] px-2 text-[9.5px] text-white/75",
                    r.self && "border-[#4f8dff] bg-[rgba(8,94,255,0.25)] text-white shadow-[0_0_0_1px_#4f8dff]",
                  )}
                >
                  {r.title}
                  {r.on && (
                    <i className="flex gap-0.5 before:size-1 before:rounded-full before:bg-[#2bd463] after:size-1 after:rounded-full after:bg-[#2bd463]" />
                  )}
                </span>
              ) : (
                <span className="my-px flex-1 border-b border-white/[0.04]" />
              )}
            </div>
          )
        })}
      </div>
      <div className={cn(glass, "mt-14 self-start rounded-2xl px-4 py-3")}>
        <span className="block text-[11px] text-muted-foreground">Юнит {d.rack.find((r) => r.self)?.unit} · это устройство</span>
        <b className="text-[15px] font-semibold">{d.rack.find((r) => r.self)?.title}</b>
      </div>
    </div>
  )
}

/* ---------- Обзор (sw-01b, нижняя часть) ---------- */

function Overview({
  d,
  used,
  down,
  free,
  onTab,
}: {
  d: SpdDetail
  used: number
  down: number
  free: number
  sfp: number
  onTab: (t: SpdTab) => void
}) {
  const go = (t: SpdTab) => (
    <button type="button" className={circ} onClick={() => onTab(t)} aria-label="Открыть вкладку">
      <ArrowUpRight />
    </button>
  )
  const mounted = d.capacity.reduce((a, c) => a + c.mounted, 0)
  const busy = d.capacity.reduce((a, c) => a + c.used, 0)
  const problem = d.ports
    .filter((p) => p.oper === "down" && p.desc !== "—")
    .concat(d.ports.filter((p) => p.link))
    .slice(0, 3)
  const big = (n: number | string, t: string) => (
    <p className="mb-3 flex items-baseline gap-2">
      <b className="text-[34px] leading-none font-medium tracking-[-0.02em] tabular-nums">{n}</b>
      <span className="text-[13px] text-muted-foreground">{t}</span>
    </p>
  )
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-4 gap-[18px] max-[1500px]:grid-cols-2 max-sm:grid-cols-1">
        <Card icon={Server} title="Порты" action={go("ports")}>
          {big(used, `из ${d.ports.length}`)}
          <SegBar
            parts={[
              { v: used, color: "var(--status-ok)" },
              { v: down, color: "var(--status-alarm)" },
              { v: free, color: "var(--chip-bg)" },
            ]}
          />
          <Legend
            items={[
              { t: `Up ${used}`, color: "var(--status-ok)" },
              { t: `Down ${down}`, color: "var(--status-alarm)" },
              { t: `Свободно ${free}`, color: "#8c919b" },
            ]}
          />
        </Card>
        <Card icon={Activity} title="Портовая ёмкость" action={go("capacity")}>
          {big(`${mounted ? Math.round((busy / mounted) * 100) : 0}%`, "задействовано")}
          <p className="text-[12.5px] text-muted-foreground">
            {d.capacity
              .filter((c) => c.mounted)
              .map((c) => `${c.type} — ${c.used} / ${c.mounted}`)
              .join(" · ")}
          </p>
        </Card>
        <Card icon={Shield} title="SmartNET" action={go("service")}>
          {d.service.smartnet ? (
            <>
              {big(d.service.days, "дня до окончания")}
              <span className="block h-2 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                <i
                  className="block h-full rounded-full bg-[linear-gradient(90deg,#2bd463,#ffc24a)]"
                  style={{ width: `${Math.max(4, 100 - d.service.days / 10)}%` }}
                />
              </span>
              <p className="mt-2.5 text-[12.5px] text-muted-foreground">
                Контракт № {d.service.contract} · до {d.service.end}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground">Сервисного контракта нет</p>
          )}
        </Card>
        <Card icon={FileText} title="Документы" action={go("docs")}>
          {big(d.docs.length, "файлов")}
          <p className="text-[12.5px] text-muted-foreground">
            Акт ввода {d.service.act} от {d.service.actDate} · паспорт производителя ·{" "}
            {d.docs.filter((f) => f.kind === "Конфигурации").length} конфига
          </p>
        </Card>
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-[18px] max-[1279px]:grid-cols-1">
        <Card
          icon={Server}
          title="Проблемные и изменённые порты"
          count={problem.length}
          action={
            <button type="button" className={btn({ sm: true })} onClick={() => onTab("ports")}>
              <ArrowRight />
              Все порты
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-[13.5px]">
              <thead>
                <tr className="text-left text-[12.5px] text-muted-foreground">
                  {["Порт", "Состояние", "Подключён", "Описание", "Изменено"].map((h) => (
                    <th key={h} className="px-4 py-1 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {problem.map((p) => (
                  <tr key={p.id}>
                    {[
                      <b key="n">{p.name}</b>,
                      <Pill key="s" tone={p.oper === "up" ? "ok" : "bad"}>
                        {p.oper === "up" ? "Up" : "Down"}
                      </Pill>,
                      p.link
                        ? `${p.link.title} ${p.link.sub.split(" · ")[0]}`
                        : p.desc.match(/ID-\d+/)?.[0]
                          ? `Клиент ${p.desc.match(/ID-\d+/)?.[0]}`
                          : "—",
                      p.desc.replace(/ · ID-\d+/, ""),
                      p.changed,
                    ].map((c, i) => (
                      <td
                        key={i}
                        className="bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-4 py-3 whitespace-nowrap first:rounded-l-[14px] last:rounded-r-[14px]"
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card
          icon={History}
          title="История"
          count={d.log.length}
          action={
            <button type="button" className={btn({ sm: true })} onClick={() => onTab("moves")}>
              Вся история
            </button>
          }
        >
          <ol className="relative ml-1.5 border-l border-border pl-5">
            {d.log.slice(0, 3).map((h, i) => (
              <li key={i} className="relative pb-4 last:pb-0">
                <i className="absolute top-1 -left-[27px] size-3 rounded-full border-2 border-[#4f8dff] bg-[var(--glass-card-solid)]" />
                <b className="block text-sm font-semibold">{h.what}</b>
                <span className="text-xs text-muted-foreground">
                  {h.who} · {h.date}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}
