"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Dialog } from "radix-ui"
import { Cable, Check, Link as LinkIcon, MapPin, Plus, RefreshCw, Search, Trash2, Upload, UserRound, Users, X } from "lucide-react"
import { Input, Select } from "@/components/list/form-controls"
import { btn, checkBox, circ } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { STAFF, type Coverage, type NodeDetail, type Person } from "@/sections/nodes/detail"
import type { NodeRow } from "@/sections/nodes/data"
import { CURRENT_USER } from "@/lib/current-user"
import { nodes } from "@/lib/api/nodes"
import { updateDetail } from "./detail-store"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/passport/ui"
import { Label, Modal } from "@/components/passport/modal"

const LocationMap = dynamic(() => import("@/components/map/location-map").then((m) => m.LocationMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--feat-bg)]" />,
})

const today = () => new Date().toLocaleDateString("ru-RU")
const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })

/** Запись в «Историю» паспорта. */
function log(d: NodeDetail, what: string, kind: NodeDetail["history"][number]["kind"], extra: Partial<NodeDetail["history"][number]> = {}) {
  return { ...d, history: [{ id: Date.now(), what, kind, who: CURRENT_USER.name, when: today(), time: now(), ...extra }, ...d.history] }
}

/* ---------- np-01 · Местоположение ---------- */

