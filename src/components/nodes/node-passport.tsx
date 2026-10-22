"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Activity,
  ArrowUpRight,
  Box,
  Cable,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  History,
  Image as ImageIcon,
  LayoutGrid,
  Link as LinkIcon,
  Map as MapIcon,
  Maximize2,
  MessageSquare,
  Pencil,
  RadioTower,
  Server,
  Trash2,
  UserCog,
  Users,
} from "lucide-react"
import { DeleteDialog } from "@/components/list/delete-dialog"
import { FormDrawer } from "@/components/list/form-drawer"
import { btn, checkBox, circ, Pill, Tag } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { nodesList } from "@/config/lists/nodes"
import { nodeDetail } from "@/data/node-detail"
import { BRANCHES, STATUS_LABEL, type NodeRow } from "@/data/nodes"
import { useRows } from "@/lib/list/store"
import type { Tone } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { Avatar, glass, Kv } from "@/components/passport/ui"
import { NodeOverview } from "./node-overview"
import { ClientsTab, DocsTab, EquipmentTab, FibersTab, IdTab, PeopleTab } from "./node-tabs"

const PointsMap = dynamic(() => import("@/components/map/points-map").then((m) => m.PointsMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--feat-bg)]" />,
})

const TONE: Record<NodeRow["status"], Tone> = { work: "ok", rebuild: "warn", off: "bad" }
type Stage = "scene" | "map" | "photo"

export type TabKey = "overview" | "fibers" | "equipment" | "id" | "clients" | "people" | "docs" | "comments" | "history"

