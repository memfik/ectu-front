"use client"

import { useState } from "react"
import {
  ArrowRight,
  ArrowUpRight,
  Cable,
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
import { btn, circ, Pill } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import type { Equipment, NodeDetail, PortState } from "@/data/node-detail"
import type { NodeRow } from "@/data/nodes"
import { cn } from "@/lib/utils"
import { Avatar, Card, glass, Kv } from "@/components/passport/ui"

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
