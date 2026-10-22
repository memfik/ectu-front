import { cn } from "@/lib/utils"
import { glass } from "./ui"

/*
 * Передняя панель шасси с платами (АТС, PDH, SDH, DWDM — экраны *-04-panel): корпус 19", платы в слотах
 * с индикаторами, подписи-выноски над и под корпусом.
 */

export type Slot = { label: string; led?: "ok" | "warn" | "bad" | "off"; on?: boolean; ports?: number }
export type Callout = { t: string; v: string; pct?: number; at: number; below?: boolean }

const LED = { ok: "#2bd463", warn: "#ffc53d", bad: "#ff3b3b", off: "#3a3f4b" }

export function Chassis({
  title,
  sub,
  left,
  right,
  slots,
  callouts,
}: {
  title: string
  sub: string
  /** Подписи над корпусом слева и справа */
  left: string
  right: string
  slots: Slot[]
  callouts: Callout[]
}) {
  return (
    <div className="absolute inset-x-0 top-[50px] px-[2%] max-[1279px]:top-0">
      <div className="relative h-[110px]">
        {callouts
          .filter((c) => !c.below)
          .map((c) => (
            <Note key={c.t} c={c} />
          ))}
      </div>
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>{left}</span>
        <span>{right}</span>
      </p>
      <div className="relative mt-2 flex h-[244px] items-stretch gap-4 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#17191f)] px-5 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.5)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#d9dce3)]">
        <i className="absolute top-4 -left-3 h-[calc(100%-32px)] w-2.5 rounded bg-[var(--chip-bg)]" />
        <i className="absolute top-4 -right-3 h-[calc(100%-32px)] w-2.5 rounded bg-[var(--chip-bg)]" />
        <span className="w-[130px] flex-none self-center">
          <b className="block text-sm font-semibold">{title}</b>
          <span className="text-[11px] text-muted-foreground">{sub}</span>
          <span className="mt-2 grid w-fit grid-cols-[8px_auto_8px_auto] items-center gap-x-1.5 gap-y-1 text-[8px] text-muted-foreground">
            <i className="size-2 rounded-full bg-[#2bd463]" />
            PWR
            <i className="size-2 rounded-full bg-[#ffc53d]" />
            ALM
            <i className="size-2 rounded-full bg-[#2bd463]" />
            SYS
            <i className="size-2 rounded-full bg-[#3a3f4b]" />
            MAJ
          </span>
        </span>
        <span className="flex flex-1 gap-1">
          {slots.map((s, i) => (
            <span
              key={i}
              title={s.label}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-2 rounded-md border border-[#3a3f4b] bg-[#14161b] pt-3 not-dark:bg-[#e9ebf0]",
                s.on && "self-start border-[#2f6bff] pb-3 shadow-[0_0_0_2px_rgba(47,107,255,0.35)]",
                s.led === undefined &&
                  "border-dashed bg-[repeating-linear-gradient(90deg,transparent_0_3px,rgba(255,255,255,0.04)_3px_4px)]",
              )}
            >
              {s.led !== undefined && (
                <>
                  <i className="size-[7px] rounded-full" style={{ background: LED[s.led], boxShadow: `0 0 6px ${LED[s.led]}` }} />
                  <i className="size-[7px] rounded-full" style={{ background: s.led === "off" ? LED.off : "#2bd463" }} />
                  <span className="text-[8px] font-semibold tracking-[0.5px] whitespace-nowrap text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                    {s.label}
                  </span>
                  {Array.from({ length: s.ports ?? 2 }, (_, j) => (
                    <i key={j} className="h-2.5 w-[60%] max-w-[22px] rounded-[2px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]" />
                  ))}
                </>
              )}
            </span>
          ))}
        </span>
      </div>
      <div className="relative mt-[70px] h-[80px]">
        {callouts
          .filter((c) => c.below)
          .map((c) => (
            <Note key={c.t} c={c} />
          ))}
      </div>
    </div>
  )
}

function Note({ c }: { c: Callout }) {
  return (
    <div className={cn(glass, "absolute w-fit rounded-2xl px-4 py-2.5", c.below ? "top-0" : "bottom-2")} style={{ left: `${c.at}%` }}>
      <span className="block text-[11px] text-muted-foreground">{c.t}</span>
      <b className="block text-sm font-semibold whitespace-nowrap">{c.v}</b>
      {c.pct !== undefined && (
        <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-[var(--chip-bg)]">
          <i className="block h-full bg-[#085eff]" style={{ width: `${c.pct}%` }} />
        </span>
      )}
    </div>
  )
}

