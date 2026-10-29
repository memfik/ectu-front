"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { DatabaseBackup, Download, Eye, Play, Search, Server } from "lucide-react"
import type { Picked } from "@/components/blocks/filters-panel"
import { HeroButton, KpiCard, ListHero } from "@/components/blocks/list-hero"
import { Pager } from "@/components/blocks/table"
import { ActiveChips, FilterChip, Toolbar, type ActiveChip } from "@/components/blocks/toolbar"
import { ConfigDrawer } from "@/components/backups/config-drawer"
import { FetchDialog } from "@/components/backups/fetch-dialog"
import { Input } from "@/components/list/form-controls"
import { circ, Pill } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { usePageTitle } from "@/hooks/use-page-title"
import { backupDownloadUrl, backups, backupStatus, useBackups, type Backup } from "@/lib/api/backups"
import { BRANCH_OPTIONS } from "@/lib/api/equipment"
import { distinct, picked, withCounts } from "@/lib/list/filter"
import { fmt } from "@/lib/list/query"
import { cn } from "@/lib/utils"

/*
 * 18 Резервные копии: устройства с последним бэкапом, просмотр конфига со сравнением (bk-02),
 * «Получить резервную копию» (bk-03). Данные — useBackups() / backups.usePage() из lib/api/backups.
 * Раздел только для чтения: без создания, правки и удаления.
 */

const HERO = "/equipment/switch-hero.jpg"

const COLS: { k: keyof Backup["f"] | "branch" | "st"; t: string }[] = [
  { k: "branch", t: "Филиал" },
  { k: "ip", t: "IP адрес" },
  { k: "host", t: "Имя устройства" },
  { k: "os", t: "Тип ОС" },
  { k: "st", t: "Статус" },
  { k: "date", t: "Дата" },
  { k: "by", t: "Запустил" },
]

/** Отбор: поиск и фильтры (branch, os). Сортировки в таблице нет. */
type Query = { search: string; f: Picked; sort: ["", 1] }
const EMPTY: Query = { search: "", f: {}, sort: ["", 1] }

const FILTER_OF: Record<string, (x: Backup) => string> = {
  branch: (x) => x.branch,
  os: (x) => x.f.os,
}

const searchText = (x: Backup) => `${x.branch} ${x.f.ip} ${x.f.host} ${x.f.os} ${x.f.date} ${x.f.by} ${x.nodeCode} ${x.city}`.toLowerCase()

function filterBackups(rows: Backup[], q: Query) {
  const needle = q.search.trim().toLowerCase()
  return rows.filter((x) => (!needle || searchText(x).includes(needle)) && Object.entries(FILTER_OF).every(([k, get]) => picked(q.f[k], get(x))))
}

/** KPI после «Успешно»: цифры макета. TODO(API): сводка бэкапов. */
const KPIS = [
  { t: "Ошибка", color: "#ff5257", value: "16", note: "", pct: 1 },
  { t: "Ожидание", color: "#8c919b", value: "0", note: "", pct: 0 },
  { t: "Изменились конфиги", color: "var(--status-nolink)", value: "23", note: "за сутки", pct: 2 },
  { t: "Хранение", color: "#a78bfa", value: "90 дней", note: "", pct: 50 },
]

