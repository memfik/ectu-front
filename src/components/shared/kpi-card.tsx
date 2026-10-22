import { GlassWidget } from "@/components/ui/opaline/glass-widget"

/** KPI на GlassWidget; фиксированные размеры виджета переопределены под сетку. */
export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <GlassWidget className="h-auto min-h-[132px] w-full justify-between gap-2 rounded-3xl p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div>
        <div className="tabular text-3xl font-semibold">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </GlassWidget>
  )
}
