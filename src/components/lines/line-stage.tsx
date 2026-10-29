"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { kmStr, type LineDetail, type LineKind } from "@/sections/lines/detail"
import { strandColor } from "@/sections/lines/tabs"

/* Сцена паспорта линии (ВОЛС, КЛС, КК): схема трассы А — Б и фон верха (3D-картинка, карта или фото). */

const NetworkMap = dynamic(() => import("@/components/map/network-map").then((m) => m.NetworkMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--feat-bg)]" />,
})

export type LineStage = "scene" | "schema" | "map" | "photo"

/** Конец трассы на схеме: УС и его ID под квадратом «А» / «Б». */
function End({ t, code, right }: { t: string; code: string; right?: boolean }) {
  return (
    <span className={cn("absolute top-[80px] w-[200px] text-[13px]", right ? "right-0 text-right" : "left-0")}>
      <b className="block truncate font-semibold">{t}</b>
      <span className="text-xs text-muted-foreground">{code}</span>
    </span>
  )
}

/** Схема трассы (vols-04-schema, kls-04-schema, kk-04-schema): А — муфты / колодцы — Б, длины участков, ряд жил или сечение. */
export function LineSchema({
  d,
  k,
  stripTitle,
}: {
  d: LineDetail
  k: Pick<LineKind, "color" | "square" | "meters" | "segLabel" | "strip" | "strand">
  /** Подпись над рядом жил */
  stripTitle: string
}) {
  const n = d.segments.length
  return (
    <div className="absolute inset-x-0 top-[200px] px-[4%] max-[1279px]:top-10">
      <div className="relative h-12">
        <i
          className="absolute top-1/2 right-6 left-6 h-[3px] -translate-y-1/2 rounded-full "
          style={{ background: k.color, boxShadow: `0 0 12px ${k.color}` }}
        />
        {d.segments.map((s, i) => (
          <span
            key={s.id}
            className="absolute top-0 h-full"
            style={{
              left: `calc(24px + (100% - 48px) * ${i / n})`,
              width: `calc((100% - 48px) / ${n})`,
            }}
          >
            <em className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full border border-border bg-[var(--glass-card-solid)] px-3 py-0.5 text-xs whitespace-nowrap not-italic tabular-nums">
              {k.meters ? `${Math.round(s.len * 1000)} м` : `${kmStr(s.len)} км`}
            </em>
            <span className="absolute top-[40px] left-1/2 -translate-x-1/2 text-[11px] whitespace-nowrap text-muted-foreground">
              {k.segLabel ? k.segLabel(s) : s.laying.toLowerCase()}
            </span>
            {i > 0 && (
              <>
                <i
                  className={cn(
                    "absolute top-1/2 left-0 size-[26px] -translate-x-1/2 -translate-y-1/2 border-[3px] bg-background",
                    k.square ? "rounded-[5px]" : "rounded-full border-[#ffc53d]",
                  )}
                  style={k.square ? { borderColor: k.color } : undefined}
                />
                <span
                  className={cn(
                    "absolute -top-[58px] left-0 -translate-x-1/2 text-[11px] whitespace-nowrap",
                    k.square ? "text-muted-foreground" : "text-[#ffc53d]",
                  )}
                >
                  {s.from}
                </span>
              </>
            )}
          </span>
        ))}
        {(["А", "Б"] as const).map((t, i) => (
          <span
            key={t}
            className={cn(
              "absolute top-0 grid size-12 place-items-center rounded-xl bg-[#085eff] text-sm font-semibold text-white shadow-[0_0_24px_rgba(8,94,255,0.6)]",
              i ? "right-0" : "left-0",
            )}
          >
            {t}
          </span>
        ))}
        <End t={d.start.title} code={d.start.code} />
        <End t={d.end.title} code={d.end.code} right />
      </div>
      <div className="mx-auto mt-[150px] w-fit max-w-full">
        <p className="mb-2 text-center text-xs text-muted-foreground">{stripTitle}</p>
        {k.strip === "duct" ? (
          <div className="mx-auto grid w-fit grid-cols-2 gap-3">
            {d.strands.map((f, i) => (
              <i
                key={i}
                title={`Канал ${i + 1}`}
                className="block size-[44px] rounded-full border-[3px]"
                style={{ borderColor: f === "free" ? "var(--chip-bg)" : k.color }}
              />
            ))}
          </div>
        ) : k.strip === "dots" ? (
          <div className="grid grid-cols-[repeat(25,18px)] justify-center gap-[7px]">
            {d.strands.map((f, i) => (
              <i key={i} title={`Пара ${i + 1}`} className="block size-[18px] rounded-full" style={{ background: strandColor(k, f) }} />
            ))}
          </div>
        ) : (
          <div className="flex justify-center gap-[3px]">
            {d.strands.map((f, i) => (
              <span key={i} className="flex w-4 flex-col items-center gap-1.5">
                <i className="block h-9 w-full rounded-[4px]" style={{ background: strandColor(k, f) }} />
                <span className="text-[9px] text-muted-foreground tabular-nums">{i + 1}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Фон верха: 3D-трасса (картинка из макета; TODO: three.js, handoff §6), трасса на карте или фото. */
export function LineBackdrop({ stage, d, k }: { stage: LineStage; d: LineDetail; k: Pick<LineKind, "color" | "scene" | "point"> }) {
  const mid = d.route[Math.floor(d.route.length / 2)]
  const lines = useMemo(
    () => [
      {
        id: "route",
        coords: d.route,
        layer: "vols",
        color: k.color,
        width: 4,
      },
    ],
    [d.route, k.color],
  )
  const points = useMemo(
    () => [
      {
        id: "a",
        ll: d.route[0],
        layer: "node",
        color: "#4f8dff",
        title: d.start.code,
      },
      {
        id: "b",
        ll: d.route[d.route.length - 1],
        layer: "node",
        color: "#4f8dff",
        title: d.end.code,
      },
      ...d.pointLl.map((ll, i) => ({
        id: `m${i}`,
        ll,
        layer: "mufta",
        color: "#ffc53d",
        title: k.point(i),
      })),
    ],
    [d, k],
  )
  const focus = useMemo(() => ({ ll: mid, zoom: 15, n: 1 }), [mid])
  if (stage === "map")
    return (
      <div className="absolute inset-0 z-[1]">
        <NetworkMap
          points={points}
          lines={lines}
          basemap="city"
          selected="a"
          focus={focus}
          onSelect={() => {}}
          onView={() => {}}
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--background)_0,transparent_18%,transparent_80%,var(--background)_100%)]" />
      </div>
    )
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_55%_45%,rgba(8,94,255,0.16),transparent_70%)]" />
      {stage === "photo" ? (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${d.media[0]})` }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,14,0.92)_0,rgba(10,11,14,0.35)_30%,rgba(10,11,14,0.1)_50%,rgba(10,11,14,0.35)_70%,rgba(10,11,14,0.92)_100%),linear-gradient(180deg,rgba(10,11,14,0.9)_0,transparent_25%,transparent_70%,var(--background)_100%)]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-[size:48px_48px] opacity-40" />
          {stage === "scene" && k.scene && (
            <div
              className="absolute top-[150px] left-1/2 h-[726px] w-[1100px] -translate-x-1/2 bg-contain bg-center bg-no-repeat max-[1279px]:hidden"
              style={{ backgroundImage: `url(${k.scene})` }}
            />
          )}
        </>
      )}
    </div>
  )
}