/** Редактирование местоположения (экран np-01): адрес, координаты, покрытие секторов АМС / БС, карта с маркером. */
export function LocationDialog({ node: x, d, onClose }: { node: NodeRow; d: NodeDetail; onClose: () => void }) {
  const [city, setCity] = useState(x.city)
  const [address, setAddress] = useState(x.address.replace(/^(г\.|с\.) [^,]+, /, ""))
  const [lat, setLat] = useState(x.ll[0].toFixed(6))
  const [lng, setLng] = useState(x.ll[1].toFixed(6))
  const [cov, setCov] = useState({
    sectors: String(d.coverage.sectors),
    width: String(d.coverage.width),
    km: String(d.coverage.km).replace(".", ","),
    azimuths: d.coverage.azimuths.join(" / "),
  })
  const num = (v: string) => Number(v.replace(",", "."))
  const ll: [number, number] = [num(lat), num(lng)]
  const coverage: Coverage = useMemo(
    () => ({
      sectors: Math.max(0, Math.min(6, Math.round(num(cov.sectors)) || 0)),
      width: Math.max(0, Math.min(360, num(cov.width) || 0)),
      km: Math.max(0, num(cov.km) || 0),
      azimuths: cov.azimuths
        .split(/[\s/;,]+/)
        .map(Number)
        .filter((a) => !Number.isNaN(a)),
    }),
    [cov],
  )
  const bad = !city.trim() || !address.trim() || Math.abs(ll[0]) > 90 || Math.abs(ll[1]) > 180 || ll.some(Number.isNaN)

  const save = () => {
    if (bad) return toast("Проверьте населённый пункт, адрес и координаты")
    // TODO(API): координаты и покрытие — нет в /api/nodes/update; в режиме API пока только в паспорте
    if (!nodes.isRemote()) void nodes.save({ ...x, city: city.trim(), address: `г. ${city.trim()}, ${address.trim()}`, ll, onMap: true }, false)
    updateDetail(x, (dd) =>
      log({ ...dd, coords: `${ll[0].toFixed(6)}, ${ll[1].toFixed(6)}`, coverage }, "Изменено местоположение", "edit", {
        note: "координаты и покрытие",
      }),
    )
    toast("Местоположение сохранено")
    onClose()
  }
  const input = (v: string, set: (v: string) => void, label: string) => (
    <Input value={v} onChange={(e) => set(e.target.value)} aria-label={label} inputMode="decimal" />
  )

  return (
    <Modal title={`Редактирование местоположения · ${x.code}`} icon={MapPin} width={1180} onClose={onClose}>
      <div className="mt-5 grid grid-cols-[380px_1fr] border-t border-[var(--dd-line)] max-[900px]:grid-cols-1">
        <div className="flex flex-col gap-4 p-6">
          <div>
            <Label t="Населённый пункт" req />
            {input(city, setCity, "Населённый пункт")}
          </div>
          <div>
            <Label t="Адрес" req />
            {input(address, setAddress, "Адрес")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label t="Широта" />
              {input(lat, setLat, "Широта")}
            </div>
            <div>
              <Label t="Долгота" />
              {input(lng, setLng, "Долгота")}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">
            Покрытие (для АМС / БС)
            <i className="h-px flex-1 bg-[var(--dd-line)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label t="Секторов, шт" />
              {input(cov.sectors, (v) => setCov({ ...cov, sectors: v }), "Секторов")}
            </div>
            <div>
              <Label t="Ширина сектора (°)" aside="0–360" />
              {input(cov.width, (v) => setCov({ ...cov, width: v }), "Ширина сектора")}
            </div>
            <div>
              <Label t="Длина покрытия (км)" />
              {input(cov.km, (v) => setCov({ ...cov, km: v }), "Длина покрытия")}
            </div>
            <div>
              <Label t="Азимут (°)" />
              {input(cov.azimuths, (v) => setCov({ ...cov, azimuths: v }), "Азимуты")}
            </div>
          </div>
          <div className="mt-auto flex justify-end gap-2.5 pt-4">
            <Dialog.Close className={btn()}>Отмена</Dialog.Close>
            <button type="button" className={btn({ primary: true })} onClick={save}>
              <Check />
              Сохранить
            </button>
          </div>
        </div>
        <div className="relative min-h-[600px] overflow-hidden border-l border-[var(--dd-line)] max-[900px]:min-h-[380px]">
          <LocationMap
            ll={ll}
            coverage={coverage}
            onMove={([a, b]) => {
              setLat(String(a))
              setLng(String(b))
            }}
            className="absolute inset-0"
          />
          <span className="absolute top-4 left-1/2 z-[1] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-[var(--glass-card)] px-3.5 py-2 text-[13px] backdrop-blur-[12px]">
            <MapPin className="size-4" />
            Кликните на карту или перетащите маркер
          </span>
          <span className="absolute bottom-4 left-4 z-[1] flex gap-4 rounded-xl border border-border bg-[var(--glass-card)] px-4 py-2 text-[13px] backdrop-blur-[12px]">
            {coverage.azimuths.slice(0, coverage.sectors).map((a, i) => (
              <span key={i} className="flex items-center gap-2">
                <i
                  className="size-2.5 rounded-sm"
                  style={{ background: ["#085eff", "#22d3ee", "#a78bfa", "#2bd463", "#ffc24a", "#ff5257"][i % 6] }}
                />
                {a}°
              </span>
            ))}
          </span>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- np-02 · Привязать ВОЛС ---------- */

/** Привязка ВОЛС трассы (экран np-02): поиск трасс рядом, сторона узла и ODF. */
export function LinkFiberDialog({ node: x, d, onClose }: { node: NodeRow; d: NodeDetail; onClose: () => void }) {
  const [q, setQ] = useState("")
  const linked = new Set(d.fibers.map((f) => f.id))
  const [sel, setSel] = useState<number[]>(() =>
    d.fiberCandidates
      .filter((c) => !linked.has(c.id))
      .slice(0, 1)
      .map((c) => c.id),
  )
  const [side, setSide] = useState("start")
  const [odf, setOdf] = useState("odf1-33")
  const list = d.fiberCandidates.filter((c) => `№${c.num} ${c.to}`.toLowerCase().includes(q.trim().toLowerCase()))

  const link = () => {
    const add = d.fiberCandidates.filter((c) => sel.includes(c.id))
    updateDetail(x, (dd) =>
      add.reduce(
        (acc, c) =>
          log(
            {
              ...acc,
              fibers: [
                ...acc.fibers,
                {
                  id: c.id,
                  num: c.num,
                  to: c.to,
                  toCode: c.to,
                  km: c.km,
                  way: c.way,
                  used: 0,
                  reserve: 0,
                  total: c.total,
                  cable: `ОКЛ-0,22-${c.total}`,
                  odf: odf === "odf1-33" ? "ODF-1 · порты 33–56" : "ODF-2 · порты 1–24",
                  status: "work" as const,
                  usage: [],
                },
              ],
            },
            `Привязана ВОЛС трасса №${c.num} → ${c.to}`,
            "link",
          ),
        dd,
      ),
    )
    toast(`Привязано трасс: ${add.length}`)
    onClose()
  }

  return (
    <Modal title="Привязать ВОЛС трассу" icon={Cable} width={680} onClose={onClose}>
      <div className="p-6">
        <Label t="Поиск трассы" />
        <Input icon={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Номер трассы или узел…" autoFocus />
        <div className="mt-3 rounded-2xl border border-[var(--dd-line)] bg-[var(--chip-bg)] p-2">
          {list.map((c) => {
            const done = linked.has(c.id)
            const on = sel.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={done}
                onClick={() => setSel(on ? sel.filter((i) => i !== c.id) : [...sel, c.id])}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm disabled:opacity-60",
                  on && "bg-[rgba(8,94,255,0.14)] shadow-[inset_0_0_0_1px_rgba(8,94,255,0.45)]",
                )}
              >
                <span className={checkBox(on)} />
                <span className="grid size-8 place-items-center rounded-lg border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                  <Cable className="size-4" />
                </span>
                <b className="min-w-0 flex-1 truncate font-semibold">
                  №{c.num} · {x.object} — {c.to}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {done ? "уже привязана" : `${String(c.km).replace(".", ",")} км · ${c.way}`}
                  </span>
                </b>
                <span className="rounded-full bg-[var(--chip-bg)] px-2.5 py-0.5 text-xs font-semibold">{c.total} вол.</span>
              </button>
            )
          })}
          {!list.length && <p className="py-6 text-center text-sm text-muted-foreground">Трасс не найдено</p>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
          <div>
            <Label t="Сторона узла" />
            <Select
              value={side}
              opts={[
                { v: "start", label: "Начало трассы" },
                { v: "end", label: "Конец трассы" },
              ]}
              onChange={setSide}
            />
          </div>
          <div>
            <Label t="ODF / кросс" />
            <Select
              value={odf}
              opts={[
                { v: "odf1-33", label: "ODF-1 · порты 33–56" },
                { v: "odf2-1", label: "ODF-2 · порты 1–24" },
              ]}
              onChange={setOdf}
            />
          </div>
        </div>
        <footer className="mt-6 flex flex-wrap gap-2.5">
          {/* TODO: создание трассы — раздел ВОЛС (07) */}
          <button type="button" className={btn()} onClick={() => toast("Создание трассы — раздел ВОЛС (07)")}>
            <Plus />
            Создать новую трассу
          </button>
          <span className="flex-1" />
          <Dialog.Close className={btn()}>Отмена</Dialog.Close>
          <button type="button" className={btn({ primary: true })} disabled={!sel.length} onClick={link}>
            <LinkIcon />
            Привязать {sel.length || ""}
          </button>
        </footer>
      </div>
    </Modal>
  )
}

/* ---------- np-03 · Загрузка документов ---------- */

type Upload = { id: number; file: File; pct: number }
const EXT = (name: string) =>
  /\.pdf$/i.test(name)
    ? ["PDF", "#ff5257"]
    : /\.xlsx?$/i.test(name)
      ? ["XLS", "#2bd463"]
      : /\.docx?$/i.test(name)
        ? ["DOC", "#4f8dff"]
        : ["IMG", "#ffc24a"]
const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(b / 1024))} КБ`)

/**
 * Загрузка документов (экран np-03): тип документации, файлы перетаскиванием, прогресс, «на бумажном носителе».
 * TODO: загрузка на сервер; сейчас прогресс имитируется, файлы попадают в паспорт как записи.
 */
export function UploadDialog({
  node: x,
  d,
  kind,
  files: initial,
  onClose,
}: {
  node: NodeRow
  d: NodeDetail
  kind?: string
  files?: File[]
  onClose: () => void
}) {
  const [type, setType] = useState(kind ?? d.docGroups[0].kind)
  const [items, setItems] = useState<Upload[]>(() => (initial ?? []).map((file, i) => ({ id: i, file, pct: 0 })))
  const [paper, setPaper] = useState(d.docGroups.find((g) => g.kind === (kind ?? d.docGroups[0].kind))?.paper ?? false)
  const [drag, setDrag] = useState(false)
  const seq = useRef(initial?.length ?? 0)

  const add = (list: FileList | null) => {
    if (!list) return
    const ok = [...list].filter((f) => f.size <= 50 * 1024 * 1024)
    if (ok.length < list.length) toast("Файлы больше 50 МБ пропущены")
    setItems((s) => [...s, ...ok.map((file) => ({ id: seq.current++, file, pct: 0 }))])
  }

  // Имитация загрузки: прогресс растёт, пока не 100%
  const busy = items.some((i) => i.pct < 100)
  useEffect(() => {
    if (!busy) return
    const t = setInterval(
      () => setItems((s) => s.map((i) => (i.pct < 100 ? { ...i, pct: Math.min(100, i.pct + 8 + ((i.id * 7) % 9)) } : i))),
      160,
    )
    return () => clearInterval(t)
  }, [busy])

  const done = () => {
    const ready = items.filter((i) => i.pct >= 100)
    updateDetail(x, (dd) => {
      let next: NodeDetail = {
        ...dd,
        docGroups: dd.docGroups.map((g) => (g.kind === type ? { ...g, paper } : g)),
        docs: [
          ...ready.map((u, n) => ({
            id: Date.now() + n,
            name: u.file.name,
            kind: type,
            size: size(u.file.size),
            date: today(),
            ext: (/\.pdf$/i.test(u.file.name)
              ? "pdf"
              : /\.xlsx?$/i.test(u.file.name)
                ? "xlsx"
                : /\.dwg$/i.test(u.file.name)
                  ? "dwg"
                  : "docx") as NodeDetail["docs"][number]["ext"],
          })),
          ...dd.docs,
        ],
      }
      for (const u of ready) next = log(next, `Загружен «${u.file.name}»`, "file", { note: `${type} документация` })
      return next
    })
    if (ready.length) toast(`Загружено файлов: ${ready.length}`)
    onClose()
  }

  return (
    <Modal title={`Загрузка документов · ${x.code}`} icon={Upload} width={620} onClose={onClose}>
      <div className="p-6">
        <Label t="Тип документации" req />
        <Select value={type} opts={d.docGroups.map((g) => ({ v: g.kind, label: g.kind }))} onChange={setType} />
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            add(e.dataTransfer.files)
          }}
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center rounded-[20px] border-2 border-dashed border-[rgba(8,94,255,0.45)] bg-[rgba(8,94,255,0.05)] px-6 py-7 text-center",
            drag && "border-[#085eff] bg-[rgba(8,94,255,0.12)]",
          )}
        >
          <span className="grid size-[68px] place-items-center rounded-full border border-[rgba(8,94,255,0.35)] bg-[rgba(8,94,255,0.12)] text-[var(--link)]">
            <Upload className="size-7" strokeWidth={1.6} />
          </span>
          <b className="mt-4 text-base font-semibold">Перетащите файлы сюда</b>
          <span className="mt-1.5 text-[13px] text-muted-foreground">
            или <b className="font-semibold text-[var(--link)]">выберите</b> · PDF, Excel, Word, изображения · до 50 МБ
          </span>
          <input type="file" multiple hidden accept=".pdf,.xls,.xlsx,.doc,.docx,.dwg,image/*" onChange={(e) => add(e.target.files)} />
        </label>
        <div className="mt-3 flex flex-col gap-2.5">
          {items.map((u) => {
            const [label, color] = EXT(u.file.name)
            const ok = u.pct >= 100
            return (
              <div key={u.id} className="flex items-center gap-3 rounded-[18px] border border-[var(--dd-line)] bg-[var(--chip-bg)] p-3.5">
                <span
                  className="grid h-10 w-10 flex-none place-items-start rounded-md px-1 pt-0.5 text-[15px] font-medium"
                  style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
                >
                  {label}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13.5px] font-semibold">{u.file.name}</b>
                  <span className="text-xs text-muted-foreground">
                    {size(u.file.size)} · {ok ? "загружено" : `${u.pct}%`}
                  </span>
                  <span className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                    <i
                      className={cn("block h-full rounded-full transition-[width]", ok ? "bg-[var(--status-ok)]" : "bg-[#085eff]")}
                      style={{ width: `${u.pct}%` }}
                    />
                  </span>
                </span>
                {ok ? (
                  <span className={cn(circ, "cursor-default hover:border-border hover:bg-[var(--chip-bg)] hover:text-[var(--nav-text)]")}>
                    <Check />
                  </span>
                ) : (
                  <button
                    type="button"
                    className={circ}
                    aria-label="Отменить"
                    onClick={() => setItems((s) => s.filter((i) => i.id !== u.id))}
                  >
                    <X />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={paper}
          onClick={() => setPaper(!paper)}
          className="mt-4 flex items-center gap-2.5 text-[13.5px]"
        >
          <span className={checkBox(paper)} />
          Имеется на бумажном носителе
        </button>
        <footer className="mt-6 flex justify-end gap-2.5">
          <Dialog.Close className={btn()}>Отмена</Dialog.Close>
          <button type="button" className={btn({ primary: true })} disabled={busy} onClick={done}>
            <Check />
            Готово
          </button>
        </footer>
      </div>
    </Modal>
  )
}

/* ---------- np-04 · Управление ответственными ---------- */

/** Управление ответственными (экран np-04): ответственные за эксплуатацию с ролью, добавление из HR, МОЛ. */
export function PeopleDrawer({ node: x, d, onClose }: { node: NodeRow; d: NodeDetail; onClose: () => void }) {
  const [people, setPeople] = useState(d.people)
  const [mol, setMol] = useState(d.mol?.name ?? "")
  const [q, setQ] = useState("")
  const found = q.trim()
    ? STAFF.filter((p) => !people.some((x) => x.name === p.name) && p.name.toLowerCase().includes(q.trim().toLowerCase()))
    : []

  const save = () => {
    updateDetail(x, (dd) => {
      let next: NodeDetail = { ...dd, people, mol: STAFF.find((p) => p.name === mol) ?? null }
      const added = people.filter((p) => !dd.people.some((o) => o.name === p.name))
      const removed = dd.people.filter((p) => !people.some((o) => o.name === p.name))
      next = {
        ...next,
        assignments: [
          ...added.map((p) => ({
            name: p.name,
            role: `Ответственный №${people.indexOf(p) + 1}`,
            date: today(),
            by: CURRENT_USER.name,
            source: "manual" as const,
          })),
          ...(next.mol && next.mol.name !== dd.mol?.name
            ? [{ name: next.mol.name, role: "МОЛ", date: today(), by: CURRENT_USER.name, source: "manual" as const }]
            : []),
          ...dd.assignments,
        ],
      }
      for (const p of added) next = log(next, `Назначен ответственный: ${p.name}`, "people")
      for (const p of removed) next = log(next, `Снят ответственный: ${p.name}`, "people")
      if (next.mol?.name !== dd.mol?.name) next = log(next, next.mol ? `Назначен МОЛ: ${next.mol.name}` : "МОЛ снят", "people")
      return next
    })
    toast("Ответственные сохранены")
    onClose()
  }
  const move = (i: number, to: number) => {
    const s = [...people]
    const [p] = s.splice(i, 1)
    s.splice(to, 0, p)
    setPeople(s)
  }

  return (
    <Modal title="Управление ответственными" sub={`${x.code} · ${x.object}`} icon={Users} width={560} side onClose={onClose}>
      <div className="flex-1 overflow-auto px-7 py-5">
        <Section t="Ответственные за эксплуатацию" />
        <div className="flex flex-col gap-2.5">
          {people.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3 rounded-[18px] border border-[var(--dd-line)] bg-[var(--chip-bg)] p-3.5">
              <Avatar initials={p.initials} color={p.color} />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-sm font-semibold">{p.name}</b>
                <span className="text-xs text-muted-foreground">{p.role}</span>
              </span>
              <span className="w-[204px] flex-none">
                <Select
                  value={String(i)}
                  opts={people.map((_, n) => ({ v: String(n), label: `Ответственный №${n + 1}` }))}
                  onChange={(v) => move(i, Number(v))}
                />
              </span>
              <button
                type="button"
                className={cn(circ, "hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
                aria-label={`Убрать ${p.name}`}
                onClick={() => setPeople(people.filter((o) => o !== p))}
              >
                <Trash2 />
              </button>
            </div>
          ))}
          {!people.length && <p className="py-3 text-sm text-muted-foreground">Ответственные не назначены</p>}
        </div>
        <div className="mt-5">
          <Label t="Добавить сотрудника" />
          <Input icon={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по ФИО или табельному…" />
          {found.length > 0 && (
            <div className="mt-2 rounded-[14px] border border-[var(--dd-line)] bg-[var(--chip-bg)] p-1.5">
              {found.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setPeople([...people, p])
                    setQ("")
                  }}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left hover:bg-[var(--mg-on)]"
                >
                  <Avatar initials={p.initials} color={p.color} className="size-8 text-[11px]" />
                  <span className="flex-1">
                    <b className="block text-sm font-medium">{p.name}</b>
                    <span className="text-xs text-muted-foreground">{p.role}</span>
                  </span>
                  <Plus className="size-4 text-[var(--link)]" />
                </button>
              ))}
            </div>
          )}
        </div>
        <Section t="МОЛ" />
        <Label t="Материально ответственное лицо" />
        <div className="relative [&>button]:pl-10">
          <UserRound className="pointer-events-none absolute top-1/2 left-3.5 z-[1] size-4 -translate-y-1/2 text-muted-foreground" />
          <Select
            value={mol}
            opts={[{ v: "", label: "Не назначено" }, ...STAFF.map((p) => ({ v: p.name, label: `${p.name} · ${p.role}` }))]}
            onChange={setMol}
          />
        </div>
        <div className="mt-5 flex gap-3 rounded-2xl border border-[rgba(43,212,99,0.3)] bg-[rgba(43,212,99,0.08)] px-4 py-3.5 text-[13px]">
          <RefreshCw className="mt-px size-4 flex-none" />
          Контакты и должность синхронизируются с HR каждый день в 06:30.
        </div>
      </div>
      <footer className="flex justify-end gap-2.5 border-t border-[var(--dd-line)] px-7 py-4">
        <Dialog.Close className={btn()}>Отмена</Dialog.Close>
        <button type="button" className={btn({ primary: true })} onClick={save}>
          <Check />
          Сохранить
        </button>
      </footer>
    </Modal>
  )
}

function Section({ t }: { t: string }) {
  return (
    <div className="mt-2 mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">
      {t}
      <i className="h-px flex-1 bg-[var(--dd-line)]" />
    </div>
  )
}

export type { Person }
