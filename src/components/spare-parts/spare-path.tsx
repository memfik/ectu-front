"use client"

import { glass } from "@/components/passport/ui"
import { isInstalled, money, replacedAt, SPARE_STATUS, spareField, spareMol, shortName, type SparePart } from "@/lib/api/spare-parts"
import { cn } from "@/lib/utils"

/** Схема «Путь» паспорта ЗИП (zip-04-schema): склад ФО → МОЛ → узел → установлено вместо. */
export function SparePath({ x }: { x: SparePart }) {
  const on = isInstalled(x)
  const steps = [
    { t: "Склад ФО", s: spareField(x, "warehouse"), c: "#8c919b", done: true },
    { t: "МОЛ", s: shortName(spareMol(x)), c: "#ffc24a", done: x.status !== "stock" },
    { t: "Узел", s: x.nodeCode, c: "#4f8dff", done: on },
    { t: "Установлено вместо", s: on ? "SFP S/N AGC1435U4PJ" : "—", c: "#3ddc84", done: on },
  ]
  return (
    <div className="absolute inset-x-0 top-[150px] px-[4%] max-[1279px]:top-0">
      <div className="relative grid grid-cols-4">
        <i className="absolute top-[22px] right-[12.5%] left-[12.5%] border-t-2 border-dashed border-[#4f8dff]/70" />
        {steps.map((s, i) => (
          <div key={s.t} className="relative flex flex-col items-center text-center">
            <span
              className={cn("grid size-11 place-items-center rounded-full border-2 bg-background text-sm font-semibold", !s.done && "opacity-40")}
              style={{ borderColor: s.c }}
            >
              {i + 1}
            </span>
            <b className="mt-3 text-[13px] font-semibold">{s.t}</b>
            <span className="text-[11px] text-muted-foreground">{s.s}</span>
          </div>
        ))}
      </div>
      <div className={cn(glass, "mx-auto mt-10 w-fit rounded-xl px-8 py-2.5 text-center text-[11px]")}>
        <span className="block text-muted-foreground">
          {spareField(x, "name")} · инв. № {spareField(x, "inv")} · {money(spareField(x, "cost"))} тг без НДС
        </span>
        <span className={on ? "text-[var(--status-ok)]" : "text-muted-foreground"}>
          ● {on ? `Установлено ${replacedAt(x)} · документ замены ${spareField(x, "replaceDoc").split(" от")[0]}` : SPARE_STATUS[x.status]?.[0]}
        </span>
      </div>
    </div>
  )
}
