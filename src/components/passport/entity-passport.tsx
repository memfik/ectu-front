"use client"

import { useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  History,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  Maximize2,
  Pencil,
  QrCode,
  RadioTower,
  Trash2,
} from "lucide-react"
import { DeleteDialog } from "@/components/list/delete-dialog"
import { FormDrawer } from "@/components/list/form-drawer"
import { QrDialog } from "@/components/list/qr-dialog"
import { btn, circ, Pill } from "@/components/list/ui"
import { DocsTab } from "@/sections/nodes/tabs"
import { toast } from "@/components/shared/toast"
import { LISTS } from "@/sections"
import { pair, val, type GenRow } from "@/sections/make"
import { specOf } from "@/sections/specs"
import { BRANCHES, nodeRows } from "@/sections/nodes/data"
import type { Doc, Media } from "@/sections/nodes/detail"
import { CURRENT_USER } from "@/lib/current-user"
import { useRemoteRecord } from "@/lib/list/remote"
import { useRows } from "@/lib/list/store"
import type { ListConfig } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { Gallery } from "./gallery"
import { Avatar, Card, glass, Kv, SegBar } from "./ui"
import { RecordNotFound } from "@/components/shared/states"

const PointsMap = dynamic(() => import("@/components/map/points-map").then((m) => m.PointsMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--feat-bg)]" />,
})

type Tab = "overview" | "docs" | "photo" | "history"

/**
 * Общий паспорт записи (EntityPassport, handoff §4) для разделов 07…25: шапка, поля паспорта, фото или карта,
 * узел связи, ответственный; вкладки «Обзор», «Документация», «Фото», «История».
 * TODO: у разделов свои визуалы (схема волокон ВОЛС, передняя панель АТС/SDH, профиль пролёта РРЛ) — handoff §4 «FrontPanel».
 */
