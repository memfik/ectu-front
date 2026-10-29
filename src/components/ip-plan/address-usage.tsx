"use client"

import { useState } from "react"
import { freeBlocks, netUsage, type Net } from "@/lib/api/ip-plan"
import { cn } from "@/lib/utils"

/** Распределение адресов (ip-02): сетка блоков выбранного размера, занято / тест / резерв / свободно. */
export function AddressUsage({ net }: { net: Net }) {
  const [blk, setBlk] = useState<"/30" | "/29" | "/28">("/30")
  const { n, busy, test, reserve, free } = netUsage(net)
  const color = (i: number) => (i < busy ? "#0d5bff" : i < busy + test ? "#ffc53d" : i < busy + test + reserve ? "#a78bfa" : "var(--chip-bg)")
  const [a, b, c] = net.cidr.split(".")
  return (
    <div className="px-1.5 pb-2">
      <div className="mb-3 flex justify-end gap-2">
        {(["/30", "/29", "/28"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={blk === s}
            onClick={() => setBlk(s)}
            className={cn("h-9 rounded-full border border-border px-3.5 text-[13px]", blk === s && "border-[#085eff] bg-[#085eff] text-white")}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(32, minmax(0, 1fr))` }}>
        {Array.from({ length: n }, (_, i) => (
          <i key={i} title={`${a}.${b}.${c}.${i}`} className={cn("block h-5 rounded-[4px]", i === 0 && "ring-2 ring-white")} style={{ background: color(i) }} />
        ))}
      </div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {(
          [
            ["Занято", busy, "#0d5bff"],
            ["Тестовый доступ", test, "#ffc53d"],
            ["Резерв", reserve, "#a78bfa"],
            ["Свободно", free, "#5b606b"],
          ] as const
        ).map(([t, v, col]) => (
          <span key={t} className="flex items-center gap-1.5">
            <i className="size-2 rounded-full" style={{ background: col }} />
            {t} {v}
          </span>
        ))}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
        {(
          [
            ["Сеть", net.cidr],
            ["Шлюз", `${a}.${b}.${c}.254`],
            [`Свободных ${blk}`, String(freeBlocks(net, blk))],
          ] as const
        ).map(([t, v]) => (
          <div key={t} className="rounded-2xl border border-border px-4 py-3">
            <span className="block text-xs text-muted-foreground">{t}</span>
            <b className="font-mono text-[15px] font-semibold">{v}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
