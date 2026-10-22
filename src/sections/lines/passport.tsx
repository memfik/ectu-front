"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Box,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  GitBranch,
  History,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Link as LinkIcon,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Pencil,
  QrCode,
  Ruler,
  Rows3,
  Trash2,
  Waypoints,
} from "lucide-react"
import { DeleteDialog } from "@/components/list/delete-dialog"
import { FormDrawer } from "@/components/list/form-drawer"
import { QrDialog } from "@/components/list/qr-dialog"
import { btn, circ, Pill } from "@/components/list/ui"
import { Gallery } from "@/components/passport/gallery"
import { Avatar, Card, glass, Kv, SegBar } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import type { Media } from "@/sections/nodes/detail"
import { useRemoteRecord } from "@/lib/list/remote"
import { useRows } from "@/lib/list/store"
import { cn } from "@/lib/utils"
import { kmStr, lineDetail, type LineDetail, type LineKind, type Segment } from "./detail"
import { LineDocsTab, LineHistoryTab, RentTab, SegmentsTab, StrandsTab, strandColor } from "./tabs"

const NetworkMap = dynamic(() => import("@/components/map/network-map").then((m) => m.NetworkMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--feat-bg)]" />,
})

type Stage = "scene" | "schema" | "map" | "photo"
type Tab = "overview" | "segments" | "strands" | "rent" | "docs" | "history"

/**
 * Паспорт линии связи: ВОЛС (макет 07: vols-04 «3D / Схема / Карта / Фото», вкладки vols-t1…t5, окно участка vols-x0)
 * и КЛС (08: kls-04, kls-t1…t4). Отличия — в `LineKind` раздела.
 */
