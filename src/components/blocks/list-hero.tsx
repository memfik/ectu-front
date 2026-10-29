import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { Bar, btn } from "@/components/list/ui"
import { fmt } from "@/lib/list/query"

/*
 * Шапка раздела-списка (макет 02, «Список узлов»): фон с картинкой раздела, крошка, заголовок с числом записей,
 * подзаголовок и кнопки справа; под ней — ряд KPI, наезжающий на фон.
 */

export function ListHero({
  crumb,
  title,
  total,
  sub,
  hero,
  children,
}: {
  crumb: string
  title: string
  total: number
  sub: string
  /** Картинка справа в шапке */
  hero?: string
  /** Кнопки шапки — HeroButton */
  children?: React.ReactNode
}) {
  return (
    <section className="relative -mt-[96px] h-[470px] max-[1279px]:h-auto max-[1279px]:pb-2">
      {/* фон на всю ширину окна, уходит под шапку, как в макете */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(800px_400px_at_20%_30%,rgba(8,94,255,0.14),transparent_70%)]" />
      {hero && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-[position:70%_30%] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.35)_25%,#000_60%)] max-[1279px]:opacity-35 not-dark:opacity-50"
          style={{ backgroundImage: `url(${hero})` }}
        />
      )}
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[220px] bg-[linear-gradient(180deg,transparent,var(--background))]" />

      <div className="flex flex-wrap items-end gap-5 px-(--page-gutter) pt-[150px] max-[1279px]:pt-[120px] max-sm:pt-[110px]">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{crumb}</p>
          <h1 className="mt-1.5 text-[60px] leading-[1.05] font-semibold tracking-[-1.6px] whitespace-nowrap max-[1279px]:text-[40px] max-sm:text-[30px] max-sm:whitespace-normal">
            {title}
            <em className="ml-2.5 text-[42px] font-normal tracking-[-1px] text-muted-foreground not-italic tabular-nums max-[1279px]:text-[30px] max-sm:text-[22px]">
              {fmt(total)}
            </em>
          </h1>
          <p className="mt-2 text-[15px] text-[var(--nav-text)]">{sub}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2.5 max-sm:ml-0">{children}</div>
      </div>
    </section>
  )
}

/** Кнопка шапки: ссылка (`href`) или действие (`onClick`). */
export function HeroButton({
  icon: Icon,
  label,
  primary,
  href,
  onClick,
}: {
  icon: LucideIcon
  label: string
  primary?: boolean
  href?: string
  onClick?: () => void
}) {
  if (href)
    return (
      <Link href={href} className={btn({ primary })}>
        <Icon />
        {label}
      </Link>
    )
  return (
    <button type="button" onClick={onClick} className={btn({ primary })}>
      <Icon />
      {label}
    </button>
  )
}

/** Ряд KPI под шапкой: до 6 карточек, наезжает на фон шапки. */
export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-[1] -mt-[148px] grid grid-cols-6 gap-3.5 px-(--page-gutter) max-[1500px]:grid-cols-3 max-sm:grid-cols-2 max-sm:gap-2.5 max-[1279px]:mt-4">
      {children}
    </div>
  )
}

/** KPI: точка цвета, подпись, число с пометкой справа («94%», «568 / 569») и полоса заполнения (0…100). */
export function KpiCard({ t, color, value, note, pct }: { t: string; color: string; value: string; note?: string; pct: number }) {
  return (
    <div className="rounded-3xl border border-border bg-[var(--glass-card)] px-5 py-[18px] backdrop-blur-[18px] max-sm:px-3.5 max-sm:py-3">
      <div className="flex items-center gap-2 text-[13px] whitespace-nowrap text-muted-foreground">
        <i className="size-[7px] flex-none rounded-full" style={{ background: color }} />
        <span className="truncate">{t}</span>
      </div>
      <b className="mt-2 block text-[30px] leading-tight font-medium tracking-[-0.02em] whitespace-nowrap tabular-nums max-sm:text-2xl">
        {value}
        {note && <em className="ml-1.5 text-[13px] font-normal text-muted-foreground not-italic">{note}</em>}
      </b>
      <Bar pct={pct} color={color} className="mt-2.5 h-[5px]" />
    </div>
  )
}
