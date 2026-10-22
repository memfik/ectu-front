"use client"

import { useDeferredValue, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, Filter, Layers, LayoutGrid, List, Map as MapIcon, Pencil, QrCode, Search, Trash2, X } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { LISTS } from "@/config/lists"
import { applyQuery, emptyQuery, exportCsv, fmt, type Query } from "@/lib/list/query"
import type { HeroButton, ListConfig, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { FilterDrawer } from "./filter-drawer"
import { ActiveChips, FilterChip } from "./filters"
import { MapView } from "./map-view"
import { Bar, btn, Check, circ, Pill, Tag } from "./ui"

type Mode = "table" | "cards" | "map"
const SIZES: Record<Mode, number[]> = { table: [10, 20, 50, 100], cards: [8, 16, 32, 64], map: [20] }
const SIZE: Record<Mode, number> = { table: 20, cards: 8, map: 20 }

/** Шаблон «Список» (макет 02, экран «Список узлов»): шапка с KPI, панель фильтров, таблица, превью справа. */
export function ListPage({ list: key }: { list: string }) {
  return <ListView cfg={LISTS[key]} />
}

function ListView<T extends Row>({ cfg }: { cfg: ListConfig<T> }) {
  const rows = useMemo(() => cfg.rows(), [cfg])
  const [q, setQState] = useState<Query>(() => emptyQuery(cfg))
  const [page, setPage] = useState(0)
  const [mode, setModeState] = useState<Mode>("table")
  const [more, setMore] = useState(false)
  const [size, setSize] = useState(SIZE.table)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<number | null>(rows[0]?.id ?? null)

  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  // Отбор — отложенно: ввод в поиске не ждёт пересчёта всех строк
  const deferred = useDeferredValue(q)
  const list = useMemo(() => applyQuery(cfg, rows, deferred), [cfg, rows, deferred])
  const kpis = useMemo(() => cfg.kpis(rows), [cfg, rows])

  const pages = Math.max(1, Math.ceil(list.length / size))
  const pg = Math.min(page, pages - 1)
  const view = list.slice(pg * size, pg * size + size)
  const current = rows.find((x) => x.id === active)

  const toggle = (id: number) => {
    const s = new Set(checked)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setChecked(s)
  }
  const allOnPage = view.length > 0 && view.every((x) => checked.has(x.id))
  const action = (b: HeroButton) => {
    if (b.onClick === "export") {
      exportCsv(cfg, checked.size ? rows.filter((x) => checked.has(x.id)) : list)
      return toast(`Выгружено ${fmt(checked.size || list.length)} записей (CSV)`)
    }
    toast(`«${b.label}» — следующим экраном`)
  }

  const setMode = (m: Mode) => {
    setModeState(m)
    setSize(SIZE[m])
    setPage(0)
  }

  // Фильтры без своей кнопки в панели, которые сейчас включены
  const hidden = cfg.filters.filter((f) => f.more && q.f[f.k]?.length).length

  const toolbar = (
    <div className="mx-1.5 mb-2 flex flex-wrap items-center gap-2.5 max-sm:gap-2">
      <label className="flex h-11 min-w-[200px] flex-[1_1_220px] items-center gap-2.5 rounded-full border border-border bg-[var(--chip-bg)] px-4 max-sm:h-10 max-sm:flex-[1_1_100%]">
        <Search className="size-[18px] text-muted-foreground" />
        <input
          value={q.q}
          onChange={(e) => setQ({ ...q, q: e.target.value })}
          placeholder={cfg.search}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q.q && (
          <button type="button" aria-label="Очистить поиск" onClick={() => setQ({ ...q, q: "" })}>
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
      </label>
      {cfg.filters
        .filter((f) => !f.more)
        .map((f) => (
          <FilterChip key={f.k} filter={f} rows={rows} value={q.f[f.k] ?? []} onChange={(v) => setQ({ ...q, f: { ...q.f, [f.k]: v } })} />
        ))}
      <button type="button" className={cn(btn(), "font-normal text-[var(--nav-text)] max-sm:h-10")} onClick={() => setMore(true)}>
        <Filter />
        Ещё фильтры
        {hidden > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#085eff] px-1.5 text-[11px] font-bold text-white">{hidden}</span>}
      </button>
      <button
        type="button"
        disabled={!checked.size}
        className={cn(btn({ danger: true }), "max-sm:h-10")}
        onClick={() => toast("Удаление с причиной — следующим экраном")}
      >
        <Trash2 />
        Удалить ({checked.size})
      </button>
      {mode === "map" && (
        // TODO: «Слои» — узлы, ВОЛС, клиенты, участки; подложка 2D / спутник (макет 05)
        <button
          type="button"
          className={cn(btn(), "font-normal text-[var(--nav-text)] max-sm:h-10")}
          onClick={() => toast("Слои карты — на экране «Карта сети» (05)")}
        >
          <Layers />
          Слои
        </button>
      )}
      <span className="flex-1 max-sm:hidden" />
      {mode === "cards" && <SortSelect cfg={cfg} q={q} setQ={setQ} />}
      <ViewSwitch mode={mode} onChange={setMode} hasMap={!!cfg.map} />
    </div>
  )
  const pager = (
    <Pager
      total={list.length}
      page={pg}
      pages={pages}
      size={size}
      sizes={SIZES[mode]}
      onSize={(n) => {
        setSize(n)
        setPage(0)
      }}
      onPage={setPage}
    />
  )

  return (
    <div className="relative isolate">
      <FilterDrawer cfg={cfg} rows={rows} q={q} open={more} onOpenChange={setMore} onApply={setQ} />
      <Hero cfg={cfg} total={rows.length} onAction={action} />

      <div className="relative z-[1] -mt-[148px] grid grid-cols-6 gap-3.5 px-(--page-gutter) max-[1500px]:grid-cols-3 max-sm:grid-cols-2 max-sm:gap-2.5 max-[1279px]:mt-4">
        {kpis.map((k) => (
          <div
            key={k.t}
            className="rounded-3xl border border-border bg-[var(--glass-card)] px-5 py-[18px] backdrop-blur-[18px] max-sm:px-3.5 max-sm:py-3"
          >
            <div className="flex items-center gap-2 text-[13px] whitespace-nowrap text-muted-foreground">
              <i className="size-[7px] flex-none rounded-full" style={{ background: k.color }} />
              <span className="truncate">{k.t}</span>
            </div>
            <b className="mt-2 block text-[30px] leading-tight font-medium tracking-[-0.02em] whitespace-nowrap tabular-nums max-sm:text-2xl">
              {k.value}
              {k.note && <em className="ml-1.5 text-[13px] font-normal text-muted-foreground not-italic">{k.note}</em>}
            </b>
            <Bar pct={k.pct} color={k.color} className="mt-2.5 h-[5px]" />
          </div>
        ))}
      </div>

      {mode === "map" ? (
        <div className="mt-[18px] px-(--page-gutter)">
          <section className="rounded-3xl border border-border bg-[var(--glass-card)] px-3 py-3 backdrop-blur-[18px] max-sm:px-2">
            {toolbar}
            <ActiveChips cfg={cfg} q={q} setQ={setQ} />
          </section>
          <MapView cfg={cfg} rows={list} active={active} setActive={setActive} />
        </div>
      ) : mode === "cards" ? (
        <div className="mt-[18px] px-(--page-gutter)">
          <section className="rounded-3xl border border-border bg-[var(--glass-card)] px-3 py-3 backdrop-blur-[18px] max-sm:px-2">
            {toolbar}
            <ActiveChips cfg={cfg} q={q} setQ={setQ} />
          </section>
          <Cards cfg={cfg} rows={view} checked={checked} toggle={toggle} />
          {pager}
        </div>
      ) : (
        <div className="mt-[18px] flex items-start gap-[18px] px-(--page-gutter)">
          <section className="min-w-0 flex-1 rounded-3xl border border-border bg-[var(--glass-card)] px-3 pt-4 pb-3 backdrop-blur-[18px] max-sm:px-2">
            {toolbar}
            <ActiveChips cfg={cfg} q={q} setQ={setQ} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5 text-[13.5px]">
                <thead>
                  <tr className="text-left text-[12.5px] text-muted-foreground">
                    <th className="w-11 px-3.5 py-1 font-medium">
                      <Check
                        on={allOnPage}
                        label="Выбрать страницу"
                        onClick={() => {
                          const s = new Set(checked)
                          view.forEach((x) => (allOnPage ? s.delete(x.id) : s.add(x.id)))
                          setChecked(s)
                        }}
                      />
                    </th>
                    <th className="w-12 px-3.5 py-1 font-medium">№</th>
                    {cfg.cols.map((c) => {
                      const sorted = q.sort[0] === c.k
                      return (
                        <th
                          key={c.k}
                          style={{ width: c.w }}
                          onClick={() =>
                            !c.noSort && setQ({ ...q, sort: sorted ? [c.k, q.sort[1] === 1 ? -1 : 1] : [c.k, c.num ? -1 : 1] })
                          }
                          className={cn("group px-3.5 py-1 font-medium whitespace-nowrap", !c.noSort && "cursor-pointer select-none")}
                        >
                          {c.t}
                          {!c.noSort && (
                            <span
                              className={cn(
                                "ml-1 opacity-0 transition-opacity group-hover:opacity-100",
                                sorted && "text-[var(--link)] opacity-100",
                              )}
                            >
                              {sorted ? (q.sort[1] > 0 ? "↑" : "↓") : "↕"}
                            </span>
                          )}
                        </th>
                      )
                    })}
                    <th className="px-3.5 py-1 text-right font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {view.map((x, i) => {
                    const on = x.id === active
                    return (
                      <tr key={x.id} onClick={() => setActive(x.id)} className={cn("group/r cursor-pointer", on && "on")}>
                        <td className={td(on, "first")} onClick={(e) => e.stopPropagation()}>
                          <Check on={checked.has(x.id)} label="Выбрать" onClick={() => toggle(x.id)} />
                        </td>
                        <td className={cn(td(on), "text-muted-foreground tabular-nums")}>{pg * size + i + 1}</td>
                        {cfg.cols.map((c) => (
                          <td key={c.k} className={cn(td(on), "whitespace-nowrap", c.num && "tabular-nums")}>
                            {c.render(x)}
                          </td>
                        ))}
                        <td className={td(on, "last")} onClick={(e) => e.stopPropagation()}>
                          <RowActions />
                        </td>
                      </tr>
                    )
                  })}
                  {!view.length && (
                    <tr>
                      <td colSpan={cfg.cols.length + 3} className="py-12 text-center text-muted-foreground">
                        Ничего не найдено — измените поиск или фильтры
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {pager}
          </section>

          {current && <PreviewPanel cfg={cfg} row={current} onClose={() => setActive(null)} />}
        </div>
      )}
    </div>
  )
}

/** Ячейка строки-плашки; выбранная строка — синяя рамка (tr.active в макете). */
const td = (on: boolean, edge?: "first" | "last") =>
  cn(
    "bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-3.5 py-3 align-middle transition-colors group-hover/r:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
    edge === "first" && "rounded-l-[14px]",
    edge === "last" && "rounded-r-[14px]",
    on &&
      "bg-[rgba(8,94,255,0.1)] shadow-[inset_0_1px_rgba(8,94,255,0.4),inset_0_-1px_rgba(8,94,255,0.4)] group-hover/r:bg-[rgba(8,94,255,0.12)]",
    on && edge === "first" && "shadow-[inset_1px_1px_rgba(8,94,255,0.4),inset_0_-1px_rgba(8,94,255,0.4)]",
    on && edge === "last" && "shadow-[inset_-1px_1px_rgba(8,94,255,0.4),inset_0_-1px_rgba(8,94,255,0.4)]",
  )

function Hero<T extends Row>({ cfg, total, onAction }: { cfg: ListConfig<T>; total: number; onAction: (b: HeroButton) => void }) {
  return (
    <section className="relative -mt-[96px] h-[470px] max-[1279px]:h-auto max-[1279px]:pb-2">
      {/* фон на всю ширину окна, уходит под шапку, как в макете */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(800px_400px_at_20%_30%,rgba(8,94,255,0.14),transparent_70%)]"
      />
      {cfg.hero && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-[position:70%_30%] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.35)_25%,#000_60%)] max-[1279px]:opacity-35 not-dark:opacity-50"
          style={{ backgroundImage: `url(${cfg.hero})` }}
        />
      )}
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[220px] bg-[linear-gradient(180deg,transparent,var(--background))]" />

      <div className="flex flex-wrap items-end gap-5 px-(--page-gutter) pt-[150px] max-[1279px]:pt-[120px] max-sm:pt-[110px]">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{cfg.crumb}</p>
          <h1 className="mt-1.5 text-[60px] leading-[1.05] font-semibold tracking-[-1.6px] whitespace-nowrap max-[1279px]:text-[40px] max-sm:text-[30px] max-sm:whitespace-normal">
            {cfg.title}
            <em className="ml-2.5 text-[42px] font-normal tracking-[-1px] text-muted-foreground not-italic tabular-nums max-[1279px]:text-[30px] max-sm:text-[22px]">
              {fmt(total)}
            </em>
          </h1>
          <p className="mt-2 text-[15px] text-[var(--nav-text)]">{cfg.sub}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2.5 max-sm:ml-0">
          {cfg.buttons.map((b) =>
            b.href ? (
              <Link key={b.label} href={b.href} className={btn({ primary: b.primary })}>
                <b.icon />
                {b.label}
              </Link>
            ) : (
              <button key={b.label} type="button" onClick={() => onAction(b)} className={btn({ primary: b.primary })}>
                <b.icon />
                {b.label}
              </button>
            ),
          )}
        </div>
      </div>
    </section>
  )
}