/** Схема ёмкости (ats-04-schema и др.): строки «подпись — полоса — занято / всего». */
export function CapacityBars({ title, rows, note }: { title: string; rows: { t: string; a: number; b: number }[]; note?: string }) {
  const max = Math.max(...rows.map((r) => r.b), 1)
  return (
    <div className="absolute inset-x-0 top-[120px] px-[6%] max-[1279px]:top-0">
      <p className="mb-6 text-[13px] text-muted-foreground">{title}</p>
      <div className="flex flex-col gap-6">
        {rows.map((r) => (
          <div key={r.t} className="grid grid-cols-[150px_1fr] items-center gap-4">
            <b className="text-sm font-semibold">{r.t}</b>
            <span className="flex items-center gap-3">
              <span
                className="relative h-6 overflow-hidden rounded-md bg-[var(--chip-bg)]"
                style={{ width: `${Math.max(2, (r.b / max) * 100)}%` }}
              >
                <i className="absolute inset-y-0 left-0 rounded-md bg-[#0d5bff]" style={{ width: `${r.b ? (r.a / r.b) * 100 : 0}%` }} />
              </span>
              <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {r.a} / {r.b}
              </span>
            </span>
          </div>
        ))}
      </div>
      {note && <p className="mt-8 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  )
}

export type PortGroup = { label: string; ports: ("up" | "warn" | "free")[] }

/** Корпус 1U (pdh-04-panel): порты группами, решётка, оптический линк и порт управления. */
export function Unit1U({
  title,
  sub,
  left,
  right,
  groups,
  callouts,
}: {
  title: string
  sub: string
  left: string
  right: string
  groups: PortGroup[]
  callouts: Callout[]
}) {
  return (
    <div className="absolute inset-x-0 top-[50px] px-[2%] max-[1279px]:top-0">
      <div className="relative h-[110px]">
        {callouts
          .filter((c) => !c.below)
          .map((c) => (
            <Note key={c.t} c={c} />
          ))}
      </div>
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>{left}</span>
        <span>{right}</span>
      </p>
      <div className="relative mt-2 flex h-[96px] items-center gap-5 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#17191f)] px-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#d9dce3)]">
        <i className="absolute top-3 -left-3 h-[calc(100%-24px)] w-2.5 rounded bg-[var(--chip-bg)]" />
        <i className="absolute top-3 -right-3 h-[calc(100%-24px)] w-2.5 rounded bg-[var(--chip-bg)]" />
        <span className="w-[100px] flex-none">
          <b className="block text-sm font-semibold">{title}</b>
          <span className="text-[11px] text-muted-foreground">{sub}</span>
          <span className="mt-1 grid w-fit grid-cols-[8px_8px_auto_auto] items-center gap-x-1.5 text-[7px] text-muted-foreground">
            <i className="size-2 rounded-full bg-[#2bd463]" />
            <i className="size-2 rounded-full bg-[#3a3f4b]" />
            PWR
            <span>ALM</span>
          </span>
        </span>
        {groups.map((g) => (
          <span key={g.label} className="flex flex-col items-center gap-1">
            <span className="flex gap-1.5">
              {g.ports.map((p, i) => (
                <span key={i} className="flex flex-col items-center gap-0.5">
                  <span className="relative grid h-[38px] w-8 place-items-center rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]">
                    <i
                      className="absolute top-1 left-1 size-1.5 rounded-full"
                      style={{ background: p === "free" ? "#3a3f4b" : "#2bd463" }}
                    />
                    <i
                      className="absolute top-1 right-1 size-1.5 rounded-full"
                      style={{ background: p === "warn" ? "#ffc53d" : p === "up" ? "#ffc53d" : "#3a3f4b" }}
                    />
                    <i className="mt-2 h-3 w-4 rounded-[2px] bg-[#1d2027]" />
                  </span>
                  <span className="text-[8px] text-muted-foreground">{i + 1}</span>
                </span>
              ))}
            </span>
            <span className="text-[8px] tracking-[0.5px] text-muted-foreground">{g.label}</span>
          </span>
        ))}
        <span className="h-[52px] flex-1 rounded-md bg-[repeating-linear-gradient(90deg,#0b0c10_0_3px,#2a2d35_3px_6px)] opacity-80" />
        <span className="flex flex-col items-center gap-1">
          <span className="flex gap-2">
            {[0, 1].map((i) => (
              <i key={i} className="grid size-6 place-items-center rounded-full border-2 border-[#4f8dff] bg-[#0b0c10]">
                <i className="size-2 rounded-full bg-[#4f8dff]" />
              </i>
            ))}
          </span>
          <span className="text-[8px] tracking-[0.5px] text-muted-foreground">FIBER LINK</span>
        </span>
        <span className="flex flex-col items-center gap-1">
          <i className="h-7 w-10 rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]" />
          <span className="text-[8px] tracking-[0.5px] text-muted-foreground">CONTROL</span>
        </span>
      </div>
    </div>
  )
}
