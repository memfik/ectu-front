"use client"

import { useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  ArrowRight,
  ArrowUpRight,
  Cable,
  ChartColumn,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Hash,
  History,
  Mail,
  Upload,
  UserRound,
  Info,
  MapPin,
  Users,
  Cpu,
  Grid2x2,
  Link as LinkIcon,
  List,
  Map as MapIcon,
  MoreHorizontal,
  Network,
  Package,
  Pencil,
  Phone,
  Plus,
  RadioTower,
  Satellite,
  Search,
  UserCog,
  Wifi,
  Zap,
} from "lucide-react"
import { btn, checkBox, circ, Pill } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import type { Equipment, NodeDetail, PortState } from "@/data/node-detail"
import type { NodeRow } from "@/data/nodes"
import { cn } from "@/lib/utils"
import { Avatar, Card, glass, Kv } from "@/components/passport/ui"

const PointsMap = dynamic(() => import("@/components/map/points-map").then((m) => m.PointsMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--feat-bg)]" />,
})

/* ---------- t01 · ВОЛС трассы ---------- */

/** Вкладка «ВОЛС трассы» (экран t01): выбранная трасса, сетка волокон, все трассы узла. */
export function FibersTab({ node: x, d }: { node: NodeRow; d: NodeDetail }) {
  const [sel, setSel] = useState(d.fibers[0]?.id)
  const [q, setQ] = useState("")
  const f = d.fibers.find((l) => l.id === sel)
  const list = d.fibers.filter((l) => `${l.num} ${l.to} ${l.cable}`.toLowerCase().includes(q.trim().toLowerCase()))

  if (!f)
    return (
      <Empty icon={Cable} title="К узлу не привязаны ВОЛС" text="Узел подключён по радиоканалу или трасса ещё не внесена.">
        <button type="button" className={btn({ primary: true })} onClick={() => toast("Привязка трассы — после подключения API")}>
          <Plus />
          Привязать трассу
        </button>
      </Empty>
    )

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-[1.6fr_1fr] gap-[18px] max-[1279px]:grid-cols-1">
        <Card
          icon={Cable}
          title={`ВОЛС трасса №${f.num}`}
          action={
            <span className="flex gap-2">
              {/* TODO: трасса на карте, редактирование трассы — раздел ВОЛС (07) */}
              <button type="button" className={btn({ sm: true })} onClick={() => toast("Трасса на карте — раздел ВОЛС (07)")}>
                <MapIcon />
                На карте
              </button>
              <button type="button" className={btn({ sm: true })} onClick={() => toast("Редактирование трассы — раздел ВОЛС (07)")}>
                <Pencil />
                Редактировать
              </button>
              <button type="button" className={circ} aria-label="Ещё">
                <MoreHorizontal />
              </button>
            </span>
          }
        >
          <div className="flex items-center gap-4 rounded-[20px] border border-[rgba(8,94,255,0.35)] bg-[rgba(8,94,255,0.08)] px-5 py-4">
            <End title={x.object} sub={`${x.code} · этот узел`} on />
            <span className="relative flex-1 border-t-2 border-dashed border-[#4f8dff]">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(8,94,255,0.45)] bg-[var(--glass-card-solid)] px-3 py-0.5 text-xs whitespace-nowrap text-[var(--nav-text)]">
                {String(f.km).replace(".", ",")} км · {f.way}
              </span>
            </span>
            <End title={f.to} sub={f.toCode} right />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
            {(
              [
                ["Волокон всего", f.total],
                ["Занято", f.used],
                ["Свободно", f.total - f.used - f.reserve, "text-[var(--status-ok)]"],
                ["Марка кабеля", f.cable],
                ["Протяжённость", `${String(f.km).replace(".", ",")} км`],
                ["ODF / кросс", f.odf],
              ] as const
            ).map(([t, v, c]) => (
              <div key={t} className="rounded-2xl border border-border bg-[var(--chip-bg)] px-4 py-3">
                <span className="block text-xs text-muted-foreground">{t}</span>
                <b className={cn("mt-1 block text-[15px] font-semibold tabular-nums", c)}>{v}</b>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={Grid2x2} title="Волокна" count={f.total}>
          <div className="-mt-2 mb-3 flex gap-4 text-xs text-muted-foreground">
            <Dot c="#085eff" t={`Занято ${f.used}`} />
            <Dot c="#ffc24a" t={`Резерв ${f.reserve}`} />
            <Dot c="#8c919b" t={`Свободно ${f.total - f.used - f.reserve}`} />
          </div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: f.total }, (_, i) => {
              const state = i < f.used ? "used" : i < f.used + f.reserve ? "reserve" : "free"
              return (
                <span
                  key={i}
                  className={cn(
                    "grid h-10 place-items-center rounded-[10px] border text-[13px] tabular-nums",
                    state === "used" && "border-[rgba(8,94,255,0.6)] bg-[rgba(8,94,255,0.22)]",
                    state === "reserve" && "border-[rgba(255,194,74,0.55)] bg-[rgba(255,194,74,0.16)] text-[#ffc24a]",
                    state === "free" && "border-border bg-[var(--chip-bg)] text-[var(--nav-text)]",
                  )}
                >
                  {i + 1}
                </span>
              )
            })}
          </div>
          <div className="mt-4">
            {f.usage.map((u) => (
              <div key={u.range} className="flex items-center gap-3 border-t border-border py-3">
                <span className="grid size-9 place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                  {u.kind === "equipment" ? <Network className="size-[17px]" /> : <LinkIcon className="size-[17px]" />}
                </span>
                <span>
                  <b className="block text-sm font-semibold">
                    {u.range} · {u.title}
                  </b>
                  <span className="text-xs text-muted-foreground">{u.sub}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        icon={List}
        title="Все трассы узла"
        count={d.fibers.length}
        action={
          <span className="flex gap-2.5">
            <SearchBox value={q} onChange={setQ} placeholder="Поиск трасс…" />
            <button type="button" className={btn({ primary: true })} onClick={() => toast("Привязка трассы — после подключения API")}>
              <Plus />
              Привязать трассу
            </button>
          </span>
        }
      >
        <Table
          head={["№", "Наименование трассы", "Начало", "Конец", "Марка кабеля", "Длина", "Волокна", "Занято", "Свободно", ""]}
          rows={list.map((l) => ({
            key: l.id,
            on: l.id === sel,
            onClick: () => setSel(l.id),
            cells: [
              l.num,
              <b key="n" className="font-semibold">
                {x.object} — {l.to}
              </b>,
              x.object,
              l.to,
              l.cable,
              `${String(l.km).replace(".", ",")} км`,
              <span key="b" className="flex items-center gap-2">
                <span className="h-1 w-[70px] overflow-hidden rounded-full bg-[var(--chip-bg)]">
                  <i className="block h-full bg-[#085eff]" style={{ width: `${(l.used / l.total) * 100}%` }} />
                </span>
                {l.total}
              </span>,
              l.used,
              <Pill key="f" tone="ok" className="[&>i]:hidden">
                {l.total - l.used - l.reserve}
              </Pill>,
              <span key="a" className="flex justify-end gap-1.5">
                <button
                  type="button"
                  className={cn(circ, "size-8")}
                  title="На карте"
                  onClick={() => toast("Трасса на карте — раздел ВОЛС (07)")}
                >
                  <MapIcon />
                </button>
                <button
                  type="button"
                  className={cn(circ, "size-8")}
                  title="Изменить"
                  onClick={() => toast("Редактирование трассы — раздел ВОЛС (07)")}
                >
                  <Pencil />
                </button>
                <button type="button" className={cn(circ, "size-8")} title="Открыть" onClick={() => setSel(l.id)}>
                  <ArrowUpRight />
                </button>
              </span>,
            ],
          }))}
        />
      </Card>
    </div>
  )
}

function End({ title, sub, on, right }: { title: string; sub: string; on?: boolean; right?: boolean }) {
  return (
    <span className={cn("flex items-center gap-3", right && "flex-row-reverse text-right")}>
      <span
        className={cn(
          "grid size-12 place-items-center rounded-2xl",
          on ? "bg-[#085eff] text-white" : "border border-border bg-[var(--chip-bg)] text-[var(--link)]",
        )}
      >
        <RadioTower className="size-5" />
      </span>
      <span>
        <b className="block text-[15px] font-semibold">{title}</b>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </span>
    </span>
  )
}

/* ---------- t02 · Оборудование ---------- */

const GROUPS = [
  { k: "spd", t: "СПД", icon: Network },
  { k: "pbx", t: "АТС", icon: Phone },
  { k: "power", t: "Электропитание", icon: Zap },
  { k: "wireless", t: "Беспроводное", icon: Wifi },
  { k: "sat", t: "Спутниковое", icon: Satellite },
  { k: "spare", t: "ЗИП", icon: Package },
] as const

const PORT: Record<PortState, string> = {
  up: "border-[rgba(43,212,99,0.45)] bg-[rgba(43,212,99,0.12)] text-[var(--status-ok)]",
  down: "border-[rgba(255,59,59,0.5)] bg-[rgba(255,59,59,0.12)] text-[#ff5257]",
  sfp: "border-[rgba(8,94,255,0.55)] bg-[rgba(8,94,255,0.2)] text-[var(--nav-text)]",
  free: "border-border bg-[var(--chip-bg)] text-muted-foreground",
}

/** Вкладка «Оборудование» (экран t02): группы, карточка устройства с портами, комплектация, МОЛ. */
export function EquipmentTab({ node: x, d }: { node: NodeRow; d: NodeDetail }) {
  const first = GROUPS.find((g) => d.equipment.some((e) => e.group === g.k))?.k ?? "spd"
  const [group, setGroup] = useState<Equipment["group"]>(first)
  const items = d.equipment.filter((e) => e.group === group)
  const [sel, setSel] = useState<number | undefined>(items[0]?.id)
  const e = items.find((i) => i.id === sel) ?? items[0]

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center gap-2">
        {GROUPS.map((g) => {
          const n = d.equipment.filter((i) => i.group === g.k).length
          return (
            <button
              key={g.k}
              type="button"
              aria-pressed={group === g.k}
              onClick={() => (setGroup(g.k), setSel(d.equipment.find((i) => i.group === g.k)?.id))}
              className={cn(
                "flex h-10 items-center gap-2 rounded-full border border-border bg-[var(--chip-bg)] px-4 text-[13.5px] text-[var(--nav-text)]",
                group === g.k && "border-[rgba(8,94,255,0.5)] bg-[rgba(8,94,255,0.16)] text-foreground",
              )}
            >
              <g.icon className="size-4" />
              {g.t}
              <em className="rounded-full bg-[var(--chip-bg)] px-[7px] text-[11.5px] not-italic">{n}</em>
            </button>
          )
        })}
        {/* TODO: добавление оборудования — формы разделов 03…35 */}
        <button
          type="button"
          className={cn(btn({ primary: true }), "ml-auto")}
          onClick={() => toast("Добавление оборудования — в разделе оборудования")}
        >
          <Plus />
          Добавить оборудование
        </button>
      </div>

      {!e ? (
        <Empty icon={Package} title="В этой группе оборудования нет" text={`На узле ${x.code} не учтено оборудование этого типа.`} />
      ) : (
        <div className="grid grid-cols-[1.6fr_1fr] gap-[18px] max-[1279px]:grid-cols-1">
          <Card
            icon={Network}
            title={e.model}
            action={
              <span className="flex items-center gap-2">
                <Pill tone={e.status === "ok" ? "ok" : "warn"}>{e.status === "ok" ? "Online" : "Нет линка"}</Pill>
                {/* TODO: паспорт оборудования — раздел 03 */}
                <button
                  type="button"
                  className={btn({ sm: true })}
                  onClick={() => toast("Паспорт оборудования — раздел «Коммутаторы» (03)")}
                >
                  <ArrowRight />
                  Паспорт оборудования
                </button>
              </span>
            }
          >
            <div className="grid grid-cols-[360px_1fr] gap-[22px] max-[1500px]:grid-cols-1">
              <span className="relative h-[260px] rounded-[20px] bg-cover bg-center" style={{ backgroundImage: `url(${e.photo})` }}>
                <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs text-white">Фото · 3</span>
              </span>
              <Kv
                rows={[
                  { t: "Hostname", v: e.host },
                  { t: "IP-адрес управления", v: e.ip },
                  { t: "Производитель / модель", v: `${e.vendor} · ${e.model}` },
                  { t: "Серийный номер", v: e.serial },
                  { t: "ОС / прошивка", v: e.os },
                  { t: "Тип сети", v: x.network },
                ]}
              />
            </div>
            {e.portList.length > 0 && (
              <>
                <div className="mt-6 mb-2.5 flex items-center justify-between">
                  <b className="text-base font-semibold">
                    Порты{" "}
                    <em className="font-normal text-muted-foreground not-italic">
                      {e.ports.up} / {e.portList.length} активны
                    </em>
                  </b>
                  <span className="flex gap-3 text-xs text-muted-foreground">
                    <Dot c="var(--status-ok)" t="up" />
                    <Dot c="var(--status-alarm)" t="down" />
                    <Dot c="#085eff" t="SFP" />
                    <Dot c="#8c919b" t="свободен" />
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1.5 max-sm:grid-cols-6">
                  {e.portList.map((p) => (
                    // TODO: редактор порта (состояние, клиент, описание) — «Передняя панель», handoff §6
                    <button
                      key={p.n}
                      type="button"
                      title={`Порт ${p.n} · ${p.state}`}
                      onClick={() => toast(`Порт ${p.n} — редактор порта появится с «Передней панелью»`)}
                      className={cn("h-[30px] rounded-md border text-[11px] tabular-nums", PORT[p.state])}
                    >
                      {p.n}
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>
          <div className="flex flex-col gap-[18px]">
            <Card icon={Cpu} title="Комплектация">
              <Kv
                rows={[
                  { t: "№ слота", v: e.module.slot },
                  { t: "№ порта", v: e.module.port },
                  { t: "Тип модуля", v: e.module.type },
                  { t: "S/N модуля", v: e.module.serial },
                ]}
              />
            </Card>
            <Card icon={UserCog} title="МОЛ и ответственный">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <span className="grid size-10 place-items-center rounded-full bg-[var(--chip-bg)] text-muted-foreground">?</span>
                <span className="flex-1">
                  <b className="block text-sm font-semibold">МОЛ не указан</b>
                  <span className="text-xs text-muted-foreground">Нужно для инвентаризации</span>
                </span>
                <button
                  type="button"
                  className={circ}
                  aria-label="Указать МОЛ"
                  onClick={() => toast("Назначение МОЛ — после подключения API")}
                >
                  <Plus />
                </button>
              </div>
              <div className="flex items-center gap-3 pt-3">
                <Avatar initials={d.people[0].initials} color={d.people[0].color} />
                <span>
                  <b className="block text-sm font-semibold">{d.people[0].name}</b>
                  <span className="text-xs text-muted-foreground">Ответственный за эксплуатацию</span>
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- общее ---------- */

export function Dot({ c, t }: { c: string; t: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <i className="size-2 rounded-full" style={{ background: c }} />
      {t}
    </span>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-10 w-60 items-center gap-2 rounded-full border border-border bg-[var(--chip-bg)] px-4 text-sm max-sm:w-full">
      <Search className="size-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </label>
  )
}

/** Таблица вкладок: строки-плашки, как в списке. */
export function Table({
  head,
  rows,
}: {
  head: string[]
  rows: { key: number | string; cells: React.ReactNode[]; on?: boolean; onClick?: () => void }[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-y-1.5 text-[13.5px]">
        <thead>
          <tr className="text-left text-[12.5px] text-muted-foreground">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-1 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} onClick={r.onClick} className={cn("group/r", r.onClick && "cursor-pointer")}>
              {r.cells.map((c, i) => (
                <td
                  key={i}
                  className={cn(
                    "bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-4 py-3.5 whitespace-nowrap first:rounded-l-[14px] last:rounded-r-[14px] group-hover/r:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
                    r.on && "bg-[rgba(8,94,255,0.08)]",
                  )}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={head.length} className="py-10 text-center text-muted-foreground">
                Ничего не найдено
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Empty({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: typeof Cable
  title: string
  text: string
  children?: React.ReactNode
}) {
  return (
    <section className={cn(glass, "flex flex-col items-center px-6 py-14 text-center")}>
      <span className={cn(circ, "size-[52px] cursor-default [&_svg]:size-6")}>
        <Icon />
      </span>
      <b className="mt-4 text-base font-semibold">{title}</b>
      <p className="mt-1 max-w-[420px] text-[13.5px] text-muted-foreground">{text}</p>
      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}

/* ---------- t03 · ID-каналы ---------- */

/** Вкладка «ID-каналы» (экран t03): фильтры, пустое состояние или таблица, «Как это работает», каналы рядом. */
export function IdTab({ d }: { d: NodeDetail }) {
  const [q, setQ] = useState("")
  const list = d.idChannels.filter((c) => `${c.num} ${c.client}`.toLowerCase().includes(q.trim().toLowerCase()))
  // TODO: привязка канала из реестра (14) и создание — API
  const link = () => toast("Привязка ID-канала — после подключения API")

  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-[18px] max-[1279px]:grid-cols-1">
      <section className={cn(glass, "p-[22px]")}>
        <div className="flex flex-wrap gap-2.5">
          <SearchBox value={q} onChange={setQ} placeholder="Поиск каналов…" />
          {["Тип канала", "Тип трафика", "Статус"].map((t) => (
            <button
              key={t}
              type="button"
              className={cn(btn(), "h-10 font-normal text-[var(--nav-text)]")}
              onClick={() => toast(`Фильтр «${t}» — когда появятся каналы`)}
            >
              {t}
            </button>
          ))}
        </div>
        {d.idChannels.length ? (
          <div className="mt-3">
            <Table
              head={["ID", "Клиент", "Скорость", "Статус"]}
              rows={list.map((c) => ({
                key: c.id,
                cells: [
                  <b key="n" className="font-semibold">
                    {c.num}
                  </b>,
                  c.client,
                  c.speed,
                  <Pill key="s" tone={c.status === "ok" ? "ok" : "muted"}>
                    {c.status === "ok" ? "Активен" : "Отключён"}
                  </Pill>,
                ],
              }))}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="grid size-[200px] place-items-center rounded-full border border-dashed border-[rgba(8,94,255,0.25)]">
              <span className="grid size-[120px] place-items-center rounded-full border border-[rgba(8,94,255,0.45)] bg-[radial-gradient(circle,rgba(8,94,255,0.35),rgba(8,94,255,0.08))] text-[var(--link)]">
                <LinkIcon className="size-10" strokeWidth={1.5} />
              </span>
            </span>
            <b className="mt-6 text-[22px] font-semibold">К узлу пока не привязано ни одного ID-канала</b>
            <p className="mt-2 max-w-[460px] text-sm text-muted-foreground">
              Привяжите существующий канал из реестра ID-каналов или создайте новый — он появится здесь вместе с трафиком, KLM и статусом.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button type="button" className={btn({ primary: true })} onClick={link}>
                <LinkIcon />
                Привязать из реестра
              </button>
              <button type="button" className={btn()} onClick={link}>
                <Plus />
                Создать канал
              </button>
            </div>
          </div>
        )}
      </section>
      <Card icon={Info} title="Как это работает">
        {[
          ["Найдите канал", "по ID, KLM или имени клиента в реестре"],
          ["Выберите узел и порт", "канал привяжется к оборудованию этого УС"],
          ["Проверьте статус", "трафик и состояние обновятся автоматически"],
        ].map(([t, s], i) => (
          <div key={t} className="mb-3 flex items-center gap-4 rounded-2xl border border-border bg-[var(--chip-bg)] px-4 py-3.5">
            <span className="grid size-8 place-items-center rounded-full bg-[rgba(8,94,255,0.18)] text-[13px] font-semibold text-[var(--link)]">
              {i + 1}
            </span>
            <span>
              <b className="block text-sm font-medium">{t}</b>
              <span className="text-xs text-muted-foreground">{s}</span>
            </span>
          </div>
        ))}
        <b className="mt-5 mb-1 block text-base font-semibold">
          Каналы рядом <em className="font-normal text-muted-foreground not-italic">{d.nearChannels.length}</em>
        </b>
        {d.nearChannels.slice(0, 2).map((c) => (
          <div key={c.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
            <span className="grid size-9 place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
              <LinkIcon className="size-[17px]" />
            </span>
            <span className="flex-1">
              <b className="block text-sm font-semibold">
                {c.id} · {c.node}
              </b>
              <span className="text-xs text-muted-foreground">
                {c.kind} · {String(c.km).replace(".", ",")} км
              </span>
            </span>
            <button type="button" className={circ} aria-label={`Привязать ${c.id}`} onClick={link}>
              <Plus />
            </button>
          </div>
        ))}
      </Card>
    </div>
  )
}

/* ---------- t04 · Потенциальные клиенты ---------- */

const CLIENT = {
  client: { t: "Клиент", tone: "ok", c: "var(--status-ok)" },
  processed: { t: "Обработан", tone: "warn", c: "#ffc24a" },
  none: { t: "Не обработан", tone: "muted", c: "#8c919b" },
} as const

/** Вкладка «Потенциальные клиенты» (экран t04): статусы, радиус, карта с кругом охвата, таблица B2B-клиентов. */
export function ClientsTab({ node: x, d }: { node: NodeRow; d: NodeDetail }) {
  const [st, setSt] = useState<"all" | keyof typeof CLIENT>("all")
  const [radius, setRadius] = useState(d.clients.radius)
  const [q, setQ] = useState("")
  const [sel, setSel] = useState<number | null>(null)
  const inRadius = d.clientList.filter((c) => c.m <= radius)
  const list = inRadius.filter(
    (c) => (st === "all" || c.status === st) && `${c.bin} ${c.name}`.toLowerCase().includes(q.trim().toLowerCase()),
  )
  const count = (k: keyof typeof CLIENT) => inRadius.filter((c) => c.status === k).length
  const points = [
    { id: 0, ll: x.ll, title: x.code, sub: x.object, tone: "info" as const },
    ...list.map((c) => ({ id: c.id, ll: c.ll, title: c.name, sub: c.bin, tone: CLIENT[c.status].tone })),
  ]

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "Все", inRadius.length, ""],
            ["client", "Клиент", count("client"), CLIENT.client.c],
            ["processed", "Обработан", count("processed"), CLIENT.processed.c],
            ["none", "Не обработан", count("none"), CLIENT.none.c],
          ] as const
        ).map(([k, t, n, c]) => (
          <button
            key={k}
            type="button"
            aria-pressed={st === k}
            onClick={() => setSt(k)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-full border border-border bg-[var(--chip-bg)] px-4 text-[13.5px] text-[var(--nav-text)]",
              st === k && "border-[rgba(8,94,255,0.5)] bg-[rgba(8,94,255,0.16)] text-foreground",
            )}
          >
            {c && <i className="size-1.5 rounded-full" style={{ background: c }} />}
            {t}
            <em className="rounded-full bg-[var(--chip-bg)] px-[7px] text-[11.5px] not-italic">{n}</em>
          </button>
        ))}
        <label className="relative flex h-10 items-center rounded-full border border-border bg-[var(--chip-bg)] pr-9 pl-4 text-[13.5px] text-[var(--nav-text)]">
          Радиус: {radius} м
          <select
            aria-label="Радиус"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {[100, 150, 250].map((r) => (
              <option key={r} value={r}>
                {r} м
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 size-4 opacity-60" />
        </label>
        <span className="flex-1" />
        <Link href="/summary-files?section=prospects" className={btn()}>
          <ChartColumn />
          Сводный отчёт
        </Link>
        <Link href={`/prospects?node=${x.code}`} className={btn()}>
          <ArrowRight />
          Все клиенты
        </Link>
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-[18px] max-[1279px]:grid-cols-1">
        <section className={cn(glass, "relative h-[600px] overflow-hidden max-[1279px]:h-[420px]")}>
          <PointsMap
            noCluster
            key={radius}
            points={points}
            selected={sel ?? 0}
            onSelect={setSel}
            ring={{ ll: x.ll, m: radius }}
            className="absolute inset-0"
          />
          <span className="absolute top-4 right-4 z-[1] rounded-full bg-[var(--glass-card)] px-3 py-1 text-[13px] font-semibold backdrop-blur">
            {radius} м
          </span>
        </section>
        <Card
          icon={Users}
          title="Потенциальные клиенты"
          count={inRadius.length}
          action={<SearchBox value={q} onChange={setQ} placeholder="БИН или название…" />}
        >
          <div className="max-h-[504px] overflow-auto">
            <Table
              head={["БИН", "Наименование", "Размер", "Дистанция", "Статус", ""]}
              rows={list.map((c) => ({
                key: c.id,
                on: c.id === sel,
                onClick: () => setSel(c.id),
                cells: [
                  <span key="b" className="text-muted-foreground tabular-nums">
                    {c.bin}
                  </span>,
                  <b key="n" className="font-semibold">
                    {c.name}
                  </b>,
                  c.size,
                  <span key="d" className="flex items-center gap-2 tabular-nums">
                    <span className="h-1 w-[80px] overflow-hidden rounded-full bg-[var(--chip-bg)]">
                      <i className="block h-full bg-[#085eff]" style={{ width: `${(c.m / radius) * 100}%` }} />
                    </span>
                    {c.m} м
                  </span>,
                  <Pill key="s" tone={CLIENT[c.status].tone} className="[&>i]:hidden">
                    {CLIENT[c.status].t}
                  </Pill>,
                  <span key="a" className="flex justify-end gap-1.5">
                    <button type="button" className={cn(circ, "size-8")} title="Показать на карте" onClick={() => setSel(c.id)}>
                      <MapPin />
                    </button>
                    {/* TODO: карточка клиента — раздел «Потенциальные» (12) */}
                    <Link href={`/prospects?bin=${c.bin}`} className={cn(circ, "size-8")} title="Карточка клиента">
                      <ArrowUpRight />
                    </Link>
                  </span>,
                ],
              }))}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ---------- t05 · Ответственные ---------- */

const SOURCE = { hr: ["HR-синхронизация", "info"], import: ["Импорт", "muted"], manual: ["Вручную", "muted"] } as const

/** Вкладка «Ответственные» (экран t05): МОЛ, карточки ответственных, история назначений. */
export function PeopleTab({ d }: { d: NodeDetail }) {
  // TODO: назначение МОЛ и ответственных — API (HR-справочник сотрудников)
  const manage = () => toast("Назначение ответственных — после подключения API")
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-3 gap-[18px] max-[1279px]:grid-cols-1">
        <Card
          icon={UserCog}
          title="МОЛ"
          action={<span className="rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-xs font-semibold">Не указано</span>}
        >
          <div className="flex flex-col items-center pb-2 text-center">
            <span className="grid size-[150px] place-items-center rounded-full border border-dashed border-[rgba(8,94,255,0.25)]">
              <span className="grid size-[84px] place-items-center rounded-full border border-[rgba(8,94,255,0.45)] bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
                <UserRound className="size-8" strokeWidth={1.5} />
              </span>
            </span>
            <b className="mt-4 text-[17px] font-semibold">Материально ответственное лицо не назначено</b>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">Укажите сотрудника, за которым числится оборудование узла.</p>
            <button type="button" className={cn(btn({ primary: true }), "mt-4")} onClick={manage}>
              <Plus />
              Назначить МОЛ
            </button>
          </div>
        </Card>
        {d.people.map((p, i) => (
          <section key={p.initials} className={cn(glass, "p-[22px]")}>
            <header className="mb-4 flex items-center gap-3.5">
              <Avatar initials={p.initials} color={p.color} className="size-16 text-xl" />
              <span className="min-w-0 flex-1">
                <b className="block text-lg font-semibold">{p.name}</b>
                <span className="text-[13px] text-muted-foreground">
                  {p.role} · ответственный №{i + 1}
                </span>
              </span>
              {p.synced && (
                <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2.5 py-1 text-xs font-semibold text-[var(--status-ok)]">
                  Синхронизировано
                </span>
              )}
            </header>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  [Phone, p.phone, "Телефон"],
                  [Mail, p.email, "Почта"],
                  [UserRound, p.dept, "Департамент"],
                  [Hash, p.inv, "Инвентарный №"],
                ] as const
              ).map(([I, v, t]) => (
                <span key={t} className="flex items-center gap-3 rounded-2xl border border-border bg-[var(--chip-bg)] px-4 py-3">
                  <I className="size-4 flex-none text-[var(--link)]" />
                  <span className="min-w-0">
                    <b className="block truncate text-[13.5px] font-medium">{v ?? "—"}</b>
                    <span className="text-[11.5px] text-muted-foreground">{t}</span>
                  </span>
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              {/* в макете номер скрыт — звонок по полному номеру из API */}
              <button type="button" className={cn(btn(), "flex-1 justify-center")} onClick={() => toast("Звонок — номер придёт из API")}>
                <Phone />
                Позвонить
              </button>
              <a href={`mailto:${p.email}`} className={cn(btn(), "flex-1 justify-center")}>
                <Mail />
                Написать
              </a>
              <button type="button" className={cn(circ, "size-11")} aria-label="Ещё" onClick={manage}>
                <MoreHorizontal />
              </button>
            </div>
          </section>
        ))}
      </div>
      <Card
        icon={History}
        title="История назначений"
        count={d.assignments.length}
        action={
          <button type="button" className={btn({ primary: true, sm: true })} onClick={manage}>
            <Users />
            Управлять ответственными
          </button>
        }
      >
        <Table
          head={["Сотрудник", "Роль", "Назначен", "Кем", "Источник"]}
          rows={d.assignments.map((a) => ({
            key: a.name + a.date,
            cells: [
              <b key="n" className="font-semibold">
                {a.name}
              </b>,
              a.role,
              a.date,
              a.by,
              <Pill key="s" tone={SOURCE[a.source][1]} className="[&>i]:hidden">
                {SOURCE[a.source][0]}
              </Pill>,
            ],
          }))}
        />
      </Card>
    </div>
  )
}

/* ---------- t06 · Документация ---------- */

const EXT_LABEL = { pdf: ["PDF", "#ff5257"], xlsx: ["XLS", "#2bd463"], docx: ["DOC", "#4f8dff"], dwg: ["DWG", "#ffc24a"] } as const

/** Вкладка «Документация» (экран t06): поиск и тип файла, колонки по разделам с превью, загрузка перетаскиванием. */
export function DocsTab({ d }: { d: NodeDetail }) {
  const [q, setQ] = useState("")
  const [ext, setExt] = useState<"all" | "pdf" | "xlsx">("all")
  const [paper, setPaper] = useState(() => Object.fromEntries(d.docGroups.map((g) => [g.kind, g.paper])))
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const docs = d.docs.filter((f) => (ext === "all" || f.ext === ext) && f.name.toLowerCase().includes(q.trim().toLowerCase()))
  // TODO: загрузка, просмотр и скачивание файлов — API (S3 / файловое хранилище)
  const upload = (files?: FileList | null) =>
    toast(files?.length ? `Файлов: ${files.length} — загрузка после подключения API` : "Загрузка — после подключения API")

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Поиск по документам…" />
        {(
          [
            ["all", "Все", d.docs.length],
            ["pdf", "PDF", d.docs.filter((f) => f.ext === "pdf").length],
            ["xlsx", "Excel", d.docs.filter((f) => f.ext === "xlsx").length],
          ] as const
        ).map(([k, t, n]) => (
          <button
            key={k}
            type="button"
            aria-pressed={ext === k}
            onClick={() => setExt(k)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-full border border-border bg-[var(--chip-bg)] px-4 text-[13.5px] text-[var(--nav-text)]",
              ext === k && "border-[rgba(8,94,255,0.5)] bg-[rgba(8,94,255,0.16)] text-foreground",
            )}
          >
            {t}
            <em className="rounded-full bg-[var(--chip-bg)] px-[7px] text-[11.5px] not-italic">{n}</em>
          </button>
        ))}
        <span className="flex-1" />
        <button type="button" className={btn()} onClick={() => toast("Архив ZIP — после подключения API")}>
          <Download />
          Скачать всё (ZIP)
        </button>
        <label className={cn(btn({ primary: true }), "cursor-pointer")}>
          <Upload />
          Загрузить
          <input type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
        </label>
      </div>

      <div className="grid grid-cols-3 items-start gap-[18px] max-[1279px]:grid-cols-1">
        {d.docGroups.map((g) => {
          const items = docs.filter((f) => f.kind === g.kind)
          const shown = open[g.kind] ? items : items.slice(0, 2)
          return (
            <section key={g.kind} className={cn(glass, "p-[18px]")}>
              <header className="mb-3 flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                  <FileText className="size-4" />
                </span>
                <b className="flex-1 text-[15px] font-semibold">
                  {g.kind} <em className="font-normal text-muted-foreground not-italic">{items.length}</em>
                </b>
                <label className={cn(circ, "cursor-pointer")} aria-label="Добавить файл">
                  <Plus />
                  <input type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
                </label>
              </header>
              <button
                type="button"
                role="checkbox"
                aria-checked={paper[g.kind]}
                onClick={() => setPaper({ ...paper, [g.kind]: !paper[g.kind] })}
                className="mb-3 flex w-full items-center gap-2.5 rounded-xl bg-[var(--chip-bg)] px-3 py-2.5 text-left text-[13px] text-[var(--nav-text)]"
              >
                <span className={checkBox(paper[g.kind])} />
                Имеется на бумажном носителе
              </button>
              <div className="flex flex-col gap-2.5">
                {shown.map((f) => {
                  const [label, color] = EXT_LABEL[f.ext]
                  return (
                    <div key={f.id} className="rounded-2xl border border-border bg-[var(--chip-bg)] p-3.5">
                      <div
                        aria-hidden
                        className="mb-3 flex h-[120px] flex-col gap-2.5 rounded-xl border border-border bg-[var(--glass-card-solid)] p-4"
                      >
                        {[80, 95, 60, 85, 55].map((w, i) => (
                          <i key={i} className="h-1 rounded-full bg-[var(--chip-bg)]" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[13px] font-medium" style={{ color }}>
                          {label}
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-[13.5px] font-medium">{f.name}</b>
                          <span className="text-[11.5px] text-muted-foreground">
                            {f.size} · {f.date}
                          </span>
                        </span>
                        <button
                          type="button"
                          className={cn(circ, "size-8")}
                          title="Просмотр"
                          onClick={() => toast("Просмотр — после подключения API")}
                        >
                          <Eye />
                        </button>
                        <button
                          type="button"
                          className={cn(circ, "size-8")}
                          title="Скачать"
                          onClick={() => toast("Скачивание — после подключения API")}
                        >
                          <Download />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {items.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOpen({ ...open, [g.kind]: !open[g.kind] })}
                    className="h-10 rounded-xl border border-border bg-[var(--chip-bg)] text-[13px] text-[var(--nav-text)]"
                  >
                    {open[g.kind] ? "Свернуть" : `Ещё ${items.length - 2} ${items.length - 2 === 1 ? "файл" : "файла"}`}
                  </button>
                )}
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    upload(e.dataTransfer.files)
                  }}
                  className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border text-[13px] text-muted-foreground"
                >
                  <Upload className="size-4" />
                  Перетащите файлы или <b className="font-semibold text-[var(--link)]">выберите</b>
                  <input type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
                </label>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
