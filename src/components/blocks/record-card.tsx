import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Bar, btn, Check, Pill, Tag, type Tone } from "@/components/list/ui"
import { cn } from "@/lib/utils"
import { RowActions } from "./table"

/** Сетка карточек; пустая — `empty` (обычно NothingFound). */
export function CardGrid({ empty, children }: { empty?: React.ReactNode; children: React.ReactNode }) {
  if (empty) return empty
  return <div className="mt-[18px] grid grid-cols-4 gap-4 max-[1500px]:grid-cols-3 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">{children}</div>
}

/** Вид «Карточки» (экран n-01): фото со статусом, название, теги, полоса, действия и «Паспорт». */
export function RecordCard({
  href,
  photo,
  status,
  title,
  sub,
  tags,
  bar,
  open = "Паспорт",
  selected,
  onSelect,
  onQr,
  onEdit,
  onDelete,
}: {
  href: string
  photo?: string
  status: { label: string; tone: Tone }
  title: string
  sub: string
  tags?: string[]
  /** Полоса внизу карточки: «Волокна 3/32». */
  bar?: { t: string; v: string; pct: number }
  /** Подпись кнопки перехода */
  open?: string
  selected: boolean
  onSelect: () => void
  onQr?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-[var(--glass-card)] backdrop-blur-[18px] transition-[transform,box-shadow] duration-250 hover:-translate-y-0.5",
        selected && "border-[#085eff] shadow-[0_0_0_1px_#085eff]",
      )}
    >
      <div className="relative h-[130px] bg-[var(--feat-bg)]">
        {photo && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,var(--glass-card-solid))]" />
        <Pill tone={status.tone} className="absolute top-3 left-3 bg-[rgba(10,11,14,0.6)] backdrop-blur">
          {status.label}
        </Pill>
        <span className="absolute top-3 right-3 [&_button]:bg-[rgba(10,11,14,0.4)]">
          <Check on={selected} label="Выбрать" onClick={onSelect} />
        </span>
      </div>
      <div className="flex flex-1 flex-col px-4 pt-2 pb-4">
        <b className="truncate text-base font-semibold">{title}</b>
        <span className="mt-1 truncate text-[12.5px] text-muted-foreground">{sub}</span>
        {tags && (
          <span className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </span>
        )}
        {bar && (
          <>
            <span className="mt-3 flex justify-between text-[12.5px] text-muted-foreground">
              {bar.t}
              <b className="font-medium text-foreground tabular-nums">{bar.v}</b>
            </span>
            <Bar pct={bar.pct} className="mt-2 h-1" />
          </>
        )}
        <div className="mt-4 flex items-center gap-1.5">
          <RowActions onQr={onQr} onEdit={onEdit} onDelete={onDelete} />
          <Link href={href} className={cn(btn({ sm: true }), "ml-auto")}>
            <ArrowRight />
            {open}
          </Link>
        </div>
      </div>
    </article>
  )
}
