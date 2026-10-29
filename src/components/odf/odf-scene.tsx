"use client"

import { glass } from "@/components/passport/ui"
import type { Odf } from "@/lib/api/odf"
import type { Strand } from "@/lib/api/lines"
import { cn } from "@/lib/utils"

/*
 * Сцена паспорта ODF (макет 10): передняя панель кросса (odf-04-panel) и схема портов (odf-04-schema).
 * Порты — жилы паспорта линии: a — занят, b — резерв, free — свободен.
 */

export const PORT_STATE = { a: ["Занят", "ok"], b: ["Резерв", "warn"], free: ["Свободен", "muted"] } as const
/** Цвет занятого порта */
export const PORT_USED = "#2bd463"
/** ВОЛС, которая заходит в кросс (TODO(API): связь кросса с трассой) */
export const ODF_VOLS = "ВОЛС №49"

/** Передняя панель кросса: корпус 19" с портами, подпись ёмкости и направления. */
export function OdfPanel({ x, strands, a }: { x: Odf; strands: Strand[]; a: number }) {
  const shown = strands.slice(0, 24)
  return (
    <div className="absolute inset-x-0 top-[120px] px-[3%] max-[1279px]:top-6">
      <div className={cn(glass, "mx-auto w-fit px-5 py-3")}>
        <span className="block text-[11px] text-muted-foreground">Порты кросса</span>
        <b className="text-sm font-semibold">
          {a} из {strands.length} · {String(x.f.conn ?? "SC/UPC")}
        </b>
        <span className="mt-2 block h-1 w-40 overflow-hidden rounded-full bg-[var(--chip-bg)]">
          <i className="block h-full bg-[#085eff]" style={{ width: `${(a / strands.length) * 100}%` }} />
        </span>
      </div>
      <p className="mt-6 flex justify-between text-[11px] text-muted-foreground">
        <span>{x.nodeCode} · SM G.652D</span>
        <span>{strands.length} портов</span>
      </p>
      <div className="relative mt-2 flex items-center gap-6 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#1a1c22)] px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#dfe2e8)]">
        <i className="absolute top-1/2 -left-3 h-8 w-2 -translate-y-1/2 rounded bg-[var(--chip-bg)]" />
        <i className="absolute top-1/2 -right-3 h-8 w-2 -translate-y-1/2 rounded bg-[var(--chip-bg)]" />
        <span className="w-[110px] flex-none">
          <b className="block text-sm font-semibold">ODF</b>
          <span className="text-[11px] text-muted-foreground">{String(x.f.mount ?? 'Стоечный, 19"')}</span>
        </span>
        <span className="flex flex-1 flex-wrap justify-around gap-3">
          {shown.map((f, i) => (
            <i key={i} title={`Порт ${i + 1} · ${PORT_STATE[f][0]}`} className="grid size-[26px] place-items-center rounded-full border-2 border-[#5b606b] bg-[#0b0c10]">
              {f !== "free" && <i className="size-2.5 rounded-full" style={{ background: f === "a" ? "#ffc53d" : PORT_USED }} />}
            </i>
          ))}
        </span>
      </div>
      <div className={cn(glass, "mt-16 mr-[18%] ml-auto w-fit px-5 py-3")}>
        <span className="block text-[11px] text-muted-foreground">Направление</span>
        <b className="text-sm font-semibold">{String(x.f.nodeB ?? "—")}</b>
      </div>
    </div>
  )
}

/** Схема портов: все порты рядами по 24, занятые, резерв, свободные; куда идёт кабель. */
export function OdfPorts({ x, strands, a, end }: { x: Odf; strands: Strand[]; a: number; end: string }) {
  const color = (f: string) => (f === "a" ? PORT_USED : f === "b" ? "#ffc53d" : "transparent")
  return (
    <div className="absolute inset-x-0 top-[150px] px-[3%] max-[1279px]:top-6">
      <section className={cn(glass, "p-7")}>
        <b className="block text-base font-semibold">ODF-1 · {x.nodeCode}</b>
        <span className="text-xs text-muted-foreground">
          {strands.length} × {String(x.f.conn ?? "SC/UPC")} · одномодовое G.652D · {String(x.f.mount ?? "").toLowerCase()}
        </span>
        <div className="mt-6 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-x-1.5 gap-y-3">
          {strands.map((f, i) => (
            <span key={i} className="flex flex-col items-center gap-1">
              <i
                title={`Порт ${i + 1} · ${PORT_STATE[f][0]}`}
                className="grid h-[34px] w-full max-w-[30px] place-items-center rounded-md border-2"
                style={{ borderColor: f === "free" ? "var(--chip-bg)" : color(f) }}
              >
                <i className="h-4 w-2.5 rounded-sm" style={{ background: f === "free" ? "var(--chip-bg)" : color(f) }} />
              </i>
              <span className="text-[9px] text-muted-foreground tabular-nums">{i + 1}</span>
            </span>
          ))}
        </div>
      </section>
      <p className="mt-10 ml-[40%] w-fit rounded-xl border border-[#085eff] bg-[var(--glass-card)] px-5 py-2.5 text-sm backdrop-blur-[12px]">
        Порты 1–{a} → {ODF_VOLS} → {end}
      </p>
    </div>
  )
}
