"use client"

import { Note } from "@/components/passport/radio"
import { glass } from "@/components/passport/ui"
import { upsReplaced, type Ups } from "@/lib/api/ups"
import { cn } from "@/lib/utils"

/*
 * ИБП (макет 33): панель — ИБП с дисплеем и батарейная линейка с напряжением банок, схема — сеть → ИБП → нагрузка.
 * TODO(API): напряжения АБ, нагрузка, заряд, автономия — SNMP (нет в API).
 */

export const UPS_BLOCKS = 40
export const UPS_LOAD = 42
const BLOCKS = UPS_BLOCKS
const LOAD = UPS_LOAD
export const upsPower = (x: Ups) => String(x.f.power ?? "1/0,9")
export const upsKva = (x: Ups) => parseFloat(upsPower(x).replace(",", ".")) || 1
export const upsKw = (x: Ups) =>
  upsPower(x)
    .split("/")[1]
    ?.replace(/[^\d,.]/g, "") || String(upsKva(x) * 0.9).replace(".", ",")
export const upsYear = (x: Ups) => upsReplaced(x).split(".")[2] ?? "—"
export const upsCls = (x: Ups) => (String(x.f.cls) === "Онлайн" ? "Online" : String(x.f.cls ?? "Online"))
const kva = upsKva
const kw = upsKw
const replaced = upsReplaced
const cls = upsCls
const volt = (i: number) => (13.5 - ((i * 7) % 7) * 0.02 - (i % 3) * 0.02).toFixed(2)

/** Панель (ups-04-panel): ИБП с дисплеем, линия сеть → ИБП → нагрузка, батарейная линейка из 40 банок. */
export function UpsPanel({ x }: { x: Ups }) {
  const box =
    "relative flex items-center gap-5 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#17191f)] px-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#d9dce3)]"
  return (
    <div className="absolute inset-x-0 top-[30px] px-[2%] max-[1279px]:top-0">
      <div className="relative h-[100px]">
        <Note t="Дисплей ИБП" v={`${kva(x)} кВА · ${cls(x)}`} at={24} />
      </div>
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>{String(x.f.model)}</span>
        <span>S/N {String(x.f.serial ?? "—")}</span>
      </p>
      <div className={cn(box, "mt-2 h-[120px]")}>
        <span className="w-[130px] min-w-0 shrink">
          <b className="block text-sm font-semibold">ИБП</b>
          <span className="block truncate text-[11px] text-muted-foreground">{String(x.f.model)}</span>
        </span>
        <pre className="rounded-lg border border-[#1f6b3c] bg-[#06170d] px-3 py-2 font-mono text-[11px] leading-[1.6] text-[#5ee08b]">
          {`INPUT   230V 50.0Hz\nOUTPUT  230V  LOAD ${LOAD}%\nBATT    100%  ${BLOCKS} blk\nRUNTIME 18 min`}
        </pre>
        <span className="flex min-w-0 flex-1 items-center gap-3 text-[11px] text-muted-foreground">
          Сеть
          <i className="h-0.5 flex-1 rounded-full bg-[#2bd463]" />
          ИБП
          <i className="h-0.5 flex-1 rounded-full bg-[#2bd463]" />
          Нагрузка
        </span>
        <span className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className="h-3 w-5 rounded-[3px] bg-[#3a3f4b]" />
          ))}
        </span>
      </div>
      <div className={cn(box, "mt-4 py-3")}>
        <span className="w-[110px] flex-none">
          <b className="block text-sm font-semibold">АБ</b>
          <span className="text-[11px] text-muted-foreground">1x480 · 40 А·ч</span>
        </span>
        <span className="grid flex-1 grid-cols-[repeat(20,minmax(0,1fr))] gap-1">
          {Array.from({ length: BLOCKS }, (_, i) => (
            <span
              key={i}
              className={cn(
                "grid h-7 place-items-center rounded-[4px] border border-[#1f6b3c] bg-[#0b2416] font-mono text-[8.5px] text-[#9fe6b8]",
                (i === 7 || i === 23) && "border-[#a3801f] bg-[#2a2108] text-[#ffc53d]",
              )}
            >
              {volt(i)}
            </span>
          ))}
        </span>
      </div>
      <div className="relative mt-4 h-[80px]">
        <div className={cn(glass, "absolute top-0 left-[34%] rounded-2xl border-[#ff5257] px-4 py-2.5")}>
          <span className="block text-[11px] text-muted-foreground">Батарейная линейка</span>
          <b className="block text-sm font-semibold">замена АБ: {replaced(x)}</b>
        </div>
      </div>
    </div>
  )
}

