import { GlassBadge } from "@/components/ui/opaline/glass-badge"

const STATUS = {
  ok: { label: "Работает", color: "var(--status-ok)" },
  nolink: { label: "Нет линка", color: "var(--status-nolink)" },
  alarm: { label: "Авария", color: "var(--status-alarm)" },
  reserve: { label: "Резерв", color: "var(--status-reserve)" },
} as const

export type Status = keyof typeof STATUS

export function StatusPill({ status, label }: { status: Status; label?: string }) {
  const s = STATUS[status]
  return <GlassBadge dot={s.color}>{label ?? s.label}</GlassBadge>
}
