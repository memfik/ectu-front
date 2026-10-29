"use client"

import { Note } from "@/components/passport/radio"
import type { TrunkBs } from "@/lib/api/trunk-bs"

/* БС Транк (макет 30): передняя панель ретранслятора. TODO(API): частоты и стандарт — нет в /api/bc. */

/** Ретранслятор (bc-04-panel): дисплей канала, ручки, решётка, антенные разъёмы TX / RX. */
export function TrunkPanel({ x }: { x: TrunkBs }) {
  return (
    <div className="absolute inset-x-0 top-[50px] px-[2%] max-[1279px]:top-0">
      <div className="relative h-[100px]">
        <Note t="Канал · частоты" v="151.250 / 155.850 МГц" at={24} />
        <Note t="Антенны" v="TX / RX на АМС" at={74} />
      </div>
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>{String(x.f.model)}</span>
        <span>TETRA / SmartTrunk</span>
      </p>
      <div className="relative mt-2 flex h-[160px] items-center gap-5 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#17191f)] px-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#d9dce3)]">
        <span className="w-[300px] min-w-0 shrink">
          <b className="block text-sm font-semibold">Ретранслятор</b>
          <span className="block truncate text-[11px] text-muted-foreground">{String(x.f.model)}</span>
        </span>
        <pre className="rounded-lg border border-[#a3801f] bg-[#1c1606] px-3 py-2 font-mono text-[11px] leading-[1.6] text-[#ffc53d]">
          {"CH 05  TX 151.250\n       RX 155.850\nSITE  SmartTrunk2"}
        </pre>
        {[0, 1].map((i) => (
          <i key={i} className="relative size-9 rounded-full border-2 border-[#5b606b] bg-[#2a2d35]">
            <i className="absolute top-1 left-1/2 h-3 w-0.5 -translate-x-1/2 rounded bg-white" />
          </i>
        ))}
        <span className="h-[120px] min-w-0 flex-1 rounded-md bg-[repeating-linear-gradient(90deg,#0b0c10_0_3px,#2a2d35_3px_6px)] opacity-80" />
        <span className="flex flex-col items-center gap-1.5">
          {["TX", "RX"].map((t) => (
            <span key={t} className="flex flex-col items-center gap-0.5">
              <i className="grid size-9 place-items-center rounded-full border-2 border-[#4f8dff] bg-[#0b0c10] shadow-[0_0_10px_rgba(79,141,255,0.5)]">
                <i className="size-3 rounded-full bg-white" />
              </i>
              <span className="text-[8px] text-muted-foreground">{t}</span>
            </span>
          ))}
          <span className="text-[8px] tracking-[0.5px] text-muted-foreground">ANT</span>
        </span>
      </div>
    </div>
  )
}