export function EntityPassport({ section, id }: { section: string; id: number }) {
  const spec = specOf(section)!
  const cfg = LISTS[section] as ListConfig<GenRow>
  const router = useRouter()
  const local = useRows(cfg).find((r) => r.id === id)
  const { row: x, loading } = useRemoteRecord(cfg, id, local)
  const [tab, setTab] = useState<Tab>("overview")
  const [stage, setStage] = useState<"photo" | "map">("photo")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)

  if (loading)
    return <div className="px-(--page-gutter) py-24 text-center text-muted-foreground">Загрузка паспорта…</div>
  if (!x)
    return <RecordNotFound title="Запись не найдена" href={`/${section}`} back="К списку" />

  const node = nodeRows().find((n) => n.id === x.nodeId)
  const status = cfg.card(x).status
  const media: Media[] = [spec.hero, "/nodes/g-1.jpg", "/nodes/g-3.jpg", "/nodes/g-5.jpg"].map((src, i) => ({
    src,
    title: `${spec.name(x)} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: [spec.title],
    text: "Фото с обхода объекта.",
  }))
  const docs: Doc[] = [
    { id: 1, name: `Паспорт ${spec.name(x)}.pdf`, kind: "Техническая", size: "1.4 МБ", date: "14.01.2026", ext: "pdf" },
    { id: 2, name: "Акт ввода в эксплуатацию.pdf", kind: "Приёмо-сдаточная", size: "620 КБ", date: "12.03.2019", ext: "pdf" },
    { id: 3, name: `Сводный ${spec.title}.xlsx`, kind: "Приёмо-сдаточная", size: "84 КБ", date: "05.10.2026", ext: "xlsx" },
  ]
  const history = [
    { what: "Изменено поле «Статус»", who: CURRENT_USER.name, date: "06.10.2026, 14:22" },
    { what: "Загружен «Акт ввода в эксплуатацию.pdf»", who: "Борис Б. Дегтярь", date: "14.01.2026, 10:05" },
    { what: "Запись создана", who: "Импорт Excel", date: "12.03.2019, 09:40" },
  ]
  // Поля «занято / всего» — сводные полосы в обзоре
  const pairs = spec.cols.map((c) => [c, pair(val(x, c.k))] as const).filter(([, p]) => p)
  const tabs: [Tab, string, typeof LayoutGrid, number?][] = [
    ["overview", "Обзор", LayoutGrid],
    ["docs", "Документация", FileText, docs.length],
    ["photo", "Фото и видео", ImageIcon, media.length],
    ["history", "История", History, history.length],
  ]

  return (
    <div className="relative isolate">
      <section className="relative -mt-[96px] overflow-hidden px-(--page-gutter) pt-[112px] pb-6">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(900px_300px_at_60%_0%,rgba(0,26,159,0.45),transparent_70%)]"
        />
        <header className="flex flex-wrap items-center gap-x-[18px] gap-y-4">
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
              <span className="max-w-[900px] truncate">{spec.name(x)}</span>
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
                {x.branch}
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{spec.sub2(x)}</p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <button type="button" className={cn(circ, "size-11")} title="QR-код" onClick={() => setQr(true)}>
              <QrCode />
            </button>
            {!spec.noMap && (
              <Link href={`/map?node=${x.nodeCode}`} className={btn()}>
                <MapIcon />
                На карту сети
              </Link>
            )}
            {!spec.readOnly && (
              <>
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
              </>
            )}
          </div>
        </header>

        <div className="mt-7 grid grid-cols-[420px_1fr_380px] gap-[18px] max-[1500px]:grid-cols-[380px_1fr_340px] max-[1279px]:grid-cols-1">
          <Card
            icon={spec.icon}
            title="Паспорт"
            className="self-start"
            action={
              !spec.readOnly && (
                <button type="button" className={circ} title="Все поля" onClick={() => setEdit(true)}>
                  <Maximize2 />
                </button>
              )
            }
          >
            <Kv
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
                ...(spec.noMap
                  ? []
                  : [
                      { t: "Идентификатор УС", v: x.nodeCode },
                      { t: "Населённый пункт", v: `г. ${x.city}` },
                    ]),
                ...spec.cols
                  .filter((c) => !["branch", "nodeCode", "num"].includes(c.k) && c.show !== "status")
                  .map((c) => ({ t: c.t, v: String(val(x, c.k)) })),
                { t: "Статус", v: status.label },
              ]}
            />
          </Card>

          <section className={cn(glass, "relative min-h-[480px] overflow-hidden")}>
            {stage === "photo" ? (
              <button
                type="button"
                onClick={() => setGallery(0)}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${spec.hero})` }}
                aria-label="Открыть галерею"
              />
            ) : (
              <PointsMap
                points={[{ id: x.id, ll: x.ll, title: spec.name(x), sub: spec.sub2(x), tone: status.tone }]}
                selected={x.id}
                onSelect={() => {}}
                className="absolute inset-0"
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(10,11,14,0.8))]" />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-[rgba(18,20,25,0.84)] p-[5px] backdrop-blur-[12px]">
              {([["photo", "Фото", ImageIcon], ...(spec.noMap ? [] : [["map", "Карта", MapIcon] as const])] as const).map(([k, t, I]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStage(k)}
                  className={cn(
                    "flex h-[38px] items-center gap-[7px] rounded-full px-4 text-[13.5px] text-white/80",
                    stage === k && "bg-[#085eff] font-semibold text-white",
                  )}
                >
                  <I className="size-4" />
                  {t}
                </button>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-[18px]">
            {node && !spec.noMap && (
              <Card
                icon={RadioTower}
                title="Узел связи"
                action={
                  <Link href={`/nodes/${node.id}`} className={circ} aria-label="Паспорт узла">
                    <ArrowUpRight />
                  </Link>
                }
              >
                <Link href={`/nodes/${node.id}`} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold">{node.code}</b>
                    <span className="block truncate text-xs text-muted-foreground">{node.address}</span>
                  </span>
                  <Pill tone="ok">В работе</Pill>
                </Link>
              </Card>
            )}
            {pairs.length > 0 && (
              <Card icon={LayoutGrid} title="Ёмкость">
                {pairs.map(([c, p]) => (
                  <div key={c.k} className="mb-3">
                    <span className="mb-1.5 flex justify-between text-[13px]">
                      <span className="text-muted-foreground">{c.t}</span>
                      <b className="font-medium tabular-nums">{String(val(x, c.k))}</b>
                    </span>
                    <SegBar
                      parts={[
                        { v: p![0], color: "#085eff" },
                        { v: Math.max(0, p![1] - p![0]), color: "var(--chip-bg)" },
                      ]}
                    />
                  </div>
                ))}
              </Card>
            )}
            <section className={cn(glass, "flex items-center gap-3 px-[18px] py-3.5")}>
              <Avatar initials="БД" color="linear-gradient(135deg,#0ea5e9,#0369a1)" className="size-11" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">Ответственный за эксплуатацию</span>
                <b className="block truncate text-sm font-semibold">Борис Б. Дегтярь</b>
              </span>
            </section>
          </div>
        </div>
      </section>

      <nav className="mx-(--page-gutter) flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-[var(--glass-card)] p-1.5 backdrop-blur-[18px] [scrollbar-width:none]">
        {tabs.map(([k, t, I, n]) => (
          <button
            key={k}
            type="button"
            aria-pressed={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "flex h-[42px] flex-none items-center gap-2 rounded-full px-3.5 text-[13.5px] whitespace-nowrap text-[var(--nav-text)] hover:bg-[var(--nav-hover)]",
              tab === k && "bg-[var(--nav-on-bg)] font-semibold text-[var(--nav-on)] hover:bg-[var(--nav-on-bg)]",
            )}
          >
            <I className="size-4" />
            {t}
            {n !== undefined && <em className="rounded-full bg-[var(--chip-bg)] px-[7px] py-px text-[11.5px] not-italic">{n}</em>}
          </button>
        ))}
        <span className="flex-1" />
        <button type="button" className={btn({ sm: true })} onClick={() => toast("Экспорт паспорта — после подключения API")}>
          <Download />
          Экспорт
        </button>
      </nav>

      <div className="mt-[18px] px-(--page-gutter)">
        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-[18px] max-[1279px]:grid-cols-1">
            <Card icon={FileText} title="Последние документы" count={docs.length}>
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-border py-2.5 text-[13.5px] last:border-0">
                  <span>
                    <b className="block font-medium">{d.name}</b>
                    <span className="text-xs text-muted-foreground">
                      {d.kind} · {d.size} · {d.date}
                    </span>
                  </span>
                </div>
              ))}
            </Card>
            <Card icon={History} title="История" count={history.length}>
              <HistoryList items={history} />
            </Card>
          </div>
        )}
        {tab === "docs" && (
          <DocsTab
            d={{
              docs,
              docGroups: [
                { kind: "Техническая", paper: true },
                { kind: "Приёмо-сдаточная", paper: false },
              ],
            }}
            onUpload={() => toast("Загрузка документов — после подключения API")}
          />
        )}
        {tab === "photo" && (
          <div className="grid grid-cols-4 gap-3 max-sm:grid-cols-2">
            {media.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGallery(i)}
                className="h-[200px] rounded-2xl bg-cover bg-center"
                style={{ backgroundImage: `url(${m.src})` }}
                aria-label={m.title}
              />
            ))}
          </div>
        )}
        {tab === "history" && (
          <Card icon={History} title="История изменений" count={history.length}>
            <HistoryList items={history} />
          </Card>
        )}
      </div>

      {gallery !== null && (
        <Gallery
          title={`Фото и видео · ${spec.name(x)}`}
          sub={spec.sub2(x)}
          media={media}
          start={gallery}
          onClose={() => setGallery(null)}
        />
      )}
      {qr && cfg.qr && <QrDialog {...cfg.qr(x)} onClose={() => setQr(false)} />}
      {edit && <FormDrawer cfg={cfg} id={x.id} onClose={() => setEdit(false)} onDelete={() => (setEdit(false), setDel(true))} />}
      {del && <DeleteDialog cfg={cfg} rows={[x]} onClose={() => setDel(false)} onDone={() => router.push(`/${section}`)} />}
    </div>
  )
}

function HistoryList({ items }: { items: { what: string; who: string; date: string }[] }) {
  return (
    <ol className="relative ml-1.5 border-l border-border pl-5">
      {items.map((h) => (
        <li key={h.what} className="relative pb-4 last:pb-0">
          <i className="absolute top-1 -left-[27px] size-3 rounded-full border-2 border-[#4f8dff] bg-[var(--glass-card-solid)]" />
          <b className="block text-sm font-semibold">{h.what}</b>
          <span className="text-xs text-muted-foreground">
            {h.who} · {h.date}
          </span>
        </li>
      ))}
    </ol>
  )
}
