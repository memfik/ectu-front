"use client"

import { useState } from "react"
import { Dialog } from "radix-ui"
import {
  Activity,
  Bell,
  Cable,
  Check,
  Download,
  FileText,
  Layers,
  Map as MapIcon,
  Pencil,
  PieChart,
  Plus,
  Search,
  Server,
  Shield,
  Trash2,
  Truck,
  UserCog,
  Users,
  X,
} from "lucide-react"
import { DateInput, Input, Select } from "@/components/list/form-controls"
import { btn, checkBox, circ, Pill } from "@/components/list/ui"
import { SearchBox } from "@/sections/nodes/tabs"
import { Avatar, Card, glass, Kv } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { STAFF } from "@/sections/nodes/detail"
import { BRANCHES, nodeRows } from "@/sections/nodes/data"
import type { SpdRow } from "@/lib/api/spd"
import type { Child, Move, Port, SpdDetail } from "@/lib/api/spd-detail"
import { cn } from "@/lib/utils"

/*
 * Вкладки паспорта СПД (макет 03: sw-05 порты, sw-06 ёмкость, sw-07 под-оборудование, sw-08 МОЛ,
 * sw-10 ввод и сервис, sw-11 перемещения) и окна swp-09…12. Изменения — в состоянии паспорта (TODO: API).
 */

const cell =
  "bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-4 py-3.5 whitespace-nowrap first:rounded-l-[14px] last:rounded-r-[14px]"
const Dot = ({ up }: { up: boolean }) => (
  <span className="flex items-center gap-1.5 font-semibold">
    <i className={cn("size-1.5 rounded-full", up ? "bg-[var(--status-ok)]" : "bg-[var(--status-alarm)]")} />
    {up ? "up" : "down"}
  </span>
)

/* ---------- Порты (sw-05) ---------- */

