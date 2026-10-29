"use client"

import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, ChevronLeft, Copy, Download, FileText, Link as LinkIcon, Map as MapIcon, Maximize2, Pencil, QrCode, Trash2, Waypoints } from "lucide-react"
import { btn, circ, Pill, type Tone } from "@/components/list/ui"
import { Avatar, Card, glass, Kv } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { cn } from "@/lib/utils"

/*
 * Паспорт записи (линии 07–09, оборудование 10–37): верх со сценой (3D / схема / карта / фото) и тремя колонками,
 * полоса вкладок, содержимое вкладки. Страница раздела сама собирает паспорт из этих блоков.
 */

export const PassportLoading = () => <div className="px-(--page-gutter) py-24 text-center text-muted-foreground">Загрузка паспорта…</div>

/** Верх паспорта: на «Обзоре» (`full`) — высокий, с фоном-сценой `backdrop`; на других вкладках — только шапка. */
export function PassportTop({ full, backdrop, children }: { full: boolean; backdrop: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={cn("relative -mt-[96px] overflow-hidden pt-[112px]", full ? "min-h-[910px] max-[1279px]:min-h-0 max-[1279px]:pb-6" : "pb-6")}>
      {full ? backdrop : <div aria-hidden className="absolute inset-0 bg-[radial-gradient(900px_300px_at_60%_0%,rgba(0,26,159,0.45),transparent_70%)]" />}
      {children}
    </section>
  )
}

/**
 * Шапка: «назад», крошки «Группа / Раздел / Паспорт», название с копированием, статус и плашка,
 * цифры (`children` — PassportStat), QR, «На карту сети», «Редактировать», «Удалить».
 */
export function PassportHeader({
  crumb,
  listHref,
  listTitle,
  title,
  status,
  pill,
  mapHref,
  onQr,
  onEdit,
  onDelete,
  children,
}: {
  crumb: string
  listHref: string
  listTitle: string
  title: string
  status: { label: string; tone: Tone }
  pill?: string
  mapHref: string
  onQr: () => void
  /** Без правки и удаления — раздел только для чтения */
  onEdit?: () => void
  onDelete?: () => void
  children?: React.ReactNode
}) {
  const router = useRouter()
  return (
    <header className="pointer-events-none relative z-[2] flex items-center gap-x-[18px] gap-y-4 px-(--page-gutter) max-[1700px]:flex-wrap [&>*]:pointer-events-auto">
      <button type="button" onClick={() => router.push(listHref)} className={cn(circ, "size-[54px] [&_svg]:size-5")} aria-label="Назад к списку">
        <ChevronLeft />
      </button>
      <div className="min-w-[min(100%,420px)] flex-1">
        <p className="truncate text-sm text-[var(--nav-text)]">
          {crumb} /{" "}
          <Link href={listHref} className="hover:text-foreground">
            {listTitle}
          </Link>{" "}
          / Паспорт
        </p>
        <h1 className="mt-1 flex items-center gap-3 text-4xl font-semibold tracking-[-0.6px] max-[1279px]:flex-wrap max-sm:text-[26px]">
          <span className="min-w-0 truncate" title={title}>
            {title}
          </span>
          <button
            type="button"
            aria-label="Скопировать"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigator.clipboard?.writeText(title).then(() => toast("Скопировано"))}
          >
            <Copy className="size-5" />
          </button>
          <Pill tone={status.tone} className="flex-none">
            {status.label}
          </Pill>
          {pill && (
            <span className="inline-flex h-[26px] flex-none items-center rounded-full whitespace-nowrap bg-[var(--chip-bg)] px-2.5 text-xs font-semibold">{pill}</span>
          )}
        </h1>
      </div>
      <div className="flex flex-none flex-wrap gap-x-[26px] gap-y-3 max-[1700px]:order-last max-[1700px]:basis-full max-[1700px]:pl-[72px] max-sm:pl-0">{children}</div>
      <div className="ml-auto flex flex-none gap-2.5">
        <button type="button" className={cn(circ, "size-11")} title="QR-код" onClick={onQr}>
          <QrCode />
        </button>
        <Link href={mapHref} className={btn()}>
          <MapIcon />
          На карту сети
        </Link>
        {onEdit && (
          <button type="button" className={btn({ primary: true })} onClick={onEdit}>
            <Pencil />
            Редактировать
          </button>
        )}
        {onDelete && (
          <button type="button" aria-label="Удалить" onClick={onDelete} className={cn(circ, "size-11 text-[#ff5257] hover:border-[#ff3b30] hover:bg-[#ff3b30]")}>
            <Trash2 />
          </button>
        )}
      </div>
    </header>
  )
}

