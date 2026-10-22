"use client"

import {
  ArrowRight,
  ArrowUpRight,
  Cable,
  Download,
  Eye,
  FileText,
  History,
  Image as ImageIcon,
  Link as LinkIcon,
  Maximize2,
  MessageSquare,
  Plus,
  Server,
  UserCog,
  Users,
} from "lucide-react"
import { btn, circ } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import type { NodeDetail } from "@/sections/nodes/detail"
import { plural } from "@/lib/list/query"
import { cn } from "@/lib/utils"
import { Avatar, Card, Legend, SegBar } from "@/components/passport/ui"
import type { TabKey } from "./passport"

/** Вкладка «Обзор» паспорта (экран p01, нижняя часть): сводки по вкладкам, фото, документы, люди, комментарии, история. */
export function NodeOverview({ d, onTab, onGallery }: { d: NodeDetail; onTab: (t: TabKey) => void; onGallery: (i?: number) => void }) {
  const go = (t: TabKey) => (
    <button type="button" className={circ} onClick={() => onTab(t)} aria-label="Открыть вкладку">
      <ArrowUpRight />
    </button>
  )
  const fiberTotal = d.fibers.reduce((a, f) => a + f.total, 0)
  const fiberUsed = d.fibers.reduce((a, f) => a + f.used, 0)
  const ports = d.equipment.reduce((a, e) => ({ up: a.up + e.ports.up, down: a.down + e.ports.down, free: a.free + e.ports.free }), {
    up: 0,
    down: 0,
    free: 0,
  })

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-4 gap-[18px] max-[1500px]:grid-cols-2 max-sm:grid-cols-1">
        <Card icon={Cable} title="ВОЛС трассы" action={go("fibers")}>
          <Big
            n={d.fibers.length}
            t={`${plural(d.fibers.length, ["трасса", "трассы", "трасс"])} · ${fiberTotal} ${plural(fiberTotal, ["волокно", "волокна", "волокон"])}`}
          />
          <SegBar
            parts={[
              { v: fiberUsed, color: "#085eff" },
              { v: fiberTotal - fiberUsed || (fiberTotal ? 0 : 1), color: "var(--chip-bg)" },
            ]}
          />
          <Legend
            items={[
              { t: `Занято ${fiberUsed}`, color: "#085eff" },
              { t: `Свободно ${fiberTotal - fiberUsed}`, color: "#8c919b" },
            ]}
          />
        </Card>
        <Card icon={Server} title="Оборудование" action={go("equipment")}>
          <Big n={d.equipment.length} t={d.equipment.map((e) => e.model).join(", ")} />
          <SegBar
            parts={[
              { v: ports.up, color: "var(--status-ok)" },
              { v: ports.down, color: "var(--status-alarm)" },
              { v: ports.free, color: "var(--chip-bg)" },
            ]}
          />
          <Legend
            items={[
              { t: `Порты up ${ports.up}`, color: "var(--status-ok)" },
              { t: `down ${ports.down}`, color: "var(--status-alarm)" },
              { t: `свободно ${ports.free}`, color: "#8c919b" },
            ]}
          />
        </Card>
        <Card
          icon={LinkIcon}
          title="ID-каналы"
          action={
            <button type="button" className={circ} aria-label="Привязать канал" onClick={() => onTab("id")}>
              <Plus />
            </button>
          }
        >
          <Big n={d.idChannels.length} t={plural(d.idChannels.length, ["канал", "канала", "каналов"])} />
          <p className="text-[12.5px] text-muted-foreground">
            {d.idChannels.length
              ? `${d.idChannels.filter((c) => c.status === "ok").length} активных · ${d.idChannels.map((c) => c.num).join(", ")}`
              : "К узлу ещё не привязаны каналы. Привяжите первый, чтобы видеть трафик и статус."}
          </p>
        </Card>
        <Card icon={Users} title="Клиенты рядом" action={go("clients")}>
          <Big n={d.clients.total} t={`в радиусе ${d.clients.radius} м`} />
          <SegBar
            parts={[
              { v: d.clients.client, color: "var(--status-ok)" },
              { v: d.clients.processed, color: "#ffc24a" },
              { v: d.clients.none, color: "var(--chip-bg)" },
            ]}
          />
          <Legend
            items={[
              { t: `Клиент ${d.clients.client}`, color: "var(--status-ok)" },
              { t: `Обработан ${d.clients.processed}`, color: "#ffc24a" },
              { t: `Нет ${d.clients.none}`, color: "#8c919b" },
            ]}
          />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-[18px] max-[1279px]:grid-cols-1">
        <Card
          icon={ImageIcon}
          title="Фото и видео"
          count={d.media.length}
          action={
            <button type="button" className={btn({ sm: true })} onClick={() => onGallery()}>
              <Maximize2 />
              Открыть галерею
            </button>
          }
        >
          <div className="grid h-[248px] grid-cols-[1fr_1fr_1fr] grid-rows-2 gap-2">
            {d.media.slice(0, 5).map((m, i) => (
              <button
                type="button"
                onClick={() => onGallery(i)}
                key={i}
                className={cn("relative rounded-[14px] bg-cover bg-center", i === 0 && "col-span-2")}
                style={{ backgroundImage: `url(${m.src})` }}
                title={m.title}
              >
                {m.video && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-1.5 py-px text-[10px] font-bold text-white">
                    ▶ {m.video}
                  </span>
                )}
                {i === 4 && d.media.length > 5 && (
                  <span className="absolute inset-0 grid place-items-center rounded-[14px] bg-black/45 text-lg font-semibold text-white">
                    +{d.media.length - 5}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Card>
        <Card
          icon={FileText}
          title="Последние документы"
          count={d.docs.length}
          action={
            <button type="button" className={btn({ sm: true })} onClick={() => onTab("docs")}>
              <ArrowRight />
              Все документы
            </button>
          }
        >
          <div className="flex flex-col gap-2">
            {d.docs.slice(0, 3).map((f) => (
              <DocRow key={f.id} doc={f} />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-[18px] max-[1279px]:grid-cols-1">
        <Card
          icon={UserCog}
          title="Ответственные"
          count={d.people.length}
          action={
            <button type="button" className={btn({ sm: true })} onClick={() => onTab("people")}>
              Управлять
            </button>
          }
        >
          {d.people.map((p) => (
            <div key={p.initials} className="flex items-center gap-3 border-b border-border py-2.5">
              <Avatar initials={p.initials} color={p.color} />
              <span className="min-w-0">
                <b className="block text-sm font-semibold">{p.name}</b>
                <span className="text-xs text-muted-foreground">{p.role}</span>
              </span>
              {p.synced && (
                <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2 py-0.5 text-[11px] font-semibold text-[var(--status-ok)]">
                  Синхр.
                </span>
              )}
            </div>
          ))}
          <div className="flex items-center gap-3 py-2.5">
            <span className="grid size-10 place-items-center rounded-full bg-[var(--chip-bg)] text-muted-foreground">?</span>
            <span className="min-w-0 flex-1">
              <b className="block text-sm font-semibold">МОЛ не указан</b>
              <span className="text-xs text-muted-foreground">Добавьте материально ответственное лицо</span>
            </span>
            <button type="button" className={circ} aria-label="Добавить МОЛ" onClick={() => onTab("people")}>
              <Plus />
            </button>
          </div>
        </Card>
        <Card
          icon={MessageSquare}
          title="Комментарии"
          count={d.comments.length}
          action={
            <button type="button" className={btn({ sm: true })} onClick={() => onTab("comments")}>
              Открыть
            </button>
          }
        >
          <div className="flex flex-col gap-3">
            {d.comments.slice(0, 2).map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar initials={c.author.initials} color={c.author.color} />
                <div
                  className={cn(
                    "min-w-0 flex-1 rounded-2xl border border-border bg-[var(--chip-bg)] px-4 py-3 text-[13.5px]",
                    c.pinned && "border-[rgba(8,94,255,0.45)] bg-[rgba(8,94,255,0.08)]",
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    <b className="mr-1.5 text-[13px] text-foreground">{c.author.name}</b>
                    {c.pinned ? `закреплено · ${c.when}` : c.when}
                  </span>
                  <p className="mt-1">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card
          icon={History}
          title="История"
          count={d.history.length}
          action={
            <button type="button" className={btn({ sm: true })} onClick={() => onTab("history")}>
              Вся история
            </button>
          }
        >
          <ol className="relative ml-1.5 border-l border-border pl-5">
            {d.history.slice(0, 3).map((h) => (
              <li key={h.id} className="relative pb-4 last:pb-0">
                <i
                  className="absolute top-1 -left-[27px] size-3 rounded-full border-2 bg-[var(--glass-card-solid)]"
                  style={{ borderColor: h.kind === "file" ? "var(--status-ok)" : "#4f8dff" }}
                />
                <b className="block text-sm font-semibold">
                  {h.from !== undefined
                    ? `${h.what.replace(/^Изменён(о поле)? /, "").replace(/^./, (c) => c.toUpperCase())}: ${h.from} → ${h.to}`
                    : h.what}
                </b>
                <span className="text-xs text-muted-foreground">
                  {h.who} · {h.when}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}

function Big({ n, t }: { n: number; t: string }) {
  return (
    <p className="mb-3 flex items-baseline gap-2">
      <b className="text-[34px] leading-none font-medium tracking-[-0.02em] tabular-nums">{n}</b>
      <span className="min-w-0 truncate text-[13px] text-muted-foreground">{t}</span>
    </p>
  )
}

const EXT = { pdf: ["PDF", "#ff5257"], xlsx: ["XLS", "#2bd463"], docx: ["DOC", "#4f8dff"], dwg: ["DWG", "#ffc24a"] } as const

export function DocRow({ doc: f }: { doc: NodeDetail["docs"][number] }) {
  const [label, color] = EXT[f.ext]
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-[var(--chip-bg)] px-3.5 py-3">
      <span
        className="grid size-10 flex-none place-items-center rounded-[10px] text-[10.5px] font-bold"
        style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
      >
        {label}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-sm font-medium">{f.name}</b>
        <span className="text-xs text-muted-foreground">
          {f.kind} · {f.size} · {f.date}
        </span>
      </span>
      {/* TODO: просмотр и скачивание — файлы из API */}
      <button
        type="button"
        className={cn(circ, "size-8")}
        title="Просмотр"
        onClick={() => toast("Просмотр документа — после подключения API")}
      >
        <Eye />
      </button>
      <button type="button" className={cn(circ, "size-8")} title="Скачать" onClick={() => toast("Скачивание — после подключения API")}>
        <Download />
      </button>
    </div>
  )
}