export default function BackupsPage() {
  usePageTitle("Резервные копии")
  const all = useBackups()
  const remote = backups.isRemote()
  const remoteOpts = backups.useOptions()
  const [q, setQState] = useState<Query>(EMPTY)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [active, setActive] = useState<number | null>(all[2]?.id ?? null)
  const [view, setView] = useState<Backup | null>(null)
  const [fetching, setFetching] = useState<Backup[] | null>(null)
  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  const deferred = useDeferredValue(q)
  const list = useMemo(() => filterBackups(all, deferred), [all, deferred])
  const pages0 = Math.max(1, Math.ceil(list.length / size))
  const srv = backups.usePage(list, deferred, remote ? page : Math.min(page, pages0 - 1), size)
  const total = srv.total
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const shown = srv.rows
  // В API счётчики — только по текущей странице
  const rows = remote ? srv.rows : all
  const count = (st: string) => all.filter((x) => x.status === st).length

  const oses = useMemo(() => distinct(all, (x) => x.f.os), [all])
  const options = {
    branch: withCounts(rows, FILTER_OF.branch, BRANCH_OPTIONS),
    os: withCounts(rows, FILTER_OF.os, remoteOpts.os ?? oses),
  }
  const setF = (k: string) => (v: string[]) => setQ({ ...q, f: { ...q.f, [k]: v } })

  const fetchSelected = () => {
    // Выбранная строка и соседняя — как в макете; без выбора — первые две
    const i = Math.max(
      0,
      shown.findIndex((x) => x.id === active),
    )
    setFetching(shown.slice(i, i + 2).length ? shown.slice(i, i + 2) : shown.slice(0, 2))
  }
  const download = (x: Backup) => {
    const url = backupDownloadUrl(x.id)
    if (url) window.open(url)
    else toast(`Скачивание ${x.f.host}.cfg — после подключения API`)
  }

  const kpis = [{ t: "Успешно", color: "var(--status-ok)", value: fmt(remote ? srv.total : count("ok") + count("changed")), note: "сегодня", pct: 98 }, ...KPIS]

  return (
    <div className="relative isolate">
      {view && <ConfigDrawer x={view} onClose={() => setView(null)} onFetch={() => setFetching([view])} onDownload={() => download(view)} />}
      {fetching && <FetchDialog rows={fetching} onClose={() => setFetching(null)} />}
      <ListHero crumb="Сервисы" title="Резервные копии" total={total} sub="Конфигурации сетевых устройств · ночной бэкап в 03:00" hero={HERO}>
        <HeroButton icon={Server} label="Список устройств" href="/switches" />
        <HeroButton icon={DatabaseBackup} label="Получить резервную копию" primary onClick={fetchSelected} />
      </ListHero>

      <div className="relative z-[1] -mt-[148px] grid grid-cols-5 gap-3.5 px-(--page-gutter) max-[1279px]:mt-4 max-[1279px]:grid-cols-3 max-sm:grid-cols-2">
        {kpis.map((k) => (
          <KpiCard key={k.t} {...k} />
        ))}
      </div>

      <section className="mx-(--page-gutter) mt-[18px] rounded-3xl border border-border bg-[var(--glass-card)] px-3 pt-4 pb-3 backdrop-blur-[18px]">
        <Toolbar>
          {/* поиск уже, чем в общем списке (max 340px) — как в макете */}
          <Input
            icon={<Search />}
            value={q.search}
            onChange={(e) => setQ({ ...q, search: e.target.value })}
            placeholder="Поиск по IP или имени…"
            className="h-11 max-w-[340px] min-w-[200px] flex-[1_1_220px] rounded-full"
          />
          <FilterChip label="Филиал" all="Все филиалы" options={options.branch} value={q.f.branch ?? []} onChange={setF("branch")} short={(v) => v} />
          <FilterChip label="Тип ОС" options={options.os} value={q.f.os ?? []} onChange={setF("os")} />
        </Toolbar>
        <ActiveChips chips={activeChips(q, setQ, options)} onClearAll={() => setQ({ ...q, f: {} })} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5 text-[13.5px]">
            <thead>
              <tr className="text-left text-[12.5px] text-muted-foreground">
                {COLS.map((c) => (
                  <th key={c.k} className="px-3.5 py-1 font-medium whitespace-nowrap">
                    {c.t}
                  </th>
                ))}
                <th className="px-3.5 py-1 text-right font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((x) => {
                const on = x.id === active
                const [label, tone] = backupStatus(x)
                const cell = cn(
                  "border-y border-transparent bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-3.5 py-3.5 whitespace-nowrap group-hover/r:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
                  on && "border-[#2f6bff] bg-[rgba(8,94,255,0.1)]",
                )
                return (
                  <tr key={x.id} onClick={() => setActive(x.id)} onDoubleClick={() => setView(x)} className="group/r cursor-pointer">
                    {COLS.map((c, i) => (
                      <td key={c.k} className={cn(cell, i === 0 && "rounded-l-[14px] border-l")}>
                        {c.k === "branch" ? (
                          x.branch
                        ) : c.k === "st" ? (
                          <Pill tone={tone}>{label}</Pill>
                        ) : (
                          <span className={cn(c.k === "ip" && "font-mono", c.k === "host" && "font-semibold")}>{String(x.f[c.k] ?? "—")}</span>
                        )}
                      </td>
                    ))}
                    <td className={cn(cell, "rounded-r-[14px] border-r py-2")} onClick={(e) => e.stopPropagation()}>
                      <span className="flex justify-end gap-1.5">
                        <button type="button" className={circ} title="Просмотр" onClick={() => setView(x)}>
                          <Eye />
                        </button>
                        <button type="button" className={circ} title="Скачать" onClick={() => download(x)}>
                          <Download />
                        </button>
                        <button type="button" className={circ} title="Получить сейчас" onClick={() => setFetching([x])}>
                          <Play />
                        </button>
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!shown.length && (
                <tr>
                  <td colSpan={COLS.length + 1} className="py-12 text-center text-muted-foreground">
                    {srv.loading ? "Загрузка…" : srv.error ? `Ошибка API: ${srv.error}` : "Ничего не найдено — измените поиск или фильтры"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager
          total={total}
          page={pg}
          pages={pages}
          size={size}
          sizes={[10, 20, 50, 100]}
          onSize={(n) => {
            setSize(n)
            setPage(0)
          }}
          onPage={setPage}
        />
      </section>
    </div>
  )
}

type Options = Record<string, { v: string; label: string }[]>
const LABEL: Record<string, string> = { branch: "Филиал", os: "Тип ОС" }
const label = (o: Options, k: string, v: string) => (k === "branch" ? v : (o[k]?.find((x) => x.v === v)?.label ?? v))

/** Плашки включённых фильтров под панелью. */
function activeChips(q: Query, setQ: (q: Query) => void, o: Options): ActiveChip[] {
  return Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => ({ label: `${LABEL[k]}: ${v.map((x) => label(o, k, x)).join(", ")}`, clear: () => setQ({ ...q, f: { ...q.f, [k]: [] } }) }))
}