export function LinePassport({ k, id }: { k: LineKind; id: number }) {
  const router = useRouter()
  const { list, spec, section } = k
  const local = useRows(list).find((r) => r.id === id)
  const { row: x, loading } = useRemoteRecord(list, id, local)
  const base = useMemo(() => (x ? lineDetail(x, k) : null), [x, k])
  // Участки правятся на месте (TODO(API): сохранение участков)
  const [segments, setSegments] = useState<Segment[] | null>(null)
  const [stage, setStage] = useState<Stage>("scene")
  const [tab, setTab] = useState<Tab>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)

  if (loading) return <div className="px-(--page-gutter) py-24 text-center text-muted-foreground">Загрузка паспорта…</div>
  if (!x || !base)
    return (
      <div className="px-(--page-gutter) py-24 text-center">
        <p className="text-lg font-semibold">Трасса не найдена</p>
        <Link href={`/${section}`} className={cn(btn(), "mt-4")}>
          <ChevronLeft />К списку {spec.title}
        </Link>
      </div>
    )

  const d: LineDetail = { ...base, segments: segments ?? base.segments }
  const status = list.card(x).status
  const len = d.segments.reduce((s, v) => s + v.len, 0)
  const cable = d.segments.reduce((s, v) => s + v.cable, 0)
  const a = d.strands.filter((f) => f === "a").length
  const b = d.strands.filter((f) => f === "b").length
  const busy = k.busyB ? a + b : a
  const points = Math.max(0, d.segments.length - 1)
  const docsUp = d.docs.filter((x) => x.uploaded).length
  const full = tab === "overview"
  const related = k.related(x, d)
  const media: Media[] = d.media.map((src, i) => ({
    src,
    title: `${spec.name(x)} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: [spec.title],
    text: "Фото с обхода трассы.",
  }))
  const tabs: { k: Tab; t: string; icon: typeof LayoutGrid; n?: number }[] = [
    { k: "overview", t: "Обзор", icon: LayoutGrid },
    { k: "segments", t: "Участки", icon: GitBranch, n: d.segments.length },
    { k: "strands", t: k.strand.tab, icon: Rows3, n: d.strands.length },
    ...(k.rent ? [{ k: "rent" as const, t: "Аренда КК", icon: Waypoints }] : []),
    { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
    { k: "history", t: "История", icon: History, n: d.history.length },
  ]

  return (
    <div className="relative isolate">
      <section
        className={cn(
          "relative -mt-[96px] overflow-hidden pt-[112px]",
          full ? "min-h-[910px] max-[1279px]:min-h-0 max-[1279px]:pb-6" : "pb-6",
        )}
      >
        {full ? (
          <Backdrop stage={stage} d={d} k={k} />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(900px_300px_at_60%_0%,rgba(0,26,159,0.45),transparent_70%)]" />
        )}

        <header className="pointer-events-none relative z-[2] flex flex-wrap items-center gap-x-[18px] gap-y-4 px-(--page-gutter) [&>*]:pointer-events-auto">
          <button
            type="button"
            onClick={() => router.push(`/${section}`)}
            className={cn(circ, "size-[54px] [&_svg]:size-5")}
            aria-label="Назад к списку"
          >
            <ChevronLeft />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-[var(--nav-text)]">
              {spec.crumb} /{" "}
              <Link href={`/${section}`} className="hover:text-foreground">
                {spec.title}
              </Link>{" "}
              / Паспорт
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-3 text-4xl font-semibold tracking-[-0.6px] max-sm:text-[26px]">
              {spec.name(x)}
              <button
                type="button"
                aria-label="Скопировать"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigator.clipboard?.writeText(spec.name(x)).then(() => toast("Скопировано"))}
              >
                <Copy className="size-5" />
              </button>
              <Pill tone={status.tone}>{status.label}</Pill>
              <span className="inline-flex h-[26px] items-center rounded-full bg-[var(--chip-bg)] px-2.5 text-xs font-semibold">
                {String(x.f.network ?? "ГРС")}
              </span>
            </h1>
          </div>
          <div className="ml-12 flex flex-wrap gap-x-[34px] gap-y-3 max-[1500px]:ml-0">
            <Stat icon={Ruler} t="Протяжённость" v={kmStr(Math.round(len * 10) / 10)} em="км" />
            <Stat icon={Rows3} t={k.strand.stat} v={d.strands.length} em={`${busy} занято`} />
            {k.third === "points" ? <Stat icon={MapPin} t="Муфт" v={points} /> : <Stat icon={MapPin} t="Участков" v={d.segments.length} />}
          </div>
          <div className="ml-auto flex gap-2.5">
            <button type="button" className={cn(circ, "size-11")} title="QR-код" onClick={() => setQr(true)}>
              <QrCode />
            </button>
            <Link href={`/map?node=${x.nodeCode}`} className={btn()}>
              <MapIcon />
              На карту сети
            </Link>
            <button type="button" className={btn({ primary: true })} onClick={() => setEdit(true)}>
              <Pencil />
              Редактировать
            </button>
            <button
              type="button"
              aria-label="Удалить"
              onClick={() => setDel(true)}
              className={cn(circ, "size-11 text-[#ff5257] hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
            >
              <Trash2 />
            </button>
          </div>
        </header>

        {full && (
          <div className="pointer-events-none relative z-[2] mt-7 grid grid-cols-[400px_1fr_400px] gap-[18px] px-(--page-gutter) max-[1500px]:grid-cols-[360px_1fr_360px] max-[1279px]:grid-cols-1 [&>*]:pointer-events-auto">
            <Card
              icon={Waypoints}
              title="Паспорт"
              className="self-start"
              action={
                <button type="button" className={circ} title="Все поля" onClick={() => setEdit(true)}>
                  <Maximize2 />
                </button>
              }
            >
              <Kv rows={k.rows(x, d)} />
            </Card>

            <div className="relative min-h-[640px] max-[1279px]:min-h-[420px]">
              {stage === "schema" && <Schema d={d} k={k} cable={String(x.f.cable ?? "")} />}
              {stage === "photo" && (
                <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-4">
                  <button type="button" className={btn({ primary: true })} onClick={() => setGallery(0)}>
                    <Maximize2 />
                    Открыть галерею
                  </button>
                  <div className="flex gap-2.5">
                    {d.media.slice(0, 6).map((src, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setGallery(i)}
                        aria-label={`Фото ${i + 1}`}
                        className={cn(
                          "h-[62px] w-[86px] rounded-xl border-2 border-transparent bg-cover bg-center",
                          i === 0 && "border-[#085eff]",
                        )}
                        style={{ backgroundImage: `url(${src})` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <StageSwitch value={stage} onChange={setStage} />
            </div>

            <div className="flex flex-col gap-[18px]">
              <Card icon={LinkIcon} title="Связано" count={related.length}>
                {related.map(({ icon: I, t, sub, href }) => (
                  <div key={t} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                    <span className="grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                      <I className="size-[17px]" strokeWidth={1.75} />
                    </span>
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
              <Card icon={FileText} title="Документы ввода">
                {d.inputDocs.map((doc) => (
                  <button
                    key={doc.t}
                    type="button"
                    onClick={() => setTab("docs")}
                    className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left last:border-0"
                  >
                    <span className="grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                      <FileText className="size-[17px]" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm font-semibold">{doc.t}</b>
                      <span className="block truncate text-xs text-muted-foreground">{doc.n}</span>
                    </span>
                  </button>
                ))}
              </Card>
              <section className={cn(glass, "flex items-center gap-3 px-[18px] py-3.5")}>
                <Avatar initials="БД" color="linear-gradient(135deg,#0ea5e9,#0369a1)" className="size-11" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">Ответственный</span>
                  <b className="block truncate text-sm font-semibold">Борис Б. Дегтярь</b>
                </span>
              </section>
            </div>
          </div>
        )}
      </section>

      <nav className="relative z-[2] mx-(--page-gutter) mt-1 flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-[var(--glass-card)] p-1.5 backdrop-blur-[18px] [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.k}
            type="button"
            aria-pressed={tab === t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              "flex h-[42px] flex-none items-center gap-2 rounded-full px-3.5 text-[13.5px] whitespace-nowrap text-[var(--nav-text)] transition-colors hover:bg-[var(--nav-hover)]",
              tab === t.k && "bg-[var(--nav-on-bg)] font-semibold text-[var(--nav-on)] hover:bg-[var(--nav-on-bg)]",
            )}
          >
            <t.icon className="size-4" strokeWidth={1.75} />
            {t.t}
            {t.n !== undefined && (
              <em className={cn("rounded-full bg-[var(--chip-bg)] px-[7px] py-px text-[11.5px] not-italic", tab === t.k && "bg-black/10")}>
                {t.n}
              </em>
            )}
          </button>
        ))}
        <span className="flex-1" />
        <button type="button" className={btn({ sm: true })} onClick={() => toast("Экспорт паспорта в PDF — после подключения API")}>
          <Download />
          Экспорт
        </button>
      </nav>

      <div className="mt-[18px] px-(--page-gutter)">
        {tab === "overview" && (
          <div className="grid grid-cols-4 gap-[18px] max-[1279px]:grid-cols-2 max-sm:grid-cols-1">
            <Summary icon={Ruler} title="Протяжённость" onOpen={() => setTab("segments")}>
              {kmStr(Math.round(len * 10) / 10)} <em>км · кабель {kmStr(cable)} км</em>
            </Summary>
            <Summary
              icon={Rows3}
              title={k.strand.tab}
              onOpen={() => setTab("strands")}
              bar={
                <SegBar
                  parts={[
                    { v: a, color: k.strand.a[1] },
                    { v: b, color: k.strand.b[1] },
                    {
                      v: d.strands.length - a - b,
                      color: "var(--chip-bg)",
                    },
                  ]}
                />
              }
            >
              {busy} / {d.strands.length} <em>занято</em>
            </Summary>
            {k.third === "points" ? (
              <Summary icon={MapPin} title="Муфты" onOpen={() => setTab("segments")}>
                {points} <em>на трассе</em>
              </Summary>
            ) : (
              <Summary icon={GitBranch} title="Участки" onOpen={() => setTab("segments")}>
                {d.segments.length}
              </Summary>
            )}
            <Summary
              icon={FileText}
              title="Документы"
              onOpen={() => setTab("docs")}
              bar={
                <SegBar
                  parts={[
                    { v: docsUp, color: "var(--status-ok)" },
                    { v: d.docs.length - docsUp, color: "var(--chip-bg)" },
                  ]}
                />
              }
            >
              {docsUp} / {d.docs.length} <em>загружено</em>
            </Summary>
          </div>
        )}
        {tab === "segments" && <SegmentsTab d={d} k={k} onChange={setSegments} />}
        {tab === "strands" && <StrandsTab x={x} d={d} k={k} />}
        {tab === "rent" && <RentTab d={d} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </div>

      {gallery !== null && (
        <Gallery
          title={`Фото и схемы · ${spec.name(x)}`}
          sub={spec.sub2(x)}
          media={media}
          start={gallery}
          onClose={() => setGallery(null)}
        />
      )}
      {qr && list.qr && <QrDialog {...list.qr(x)} onClose={() => setQr(false)} />}
      {edit && <FormDrawer cfg={list} id={x.id} onClose={() => setEdit(false)} onDelete={() => (setEdit(false), setDel(true))} />}
      {del && <DeleteDialog cfg={list} rows={[x]} onClose={() => setDel(false)} onDone={() => router.push(`/${section}`)} />}
    </div>
  )
}

function Stat({ icon: Icon, t, v, em }: { icon: typeof Ruler; t: string; v: number | string; em?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn(circ, "size-11 cursor-default hover:border-border hover:bg-[var(--chip-bg)] hover:text-[var(--nav-text)]")}>
        <Icon />
      </span>
      <span>
        <span className="block text-[12.5px] whitespace-nowrap text-[var(--nav-text)]">{t}</span>
        <b className="text-[28px] leading-tight font-medium tracking-[-0.5px] tabular-nums">
          {v}
          {em && <em className="ml-1.5 text-xs font-normal text-muted-foreground not-italic">{em}</em>}
        </b>
      </span>
    </div>
  )
}

/** Карточка сводки внизу «Обзора»: цифра, подпись, полоса; стрелка — на вкладку. */
function Summary({
  icon,
  title,
  onOpen,
  bar,
  children,
}: {
  icon: typeof Ruler
  title: string
  onOpen: () => void
  bar?: React.ReactNode
  children: React.ReactNode
}) {
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

function StageSwitch({ value, onChange }: { value: Stage; onChange: (s: Stage) => void }) {
  const items = [
    ["scene", "3D", Box],
    ["schema", "Схема", Layers],
    ["map", "Карта", MapIcon],
    ["photo", "Фото", ImageIcon],
  ] as const
  return (
    <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-[rgba(18,20,25,0.84)] p-[5px] backdrop-blur-[12px] not-dark:bg-white/90">
      {items.map(([k, t, I]) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => onChange(k)}
          className={cn(
            "flex h-[38px] items-center gap-[7px] rounded-full px-4 text-[13.5px] whitespace-nowrap text-[var(--nav-text)]",
            value === k && "bg-[#085eff] font-semibold text-white",
          )}
        >
          <I className="size-4" />
          {t}
        </button>
      ))}
    </div>
  )
}

/** «Занято» → «занято», аббревиатуры («JM») — как есть. */
const low = (t: string) => (t === t.toUpperCase() ? t : t[0].toLowerCase() + t.slice(1))

/** Конец трассы на схеме: УС и его ID под квадратом «А» / «Б». */
function End({ t, code, right }: { t: string; code: string; right?: boolean }) {
  return (
    <span className={cn("absolute top-[80px] w-[200px] text-[13px]", right ? "right-0 text-right" : "left-0")}>
      <b className="block truncate font-semibold">{t}</b>
      <span className="text-xs text-muted-foreground">{code}</span>
    </span>
  )
}

/** Схема трассы (vols-04-schema): А — муфты — Б, длины и тип прокладки участков, ряд волокон кабеля. */
function Schema({ d, k, cable }: { d: LineDetail; k: LineKind; cable: string }) {
  const n = d.segments.length
  const a = d.strands.filter((f) => f === "a").length
  const b = d.strands.filter((f) => f === "b").length
  return (
    <div className="absolute inset-x-0 top-[200px] px-[4%] max-[1279px]:top-10">
      <div className="relative h-12">
        <i
          className="absolute top-1/2 right-6 left-6 h-[3px] -translate-y-1/2 rounded-full "
          style={{ background: k.color, boxShadow: `0 0 12px ${k.color}` }}
        />
        {d.segments.map((s, i) => (
          <span
            key={s.id}
            className="absolute top-0 h-full"
            style={{
              left: `calc(24px + (100% - 48px) * ${i / n})`,
              width: `calc((100% - 48px) / ${n})`,
            }}
          >
            <em className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full border border-border bg-[var(--glass-card-solid)] px-3 py-0.5 text-xs whitespace-nowrap not-italic tabular-nums">
              {kmStr(s.len)} км
            </em>
            <span className="absolute top-[40px] left-1/2 -translate-x-1/2 text-[11px] whitespace-nowrap text-muted-foreground lowercase">
              {s.laying}
            </span>
            {i > 0 && (
              <>
                <i className="absolute top-1/2 left-0 size-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#ffc53d] bg-background" />
                <span className="absolute -top-[58px] left-0 -translate-x-1/2 text-[11px] whitespace-nowrap text-[#ffc53d]">{s.from}</span>
              </>
            )}
          </span>
        ))}
        {(["А", "Б"] as const).map((t, i) => (
          <span
            key={t}
            className={cn(
              "absolute top-0 grid size-12 place-items-center rounded-xl bg-[#085eff] text-sm font-semibold text-white shadow-[0_0_24px_rgba(8,94,255,0.6)]",
              i ? "right-0" : "left-0",
            )}
          >
            {t}
          </span>
        ))}
        <End t={d.start.title} code={d.start.code} />
        <End t={d.end.title} code={d.end.code} right />
      </div>
      <div className="mx-auto mt-[150px] w-fit max-w-full">
        <p className="mb-2 text-xs text-muted-foreground">
          {k.strand.dots ? `Медные пары ${cable}` : `Волокна кабеля ${cable}`} · {low(k.strand.a[0])} {a} · {low(k.strand.b[0])} {b} ·
          свободно {d.strands.length - a - b}
        </p>
        {k.strand.dots ? (
          <div className="grid grid-cols-[repeat(25,18px)] justify-center gap-[7px]">
            {d.strands.map((f, i) => (
              <i key={i} title={`Пара ${i + 1}`} className="block size-[18px] rounded-full" style={{ background: strandColor(k, f) }} />
            ))}
          </div>
        ) : (
          <div className="flex justify-center gap-[3px]">
            {d.strands.map((f, i) => (
              <span key={i} className="flex w-4 flex-col items-center gap-1.5">
                <i className="block h-9 w-full rounded-[4px]" style={{ background: strandColor(k, f) }} />
                <span className="text-[9px] text-muted-foreground tabular-nums">{i + 1}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Фон верха: 3D-трасса (картинка из макета; TODO: three.js, handoff §6), трасса на карте или фото. */
function Backdrop({ stage, d, k }: { stage: Stage; d: LineDetail; k: LineKind }) {
  const mid = d.route[Math.floor(d.route.length / 2)]
  const lines = useMemo(
    () => [
      {
        id: "route",
        coords: d.route,
        layer: "vols",
        color: k.color,
        width: 4,
      },
    ],
    [d.route, k.color],
  )
  const points = useMemo(
    () => [
      {
        id: "a",
        ll: d.route[0],
        layer: "node",
        color: "#4f8dff",
        title: d.start.code,
      },
      {
        id: "b",
        ll: d.route[d.route.length - 1],
        layer: "node",
        color: "#4f8dff",
        title: d.end.code,
      },
      ...d.pointLl.map((ll, i) => ({
        id: `m${i}`,
        ll,
        layer: "mufta",
        color: "#ffc53d",
        title: `${k.point} М-${i + 1}`,
      })),
    ],
    [d, k.point],
  )
  const focus = useMemo(() => ({ ll: mid, zoom: 15, n: 1 }), [mid])
  if (stage === "map")
    return (
      <div className="absolute inset-0 z-[1]">
        <NetworkMap
          points={points}
          lines={lines}
          basemap="city"
          selected="a"
          focus={focus}
          onSelect={() => {}}
          onView={() => {}}
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--background)_0,transparent_18%,transparent_80%,var(--background)_100%)]" />
      </div>
    )
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_55%_45%,rgba(8,94,255,0.16),transparent_70%)]" />
      {stage === "photo" ? (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${d.media[0]})` }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,14,0.92)_0,rgba(10,11,14,0.35)_30%,rgba(10,11,14,0.1)_50%,rgba(10,11,14,0.35)_70%,rgba(10,11,14,0.92)_100%),linear-gradient(180deg,rgba(10,11,14,0.9)_0,transparent_25%,transparent_70%,var(--background)_100%)]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-[size:48px_48px] opacity-40" />
          {stage === "scene" && (
            <div
              className="absolute top-[150px] left-1/2 h-[726px] w-[1100px] -translate-x-1/2 bg-contain bg-center bg-no-repeat max-[1279px]:hidden"
              style={{ backgroundImage: `url(${k.scene})` }}
            />
          )}
        </>
      )}
    </div>
  )
}
