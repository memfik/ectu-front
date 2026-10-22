"use client"

import { useState } from "react"
import {
  ArrowRight,
  Download,
  FileText,
  GitBranch,
  History,
  Image as ImageIcon,
  Link as LinkIcon,
  Pencil,
  Plus,
  Rows3,
  Trash2,
  Upload,
  Waypoints,
} from "lucide-react"
import { Input, Select } from "@/components/list/form-controls"
import { btn, circ } from "@/components/list/ui"
import { Label, Modal } from "@/components/passport/modal"
import { Card, Kv } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { Table } from "@/sections/nodes/tabs"
import { cn } from "@/lib/utils"
import { LAYING, kmStr, parseKm, type FiberState, type Segment, type VolsDetail, type VolsEvent } from "./detail"

/* ---------- vols-t1 · Участки ---------- */

/** Вкладка «Участки» (vols-t1): таблица участков трассы, добавление и правка (vols-x0), удаление. */
export function SegmentsTab({ d, onChange }: { d: VolsDetail; onChange: (s: Segment[]) => void }) {
  const [edit, setEdit] = useState<Segment | "new" | null>(null)
  const list = d.segments
  return (
    <Card
      icon={GitBranch}
      title="Участки трассы"
      count={list.length}
      action={
        <button type="button" className={btn({ primary: true, sm: true })} onClick={() => setEdit("new")}>
          <Plus />
          Добавить
        </button>
      }
    >
      <Table
        head={["Нумерация", "Начало участка", "Конец участка", "Тип прокладки", "Длина участка, км", "Длина кабеля, км", ""]}
        rows={list.map((s) => ({
          key: s.id,
          cells: [
            s.num,
            s.from,
            s.to,
            s.laying,
            kmStr(s.len),
            kmStr(s.cable),
            <span key="a" className="flex justify-end gap-1.5">
              <button type="button" className={circ} aria-label="Изменить участок" onClick={() => setEdit(s)}>
                <Pencil />
              </button>
              <button
                type="button"
                className={cn(circ, "hover:text-[#ff5257]")}
                aria-label="Удалить участок"
                onClick={() => {
                  onChange(list.filter((x) => x.id !== s.id))
                  toast(`Участок ${s.num} удалён`)
                }}
              >
                <Trash2 />
              </button>
            </span>,
          ],
        }))}
      />
      {edit && (
        <SegmentDialog
          seg={edit === "new" ? null : edit}
          next={{
            num: Math.max(0, ...list.map((s) => s.num)) + 1,
            from: list.length > 1 ? `Муфта М-${list.length}` : d.start.title,
            to: d.end.title,
          }}
          onClose={() => setEdit(null)}
          onSave={(s) => {
            onChange(edit === "new" ? [...list, s] : list.map((x) => (x.id === s.id ? s : x)))
            toast(edit === "new" ? "Участок добавлен" : "Участок изменён")
            setEdit(null)
          }}
        />
      )}
    </Card>
  )
}

