"use client"

import { Activity, ArrowRight, ArrowUpRight, Cable, DatabaseBackup, FileText, History, Server, Shield, Zap } from "lucide-react"
import { btn, circ, Pill } from "@/components/list/ui"
import { Card, glass, Legend, SegBar } from "@/components/passport/ui"
import type { Port, SpdDetail } from "@/lib/api/spd-detail"
import type { SpdRow } from "@/lib/api/spd"
import { cn } from "@/lib/utils"

/*
 * Части паспорта оборудования СПД (макет 03): сцены «Передняя панель» и «Стойка», нижняя часть «Обзора».
 * Сами паспорта — app/(main)/switches/[id]/page.tsx и routers/[id]/page.tsx.
 */

/** Вкладки паспорта, на которые ведут карточки «Обзора». */
export type SpdTab = "overview" | "ports" | "capacity" | "children" | "mol" | "docs" | "service" | "moves"

/* ---------- Передняя панель (sw-02) ---------- */

const PORT_CLS = {
  up: "border-[rgba(43,212,99,0.5)] [&>i]:bg-[#2bd463]",
  down: "border-[rgba(255,59,59,0.7)] [&>i]:bg-[#ff3b3b]",
  free: "border-white/10 [&>i]:bg-white/15",
}

/** Передняя панель 1U: медные порты в два ряда (нечётные сверху), SFP справа; клик — карточка порта. */
export function FrontPanel({ x, d, onPort }: { x: SpdRow; d: SpdDetail; onPort: (p: Port) => void }) {
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
export function Rack({ d }: { d: SpdDetail }) {
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

export function SpdOverview({
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