export function PortsTab({ d, onEdit }: { d: SpdDetail; onEdit: (p: Port | "new") => void }) {
  type F = "all" | "up" | "down" | "free" | "sfp"
  const [f, setF] = useState<F>("all")
  const [q, setQ] = useState("")
  const [sel, setSel] = useState<number>(d.ports.find((p) => p.link)?.id ?? d.ports[0]?.id)
  const [page, setPage] = useState(0)
  const is = (p: Port, k: F) =>
    k === "all" ||
    (k === "up" && p.oper === "up") ||
    (k === "down" && p.oper === "down" && p.desc !== "—") ||
    (k === "free" && p.desc === "—") ||
    (k === "sfp" && p.sfp)
  const list = d.ports.filter((p) => is(p, f) && `${p.name} ${p.desc}`.toLowerCase().includes(q.trim().toLowerCase()))
  const SIZE = 10
  const view = list.slice(page * SIZE, page * SIZE + SIZE)
  const pages = Math.max(1, Math.ceil(list.length / SIZE))
  const p = d.ports.find((x) => x.id === sel)

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "Все"],
            ["up", "Up"],
            ["down", "Down"],
            ["free", "Свободные"],
            ["sfp", "SFP"],
          ] as const
        ).map(([k, t]) => (
          <button
            key={k}
            type="button"
            aria-pressed={f === k}
            onClick={() => (setF(k), setPage(0))}
            className={cn(
              "flex h-10 items-center gap-2 rounded-full border border-border bg-[var(--chip-bg)] px-4 text-[13.5px] text-[var(--nav-text)]",
              f === k && "border-[rgba(8,94,255,0.5)] bg-[rgba(8,94,255,0.16)] text-foreground",
            )}
          >
            {(k === "up" || k === "down") && (
              <i className={cn("size-1.5 rounded-full", k === "up" ? "bg-[var(--status-ok)]" : "bg-[var(--status-alarm)]")} />
            )}
            {t}
            <em className="rounded-full bg-[var(--chip-bg)] px-[7px] text-[11.5px] not-italic">{d.ports.filter((x) => is(x, k)).length}</em>
          </button>
        ))}
        <SearchBox value={q} onChange={(v) => (setQ(v), setPage(0))} placeholder="Порт, клиент, описание…" />
        <button type="button" className={cn(btn({ primary: true }), "ml-auto")} onClick={() => onEdit("new")}>
          <Plus />
          Создать порт
        </button>
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] items-start gap-[18px] max-[1279px]:grid-cols-1">
        <section className={cn(glass, "p-3")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-separate border-spacing-y-1.5 text-[13.5px]">
              <thead>
                <tr className="text-left text-[12.5px] text-muted-foreground">
                  {["Порт", "Включен (Admin)", "Подключен (Oper)", "Тип", "Скорость", "Описание", ""].map((h) => (
                    <th key={h} className="px-4 py-1 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.map((x) => (
                  <tr key={x.id} onClick={() => setSel(x.id)} className="cursor-pointer">
                    {[
                      <b key="n">{x.name.replace("Gi", "GigabitEthernet")}</b>,
                      <Dot key="a" up={x.admin === "up"} />,
                      <Dot key="o" up={x.oper === "up"} />,
                      x.type,
                      x.speed,
                      <span key="d" className="text-muted-foreground">
                        {x.desc}
                      </span>,
                      <span key="act" className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className={cn(circ, "size-8")} title="Изменить" onClick={() => onEdit(x)}>
                          <Pencil />
                        </button>
                        <button
                          type="button"
                          className={cn(circ, "size-8 hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
                          title="Удалить"
                          onClick={() => onEdit(x)}
                        >
                          <Trash2 />
                        </button>
                      </span>,
                    ].map((c, i) => (
                      <td key={i} className={cn(cell, x.id === sel && "bg-[rgba(8,94,255,0.1)]")}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex items-center justify-between px-2 text-[13px] text-muted-foreground">
            <span>
              {list.length ? page * SIZE + 1 : 0}–{Math.min(list.length, (page + 1) * SIZE)} из {list.length}
            </span>
            <span className="flex gap-1.5">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={cn(
                    "grid size-[38px] place-items-center rounded-full border border-border bg-[var(--chip-bg)]",
                    i === page && "border-[#085eff] bg-[#085eff] text-white",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </span>
          </div>
        </section>
        {p && (
          <section className={cn(glass, "p-[22px]")}>
            <header className="mb-4 flex items-center gap-3">
              <span className="grid h-14 min-w-14 place-items-center rounded-2xl border-2 border-[#085eff] px-2 text-sm font-semibold">
                {p.slot}
              </span>
              <span className="flex-1">
                <b className="block text-lg font-semibold">{p.name}</b>
                <span className="text-[13px] text-muted-foreground">
                  {p.sfp ? "SFP · trunk" : "RJ45 · access"} ·{" "}
                  {p.speed === "—" ? "нет линка" : p.speed.replace("Gbps", "Гбит/с").replace("Mbps", "Мбит/с")}
                </span>
              </span>
              <Pill tone={p.oper === "up" ? "ok" : "bad"}>{p.oper === "up" ? "Up" : "Down"}</Pill>
            </header>
            {p.link && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[rgba(8,94,255,0.35)] bg-[rgba(8,94,255,0.08)] px-4 py-3">
                <Cable className="size-5 text-[var(--link)]" />
                <span className="flex-1">
                  <b className="block text-sm font-semibold">{p.link.title}</b>
                  <span className="text-xs text-muted-foreground">{p.link.sub}</span>
                </span>
              </div>
            )}
            <Kv
              rows={[
                { t: "Модуль", v: p.module ?? "—" },
                { t: "S/N модуля", v: p.moduleSn ?? "—" },
                { t: "VLAN", v: p.vlan },
                { t: "Описание", v: p.desc },
                { t: "Последнее изменение", v: p.changed.split(",")[0] },
              ]}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className={cn(btn(), "flex-1 justify-center")} onClick={() => onEdit(p)}>
                <Pencil />
                Изменить порт
              </button>
              {/* TODO: трасса на карте — раздел ВОЛС (07) */}
              <button
                type="button"
                className={cn(btn(), "flex-1 justify-center")}
                disabled={!p.link}
                onClick={() => toast("Трасса на карте — раздел ВОЛС (07)")}
              >
                <MapIcon />
                На трассе
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/** Порт · редактирование (swp-09). */
export function PortDialog({
  port,
  next,
  onClose,
  onSave,
  onDelete,
}: {
  port: Port | null
  next: number
  onClose: () => void
  onSave: (p: Port) => void
  onDelete: (p: Port) => void
}) {
  const [v, setV] = useState<Port>(
    port ?? {
      id: next,
      name: `Gi1/0/${next}`,
      slot: `0/${next}`,
      admin: "up",
      oper: "down",
      type: "1000BASE-T",
      speed: "—",
      desc: "",
      sfp: false,
      vlan: "",
      changed: "",
    },
  )
  const set = (p: Partial<Port>) => setV({ ...v, ...p })
  const save = () => {
    if (!v.name.trim()) return toast("Укажите порт")
    onSave({
      ...v,
      desc: v.desc || "—",
      changed: new Date().toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    })
    toast(port ? `Порт ${v.name} сохранён` : `Порт ${v.name} создан`)
    onClose()
  }
  const label = (t: string, req?: boolean) => (
    <span className="mb-2 block text-[13.5px] font-medium">
      {t} {req && <span className="text-[#ff5257]">*</span>}
    </span>
  )
  return (
    <Modal title={port ? "Порт · редактирование" : "Новый порт"} icon={Server} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3.5">
        <div className="col-span-full">
          {label("Порт", true)}
          <Input
            aria-label="Порт"
            value={v.name.replace("Gi", "GigabitEthernet")}
            onChange={(e) => set({ name: e.target.value.replace("GigabitEthernet", "Gi") })}
          />
        </div>
        <div>
          {label("Тип")}
          <Select
            value={v.type}
            opts={["1000BASE-T", "1000BASE-LX", "1000BASE-SX", "10GBASE-LR"].map((t) => ({ v: t, label: t }))}
            onChange={(t) => set({ type: t, sfp: t !== "1000BASE-T" })}
          />
        </div>
        <div>
          {label("Скорость")}
          <Select
            value={v.speed}
            opts={["—", "100 Mbps", "1 Gbps", "10 Gbps"].map((t) => ({ v: t, label: t }))}
            onChange={(t) => set({ speed: t })}
          />
        </div>
        <div>
          {label("Включен (Admin Status)")}
          <Select
            value={v.admin}
            opts={[
              { v: "up", label: "up" },
              { v: "down", label: "down" },
            ]}
            tone={(s) => (s === "up" ? "ok" : "bad")}
            onChange={(t) => set({ admin: t as Port["admin"] })}
          />
        </div>
        <div>
          {label("Подключен (Oper Status)")}
          <Select
            value={v.oper}
            opts={[
              { v: "up", label: "up" },
              { v: "down", label: "down" },
            ]}
            tone={(s) => (s === "up" ? "ok" : "bad")}
            onChange={(t) => set({ oper: t as Port["oper"] })}
          />
        </div>
        <div className="col-span-full">
          {label("Описание")}
          <Input
            aria-label="Описание"
            value={v.desc === "—" ? "" : v.desc}
            onChange={(e) => set({ desc: e.target.value })}
            placeholder="Клиент, ID-канал, uplink…"
          />
        </div>
        <div className="col-span-full">
          {label("VLAN")}
          <Input aria-label="VLAN" value={v.vlan} onChange={(e) => set({ vlan: e.target.value })} placeholder="10, 20, 110–120" />
        </div>
      </div>
      <footer className="mt-6 flex gap-2.5">
        {port && (
          <button
            type="button"
            className={btn({ danger: true })}
            onClick={() => {
              onDelete(port)
              toast(`Порт ${port.name} удалён`)
              onClose()
            }}
          >
            <Trash2 />
            Удалить
          </button>
        )}
        <span className="flex-1" />
        <Dialog.Close className={btn()}>Отмена</Dialog.Close>
        <button type="button" className={btn({ primary: true })} onClick={save}>
          <Check />
          Сохранить
        </button>
      </footer>
    </Modal>
  )
}

/* ---------- Портовая ёмкость (sw-06) ---------- */

export function CapacityTab({ d, onSave }: { d: SpdDetail; onSave: (c: SpdDetail["capacity"]) => void }) {
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState(d.capacity)
  const mounted = d.capacity.reduce((a, c) => a + c.mounted, 0)
  const used = d.capacity.reduce((a, c) => a + c.used, 0)
  const pct = mounted ? Math.round((used / mounted) * 100) : 0
  const editable = draft.filter((c) => ["1000base-tx", "1000base-x-sfp", "10gbase-x-sfpp"].includes(c.type))
  const bad = draft.some((c) => c.used > c.mounted || c.used < 0 || c.mounted < 0)

  return (
    <div className="grid grid-cols-[1.6fr_1fr] items-start gap-[18px] max-[1279px]:grid-cols-1">
      <Card
        icon={Activity}
        title="Портовая ёмкость"
        action={
          <button type="button" className={btn({ sm: true })} onClick={() => (setDraft(d.capacity), setEdit(true))}>
            <Pencil />
            Редактировать
          </button>
        }
      >
        <table className="w-full border-separate border-spacing-y-1.5 text-[13.5px]">
          <thead>
            <tr className="text-left text-[12.5px] text-muted-foreground">
              {["Тип порта", "Смонтировано", "Задействовано", "Свободно", "Загрузка"].map((h) => (
                <th key={h} className="px-4 py-1 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.capacity.map((c) => {
              const p = c.mounted ? Math.round((c.used / c.mounted) * 100) : 0
              return (
                <tr key={c.type} className={cn(!c.mounted && "text-muted-foreground")}>
                  <td className={cn(cell, "font-semibold")}>{c.type}</td>
                  <td className={cell}>{c.mounted}</td>
                  <td className={cell}>{c.used}</td>
                  <td className={cell}>{c.mounted - c.used}</td>
                  <td className={cell}>
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-[220px] overflow-hidden rounded-full bg-[var(--chip-bg)]">
                        <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${p}%` }} />
                      </span>
                      {p}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      <div className="flex flex-col gap-[18px]">
        <Card icon={PieChart} title="Итого по устройству">
          <div className="flex flex-col items-center">
            <div
              className="relative size-[220px] rounded-full"
              style={{ background: `conic-gradient(#085eff 0 ${pct}%, var(--chip-bg) ${pct}% 100%)` }}
            >
              <div className="absolute inset-[30px] grid place-items-center rounded-full bg-[var(--glass-card-solid)] text-center">
                <span>
                  <b className="block text-[40px] leading-none font-medium tabular-nums">{pct}%</b>
                  <span className="text-xs text-muted-foreground">
                    {used} из {mounted} портов
                  </span>
                </span>
              </div>
            </div>
            <span className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span>● Задействовано {used}</span>
              <span>● Свободно {mounted - used}</span>
            </span>
          </div>
        </Card>
        {edit && (
          <Card icon={Pencil} title="Редактирование ёмкости" className="border-[rgba(8,94,255,0.45)]">
            <div className="grid grid-cols-[1fr_120px_120px] items-center gap-2.5 text-[13.5px]">
              <span className="text-xs text-muted-foreground">Тип</span>
              <span className="text-xs text-muted-foreground">Смонтировано</span>
              <span className="text-xs text-muted-foreground">Задействовано</span>
              {editable.map((c) => (
                <span key={c.type} className="contents">
                  <b className="font-semibold">{c.type}</b>
                  {(["mounted", "used"] as const).map((k) => (
                    <Input
                      key={k}
                      aria-label={`${c.type} ${k}`}
                      inputMode="numeric"
                      value={c[k]}
                      onChange={(e) => setDraft(draft.map((o) => (o.type === c.type ? { ...o, [k]: Number(e.target.value) || 0 } : o)))}
                      className={cn("min-h-10", k === "used" && c.used > c.mounted && "border-[#ff5257]")}
                    />
                  ))}
                </span>
              ))}
            </div>
            {bad && <p className="mt-2 text-xs text-[#ff5257]">Задействовано не может быть больше смонтированного</p>}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button type="button" className={cn(btn(), "justify-center")} onClick={() => setEdit(false)}>
                Отмена
              </button>
              <button
                type="button"
                disabled={bad}
                className={cn(btn({ primary: true }), "justify-center")}
                onClick={() => {
                  onSave(draft)
                  setEdit(false)
                  toast("Портовая ёмкость сохранена")
                }}
              >
                <Check />
                Сохранить
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

/* ---------- Под-оборудование (sw-07, swp-10) ---------- */

export function ChildrenTab({ d, onChange }: { d: SpdDetail; onChange: (c: Child[]) => void }) {
  const [q, setQ] = useState("")
  const [form, setForm] = useState<{ parent?: Child; edit?: Child } | null>(null)
  const list = d.children.filter((c) => `${c.model} ${c.serial}`.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <Card
      icon={Layers}
      title="Под-оборудование"
      count={d.children.length}
      action={
        <span className="flex gap-2">
          <SearchBox value={q} onChange={setQ} placeholder="Модель, S/N…" />
          <button type="button" className={btn({ primary: true, sm: true })} onClick={() => setForm({})}>
            <Plus />
            Создать
          </button>
        </span>
      }
    >
      <p className="-mt-2 mb-3 text-[13px] text-muted-foreground">
        Модули, платы, блоки питания и вентиляторы внутри устройства. У каждого можно создать вложенный элемент.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-1.5 text-[13.5px]">
          <thead>
            <tr className="text-left text-[12.5px] text-muted-foreground">
              {["Номер", "Модель", "Серийный номер", "Слот", "Порт", "Примечание", ""].map((h) => (
                <th key={h} className="px-4 py-1 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td className={cn(cell, c.id.includes(".") && "pl-9")}>{c.id}</td>
                <td className={cn(cell, "font-semibold")}>{c.model}</td>
                <td className={cn(cell, "tabular-nums")}>{c.serial}</td>
                <td className={cell}>{c.slot}</td>
                <td className={cell}>{c.port}</td>
                <td className={cn(cell, "text-muted-foreground")}>{c.note}</td>
                <td className={cell}>
                  <span className="flex justify-end gap-1.5">
                    <button type="button" className={cn(circ, "size-8")} title="Вложенный элемент" onClick={() => setForm({ parent: c })}>
                      <Plus />
                    </button>
                    <button type="button" className={cn(circ, "size-8")} title="Изменить" onClick={() => setForm({ edit: c })}>
                      <Pencil />
                    </button>
                    <button
                      type="button"
                      className={cn(circ, "size-8 hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
                      title="Удалить"
                      onClick={() => {
                        onChange(d.children.filter((o) => o.id !== c.id && !o.id.startsWith(`${c.id}.`)))
                        toast(`Удалено: ${c.model}`)
                      }}
                    >
                      <Trash2 />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {form && <ChildDialog d={d} parent={form.parent} edit={form.edit} onClose={() => setForm(null)} onSave={onChange} />}
    </Card>
  )
}

function ChildDialog({
  d,
  parent,
  edit,
  onClose,
  onSave,
}: {
  d: SpdDetail
  parent?: Child
  edit?: Child
  onClose: () => void
  onSave: (c: Child[]) => void
}) {
  // Номер: следующий на своём уровне — «4» или «1.1»
  const nextId = () => {
    const prefix = parent ? `${parent.id}.` : ""
    const level = d.children.filter((c) =>
      parent ? c.id.startsWith(prefix) && !c.id.slice(prefix.length).includes(".") : !c.id.includes("."),
    )
    return `${prefix}${Math.max(0, ...level.map((c) => Number(c.id.slice(prefix.length)))) + 1}`
  }
  const [v, setV] = useState<Child>(edit ?? { id: nextId(), model: parent?.model ?? "", serial: "", slot: "", port: "", note: "" })
  const save = () => {
    if (!v.id.trim() || !v.model.trim()) return toast("Заполните № и модель")
    const list = edit
      ? d.children.map((c) => (c.id === edit.id ? v : c))
      : [...d.children, v].sort((a, b) => a.id.localeCompare(b.id, "ru", { numeric: true }))
    onSave(list)
    toast(edit ? "Сохранено" : `Добавлено: ${v.model}`)
    onClose()
  }
  const input = (k: keyof Child, t: string, req?: boolean, ph?: string) => (
    <div>
      <span className="mb-2 block text-[13.5px] font-medium">
        {t} {req && <span className="text-[#ff5257]">*</span>}
      </span>
      <Input aria-label={t} value={v[k]} placeholder={ph} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
    </div>
  )
  return (
    <Modal
      title={edit ? "Под-оборудование · изменение" : "Новое под-оборудование"}
      sub={parent ? `Вложенный элемент для ${parent.id} · ${parent.model}` : undefined}
      icon={Layers}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-3.5">
        {input("id", "№ п/п", true)}
        {input("model", "Модель оборудования", true, "Например: GLC-LH-SMD")}
        {input("serial", "Серийный номер", false, "S/N")}
        {input("slot", "Номер слота", false, "0/1")}
        {input("port", "Номер порта", false, "0/1/0")}
        {input("note", "Примечание", false, "Необязательно")}
      </div>
      <footer className="mt-6 flex justify-end gap-2.5">
        <Dialog.Close className={btn()}>Отмена</Dialog.Close>
        <button type="button" className={btn({ primary: true })} onClick={save}>
          <Check />
          {edit ? "Сохранить" : "Создать"}
        </button>
      </footer>
    </Modal>
  )
}

/* ---------- МОЛ и ответственные (sw-08, swp-11) ---------- */

/** Что нужно вкладкам МОЛ и перемещений — общие для СПД, АТС, PDH, SDH, DWDM. */
export type Staff = Pick<SpdDetail, "mol" | "people" | "moves"> & { log?: SpdDetail["log"] }

export function MolTab({ d, onChange }: { d: Pick<Staff, "mol" | "people">; onChange: (m: SpdDetail["mol"]) => void }) {
  const [assign, setAssign] = useState(false)
  const person = (p: SpdDetail["people"][number] | SpdDetail["mol"], title: string, action?: React.ReactNode) => (
    <section className={cn(glass, "p-[22px]")}>
      <header className="mb-4 flex items-center gap-3.5">
        <Avatar initials={p.initials} color={p.color} className="size-14 text-lg" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted-foreground">{title}</span>
          <b className="block text-[17px] font-semibold">{p.name}</b>
          <span className="text-[13px] text-muted-foreground">
            {p.post} · {p.dept}
          </span>
        </span>
        {p.synced && (
          <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2.5 py-1 text-xs font-semibold text-[var(--status-ok)]">
            Синхронизировано
          </span>
        )}
        {action}
      </header>
      <Kv
        rows={[
          { t: "ФИО", v: p.name },
          { t: "Инвентарный номер", v: p.inv ?? "—" },
          { t: "Отдел", v: p.dept },
          { t: "Почта", v: p.email ?? "—" },
          { t: "Телефон", v: p.phone ?? "—" },
          { t: "Мобильный", v: p.mobile },
          { t: "Должность", v: p.post },
          { t: "Информация", v: "since" in p ? `Материально ответственный с ${p.since}` : "—" },
        ]}
      />
    </section>
  )
  return (
    <div className="grid grid-cols-[1fr_1.4fr] items-start gap-[18px] max-[1279px]:grid-cols-1">
      {person(
        d.mol,
        "МОЛ",
        <button type="button" className={btn({ sm: true })} onClick={() => setAssign(true)}>
          <Pencil />
          Изменить
        </button>,
      )}
      <Card
        icon={Users}
        title="Ответственные за эксплуатацию оборудования"
        count={d.people.length}
        action={
          // TODO: управление ответственными оборудования — как у узла (np-04), API
          <button type="button" className={btn({ sm: true })} onClick={() => toast("Ответственные назначаются в паспорте узла связи")}>
            Управлять
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          {d.people.map((p, i) => (
            <div key={p.name} className="rounded-2xl border border-border bg-[var(--chip-bg)] p-4">
              <div className="flex items-center gap-3">
                <Avatar initials={p.initials} color={p.color} />
                <span className="flex-1">
                  <b className="block text-sm font-semibold">
                    Ответственный {i + 1} · {p.name}
                  </b>
                  <span className="text-xs text-muted-foreground">
                    {p.post} · {p.dept}
                  </span>
                </span>
                <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2 py-0.5 text-[11px] font-semibold text-[var(--status-ok)]">
                  Синхр.
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[12.5px] max-sm:grid-cols-1">
                <span className="truncate text-muted-foreground">{p.email}</span>
                <span className="text-muted-foreground">{p.phone}</span>
                <span className="text-muted-foreground">{p.inv}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      {assign && (
        <MolDialog
          current={d.mol.name}
          onClose={() => setAssign(false)}
          onPick={(p) => (onChange({ ...d.mol, ...p, since: new Date().toLocaleDateString("ru-RU").slice(3) }), setAssign(false))}
        />
      )}
    </div>
  )
}

function MolDialog({ current, onClose, onPick }: { current: string; onClose: () => void; onPick: (p: Partial<SpdDetail["mol"]>) => void }) {
  const staff = [
    {
      initials: "ЕС",
      name: "Ержан К. Сапаров",
      post: "Ведущий инженер",
      dept: "Отдел эксплуатации СПД",
      inv: "INV-004471",
      color: "linear-gradient(135deg,#22c55e,#15803d)",
    },
    {
      initials: "ЕМ",
      name: "Ерлан М. Сарсенов",
      post: "Инженер",
      dept: "ЦТ",
      inv: "INV-004890",
      color: "linear-gradient(135deg,#0ea5e9,#0369a1)",
    },
    {
      initials: "ЕА",
      name: "Елена А. Савченко",
      post: "Специалист",
      dept: "Склад",
      inv: "INV-005003",
      color: "linear-gradient(135deg,#ec4899,#be185d)",
    },
    ...STAFF.map((p) => ({ initials: p.initials, name: p.name, post: p.role, dept: "ЦТ", inv: p.inv ?? "—", color: p.color })),
  ]
  const [q, setQ] = useState("")
  const [sel, setSel] = useState(current)
  const list = staff.filter(
    (p) => p.name.toLowerCase().includes(q.trim().toLowerCase()) || p.inv.toLowerCase().includes(q.trim().toLowerCase()),
  )
  return (
    <Modal title="Назначить МОЛ" icon={UserCog} onClose={onClose}>
      <span className="mb-2 block text-[13.5px] font-medium">Поиск сотрудника</span>
      <Input icon={<Search />} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ФИО или табельный номер" />
      <div className="mt-3 flex max-h-[300px] flex-col gap-1.5 overflow-auto">
        {list.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setSel(p.name)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left hover:bg-[var(--mg-on)]",
              sel === p.name && "border-[rgba(8,94,255,0.5)] bg-[rgba(8,94,255,0.12)]",
            )}
          >
            <Avatar initials={p.initials} color={p.color} />
            <span className="flex-1">
              <b className="block text-sm font-semibold">{p.name}</b>
              <span className="text-xs text-muted-foreground">
                {p.post} · {p.dept} · {p.inv}
              </span>
            </span>
            {sel === p.name && <span className="text-xs font-semibold text-[var(--link)]">Выбран</span>}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12.5px] text-muted-foreground">
        Данные (телефон, почта, отдел, должность) подтянутся из HR-справочника и будут синхронизироваться автоматически.
      </p>
      <footer className="mt-5 flex justify-end gap-2.5">
        <Dialog.Close className={btn()}>Отмена</Dialog.Close>
        <button
          type="button"
          className={btn({ primary: true })}
          onClick={() => {
            const p = staff.find((s) => s.name === sel)
            if (!p) return
            onPick({ initials: p.initials, name: p.name, post: p.post, role: p.post, dept: p.dept, inv: p.inv, color: p.color })
            toast(`МОЛ: ${p.name}`)
          }}
        >
          <Check />
          Назначить
        </button>
      </footer>
    </Modal>
  )
}

/* ---------- Ввод и сервис (sw-10) ---------- */

export function ServiceTab({ d, onChange }: { d: SpdDetail; onChange: (s: SpdDetail["service"]) => void }) {
  const s = d.service
  const [edit, setEdit] = useState(false)
  const [v, setV] = useState(s)
  return (
    <div className="grid grid-cols-2 items-start gap-[18px] max-[1279px]:grid-cols-1">
      <Card
        icon={Shield}
        title="SmartNET — сервисный контракт"
        action={
          s.smartnet ? (
            <Pill tone={s.days <= 90 ? "warn" : "ok"}>Истекает через {s.days} дн.</Pill>
          ) : (
            <Pill tone="muted">Нет контракта</Pill>
          )
        }
      >
        {edit ? (
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["contract", "Contract Number"],
                ["end", "Дата завершения"],
                ["start", "Начало"],
                ["note", "Примечание"],
              ] as const
            ).map(([k, t]) => (
              <div key={k}>
                <span className="mb-2 block text-[13.5px] font-medium">{t}</span>
                <Input aria-label={t} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        ) : (
          <Kv
            rows={[
              { t: "Contract Number", v: s.contract },
              { t: "Дата завершения", v: s.end },
              { t: "Срок контракта", v: `${s.start} – ${s.end}` },
              { t: "SmartNET", v: s.smartnet ? "Да" : "Нет" },
              { t: "Примечание", v: s.note },
            ]}
          />
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={v.remind}
            onClick={() => setV({ ...v, remind: !v.remind })}
            className="flex items-center gap-2.5 text-[13.5px]"
          >
            <span className={checkBox(v.remind)} />
            <Bell className="size-4" />
            Напомнить за 30 дней
          </button>
          <span className="flex-1" />
          {edit ? (
            <>
              <button type="button" className={btn({ sm: true })} onClick={() => (setV(s), setEdit(false))}>
                Отмена
              </button>
              <button
                type="button"
                className={btn({ primary: true, sm: true })}
                onClick={() => {
                  onChange(v)
                  setEdit(false)
                  toast("Контракт сохранён")
                }}
              >
                <Check />
                Сохранить
              </button>
            </>
          ) : (
            <button type="button" className={btn({ sm: true })} onClick={() => setEdit(true)}>
              <Pencil />
              Изменить
            </button>
          )}
        </div>
      </Card>
      <Card
        icon={FileText}
        title="Акт о вводе в эксплуатацию"
        action={
          // TODO: скан акта — файловое хранилище
          <button type="button" className={btn({ sm: true })} onClick={() => toast("Скачивание акта — после подключения API")}>
            <Download />
            Скачать
          </button>
        }
      >
        <Kv
          rows={[
            { t: "Номер акта", v: s.act },
            { t: "Дата", v: s.actDate },
          ]}
        />
        <div className="mt-4 grid h-[220px] place-items-center rounded-2xl border border-border bg-[#f6f4ee] text-center text-[#2a2a2a]">
          <span>
            <b className="block text-sm tracking-wide">АКТ {s.act} о вводе в эксплуатацию</b>
            <span className="mt-6 inline-block -rotate-6 rounded border-2 border-[#1d4ed8] px-3 py-1 text-sm font-bold text-[#1d4ed8]">
              ПРИНЯТО
            </span>
          </span>
        </div>
      </Card>
    </div>
  )
}

/* ---------- История перемещений (sw-11, swp-12) ---------- */

const MOVE: Record<Move["status"], [string, "ok" | "muted" | "info"]> = {
  done: ["Завершено", "ok"],
  archive: ["Архив", "muted"],
  plan: ["Запланировано", "info"],
}

export function MovesTab({ d, x, onChange }: { d: Staff; x: Pick<SpdRow, "nodeCode" | "branch">; onChange: (m: Move[]) => void }) {
  const [st, setSt] = useState<"all" | Move["status"]>("all")
  const [add, setAdd] = useState(false)
  const list = d.moves.filter((m) => st === "all" || m.status === st)
  return (
    <div className="flex flex-col gap-[18px]">
      <Card
        icon={Truck}
        title="История перемещений"
        count={d.moves.length}
        action={
          <span className="flex gap-2">
            <span className="w-[180px]">
              <Select
                value={st}
                opts={[{ v: "all", label: "Статус: все" }, ...Object.entries(MOVE).map(([v, [label]]) => ({ v, label }))]}
                onChange={(v) => setSt(v as typeof st)}
              />
            </span>
            <button type="button" className={btn({ primary: true, sm: true })} onClick={() => setAdd(true)}>
              <Plus />
              Добавить перемещение
            </button>
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-separate border-spacing-y-1.5 text-[13.5px]">
            <thead>
              <tr className="text-left text-[12.5px] text-muted-foreground">
                {[
                  "№ п/п",
                  "Дата",
                  "№ распоряжения",
                  "Узел связи: старый → новый (филиал)",
                  "Ответственный: от → к",
                  "Статус",
                  "Описание",
                ].map((h) => (
                  <th key={h} className="px-4 py-1 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td className={cell}>{m.id}</td>
                  <td className={cell}>{m.date}</td>
                  <td className={cell}>{m.order}</td>
                  <td className={cell}>
                    {m.from} <span className="text-muted-foreground">{m.fromBranch}</span> → <b>{m.to}</b>{" "}
                    <span className="text-muted-foreground">{m.toBranch}</span>
                  </td>
                  <td className={cell}>
                    {m.personFrom} → <b>{m.personTo}</b>
                  </td>
                  <td className={cell}>
                    <Pill tone={MOVE[m.status][1]}>{MOVE[m.status][0]}</Pill>
                  </td>
                  <td className={cn(cell, "text-muted-foreground")}>{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {!!d.log?.length && (
        <Card icon={FileText} title="Журнал изменений паспорта" count={d.log.length}>
          {d.log.map((h, i) => (
            <div key={i} className="mb-2 flex items-center gap-3 rounded-2xl border border-border bg-[var(--chip-bg)] px-4 py-3">
              <Pencil className="size-4 text-[var(--link)]" />
              <span className="flex-1">
                <b className="block text-sm font-semibold">{h.what}</b>
                {h.from && (
                  <span className="my-1 flex items-center gap-2 text-xs">
                    <s className="rounded-md bg-[rgba(255,59,59,0.14)] px-2 py-0.5 text-[#ff5257]">{h.from}</s>→
                    <span className="rounded-md bg-[rgba(43,212,99,0.14)] px-2 py-0.5 text-[var(--status-ok)]">{h.to}</span>
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{h.who}</span>
              </span>
              <span className="text-xs text-muted-foreground">{h.date}</span>
            </div>
          ))}
        </Card>
      )}
      {add && <MoveDialog d={d} x={x} onClose={() => setAdd(false)} onSave={(m) => onChange([m, ...d.moves])} />}
    </div>
  )
}

function MoveDialog({
  d,
  x,
  onClose,
  onSave,
}: {
  d: Staff
  x: Pick<SpdRow, "nodeCode" | "branch">
  onClose: () => void
  onSave: (m: Move) => void
}) {
  const nodes = nodeRows()
  const people = [...new Set([...d.people.map((p) => p.name), ...STAFF.map((p) => p.name), d.mol.name])].map((v) => ({ v, label: v }))
  const [v, setV] = useState<Move>({
    id: Math.max(0, ...d.moves.map((m) => m.id)) + 1,
    date: new Date().toLocaleDateString("ru-RU"),
    order: "",
    from: x.nodeCode,
    fromBranch: x.branch,
    to: "",
    toBranch: x.branch,
    personFrom: d.people[0]?.name ?? "",
    personTo: "",
    status: "done",
    note: "",
  })
  const set = (p: Partial<Move>) => setV({ ...v, ...p })
  const branches = BRANCHES.map((b) => ({ v: b.v, label: b.full }))
  const save = () => {
    if (!v.date || !v.order.trim() || !v.to || !v.personTo) return toast("Заполните поля со *")
    onSave(v)
    toast(`Перемещение ${v.order} добавлено`)
    onClose()
  }
  const label = (t: string, req?: boolean) => (
    <span className="mb-2 block text-[13.5px] font-medium">
      {t} {req && <span className="text-[#ff5257]">*</span>}
    </span>
  )
  return (
    <Modal title="Новое перемещение" icon={Truck} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3.5">
        <div>
          {label("Дата", true)}
          <DateInput value={v.date} onChange={(date) => set({ date })} />
        </div>
        <div>
          {label("№ распоряжения", true)}
          <Input aria-label="№ распоряжения" value={v.order} placeholder="№ 118-р" onChange={(e) => set({ order: e.target.value })} />
        </div>
        <div>
          {label("Филиал (старый узел)")}
          <Select value={v.fromBranch} opts={branches} onChange={(b) => set({ fromBranch: b })} />
        </div>
        <div>
          {label("Старый узел связи")}
          <Select
            value={v.from}
            opts={nodes.filter((n) => n.branch === v.fromBranch).map((n) => ({ v: n.code, label: n.code }))}
            onChange={(c) => set({ from: c })}
          />
        </div>
        <div>
          {label("Филиал (новый узел)", true)}
          <Select value={v.toBranch} opts={branches} onChange={(b) => set({ toBranch: b, to: "" })} />
        </div>
        <div>
          {label("Новый узел связи", true)}
          <Select
            value={v.to}
            placeholder="Выберите узел"
            opts={nodes.filter((n) => n.branch === v.toBranch).map((n) => ({ v: n.code, label: `${n.code} · ${n.object}` }))}
            onChange={(c) => set({ to: c })}
          />
        </div>
        <div>
          {label("Ответственный (от)")}
          <Select value={v.personFrom} opts={people} onChange={(p) => set({ personFrom: p })} />
        </div>
        <div>
          {label("Ответственный (к)", true)}
          <Select value={v.personTo} placeholder="Выберите" opts={people} onChange={(p) => set({ personTo: p })} />
        </div>
        <div>
          {label("Статус", true)}
          <Select
            value={v.status}
            opts={Object.entries(MOVE).map(([k, [t]]) => ({ v: k, label: t }))}
            tone={(s) => MOVE[s as Move["status"]][1]}
            onChange={(s) => set({ status: s as Move["status"] })}
          />
        </div>
        <div>
          {label("Описание")}
          <Input aria-label="Описание" value={v.note} onChange={(e) => set({ note: e.target.value })} placeholder="Необязательно" />
        </div>
      </div>
      <footer className="mt-6 flex justify-end gap-2.5">
        <Dialog.Close className={btn()}>Отмена</Dialog.Close>
        <button type="button" className={btn({ primary: true })} onClick={save}>
          <Check />
          Сохранить
        </button>
      </footer>
    </Modal>
  )
}

/* ---------- общее окно ---------- */

function Modal({
  title,
  sub,
  icon: Icon,
  wide,
  onClose,
  children,
}: {
  title: string
  sub?: string
  icon: typeof Server
  wide?: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[rgba(5,6,9,0.55)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed top-1/2 left-1/2 z-[101] max-h-[calc(100vh-24px)] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[28px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-6 text-[var(--mg-text)] shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
            wide ? "w-[720px]" : "w-[560px]",
          )}
        >
          <header className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
              {sub && <p className="text-[13px] text-muted-foreground">{sub}</p>}
            </div>
            <Dialog.Close className={circ} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