/** Цифра в шапке: значок, подпись, число с пометкой («41,2 км»). */
export function PassportStat({ icon: Icon, t, v, em }: { icon: LucideIcon; t: string; v: React.ReactNode; em?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn(circ, "size-11 cursor-default hover:border-border hover:bg-[var(--chip-bg)] hover:text-[var(--nav-text)]")}>
        <Icon />
      </span>
      <span>
        <span className="block text-[12.5px] whitespace-nowrap text-[var(--nav-text)]">{t}</span>
        <b
          className={cn(
            "text-[28px] leading-tight font-medium tracking-[-0.5px] whitespace-nowrap tabular-nums",
            // длинный текст («Демонтирована») — мельче, чтобы шапка не переносилась
            typeof v === "string" && v.length > 9 && "text-xl",
          )}
        >
          {v}
          {em && <em className="ml-1.5 text-xs font-normal text-muted-foreground not-italic">{em}</em>}
        </b>
      </span>
    </div>
  )
}

/** Три колонки «Обзора»: паспорт слева, сцена по центру, связанное справа. */
export function PassportColumns({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none relative z-[2] mt-7 grid grid-cols-[400px_1fr_400px] gap-[18px] px-(--page-gutter) max-[1500px]:grid-cols-[360px_1fr_360px] max-[1279px]:grid-cols-1 [&>*]:pointer-events-auto">
      {children}
    </div>
  )
}

/** «Паспорт» — поля записи; ⤢ — открыть форму со всеми полями. */
export function PassportCard({ rows, onAll }: { rows: { t: string; v: React.ReactNode }[]; onAll?: () => void }) {
  return (
    <Card
      icon={Waypoints}
      title="Паспорт"
      className="self-start"
      action={
        onAll && (
          <button type="button" className={circ} title="Все поля" onClick={onAll}>
            <Maximize2 />
          </button>
        )
      }
    >
      <Kv rows={rows} />
    </Card>
  )
}

/** Центр «Обзора»: сцена и переключатель снизу. */
export function StageArea({ children }: { children: React.ReactNode }) {
  return <div className="relative min-h-[640px] max-[1279px]:min-h-[420px]">{children}</div>
}

/** 3D / Схема / Карта / Фото. */
export function StageSwitch<K extends string>({ items, value, onChange }: { items: [K, string, LucideIcon][]; value: K; onChange: (k: K) => void }) {
  return (
    <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-[rgba(18,20,25,0.84)] p-[5px] backdrop-blur-[12px] not-dark:bg-white/90">
      {items.map(([k, t, I]) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => onChange(k)}
          className={cn("flex h-[38px] items-center gap-[7px] rounded-full px-4 text-[13.5px] whitespace-nowrap text-[var(--nav-text)]", value === k && "bg-[#085eff] font-semibold text-white")}
        >
          <I className="size-4" />
          {t}
        </button>
      ))}
    </div>
  )
}

