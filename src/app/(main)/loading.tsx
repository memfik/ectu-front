import { RefreshCw } from "lucide-react"

/** Загрузка раздела (макет 39, st-loading): скелет шапки, KPI и таблицы, плашка «Загрузка данных…». */
export default function Loading() {
  const sk = "animate-pulse rounded-2xl bg-[var(--chip-bg)]"
  return (
    <div className="px-(--page-gutter) pt-8" aria-busy>
      <div className={`${sk} h-14 w-[420px] max-w-full`} />
      <div className="mt-6 grid grid-cols-5 gap-3.5 max-sm:grid-cols-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-3xl border border-border p-5">
            <div className={`${sk} h-3 w-2/3`} />
            <div className={`${sk} mt-4 h-6 w-1/3`} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 rounded-3xl border border-border p-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className={`${sk} h-11 rounded-xl`} style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
      <span className="fixed right-8 bottom-8 flex items-center gap-2 rounded-2xl border border-border bg-[var(--dd-bg)] px-4 py-2.5 text-[13px] shadow-[var(--dd-shadow)]">
        <RefreshCw className="size-4 animate-spin" />
        Загрузка данных…
      </span>
    </div>
  )
}
