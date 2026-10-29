"use client"

import Link from "next/link"
import { ArrowRight, Map as MapIcon, Pencil, X } from "lucide-react"
import { circ, btn, Pill, Tag, type Tone } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { cn } from "@/lib/utils"

/** Превью записи справа от таблицы (на узких экранах скрыто). */
export function PreviewPanel({
  href,
  onClose,
  onEdit,
  onMap,
  ...p
}: {
  /** Паспорт записи */
  href: string
  onClose: () => void
  onEdit?: () => void
  /** «На карте»; по умолчанию — подсказка про экран «Карта» */
  onMap?: () => void
  photo?: string
  /** Порты устройства вместо цифр (оборудование СПД) */
  ports?: { n: string; state: "up" | "down" | "sfp" | "free" }[]
  status: { label: string; tone: Tone }
  title: string
  sub: string
  facts: { t: string; v: React.ReactNode }[]
  stats?: { t: string; v: React.ReactNode }[]
  tags?: string[]
  /** Кнопка «Открыть паспорт», «Подробнее об узле» */
  more: string
}) {
  return (
    <aside className="sticky top-4 w-[420px] flex-none self-start overflow-hidden rounded-3xl border border-border bg-[var(--glass-card)] backdrop-blur-[18px] max-[1500px]:w-[360px] max-[1279px]:hidden">
      <div className="relative h-[270px] bg-[var(--feat-bg)]">
        {p.photo && <div className="absolute inset-0 bg-cover bg-[position:50%_30%]" style={{ backgroundImage: `url(${p.photo})` }} />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,11,14,0.1)_40%,var(--glass-card-solid))]" />
        <div className="absolute inset-x-4 top-3.5 flex items-center justify-between">
          <Pill tone={p.status.tone} className="bg-[rgba(10,11,14,0.6)] backdrop-blur">
            {p.status.label}
          </Pill>
          <button type="button" aria-label="Закрыть превью" onClick={onClose} className={cn(circ, "bg-[rgba(10,11,14,0.5)] text-white")}>
            <X />
          </button>
        </div>
      </div>
      <div className="px-[22px] pt-1 pb-[22px]">
        <h3 className="text-2xl font-semibold tracking-[-0.3px]">{p.title}</h3>
        <p className="mt-1 mb-3 text-[13px] text-muted-foreground">{p.sub}</p>
        <dl className="text-[13.5px]">
          {p.facts.map((f) => (
            <div key={f.t} className="flex justify-between gap-4 border-b border-border py-2.5">
              <dt className="text-muted-foreground">{f.t}</dt>
              <dd className="text-right font-medium">{f.v}</dd>
            </div>
          ))}
        </dl>
        {p.ports ? (
          <div className="my-3.5">
            <span className="text-[13px] text-muted-foreground">
              Порты · {p.ports.filter((x) => x.state === "up").length} / {p.ports.length}
            </span>
            <div className="mt-2 grid grid-cols-14 gap-1">
              {p.ports.map((x) => (
                <i
                  key={x.n}
                  title={`${x.n} · ${x.state}`}
                  className={cn(
                    "aspect-square rounded-[4px] border",
                    x.state === "up" && "border-[rgba(43,212,99,0.5)] bg-[rgba(43,212,99,0.18)]",
                    x.state === "down" && "border-[rgba(255,59,59,0.55)] bg-[rgba(255,59,59,0.18)]",
                    x.state === "sfp" && "border-[rgba(8,94,255,0.6)] bg-[rgba(8,94,255,0.25)]",
                    x.state === "free" && "border-border bg-[var(--chip-bg)]",
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="my-3.5 grid grid-cols-4 gap-2">
            {p.stats?.map((s) => (
              <div key={s.t} className="rounded-[14px] border border-border bg-[var(--chip-bg)] p-3">
                <span className="block truncate text-xs text-muted-foreground">{s.t}</span>
                <b className="mt-1 block text-xl font-medium tabular-nums">{s.v}</b>
              </div>
            ))}
          </div>
        )}
        {p.tags && (
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          {/* TODO: «На карте» — паспорт, вкладка «Карта» (p02) */}
          <button type="button" title="На карте" className={cn(circ, "size-11")} onClick={onMap ?? (() => toast("Узел на карте — экран «Карта»"))}>
            <MapIcon />
          </button>
          {onEdit && (
            <button type="button" title="Изменить" className={cn(circ, "size-11")} onClick={onEdit}>
              <Pencil />
            </button>
          )}
          <Link href={href} className={cn(btn({ primary: true }), "flex-1 justify-center")}>
            {p.more}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </aside>
  )
}
