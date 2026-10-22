"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { ArrowRight, Search } from "lucide-react"
import { toast } from "@/components/shared/toast"
import type { MapPoint, Visible } from "@/components/map/points-map"
import { fmt } from "@/lib/list/query"
import type { ListConfig, Row, Tone } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { btn, Pill } from "./ui"

const PointsMap = dynamic(() => import("@/components/map/points-map").then((m) => m.PointsMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--feat-bg)]" />,
})

const SHORT: Partial<Record<Tone, string>> = { warn: "Реконстр." }

/** Вид «Карта» (экран n-02): узлы с кластерами, слева — ближайшие к центру в видимой области. */
export function MapView<T extends Row>({
  cfg,
  rows,
  active,
  setActive,
}: {
  cfg: ListConfig<T>
  rows: T[]
  active: number | null
  setActive: (id: number) => void
}) {
  const [visible, setVisible] = useState<Visible>({ total: 0, near: [] })
  const points = useMemo(
    () =>
      rows.flatMap((x): (MapPoint & { note: string; status: string })[] => {
        const p = cfg.map?.(x)
        return p ? [{ id: x.id, ...p, status: cfg.preview(x).status.label }] : []
      }),
    [cfg, rows],
  )
  const cur = points.find((p) => p.id === active)
  const label = (p: (typeof points)[number]) => (p.tone === "warn" ? SHORT.warn : p.status)

  return (
    <section className="relative mt-[18px] h-[min(980px,calc(100vh-120px))] min-h-[560px] overflow-hidden rounded-3xl border border-border bg-[var(--feat-bg)]">
      <PointsMap points={points} selected={active} onSelect={setActive} onVisible={setVisible} className="absolute inset-0" />

      <aside className="absolute top-4 bottom-4 left-4 z-[1] flex w-[400px] flex-col rounded-3xl border border-border bg-[var(--glass-card)] p-4 backdrop-blur-[18px] max-md:top-auto max-md:right-4 max-md:h-[45%] max-md:w-auto">
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-border bg-[var(--chip-bg)] px-4 text-sm text-muted-foreground">
          <Search className="size-[18px]" />
          Узлы в видимой области · {fmt(visible.total)}
        </div>
        <div className="mt-2 min-h-0 flex-1 overflow-auto">
          {visible.near.map((p) => {
            const full = points.find((x) => x.id === p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border px-1 py-3 text-left last:border-0",
                  p.id === active && "rounded-xl border-transparent bg-[rgba(8,94,255,0.1)]",
                )}
              >
                <span className="grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                  <cfg.icon className="size-[17px]" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[14px] font-semibold">{p.title}</b>
                  <span className="block truncate text-xs text-muted-foreground">
                    {p.km < 0.05 ? "0,0" : p.km.toFixed(1).replace(".", ",")} км
                  </span>
                </span>
                {full && <Pill tone={p.tone}>{label(full)}</Pill>}
              </button>
            )
          })}
          {!visible.near.length && <p className="px-2 py-8 text-center text-sm text-muted-foreground">В этой области узлов нет</p>}
        </div>
        {visible.total > visible.near.length && (
          <p className="pt-3 text-center text-[13px] text-muted-foreground">Приблизьте карту, чтобы увидеть больше</p>
        )}
      </aside>

      {cur && (
        <div className="absolute top-4 right-4 z-[1] flex max-w-[calc(100%-450px)] items-center gap-4 rounded-2xl border border-border bg-[var(--glass-card)] py-3 pr-3 pl-4 backdrop-blur-[18px] max-md:hidden">
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              {cur.title} · {cur.status}
            </span>
            <b className="block truncate text-sm font-semibold">{cur.note}</b>
          </span>
          {/* TODO: паспорт узла (p01) */}
          <button type="button" className={btn({ sm: true })} onClick={() => toast("Паспорт — следующим этапом")}>
            Паспорт
            <ArrowRight />
          </button>
        </div>
      )}
    </section>
  )
}