/** Таблица / Карточки / Карта. */
function ViewSwitch({ mode, onChange, hasMap }: { mode: Mode; onChange: (m: Mode) => void; hasMap: boolean }) {
  const b = "grid size-[34px] cursor-pointer place-items-center rounded-full text-muted-foreground [&_svg]:size-[17px]"
  const on = "bg-[var(--nav-hover)] text-foreground"
  return (
    <div className="flex gap-0.5 rounded-full border border-border bg-[var(--chip-bg)] p-1">
      <button
        type="button"
        title="Таблица"
        aria-pressed={mode === "table"}
        className={cn(b, mode === "table" && on)}
        onClick={() => onChange("table")}
      >
        <List />
      </button>
      <button
        type="button"
        title="Карточки"
        aria-pressed={mode === "cards"}
        className={cn(b, mode === "cards" && on)}
        onClick={() => onChange("cards")}
      >
        <LayoutGrid />
      </button>
      {hasMap && (
        <button
          type="button"
          title="Карта"
          aria-pressed={mode === "map"}
          className={cn(b, mode === "map" && on)}
          onClick={() => onChange("map")}
        >
          <MapIcon />
        </button>
      )}
    </div>
  )
}

/** «Сортировка: ID» в виде карточек — те же колонки, что и в таблице. */
function SortSelect<T extends Row>({ cfg, q, setQ }: { cfg: ListConfig<T>; q: Query; setQ: (q: Query) => void }) {
  const cols = cfg.cols.filter((c) => !c.noSort)
  const cur = cols.find((c) => c.k === q.sort[0])
  return (
    <label className="relative flex h-11 flex-none items-center gap-1 rounded-full border border-border bg-[var(--chip-bg)] pr-10 pl-4 text-sm whitespace-nowrap text-[var(--nav-text)] max-sm:h-10">
      Сортировка: {cur ? (cur.k === cols[0]?.k ? "ID" : cur.t) : "ID"}
      {cur && q.sort[1] < 0 && " ↓"}
      <select
        aria-label="Сортировка"
        value={q.sort[0] ? `${q.sort[0]}:${q.sort[1]}` : ""}
        onChange={(e) => {
          const [k, d] = e.target.value.split(":")
          setQ({ ...q, sort: [k ?? "", d === "-1" ? -1 : 1] })
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">ID — как в базе</option>
        {cols.flatMap((c) => [
          <option key={`${c.k}:1`} value={`${c.k}:1`}>
            {c.t} ↑
          </option>,
          <option key={`${c.k}:-1`} value={`${c.k}:-1`}>
            {c.t} ↓
          </option>,
        ])}
      </select>
      <ChevronDown className="absolute right-3.5 size-4 opacity-60" />
    </label>
  )
}

/** QR · изменить · удалить. TODO: QR (n-10), правка (n-05), удаление с причиной (n-09). */
function RowActions() {
  return (
    <div className="flex justify-end gap-1.5">
      <button type="button" className={cn(circ, "size-8")} title="QR-код" onClick={() => toast("QR-код узла — следующим экраном")}>
        <QrCode />
      </button>
      <button type="button" className={cn(circ, "size-8")} title="Изменить" onClick={() => toast("Редактирование — следующим экраном")}>
        <Pencil />
      </button>
      <button
        type="button"
        className={cn(circ, "size-8 hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
        title="Удалить"
        onClick={() => toast("Удаление с причиной — следующим экраном")}
      >
        <Trash2 />
      </button>
    </div>
  )
}

/** Вид «Карточки» (экран n-01): фото со статусом, название, теги, полоса, действия и «Паспорт». */
function Cards<T extends Row>({
  cfg,
  rows,
  checked,
  toggle,
}: {
  cfg: ListConfig<T>
  rows: T[]
  checked: Set<number>
  toggle: (id: number) => void
}) {
  if (!rows.length) return <div className="py-16 text-center text-muted-foreground">Ничего не найдено — измените поиск или фильтры</div>
  return (
    <div className="mt-[18px] grid grid-cols-4 gap-4 max-[1500px]:grid-cols-3 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
      {rows.map((x) => {
        const c = cfg.card(x)
        const on = checked.has(x.id)
        return (
          <article
            key={x.id}
            className={cn(
              "flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-[var(--glass-card)] backdrop-blur-[18px] transition-[transform,box-shadow] duration-250 hover:-translate-y-0.5",
              on && "border-[#085eff] shadow-[0_0_0_1px_#085eff]",
            )}
          >
            <div className="relative h-[130px] bg-[var(--feat-bg)]">
              {c.photo && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${c.photo})` }} />}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,var(--glass-card-solid))]" />
              <Pill tone={c.status.tone} className="absolute top-3 left-3 bg-[rgba(10,11,14,0.6)] backdrop-blur">
                {c.status.label}
              </Pill>
              <span className="absolute top-3 right-3 [&_button]:bg-[rgba(10,11,14,0.4)]">
                <Check on={on} label="Выбрать" onClick={() => toggle(x.id)} />
              </span>
            </div>
            <div className="flex flex-1 flex-col px-4 pt-2 pb-4">
              <b className="truncate text-base font-semibold">{c.title}</b>
              <span className="mt-1 truncate text-[12.5px] text-muted-foreground">{c.sub}</span>
              {c.tags && (
                <span className="mt-2.5 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </span>
              )}
              {c.bar && (
                <>
                  <span className="mt-3 flex justify-between text-[12.5px] text-muted-foreground">
                    {c.bar.t}
                    <b className="font-medium text-foreground tabular-nums">{c.bar.v}</b>
                  </span>
                  <Bar pct={c.bar.pct} className="mt-2 h-1" />
                </>
              )}
              <div className="mt-4 flex items-center gap-1.5">
                <RowActions />
                <button type="button" className={cn(btn({ sm: true }), "ml-auto")} onClick={() => toast("Паспорт — следующим этапом")}>
                  <ArrowRight />
                  {c.open}
                </button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function Pager({
  total,
  page,
  pages,
  size,
  sizes,
  onSize,
  onPage,
}: {
  total: number
  page: number
  pages: number
  size: number
  sizes: number[]
  onSize: (s: number) => void
  onPage: (p: number) => void
}) {
  // 1 2 3 … 70 — как в макете: первые, текущая с соседями, последняя
  const nums = [...new Set([0, 1, 2, page - 1, page, page + 1, pages - 1])].filter((i) => i >= 0 && i < pages).sort((a, b) => a - b)
  const b =
    "grid h-[38px] min-w-[38px] cursor-pointer place-items-center rounded-full border border-border bg-[var(--chip-bg)] px-2.5 text-[13px] text-[var(--nav-text)] tabular-nums disabled:cursor-default disabled:opacity-40"
  const from = total ? page * size + 1 : 0
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-1.5 text-[13px] text-muted-foreground">
      <label className="relative flex h-[38px] items-center rounded-full border border-border bg-[var(--chip-bg)] pr-9 pl-4 text-[var(--nav-text)]">
        Показать
        <select
          value={size}
          onChange={(e) => onSize(Number(e.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Строк на странице"
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-1.5">{size}</span>
        <ChevronDown className="absolute right-3 size-4 opacity-60" />
      </label>
      <span className="tabular-nums">
        {fmt(from)}–{fmt(Math.min(total, (page + 1) * size))} из {fmt(total)}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" className={b} disabled={!page} onClick={() => onPage(page - 1)} aria-label="Назад">
          ←
        </button>
        {nums.map((i, k) => (
          <span key={i} className="contents">
            {k > 0 && i - nums[k - 1] > 1 && <span className={cn(b, "cursor-default")}>…</span>}
            <button type="button" className={cn(b, i === page && "border-[#085eff] bg-[#085eff] text-white")} onClick={() => onPage(i)}>
              {fmt(i + 1)}
            </button>
          </span>
        ))}
        <button type="button" className={b} disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label="Вперёд">
          →
        </button>
      </div>
    </div>
  )
}

function PreviewPanel<T extends Row>({ cfg, row, onClose }: { cfg: ListConfig<T>; row: T; onClose: () => void }) {
  const p = cfg.preview(row)
  return (
    <aside className="sticky top-4 w-[420px] flex-none self-start overflow-hidden rounded-3xl border border-border bg-[var(--glass-card)] backdrop-blur-[18px] max-[1500px]:w-[360px] max-[1279px]:hidden">
      <div className="relative h-[270px] bg-[var(--feat-bg)]">
        {p.photo && <div className="absolute inset-0 bg-cover bg-[position:50%_30%]" style={{ backgroundImage: `url(${p.photo})` }} />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,11,14,0.1)_40%,var(--glass-card-solid))]" />
        <div className="absolute inset-x-4 top-3.5 flex items-center justify-between">
          <Pill tone={p.status.tone} className="bg-[rgba(10,11,14,0.6)] backdrop-blur">
            {p.status.label}
          </Pill>
          <button type="button" aria-label="Закрыть превью" onClick={onClose} className={cn(circ, "bg-[rgba(10,11,14,0.5)] text-white")}>
            <X />
          </button>
        </div>
      </div>
      <div className="px-[22px] pt-1 pb-[22px]">
        <h3 className="text-2xl font-semibold tracking-[-0.3px]">{p.title}</h3>
        <p className="mt-1 mb-3 text-[13px] text-muted-foreground">{p.sub}</p>
        <dl className="text-[13.5px]">
          {p.facts.map((f) => (
            <div key={f.t} className="flex justify-between gap-4 border-b border-border py-2.5">
              <dt className="text-muted-foreground">{f.t}</dt>
              <dd className="text-right font-medium">{f.v}</dd>
            </div>
          ))}
        </dl>
        <div className="my-3.5 grid grid-cols-4 gap-2">
          {p.stats.map((s) => (
            <div key={s.t} className="rounded-[14px] border border-border bg-[var(--chip-bg)] p-3">
              <span className="block truncate text-xs text-muted-foreground">{s.t}</span>
              <b className="mt-1 block text-xl font-medium tabular-nums">{s.v}</b>
            </div>
          ))}
        </div>
        {p.tags && (
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          {/* TODO: «На карте» и «Изменить» — экраны карты и правки */}
          <button type="button" title="На карте" className={cn(circ, "size-11")} onClick={() => toast("Узел на карте — экран «Карта»")}>
            <MapIcon />
          </button>
          <button
            type="button"
            title="Изменить"
            className={cn(circ, "size-11")}
            onClick={() => toast("Редактирование — следующим экраном")}
          >
            <Pencil />
          </button>
          <button
            type="button"
            className={cn(btn({ primary: true }), "flex-1 justify-center")}
            onClick={() => toast("Паспорт — следующим этапом")}
          >
            {p.more}
            <ArrowRight />
          </button>
        </div>
      </div>
    </aside>
  )
}
