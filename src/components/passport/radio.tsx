import { cn } from "@/lib/utils"
import { glass } from "./ui"

/*
 * Радиорелейные линии и радиомосты (макеты 25, 26): панель «блок в помещении + радиоблок на мачте»
 * и схема пролёта между двумя мачтами с частотами.
 */

const BOX =
  "relative flex items-center gap-5 rounded-xl border border-border bg-[linear-gradient(180deg,#2a2d35,#17191f)] px-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] not-dark:bg-[linear-gradient(180deg,#f3f4f7,#d9dce3)]"

function Port({ on }: { on: boolean }) {
  return (
    <span className="relative grid h-[38px] w-8 place-items-center rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]">
      <i className="absolute top-1 left-1 size-1.5 rounded-full" style={{ background: on ? "#2bd463" : "#3a3f4b" }} />
      <i className="absolute top-1 right-1 size-1.5 rounded-full" style={{ background: on ? "#ffc53d" : "#3a3f4b" }} />
      <i className="mt-2 h-3 w-4 rounded-[2px] bg-[#1d2027]" />
    </span>
  )
}

export function Note({ t, v, pct, at }: { t: string; v: string; pct?: number; at: number }) {
  return (
    <div className={cn(glass, "absolute bottom-2 w-fit rounded-2xl px-4 py-2.5")} style={{ left: `${at}%` }}>
      <span className="block text-[11px] text-muted-foreground">{t}</span>
      <b className="block text-sm font-semibold whitespace-nowrap">{v}</b>
      {pct !== undefined && (
        <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-[var(--chip-bg)]">
          <i className="block h-full bg-[#085eff]" style={{ width: `${pct}%` }} />
        </span>
      )}
    </div>
  )
}

/** Панель: блок в помещении (порты, E1, разъём радио) и радиоблок с уровнем сигнала. */
export function RadioPanel({
  left,
  right,
  indoor,
  outdoor,
  notes,
}: {
  left: string
  right: string
  /** Блок в помещении: подпись, модель, группы портов (вкл. / выкл.), есть ли E1 и разъём ODU */
  indoor: { t: string; sub: string; groups: { label: string; ports: boolean[] }[]; e1?: boolean; odu?: boolean }
  /** Радиоблок: подпись, частоты, строки монитора, подписи концов */
  outdoor: { t: string; sub: string; lines: string[]; from: string; to: string; len: string }
  notes: { t: string; v: string; pct?: number; at: number }[]
}) {
  return (
    <div className="absolute inset-x-0 top-[30px] px-[2%] max-[1279px]:top-0">
      <div className="relative h-[100px]">
        {notes.map((n) => (
          <Note key={n.t} {...n} />
        ))}
      </div>
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>{left}</span>
        <span>{right}</span>
      </p>
      <div className={cn(BOX, "mt-2 h-[100px]")}>
        <span className="w-[130px] flex-none">
          <b className="block text-sm font-semibold">{indoor.t}</b>
          <span className="block truncate text-[11px] text-muted-foreground">{indoor.sub}</span>
        </span>
        {indoor.groups.map((g) => (
          <span key={g.label} className="flex flex-col items-center gap-1">
            <span className="flex gap-1.5">
              {g.ports.map((on, i) => (
                <Port key={i} on={on} />
              ))}
            </span>
            <span className="text-[8px] tracking-[0.5px] text-muted-foreground">{g.label}</span>
          </span>
        ))}
        {indoor.e1 && (
          <span className="flex flex-col items-center gap-1">
            <i className="h-[38px] w-[140px] rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]" />
            <span className="text-[8px] tracking-[0.5px] text-muted-foreground">E1 · 16×</span>
          </span>
        )}
        <span className="h-[52px] flex-1 rounded-md bg-[repeating-linear-gradient(90deg,#0b0c10_0_3px,#2a2d35_3px_6px)] opacity-80" />
        {indoor.odu && (
          <>
            <span className="flex flex-col items-center gap-1">
              <i className="grid size-9 place-items-center rounded-full border-2 border-[#4f8dff] bg-[#0b0c10] shadow-[0_0_14px_rgba(79,141,255,0.6)]">
                <i className="size-3 rounded-full bg-white" />
              </i>
              <span className="text-[8px] tracking-[0.5px] text-muted-foreground">ODU · IF</span>
            </span>
            <span className="flex flex-col items-center gap-1">
              <i className="h-7 w-9 rounded-[4px] bg-[#0b0c10] ring-1 ring-[#3a3f4b]" />
              <span className="text-[8px] text-muted-foreground">-48V</span>
            </span>
          </>
        )}
      </div>
      <div className={cn(BOX, "mt-4 h-[120px]")}>
        <span className="w-[150px] flex-none">
          <b className="block text-sm font-semibold">{outdoor.t}</b>
          <span className="text-[11px] text-muted-foreground">{outdoor.sub}</span>
        </span>
        <pre className="rounded-lg border border-[#2f6bff] bg-[#0a1430] px-3 py-2 font-mono text-[11px] leading-[1.6] text-[#7fb0ff]">
          {outdoor.lines.join("\n")}
        </pre>
        <span className="flex flex-1 items-center gap-3 text-[11px] text-muted-foreground">
          {outdoor.from}
          <i className="h-0.5 flex-1 rounded-full bg-[#2bd463]" />
          {outdoor.len}
          <i className="h-0.5 flex-1 rounded-full bg-[#2bd463]" />
          {outdoor.to}
        </span>
      </div>
    </div>
  )
}

