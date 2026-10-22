"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { ChevronLeft, DatabaseBackup, Download, Eye, Play, Search, Server } from "lucide-react"
import { ActiveChips, FilterChip } from "@/components/list/filters"
import { Input } from "@/components/list/form-controls"
import { Hero, Pager } from "@/components/list/list-page"
import { Bar, btn, circ, Pill } from "@/components/list/ui"
import { Modal } from "@/components/passport/modal"
import { toast } from "@/components/shared/toast"
import type { GenRow } from "@/sections/make"
import { api, apiOn } from "@/lib/api/client"
import { isRemote, useFilterOptions, useRemoteList } from "@/lib/list/remote"
import { applyQuery, emptyQuery, fmt, type Query } from "@/lib/list/query"
import { useRows } from "@/lib/list/store"
import type { HeroButton, ListConfig } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { list as base, spec } from "./config"

/*
 * Резервные копии (макет 18): устройства с последним бэкапом, просмотр конфига со сравнением (bk-02),
 * «Получить резервную копию» (bk-03). API — /api/network-backups (как networkBackupApi в techaccaunt_front):
 * /devices, /content/{id}, /download/{id}, /fetch-config { device_ids }.
 */

const COLS = spec.cols

/** Пример конфига для просмотра: строки с пометкой «-» удалены, «+» добавлены (сравнение с прошлым днём). */
function config(x: GenRow) {
  return [
    `! ${x.f.host} · 07.10.2026 03:00 · сравнение с 06.10`,
    `hostname ${x.f.host}`,
    "!",
    "interface GigabitEthernet1/0/12",
    " description FTTB Mametovoi 65 ID-00248",
    "- switchport access vlan 120",
    "+ switchport access vlan 124",
    " spanning-tree portfast",
    "!",
    "interface GigabitEthernet1/0/25",
    " description uplink rt1.alm1",
    " switchport mode trunk",
    "+ switchport trunk allowed vlan add 124",
    "!",
    "ip default-gateway 10.13.93.1",
    "end",
  ]
}