/** Паспорт узла связи (макет 02, экраны p01 «3D-схема», p02 «Карта», p03 «Фото» и вкладки t01…t08). */
export function NodePassport({ id }: { id: number }) {
  const router = useRouter()
  const rows = useRows(nodesList)
  const x = rows.find((r) => r.id === id)
  const [stage, setStage] = useState<Stage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [showNodes, setShowNodes] = useState(true)
  const d = useMemo(() => (x ? nodeDetail(x) : null), [x])
  // Верх целиком (сцена и колонки) — только на «Обзоре», на остальных вкладках — одна шапка
  const full = tab === "overview"

  if (!x || !d)
    return (
      <div className="px-(--page-gutter) py-24 text-center">
        <p className="text-lg font-semibold">Узел не найден</p>
        <Link href="/nodes" className={cn(btn(), "mt-4")}>
          <ChevronLeft />К списку узлов
        </Link>
      </div>
    )

  const branch = BRANCHES.find((b) => b.v === x.branch)
  const tabs: { k: TabKey; t: string; icon: typeof Cable; n?: number }[] = [
    { k: "overview", t: "Обзор", icon: LayoutGrid },
    { k: "fibers", t: "ВОЛС трассы", icon: Cable, n: d.fibers.length },
    { k: "equipment", t: "Оборудование", icon: Server, n: d.equipment.length },
    { k: "id", t: "ID-каналы", icon: LinkIcon, n: d.idChannels.length },
    { k: "clients", t: "Потенциальные клиенты", icon: Users, n: d.clients.total },
    { k: "people", t: "Ответственные", icon: UserCog, n: d.people.length },
    { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
    { k: "comments", t: "Комментарий", icon: MessageSquare, n: d.comments.length },
    { k: "history", t: "История", icon: History, n: d.history.length },
  ]
  const near = rows
    .filter((r) => r.city === x.city && r.onMap)
    .map((r) => ({ id: r.id, ll: r.ll, title: r.code, sub: r.object, tone: TONE[r.status] }))

  return (
    <div className="relative isolate">
      {/* ----- верх: шапка, колонки и сцена ----- */}
      <section
        className={cn(
          "relative -mt-[96px] overflow-hidden pt-[112px]",
          full ? "min-h-[910px] max-[1279px]:min-h-0 max-[1279px]:pb-6" : "pb-6",
        )}
      >
        {!full && (
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(900px_300px_at_60%_0%,rgba(0,26,159,0.45),transparent_70%)]" />
        )}
        {full && <Backdrop stage={stage} points={showNodes ? near : near.filter((n) => n.id === x.id)} id={x.id} />}

        <header className="relative z-[2] flex flex-wrap items-center gap-x-[18px] gap-y-4 px-(--page-gutter)">
          <button
            type="button"
            onClick={() => router.push("/nodes")}
            className={cn(circ, "size-[54px] [&_svg]:size-5")}
            aria-label="Назад к списку"
          >
            <ChevronLeft />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-[var(--nav-text)]">
              <Link href="/nodes" className="hover:text-foreground">
                Сеть / Узлы связи
              </Link>{" "}
              / Паспорт узла связи
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-3.5 text-4xl font-semibold tracking-[-0.6px] max-sm:text-[26px]">
              {x.code}
              <button
                type="button"
                aria-label="Скопировать ID"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigator.clipboard?.writeText(x.code).then(() => toast("ID скопирован"))}
              >
                <Copy className="size-5" />
              </button>
              <Pill tone={TONE[x.status]}>{STATUS_LABEL[x.status]}</Pill>
              <span className="inline-flex h-[26px] items-center rounded-full bg-[var(--chip-bg)] px-2.5 text-xs font-semibold">
                {x.network}
              </span>
            </h1>
          </div>
          <div className="ml-12 flex flex-wrap gap-x-[34px] gap-y-3 max-[1500px]:ml-0">
            <Stat icon={Activity} t="Волокон ВОЛС" v={d.capacity.fibers[1] || 0} em={`${d.capacity.fibers[0]} занято`} />
            <Stat icon={Server} t="Оборудование" v={160} em="12 типов" />
            <Stat icon={LinkIcon} t="ID-каналы" v={d.idChannels.length} />
            <Stat icon={Users} t="Потенц. клиенты" v={d.clients.total} em={`до ${d.clients.radius} м`} />
          </div>
          <div className="ml-auto flex gap-2.5">
            <Link href={`/map?node=${x.code}`} className={btn()}>
              <MapIcon />
              На карту сети
            </Link>
            <button type="button" className={btn({ primary: true })} onClick={() => setEdit(true)}>
              <Pencil />
              Редактировать
            </button>
            <button
              type="button"
              aria-label="Удалить узел"
              onClick={() => setDel(true)}
              className={cn(circ, "size-11 text-[#ff5257] hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
            >
              <Trash2 />
            </button>
          </div>
        </header>

        {full && (
          <div className="pointer-events-none relative z-[2] mt-7 grid grid-cols-[400px_1fr_400px] gap-[18px] px-(--page-gutter) max-[1500px]:grid-cols-[360px_1fr_360px] max-[1279px]:grid-cols-1 [&>*]:pointer-events-auto">
            {/* слева: паспорт и ёмкость */}
            <div className="flex flex-col gap-[18px]">
              <section className={cn(glass, "p-[22px]")}>
                <header className="mb-3 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-[11px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                    <RadioTower className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <h3 className="flex-1 text-base font-semibold">Паспорт узла</h3>
                  <button type="button" className={circ} title="Все поля" onClick={() => setEdit(true)}>
                    <Maximize2 />
                  </button>
                </header>
                <Kv
                  rows={[
                    { t: "Филиал", v: branch?.full ?? x.branch },
                    { t: "Порядковый № УС в филиале", v: x.num || "—" },
                    { t: "Идентификатор (ID)", v: x.code },
                    { t: "Населённый пункт", v: `г. ${x.city}` },
                    { t: "Адрес", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
                    { t: "Объект", v: x.object },
                    { t: "Тип сети", v: x.network },
                    { t: "Форма владения УС", v: x.ownership === "own" ? "Собственный" : "Аренда" },
                    { t: "Группа эксплуатации", v: x.opsGroup === "ЦТ" ? "Центр телекоммуникаций" : x.opsGroup || "—" },
                    { t: "Расположение ГЭ", v: x.opsPlace || "—" },
                    { t: "Удалённость от ГЭ", v: `${String(x.opsKm).replace(".", ",")} км` },
                  ]}
                />
              </section>
              <section className={cn(glass, "p-[22px]")}>
                <header className="mb-3 flex items-center gap-3">
                  <Activity className="size-5 text-[var(--link)]" />
                  <h3 className="flex-1 text-base font-semibold">Ёмкость узла</h3>
                  <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2.5 py-0.5 text-xs font-semibold text-[var(--status-ok)]">
                    98%
                  </span>
                </header>
                {(
                  [
                    ["Портовая (СПД)", d.capacity.ports],
                    ["Волокна (ВОЛС)", d.capacity.fibers],
                  ] as const
                ).map(([t, [a, b]]) => (
                  <div key={t} className="flex items-center gap-4 py-1.5 text-[13.5px]">
                    <span className="w-[140px] text-muted-foreground">{t}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                      <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${b ? (a / b) * 100 : 0}%` }} />
                    </span>
                    <b className="w-14 text-right font-medium tabular-nums">
                      {a} / {b || "—"}
                    </b>
                  </div>
                ))}
              </section>
            </div>

            {/* центр: подписи сцены и переключатель */}
            <div className="relative min-h-[640px] max-[1279px]:min-h-[420px]">
              {stage === "scene" &&
                d.scene.map((c) => (
                  <div
                    key={c.label}
                    className="absolute max-w-[240px] rounded-2xl border border-border bg-[var(--glass-card)] px-4 py-2.5 backdrop-blur-[12px]"
                    style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translateY(-50%)" }}
                  >
                    <span className="block text-[11px] text-muted-foreground">{c.label}</span>
                    <b className="block text-[13.5px] font-semibold whitespace-nowrap">{c.title}</b>
                    {c.bar !== undefined && (
                      <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-[var(--chip-bg)]">
                        <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${c.bar}%` }} />
                      </span>
                    )}
                  </div>
                ))}
              {stage === "map" && (
                <div className="absolute top-0 left-0 w-[220px] rounded-2xl border border-border bg-[var(--glass-card)] p-4 backdrop-blur-[12px]">
                  <span className="mb-2 block text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">Слои</span>
                  {(
                    [
                      ["Узлы связи", showNodes, () => setShowNodes(!showNodes)],
                      // TODO: слои ВОЛС, клиентов и участков — геометрии из API (общие с «Картой сети», 05)
                      ["ВОЛС трассы", false, null],
                      ["Потенциальные клиенты", false, null],
                      ["Земельные участки", false, null],
                    ] as const
                  ).map(([t, on, toggle]) => (
                    <button
                      key={t}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      disabled={!toggle}
                      title={toggle ? undefined : "Слой появится вместе с «Картой сети»"}
                      onClick={() => toggle?.()}
                      className="flex w-full items-center gap-2.5 py-1 text-left text-[13.5px] disabled:opacity-50"
                    >
                      <span className={checkBox(on)} />
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {stage === "photo" && (
                <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-4">
                    {/* TODO: галерея (g01, g02) */}
                    <button type="button" className={btn({ primary: true })} onClick={() => toast("Галерея — экран g01")}>
                      <Maximize2 />
                      Открыть галерею
                    </button>
                    <span className="text-[13px] text-[var(--nav-text)]">12 фото · 2 видео · обновлено {x.updated || "—"}</span>
                  </div>
                  <div className="flex gap-2.5">
                    {d.media.slice(0, 6).map((m, i) => (
                      <span
                        key={i}
                        className={cn(
                          "relative h-[62px] w-[86px] rounded-xl border-2 border-transparent bg-cover bg-center",
                          i === 0 && "border-[#085eff]",
                        )}
                        style={{ backgroundImage: `url(${m.src})` }}
                      >
                        {m.video && (
                          <span className="absolute bottom-1 left-1 rounded-full bg-black/70 px-1.5 text-[10px] font-bold text-white">
                            ▶ {m.video}
                          </span>
                        )}
                      </span>
                    ))}
                    <span className="grid h-[62px] w-[86px] place-items-center rounded-xl border border-border bg-[var(--glass-card)] text-sm font-semibold">
                      +{d.media.length - 6}
                    </span>
                  </div>
                </div>
              )}
              <StageSwitch value={stage} onChange={setStage} />
            </div>

            {/* справа: расположение / узлы рядом, технологии, фото, ответственный */}
            <div className="flex flex-col gap-[18px]">
              {stage === "map" ? (
                <section className={cn(glass, "p-[22px]")}>
                  <header className="mb-2 flex items-center gap-3">
                    <MapIcon className="size-5 text-[var(--link)]" />
                    <h3 className="text-base font-semibold">
                      Узлы рядом <em className="font-normal text-muted-foreground not-italic">{Math.min(4, near.length - 1)}</em>
                    </h3>
                  </header>
                  {near
                    .filter((n) => n.id !== x.id)
                    .slice(0, 4)
                    .map((n) => (
                      <Link
                        key={n.id}
                        href={`/nodes/${n.id}`}
                        className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
                      >
                        <span className="grid size-9 place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                          <RadioTower className="size-[17px]" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-sm font-semibold">{n.title}</b>
                          <span className="block truncate text-xs text-muted-foreground">{n.sub}</span>
                        </span>
                        <Pill tone={n.tone}>{n.tone === "warn" ? "Реконстр." : n.tone === "bad" ? "Выведен" : "В работе"}</Pill>
                      </Link>
                    ))}
                </section>
              ) : (
                <section className={cn(glass, "overflow-hidden")}>
                  <div className="relative h-[170px]">
                    <PointsMap
                      mini
                      points={near}
                      selected={x.id}
                      onSelect={(n) => n !== x.id && router.push(`/nodes/${n}`)}
                      className="absolute inset-0"
                    />
                    <span className="absolute bottom-3 left-3 z-[1] rounded-lg bg-[rgba(10,11,14,0.8)] px-2 py-1 text-[11px] font-semibold text-white tabular-nums">
                      {d.coords}
                    </span>
                  </div>
                  <div className="flex items-end gap-3 px-[22px] py-4">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] text-muted-foreground">Расположение</span>
                      <b className="block truncate text-sm font-semibold">{x.address}</b>
                    </span>
                    <button type="button" className={circ} title="Открыть на карте" onClick={() => setStage("map")}>
                      <ArrowUpRight />
                    </button>
                  </div>
                </section>
              )}
              <section className={cn(glass, "p-[22px]")}>
                <span className="block text-[13px] text-muted-foreground">Подключение УС к сети филиала</span>
                <span className="mt-2 mb-4 flex flex-wrap gap-1.5">
                  {x.techNode.length ? x.techNode.map((t) => <Tag key={t}>{t}</Tag>) : "—"}
                </span>
                <span className="block text-[13px] text-muted-foreground">Подключение клиентов к УС</span>
                <span className="mt-2 flex flex-wrap gap-1.5">{x.tech.length ? x.tech.map((t) => <Tag key={t}>{t}</Tag>) : "—"}</span>
              </section>
              {stage === "scene" && (
                <button
                  type="button"
                  onClick={() => setStage("photo")}
                  className="relative h-[122px] overflow-hidden rounded-3xl border border-border bg-cover bg-[position:center_35%] text-left text-white"
                  style={{ backgroundImage: "url(/nodes/tower.jpg)" }}
                >
                  <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,14,0.88),rgba(10,11,14,0.1))]" />
                  <span className="absolute top-[18px] left-5">
                    <span className="block text-xs text-white/70">Фото объекта · {d.media.length - 2}</span>
                    <b className="mt-1 block text-[15px] font-semibold">АМС {x.code.split(".")[0]} · 40 м</b>
                  </span>
                  <span className="absolute bottom-3.5 left-5 flex gap-1.5">
                    {d.media.slice(0, 2).map((m, i) => (
                      <i
                        key={i}
                        className="size-[34px] rounded-[9px] border border-white/25 bg-cover"
                        style={{ backgroundImage: `url(${m.src})` }}
                      />
                    ))}
                    <em className="grid size-[34px] place-items-center rounded-[9px] bg-white/12 text-[11px] font-semibold not-italic">
                      +{d.media.length - 4}
                    </em>
                  </span>
                </button>
              )}
              <section className={cn(glass, "flex items-center gap-3 px-[18px] py-3.5")}>
                <Avatar initials={d.people[0].initials} color={d.people[0].color} className="size-11" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">Ответственный за эксплуатацию</span>
                  <b className="block truncate text-sm font-semibold">{d.people[0].name}</b>
                </span>
                <span className="flex">
                  {d.people.slice(1, 2).map((p) => (
                    <Avatar
                      key={p.initials}
                      initials={p.initials}
                      color={p.color}
                      className="size-8 text-[11px] ring-2 ring-[var(--glass-card-solid)]"
                    />
                  ))}
                  {d.people.length > 1 && (
                    <span className="-ml-1.5 grid size-8 place-items-center rounded-full bg-[var(--chip-bg)] text-[11px] font-semibold ring-2 ring-[var(--glass-card-solid)]">
                      +1
                    </span>
                  )}
                </span>
              </section>
            </div>
          </div>
        )}
      </section>

      {/* ----- вкладки ----- */}
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
        {/* TODO: экспорт паспорта в PDF — на сервере */}
        <button type="button" className={btn({ sm: true })} onClick={() => toast("Экспорт паспорта в PDF — после подключения API")}>
          <Download />
          Экспорт паспорта
        </button>
      </nav>

      <div className="mt-[18px] px-(--page-gutter)">
        {tab === "overview" ? (
          <NodeOverview d={d} onTab={setTab} />
        ) : tab === "fibers" ? (
          <FibersTab node={x} d={d} />
        ) : tab === "equipment" ? (
          <EquipmentTab node={x} d={d} />
        ) : tab === "id" ? (
          <IdTab d={d} />
        ) : tab === "clients" ? (
          <ClientsTab node={x} d={d} />
        ) : tab === "people" ? (
          <PeopleTab d={d} />
        ) : tab === "docs" ? (
          <DocsTab d={d} />
        ) : (
          <p className="py-16 text-center text-muted-foreground">Вкладка «{tabs.find((t) => t.k === tab)?.t}» — следующим экраном</p>
        )}
      </div>

      {edit && <FormDrawer cfg={nodesList} id={x.id} onClose={() => setEdit(false)} onDelete={() => (setEdit(false), setDel(true))} />}
      {del && <DeleteDialog cfg={nodesList} rows={[x]} onClose={() => setDel(false)} onDone={() => router.push("/nodes")} />}
    </div>
  )
}