function Mast({ x, top }: { x: number; top: number }) {
  const w = 34
  return (
    <g stroke="#c8ccd4" strokeWidth="2" fill="none">
      <path d={`M${x - w} 430 L${x - 6} ${top} M${x + w} 430 L${x + 6} ${top}`} />
      {Array.from({ length: Math.floor((430 - top) / 34) }, (_, i) => {
        const a = 430 - i * 34
        const b = a - 34
        const half = (y: number) => 6 + ((y - top) / (430 - top)) * (w - 6)
        return (
          <g key={i}>
            <line x1={x - half(a)} y1={a} x2={x + half(b)} y2={b} />
            <line x1={x + half(a)} y1={a} x2={x - half(b)} y2={b} />
          </g>
        )
      })}
      <circle cx={x} cy={top + 6} r="20" fill="#e8eaee" stroke="#9aa0ab" />
    </g>
  )
}

/** Пролёт (rrl-04-schema, rb-04-schema): две мачты, дуга с Tx1 / Tx2, длина и пропускная способность. */
export function RadioSpan({
  len,
  bw,
  label,
  tx,
  a,
  b,
}: {
  len: string
  bw: string
  label: string
  tx: [number, number]
  a: string
  b: string
}) {
  return (
    <div className="absolute inset-x-0 top-[60px] flex justify-center max-[1279px]:top-0">
      <svg viewBox="0 0 900 500" className="h-[500px] w-auto max-w-full" fill="none" fontFamily="inherit">
        <path d="M120 170 Q450 40 780 220" stroke="#4f8dff" strokeWidth="3" strokeDasharray="10 8" />
        <rect x="390" y="78" width="180" height="34" rx="17" fill="var(--glass-card-solid)" stroke="var(--border)" />
        <text x="480" y="100" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--foreground)">
          {len}
        </text>
        <text x="190" y="128" fontSize="12" fill="#22d3ee">
          Tx1 {tx[0].toLocaleString("ru-RU")} MHz →
        </text>
        <text x="610" y="170" fontSize="12" fill="#a78bfa">
          ← Tx2 {tx[1].toLocaleString("ru-RU")} MHz
        </text>
        <Mast x={120} top={150} />
        <Mast x={780} top={200} />
        <rect x="340" y="290" width="240" height="80" rx="18" fill="var(--glass-card-solid)" stroke="var(--border)" />
        <text x="460" y="318" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
          {label}
        </text>
        <text x="460" y="350" textAnchor="middle" fontSize="24" fontWeight="600" fill="var(--foreground)">
          {bw}
        </text>
        {(
          [
            [120, "Точка #1", a],
            [780, "Точка #2", b],
          ] as const
        ).map(([cx, t, sub]) => (
          <g key={t}>
            <text x={cx} y="462" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--foreground)">
              {t}
            </text>
            <text x={cx} y="482" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
              {sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