/** Сцена «Фото»: «Открыть галерею» и миниатюры. */
export function PhotoStrip({ media, onOpen }: { media: string[]; onOpen: (i: number) => void }) {
  return (
    <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-4">
      <button type="button" className={btn({ primary: true })} onClick={() => onOpen(0)}>
        <Maximize2 />
        Открыть галерею
      </button>
      <div className="flex gap-2.5">
        {media.slice(0, 6).map((src, i) => (
          <button
            type="button"
            key={i}
            onClick={() => onOpen(i)}
            aria-label={`Фото ${i + 1}`}
            className={cn("h-[62px] w-[86px] rounded-xl border-2 border-transparent bg-cover bg-center", i === 0 && "border-[#085eff]")}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>
    </div>
  )
}

export const PassportSide = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-[18px]">{children}</div>

const Thumb = ({ icon: I }: { icon: LucideIcon }) => (
  <span className="grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
    <I className="size-[17px]" strokeWidth={1.75} />
  </span>
)

/** «Связано»: УС, оборудование, кроссы — со ссылкой. */
export function RelatedCard({ items }: { items: { icon: LucideIcon; t: string; sub: string; href?: string }[] }) {
  return (
    <Card icon={LinkIcon} title="Связано" count={items.length}>
      {items.map(({ icon, t, sub, href }) => (
        <div key={t} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
          <Thumb icon={icon} />
          <span className="min-w-0 flex-1">
            <b className="block truncate text-sm font-semibold">{t}</b>
            <span className="block truncate text-xs text-muted-foreground">{sub}</span>
          </span>
          {href && (
            <Link href={href} className={circ} aria-label={`Открыть ${t}`}>
              <ArrowUpRight />
            </Link>
          )}
        </div>
      ))}
    </Card>
  )
}

/** «Документы ввода» — клик ведёт на вкладку документов. */
export function InputDocsCard({ docs, onOpen }: { docs: { t: string; n: string }[]; onOpen: () => void }) {
  return (
    <Card icon={FileText} title="Документы ввода">
      {docs.map((doc) => (
        <button key={doc.t} type="button" onClick={onOpen} className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left last:border-0">
          <Thumb icon={FileText} />
          <span className="min-w-0 flex-1">
            <b className="block truncate text-sm font-semibold">{doc.t}</b>
            <span className="block truncate text-xs text-muted-foreground">{doc.n}</span>
          </span>
        </button>
      ))}
    </Card>
  )
}

/** Ответственный за запись. TODO(API): из записи. */
export function ResponsibleCard() {
  return (
    <section className={cn(glass, "flex items-center gap-3 px-[18px] py-3.5")}>
      <Avatar initials="БД" color="linear-gradient(135deg,#0ea5e9,#0369a1)" className="size-11" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">Ответственный</span>
        <b className="block truncate text-sm font-semibold">Борис Б. Дегтярь</b>
      </span>
    </section>
  )
}

export type PassportTab<K extends string = string> = { k: K; t: string; icon: LucideIcon; n?: number }

/** Полоса вкладок с числами и «Экспорт» справа. */
export function PassportTabs<K extends string>({ tabs, value, onChange }: { tabs: PassportTab<K>[]; value: K; onChange: (k: K) => void }) {
  return (
    <nav className="relative z-[2] mx-(--page-gutter) mt-1 flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-[var(--glass-card)] p-1.5 backdrop-blur-[18px] [scrollbar-width:none]">
      {tabs.map((t) => (
        <button
          key={t.k}
          type="button"
          aria-pressed={value === t.k}
          onClick={() => onChange(t.k)}
          className={cn(
            "flex h-[42px] flex-none items-center gap-2 rounded-full px-3.5 text-[13.5px] whitespace-nowrap text-[var(--nav-text)] transition-colors hover:bg-[var(--nav-hover)]",
            value === t.k && "bg-[var(--nav-on-bg)] font-semibold text-[var(--nav-on)] hover:bg-[var(--nav-on-bg)]",
          )}
        >
          <t.icon className="size-4" strokeWidth={1.75} />
          {t.t}
          {t.n !== undefined && <em className={cn("rounded-full bg-[var(--chip-bg)] px-[7px] py-px text-[11.5px] not-italic", value === t.k && "bg-black/10")}>{t.n}</em>}
        </button>
      ))}
      <span className="flex-1" />
      <button type="button" className={btn({ sm: true })} onClick={() => toast("Экспорт паспорта в PDF — после подключения API")}>
        <Download />
        Экспорт
      </button>
    </nav>
  )
}

export const TabBody = ({ children }: { children: React.ReactNode }) => <div className="mt-[18px] px-(--page-gutter)">{children}</div>

export const SummaryGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-4 gap-[18px] max-[1279px]:grid-cols-2 max-sm:grid-cols-1">{children}</div>
)

/** Карточка сводки внизу «Обзора»: цифра, подпись, полоса; стрелка — на вкладку. */
export function SummaryCard({ icon, title, onOpen, bar, children }: { icon: LucideIcon; title: string; onOpen: () => void; bar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card
      icon={icon}
      title={title}
      action={
        <button type="button" className={circ} aria-label={`Открыть «${title}»`} onClick={onOpen}>
          <ArrowUpRight />
        </button>
      }
    >
      <b className="block text-[34px] leading-tight font-medium tracking-[-0.5px] tabular-nums [&_em]:text-sm [&_em]:font-normal [&_em]:text-muted-foreground [&_em]:not-italic">
        {children}
      </b>
      {bar && <div className="mt-3">{bar}</div>}
    </Card>
  )
}