/** Схема (ups-04-schema): вход сети → ИБП с дисплеем → нагрузка узла, батарейный блок. */
export function UpsFlow({ x }: { x: Ups }) {
  return (
    <div className="absolute inset-x-0 top-[50px] grid grid-cols-[1fr_260px_1fr] items-start gap-0 px-[2%] max-[1279px]:top-0">
      <div className="flex items-center pt-[30px]">
        <div className={cn(glass, "w-[150px] flex-none rounded-2xl px-5 py-4 text-center")}>
          <span className="block text-xs text-muted-foreground">Вход · сеть</span>
          <b className="block text-2xl font-semibold">230 В</b>
          <span className="text-[11px] text-[var(--status-ok)]">● 50,0 Гц</span>
        </div>
        <i className="h-[3px] flex-1 bg-[#2bd463]" />
      </div>
      <div className={cn(glass, "rounded-[22px] p-6 text-center")}>
        <b className="block text-base font-semibold">{String(x.f.model)}</b>
        <span className="text-[11px] text-muted-foreground">
          {kva(x)} кВА / {kw(x)} кВт · {cls(x)}
        </span>
        <div className="mt-5 rounded-xl border border-[#1f6b3c] bg-[#06170d] p-3 text-left font-mono text-[11px] text-[#9fe6b8]">
          <span className="flex justify-between text-[#5ee08b]">
            <span>● ONLINE</span>
            <span>230V</span>
          </span>
          {(
            [
              ["LOAD", LOAD, "#2bd463"],
              ["BATT", 100, "#4f8dff"],
            ] as const
          ).map(([t, v, c]) => (
            <span key={t} className="mt-2 flex items-center gap-3">
              <span className="w-9">{t}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#1d2027]">
                <i className="block h-full rounded-full" style={{ width: `${v}%`, background: c }} />
              </span>
            </span>
          ))}
          <span className="mt-2 block">AUTONOMY 18 MIN</span>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} className="h-1.5 rounded-full bg-[#1d2027]" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex items-center pt-[30px]">
          <i className="h-[3px] flex-1 bg-[#2bd463]" />
          <div className={cn(glass, "w-[180px] flex-none rounded-2xl px-5 py-4 text-center")}>
            <span className="block text-xs text-muted-foreground">Нагрузка узла</span>
            <b className="block text-2xl font-semibold">{((parseFloat(kw(x).replace(",", ".")) * LOAD) / 100).toFixed(2).replace(".", ",")} кВт</b>
            <span className="text-[11px] text-muted-foreground">СПД · АТС · РРЛ</span>
          </div>
        </div>
        <div className="flex items-center">
          <i className="h-[3px] w-10 flex-none border-t-[3px] border-dashed border-[#4f8dff]" />
          <div className={cn(glass, "flex-1 rounded-2xl p-4")}>
            <b className="mb-3 block text-sm font-semibold">Батарейный блок · 8 × 12 В · 9 А·ч</b>
            <span className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <span
                  key={i}
                  className="grid h-14 place-items-center rounded-lg border border-[#1f6b3c] bg-[#0b2416] text-xs text-[#9fe6b8]"
                >
                  {(13.4 - Math.floor(i / 2) * 0.1).toFixed(1)}
                </span>
              ))}
            </span>
            <span className="mt-3 block text-[11px] text-muted-foreground">Последняя замена АБ: {replaced(x)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