/** Окно «Новый участок трассы» (vols-x0). TODO(API): POST /api/bols/children. */
function SegmentDialog({
  seg,
  next,
  onClose,
  onSave,
}: {
  seg: Segment | null
  next: { num: number; from: string; to: string }
  onClose: () => void
  onSave: (s: Segment) => void
}) {
  const [v, set] = useState({
    num: String(seg?.num ?? next.num),
    laying: seg?.laying ?? LAYING[0],
    from: seg?.from ?? next.from,
    to: seg?.to ?? next.to,
    len: seg ? kmStr(seg.len) : "",
    cable: seg ? kmStr(seg.cable) : "",
  })
  const [tried, setTried] = useState(false)
  const bad = {
    num: !+v.num,
    from: !v.from.trim(),
    to: !v.to.trim(),
    len: !(parseKm(v.len) > 0),
  }
  const f = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => set({ ...v, [k]: e.target.value })
  return (
    <Modal title={seg ? `Участок трассы ${seg.num}` : "Новый участок трассы"} icon={GitBranch} width={640} onClose={onClose}>
      <form
        className="px-6 pt-5 pb-6"
        onSubmit={(e) => {
          e.preventDefault()
          setTried(true)
          if (Object.values(bad).some(Boolean)) return
          onSave({
            id: seg?.id ?? Date.now(),
            num: +v.num,
            laying: v.laying,
            from: v.from.trim(),
            to: v.to.trim(),
            len: parseKm(v.len),
            cable: parseKm(v.cable) || parseKm(v.len),
          })
        }}
      >
        <p className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase after:h-px after:flex-1 after:bg-border">
          Участок
        </p>
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-4 max-sm:grid-cols-1">
          <label>
            <Label t="Нумерация" req />
            <Input inputMode="numeric" value={v.num} onChange={f("num")} invalid={tried && bad.num} />
          </label>
          <div>
            <Label t="Тип прокладки" req />
            <Select value={v.laying} opts={LAYING.map((t) => ({ v: t, label: t }))} onChange={(laying) => set({ ...v, laying })} />
          </div>
          <label>
            <Label t="Начало участка" req />
            <Input value={v.from} onChange={f("from")} invalid={tried && bad.from} />
          </label>
          <label>
            <Label t="Конец участка" req />
            <Input value={v.to} onChange={f("to")} invalid={tried && bad.to} />
          </label>
          <label>
            <Label t="Длина участка, км" req />
            <Input inputMode="decimal" value={v.len} onChange={f("len")} invalid={tried && bad.len} placeholder="0,1" />
          </label>
          <label>
            <Label t="Длина кабеля, км" />
            <Input inputMode="decimal" value={v.cable} onChange={f("cable")} placeholder="0,11" />
          </label>
        </div>
        <div className="mt-7 flex justify-end gap-2.5">
          <button type="button" className={btn()} onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className={btn({ primary: true })}>
            {seg ? <Pencil /> : <Plus />}
            {seg ? "Сохранить" : "Добавить"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ---------- vols-t2 · Волокна ---------- */

export const FIBER_COLOR: Record<FiberState, string> = {
  used: "#4f8dff",
  reserve: "#ffc53d",
  free: "var(--chip-bg)",
}

/** Вкладка «Волокна» (vols-t2): сетка волокон (занято / резерв / свободно) и сводка. */
export function FibersTab({ d, own }: { d: VolsDetail; own: boolean }) {
  const used = d.fibers.filter((f) => f !== "free").length
  const busy = d.fibers.filter((f) => f === "used").length
  return (
    <Card icon={Rows3} title="Волокна" count={d.fibers.length}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
        {d.fibers.map((f, i) => (
          <span
            key={i}
            title={f === "used" ? "Занято" : f === "reserve" ? "Резерв" : "Свободно"}
            className={cn(
              "grid h-11 place-items-center rounded-[10px] border text-[13px] font-medium tabular-nums",
              f === "used" && "border-[#2f5fd0] bg-[rgba(8,94,255,0.22)] text-foreground",
              f === "reserve" && "border-[#a3801f] bg-[rgba(255,197,61,0.14)] text-[#ffc53d]",
              f === "free" && "border-border bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] text-muted-foreground",
            )}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="mt-5">
        <Kv
          rows={[
            { t: "Кол-во волокон всего", v: d.fibers.length },
            { t: "Принадлежит JM", v: own ? d.fibers.length : 0 },
            { t: "Арендуемых", v: own ? 0 : d.fibers.length },
            { t: "Занятых", v: busy ? `${busy} · ${d.fiberNote}` : 0 },
            { t: "Свободных", v: d.fibers.length - used },
          ]}
        />
      </div>
    </Card>
  )
}

/* ---------- vols-t3 · Аренда КК ---------- */

/** Вкладка «Аренда КК» (vols-t3). */
export function RentTab({ d }: { d: VolsDetail }) {
  return (
    <Card icon={Waypoints} title="Аренда кабельной канализации" className="max-w-[1200px]">
      <Kv
        rows={[
          { t: "Протяжённость арендуемой КК, км", v: d.rent.len || "0" },
          { t: "Ежемесячная плата за аренду КК", v: d.rent.pay || "—" },
          { t: "Основание (номер договора)", v: d.rent.basis || "—" },
          { t: "Реквизиты технических условий (ТУ)", v: d.rent.tu || "—" },
          { t: "Подтверждение", v: d.rent.confirmed ? "Да" : "Нет" },
        ]}
      />
    </Card>
  )
}

/* ---------- vols-t4 · Документация ---------- */

/** Вкладка «Документация» (vols-t4): обязательные документы с отметкой загрузки и фото / схемы. */
export function VolsDocsTab({ d, onGallery }: { d: VolsDetail; onGallery: (i: number) => void }) {
  const upload = () => toast("Загрузка документов — после подключения API")
  return (
    <div className="grid grid-cols-[1fr_590px] gap-[18px] max-[1500px]:grid-cols-[1fr_440px] max-[1279px]:grid-cols-1">
      <Card
        icon={FileText}
        title="Документация"
        count={d.docs.length}
        action={
          <button type="button" className={btn({ primary: true, sm: true })} onClick={upload}>
            <Upload />
            Загрузить
          </button>
        }
      >
        <div className="flex flex-col gap-2">
          {d.docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
              <span className="grid size-8 flex-none place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
                <FileText className="size-4" />
              </span>
              <span className="min-w-0">
                <b className="block text-[13.5px] font-semibold">{doc.name}</b>
                <span className="block text-[13px] text-muted-foreground">{doc.req}</span>
              </span>
              <span
                className={cn(
                  "flex-none rounded-full px-2.5 py-1 text-xs font-medium",
                  doc.uploaded ? "bg-[rgba(43,212,99,0.14)] text-[var(--status-ok)]" : "bg-[var(--chip-bg)] text-muted-foreground",
                )}
              >
                {doc.uploaded ? "Загружено" : "Нет файла"}
              </span>
              <button type="button" className={circ} aria-label="Загрузить файл" onClick={upload}>
                <Upload />
              </button>
            </div>
          ))}
        </div>
      </Card>
      <Card icon={ImageIcon} title="Фото и схемы" count={d.media.length} className="self-start">
        <div className="grid grid-cols-3 gap-2">
          {d.media.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onGallery(i)}
              className="aspect-[16/9] rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${src})` }}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ---------- vols-t5 · История ---------- */

const EV: Record<VolsEvent["kind"], [typeof Pencil, string]> = {
  edit: [Pencil, "bg-[rgba(8,94,255,0.16)] text-[var(--link)]"],
  upload: [Upload, "bg-[rgba(43,212,99,0.14)] text-[var(--status-ok)]"],
  link: [LinkIcon, "bg-[rgba(8,94,255,0.16)] text-[var(--link)]"],
  create: [Plus, "bg-[rgba(43,212,99,0.14)] text-[var(--status-ok)]"],
}

/** Вкладка «История» (vols-t5): события с изменением «было → стало». */
export function VolsHistoryTab({ d }: { d: VolsDetail }) {
  return (
    <Card
      icon={History}
      title="История изменений"
      count={d.history.length}
      action={
        <button type="button" className={btn({ sm: true })} onClick={() => toast("Экспорт истории — после подключения API")}>
          <Download />
          Экспорт
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        {d.history.map((h) => {
          const [I, tone] = EV[h.kind]
          return (
            <div key={h.id} className="flex gap-3.5 rounded-2xl border border-border px-4 py-3.5">
              <span className={cn("grid size-[38px] flex-none place-items-center rounded-xl", tone)}>
                <I className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[13.5px] font-semibold">{h.what}</b>
                {h.diff && (
                  <span className="my-1.5 flex items-center gap-2 text-xs">
                    <s className="rounded-md bg-[rgba(255,82,87,0.14)] px-1.5 py-0.5 text-[#ff5257]">{h.diff[0]}</s>
                    <ArrowRight className="size-3.5" />
                    <span className="rounded-md bg-[rgba(43,212,99,0.14)] px-1.5 py-0.5 text-[var(--status-ok)]">{h.diff[1]}</span>
                  </span>
                )}
                <span className="block text-xs text-muted-foreground">{h.who}</span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">{h.date}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