export function BackupsPage() {
  const remote = isRemote(base)
  const local = useRows(base)
  const remoteOpts = useFilterOptions(base, remote)
  const cfg = useMemo<ListConfig<GenRow>>(
    () => ({
      ...base,
      buttons: [
        { icon: Server, label: "Список устройств", href: "/switches" },
        { icon: DatabaseBackup, label: "Получить резервную копию", primary: true, onClick: "create" },
      ],
      filters: remote ? base.filters.map((f) => (remoteOpts[f.k] ? { ...f, opts: remoteOpts[f.k] } : f)) : base.filters,
    }),
    [remote, remoteOpts],
  )
  const [q, setQState] = useState<Query>(() => emptyQuery(cfg))
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [active, setActive] = useState<number | null>(local[2]?.id ?? null)
  const [view, setView] = useState<GenRow | null>(null)
  const [fetch, setFetch] = useState<GenRow[] | null>(null)
  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  const deferred = useDeferredValue(q)
  const srv = useRemoteList(cfg, remote, deferred, page, size)
  const filtered = useMemo(() => (remote ? [] : applyQuery(cfg, local, deferred)), [cfg, local, deferred, remote])
  const rows = remote ? srv.rows : local
  const total = remote ? srv.total : filtered.length
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const shown = remote ? srv.rows : filtered.slice(pg * size, pg * size + size)
  const count = (st: string) => local.filter((x) => x.status === st).length

  const action = (b: HeroButton) => {
    if (b.onClick !== "create") return
    // Выбранная строка и соседняя — как в макете; без выбора — первые две
    const i = Math.max(
      0,
      shown.findIndex((x) => x.id === active),
    )
    setFetch(shown.slice(i, i + 2).length ? shown.slice(i, i + 2) : shown.slice(0, 2))
  }
  const download = (x: GenRow) => {
    if (apiOn()) window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/network-backups/download/${x.id}`)
    else toast(`Скачивание ${x.f.host}.cfg — после подключения API`)
  }

  const kpis = [
    { t: "Успешно", color: "var(--status-ok)", value: fmt(remote ? srv.total : count("ok") + count("changed")), note: "сегодня", pct: 98 },
    ...cfg.kpis(local).slice(1, 5),
  ]

  return (
    <div className="relative isolate">
      {view && <ConfigDrawer x={view} onClose={() => setView(null)} onFetch={() => setFetch([view])} onDownload={() => download(view)} />}
      {fetch && <FetchDialog rows={fetch} onClose={() => setFetch(null)} />}
      <Hero cfg={cfg} total={total} onAction={action} />

      <div className="relative z-[1] -mt-[148px] grid grid-cols-5 gap-3.5 px-(--page-gutter) max-[1279px]:mt-4 max-[1279px]:grid-cols-3 max-sm:grid-cols-2">
        {kpis.map((k) => (
          <div key={k.t} className="rounded-3xl border border-border bg-[var(--glass-card)] px-5 py-[18px] backdrop-blur-[18px]">
            <div className="flex items-center gap-2 text-[13px] whitespace-nowrap text-muted-foreground">
              <i className="size-[7px] flex-none rounded-full" style={{ background: k.color }} />
              <span className="truncate">{k.t}</span>
            </div>
            <b className="mt-2 block text-[30px] leading-tight font-medium tracking-[-0.02em] whitespace-nowrap tabular-nums">
              {k.value}
              {k.note && <em className="ml-1.5 text-[13px] font-normal text-muted-foreground not-italic">{k.note}</em>}
            </b>
            <Bar pct={k.pct} color={k.color} className="mt-2.5 h-[5px]" />
          </div>
        ))}
      </div>

      <section className="mx-(--page-gutter) mt-[18px] rounded-3xl border border-border bg-[var(--glass-card)] px-3 pt-4 pb-3 backdrop-blur-[18px]">
        <div className="mx-1.5 mb-2 flex flex-wrap items-center gap-2.5">
          <Input
            icon={<Search />}
            value={q.q}
            onChange={(e) => setQ({ ...q, q: e.target.value })}
            placeholder={cfg.search}
            className="h-11 max-w-[340px] min-w-[200px] flex-[1_1_220px] rounded-full"
          />
          {cfg.filters
            .filter((f) => !f.more)
            .map((f) => (
              <FilterChip
                key={f.k}
                filter={f}
                rows={rows}
                value={q.f[f.k] ?? []}
                onChange={(v) => setQ({ ...q, f: { ...q.f, [f.k]: v } })}
              />
            ))}
        </div>
        <ActiveChips cfg={cfg} q={q} setQ={setQ} />
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
                        ) : c.show === "status" ? (
                          <Pill tone={cfg.card(x).status.tone}>{cfg.card(x).status.label}</Pill>
                        ) : (
                          <span className={cn(c.k === "ip" && "font-mono", c.show === "bold" && "font-semibold")}>
                            {String(x.f[c.k] ?? "—")}
                          </span>
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
                        <button type="button" className={circ} title="Получить сейчас" onClick={() => setFetch([x])}>
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

/** Шторка резервной копии (bk-02): данные устройства и конфиг — полный, изменения или лог снятия. */
function ConfigDrawer({
  x,
  onClose,
  onFetch,
  onDownload,
}: {
  x: GenRow
  onClose: () => void
  onFetch: () => void
  onDownload: () => void
}) {
  const [tab, setTab] = useState<"full" | "diff" | "log">(x.status === "changed" ? "diff" : "full")
  const [remote, setRemote] = useState<string | null>(null)
  // В API — содержимое последнего бэкапа. TODO(API): id бэкапа устройства (сейчас берётся id строки)
  useEffect(() => {
    if (!apiOn()) return
    api
      .get<{ content?: string } | string>(`/api/network-backups/content/${x.id}`)
      .then((d) => setRemote(typeof d === "string" ? d : (d.content ?? "")))
      .catch(() => setRemote(null))
  }, [x.id])
  const lines = remote ? remote.split("\n") : config(x)
  const plus = lines.filter((l) => l.startsWith("+")).length
  const minus = lines.filter((l) => l.startsWith("-")).length
  const st = base.card(x).status
  const shown =
    tab === "log"
      ? [
          `[03:00:01] connect ${x.f.ip}:22 ssh`,
          "[03:00:02] auth ok (tacacs)",
          "[03:00:03] terminal length 0",
          "[03:00:04] show running-config",
          `[03:00:09] saved ${x.f.host}_20261007_0300.cfg (${lines.length} строк)`,
          x.status === "error" ? "[03:00:09] ERROR: timeout" : "[03:00:09] done",
        ]
      : tab === "diff"
        ? lines
        : lines.filter((l) => !l.startsWith("-")).map((l) => (l.startsWith("+") ? ` ${l.slice(1)}` : l))
  return (
    <Modal
      side
      title={`Резервная копия · ${x.f.host}`}
      sub={`07.10.2026 ${String(x.f.date).split(" ")[1] ?? ""} · ${plus + minus} строки изменились`}
      icon={DatabaseBackup}
      width={720}
      onClose={onClose}
    >
      <div className="flex-1 overflow-y-auto px-7 py-4">
        <dl className="text-[13.5px]">
          {(
            [
              ["Имя устройства", x.f.host],
              ["IP адрес", x.f.ip],
              ["Тип ОС", x.f.os],
              ["Филиал", x.branch],
              ["Статус", x.status === "changed" ? "Успешно · изменён" : st.label],
              ["Дата создания", `07.10.2026 ${String(x.f.date).split(" ")[1] ?? ""}`],
              ["Запустил", x.f.by],
            ] as const
          ).map(([t, v]) => (
            <div key={t} className="flex justify-between gap-4 border-b border-border py-3.5">
              <dt className="text-muted-foreground">{t}</dt>
              <dd className="font-medium">{String(v ?? "—")}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase after:h-px after:flex-1 after:bg-border">
          Конфигурация
        </p>
        <div className="mb-3 flex gap-2">
          {(
            [
              ["full", "Полная"],
              ["diff", "Изменения"],
              ["log", "Логирование"],
            ] as const
          ).map(([k, t]) => (
            <button
              key={k}
              type="button"
              aria-pressed={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-full border border-border px-4 text-[13.5px]",
                tab === k && "border-[#085eff] bg-[rgba(8,94,255,0.16)]",
              )}
            >
              {t}
              {k === "diff" && (
                <em className="rounded-full bg-[var(--chip-bg)] px-2 text-[11px] not-italic">
                  +{plus} −{minus}
                </em>
              )}
            </button>
          ))}
        </div>
        <pre className="overflow-x-auto rounded-2xl border border-border bg-[#0b0c10] py-3 font-mono text-[12.5px] leading-[1.6] text-[#d5d9e0] not-dark:bg-[#f6f7f9] not-dark:text-[#1c1c1e]">
          {shown.map((l, i) => (
            <div
              key={i}
              className={cn(
                "px-4 whitespace-pre",
                l.startsWith("!") && i === 0 && "text-muted-foreground",
                tab === "diff" && l.startsWith("-") && "bg-[rgba(255,59,59,0.14)] text-[#ff7b7b] line-through",
                tab === "diff" && l.startsWith("+") && "bg-[rgba(43,212,99,0.14)] text-[#5ee08b]",
                /ERROR/.test(l) && "text-[#ff7b7b]",
              )}
            >
              {tab === "diff" && /^[+-]/.test(l) ? ` ${l.slice(1)}` : l}
            </div>
          ))}
        </pre>
      </div>
      <footer className="flex items-center gap-2.5 border-t border-[var(--dd-line)] px-7 py-4">
        <button type="button" className={btn()} onClick={() => toast("Предыдущая копия — после подключения API (/history)")}>
          <ChevronLeft />
          Предыдущая
        </button>
        <span className="flex-1" />
        <button type="button" className={btn()} onClick={onDownload}>
          <Download />
          Скачать
        </button>
        <button type="button" className={btn({ primary: true })} onClick={onFetch}>
          <Play />
          Получить сейчас
        </button>
      </footer>
    </Modal>
  )
}

/** «Получить резервную копию?» (bk-03): список устройств и запуск снятия конфига. */
function FetchDialog({ rows, onClose }: { rows: GenRow[]; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      if (apiOn()) await api.post("/api/network-backups/fetch-config", { device_ids: rows.map((x) => x.id) })
      toast(`Запущено снятие конфига: ${rows.length} ${rows.length === 1 ? "устройство" : "устройства"}`)
      onClose()
    } catch (e) {
      toast(`Не удалось: ${(e as Error).message}`)
      setBusy(false)
    }
  }
  return (
    <Modal title="Получить резервную копию?" icon={DatabaseBackup} width={520} onClose={onClose}>
      <div className="px-6 pt-4 pb-6">
        <p className="text-[13.5px] text-muted-foreground">
          Будет снят текущий конфиг выбранных устройств. Это займёт ~10 секунд на устройство.
        </p>
        <ul className="mt-4 rounded-2xl border border-border px-4 py-2.5 text-[13.5px]">
          {rows.map((x) => (
            <li key={x.id} className="flex items-center gap-2.5 py-1 font-semibold">
              <Server className="size-4 text-muted-foreground" />
              {String(x.f.host)} · {String(x.f.ip)}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex justify-end gap-2.5">
          <button type="button" className={btn()} onClick={onClose}>
            Отмена
          </button>
          <button type="button" className={btn({ primary: true })} disabled={busy} onClick={run}>
            <Play />
            {busy ? "Запуск…" : "Получить"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