function Stat({ icon: Icon, t, v, em }: { icon: typeof Activity; t: string; v: number; em?: string }) {
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
    ["scene", "3D-схема", Box],
    ["map", "Карта", MapIcon],
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

/** Фон верхней части: 3D-сцена (картинка из макета; TODO: three.js-модель узла, handoff §6), карта или фото. */
function Backdrop({
  stage,
  points,
  id,
}: {
  stage: Stage
  points: { id: number; ll: [number, number]; title: string; sub: string; tone: Tone }[]
  id: number
}) {
  const router = useRouter()
  if (stage === "map")
    return (
      <div className="absolute inset-0 z-[1]">
        <PointsMap points={points} selected={id} onSelect={(n) => n !== id && router.push(`/nodes/${n}`)} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--background)_0,transparent_18%,transparent_80%,var(--background)_100%)]" />
      </div>
    )
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_55%_45%,rgba(8,94,255,0.16),transparent_70%)]" />
      {stage === "scene" ? (
        <div
          className="absolute top-[150px] left-1/2 h-[726px] w-[1100px] -translate-x-1/2 bg-contain bg-center bg-no-repeat max-[1279px]:hidden"
          style={{ backgroundImage: "url(/nodes/scene.png)" }}
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/nodes/g-1.jpg)" }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,14,0.92)_0,rgba(10,11,14,0.35)_30%,rgba(10,11,14,0.1)_50%,rgba(10,11,14,0.35)_70%,rgba(10,11,14,0.92)_100%),linear-gradient(180deg,rgba(10,11,14,0.9)_0,transparent_25%,transparent_70%,var(--background)_100%)]" />
        </>
      )}
    </div>
  )
}
