import type { Strand } from "@/lib/api/lines"

/*
 * Схема мачты паспорта АМС (ams-04-schema): шкала высоты, решётка, площадки и что на них стоит.
 * Площадки — жилы паспорта линии (a — занята).
 */

/** Высоты площадок: 20 / 30 / 40 м для 42-метровой мачты. */
export const mastLevels = (h: number, n: number) => Array.from({ length: n }, (_, i) => Math.round((h * (0.48 + i * 0.24)) / 5) * 5)

/** Что стоит на площадках снизу вверх; занятые — верхние. */
const LOAD = ["БС GSM · 3 сектора", "РРЛ Ø0,6 → УС-8", "4 сектора LTE · 2 РРЛ"]

export function MastTower({ h, strands }: { h: number; strands: Strand[] }) {
  const lv = mastLevels(h, strands.length)
  const y = (m: number) => 470 - (m / h) * 450
  const ticks = [...[0, 10, 20, 30, 40, 50, 60].filter((t) => t < h - 3), h]
  return (
    <div className="absolute inset-x-0 top-[70px] flex justify-center max-[1279px]:top-0">
      <svg viewBox="0 0 640 500" className="h-[540px] w-auto max-w-full" fill="none">
        <line x1="70" y1={y(h)} x2="70" y2="470" stroke="var(--border)" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1="62" x2="100" y1={y(t)} y2={y(t)} stroke="var(--border)" />
            <text x="40" y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
              {t} м
            </text>
          </g>
        ))}
        {/* решётка: ноги сходятся к верху, раскосы между поясами */}
        <path d={`M140 470 L195 ${y(h) + 10} M250 470 L205 ${y(h) + 10}`} stroke="#8a93a6" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = 470 - i * 36
          const b = a - 36
          const w = (yy: number) => 55 - ((470 - yy) / 450) * 45
          return (
            <g key={i} stroke="#6b7385" strokeWidth="1.2">
              <line x1={195 - w(a)} y1={a} x2={195 + w(b)} y2={b} />
              <line x1={195 + w(a)} y1={a} x2={195 - w(b)} y2={b} />
              <line x1={195 - w(b)} y1={b} x2={195 + w(b)} y2={b} />
            </g>
          )
        })}
        <rect x="120" y="470" width="150" height="9" rx="2" fill="#3a3f4b" />
        <circle cx="200" cy={y(h) - 4} r="5" fill="#ff3b3b" />
        <circle cx="200" cy={y(h) - 4} r="11" fill="#ff3b3b" opacity="0.25" />
        {lv.map((m, i) => (
          <g key={i}>
            <rect x="150" y={y(m) - 4} width="100" height="8" rx="2" fill="#2f6bff" />
            <line x1="252" x2="345" y1={y(m)} y2={y(m)} stroke="#4f8dff" strokeDasharray="3 4" />
            <rect x="345" y={y(m) - 24} width="250" height="48" rx="12" fill="var(--glass-card-solid)" stroke="var(--border)" />
            <text x="361" y={y(m) - 6} fontSize="10.5" fill="var(--muted-foreground)">
              Площадка {i + 1} · {m} м
            </text>
            <text x="361" y={y(m) + 12} fontSize="13" fontWeight="600" fill="var(--foreground)">
              {strands[strands.length - 1 - i] === "free" ? "свободна" : LOAD[Math.min(i, LOAD.length - 1)]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
