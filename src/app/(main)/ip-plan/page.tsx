"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { Download, FileSpreadsheet, Filter, GitFork, Pencil, Plus } from "lucide-react"
import { FiltersPanel, type Picked } from "@/components/blocks/filters-panel"
import { HeroButton, KpiCard, ListHero } from "@/components/blocks/list-hero"
import { ReportDialog } from "@/components/blocks/report-dialog"
import { Pager } from "@/components/blocks/table"
import { ActiveChips, FilterChip, SearchBox, Toolbar, type ActiveChip } from "@/components/blocks/toolbar"
import { AddressUsage } from "@/components/ip-plan/address-usage"
import { AllocDialog } from "@/components/ip-plan/alloc-dialog"
import { IpPlanForm } from "@/components/ip-plan/ip-plan-form"
import { SubnetTree } from "@/components/ip-plan/subnet-tree"
import { btn, circ, Pill } from "@/components/list/ui"
import { RoleGate } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { BRANCH_OPTIONS } from "@/lib/api/equipment"
import { inSubnet, IP_DOT, IP_STATUS, ipPlan, ipPlanColumns, ipStatus, PREFIXES, SUBNETS, useIpAddresses, type IpAddress } from "@/lib/api/ip-plan"
import { picked, withCounts } from "@/lib/list/filter"
import { fmt } from "@/lib/list/query"
import { cn } from "@/lib/utils"

/*
 * 15 Единый IP-план: дерево подсетей слева, справа — «Адресный план» (таблица) или «Распределение адресов»
 * (сетка использования сети), окно «Выделить подсеть» (ip-04), правка — шторка (ip-03), отчёт (ip-05).
 * Данные — useIpAddresses() / ipPlan.usePage() из lib/api/ip-plan. Доступ: admin, ip_manager.
 */

const HERO = "/equipment/switch-hero.jpg"
const UNIT: [string, string, string] = ["запись", "записи", "записей"]

/** Колонки таблицы — как в макете, без «Филиала». */
const COLS: { k: keyof IpAddress["f"] | "st"; t: string }[] = [
  { k: "ip", t: "IP-адрес" },
  { k: "prefix", t: "Префикс" },
  { k: "client", t: "Клиент" },
  { k: "place", t: "Локация" },
  { k: "speed", t: "Скорость" },
  { k: "kcrm", t: "Заявка KCRM" },
  { k: "eng", t: "Менеджер/Инженер" },
  { k: "st", t: "Статус" },
]

/** Отбор: поиск и фильтры (branch, prefix, status). Сортировки в таблице нет. */
type Query = { search: string; f: Picked; sort: ["", 1] }
const EMPTY: Query = { search: "", f: {}, sort: ["", 1] }

const FILTER_OF: Record<string, (x: IpAddress) => string> = {
  branch: (x) => x.branch,
  prefix: (x) => x.f.prefix,
  status: (x) => x.status,
}

const searchText = (x: IpAddress) =>
  `${x.f.ip} ${x.f.prefix} ${x.f.client} ${x.f.place} ${x.f.speed} ${x.f.kcrm} ${x.f.eng} ${x.branch} ${x.nodeCode} ${x.city}`.toLowerCase()

function filterIps(rows: IpAddress[], q: Query) {
  const needle = q.search.trim().toLowerCase()
  return rows.filter((x) => (!needle || searchText(x).includes(needle)) && Object.entries(FILTER_OF).every(([k, get]) => picked(q.f[k], get(x))))
}

const STATUS_OPTIONS = Object.entries(IP_STATUS).map(([v, [label]]) => ({ v, label }))
const PREFIX_OPTIONS = PREFIXES.map((v) => ({ v, label: v }))

/** KPI после «Записей»: цифры макета. TODO(API): сводка IP-плана. */
const KPIS = [
  { t: "Адресов IPv4", color: "#a78bfa", value: "1,2 млн", note: "", pct: 50 },
  { t: "Занято", color: "#22d3ee", value: "61%", note: "", pct: 61 },
  { t: "Тестовый доступ", color: "var(--status-nolink)", value: "38", note: "истекает 9", pct: 20 },
  { t: "Не совпадает с Onyma", color: "#ff5257", value: "142", note: "", pct: 1 },
]

export default function Page() {
  usePageTitle("Единый IP-план")
  return (
    <RoleGate section="Единый IP-план" roles={["admin", "ip_manager"]}>
      <IpPlanPage />
    </RoleGate>
  )
}

function IpPlanPage() {
  const all = useIpAddresses()
  const remote = ipPlan.isRemote()
  const remoteOpts = ipPlan.useOptions()
  const [net, setNet] = useState("185.12.40.0/24")
  const [view, setView] = useState<"plan" | "usage">("plan")
  const [q, setQState] = useState<Query>(EMPTY)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [more, setMore] = useState(false)
  const [form, setForm] = useState<number | null>(null)
  const [report, setReport] = useState(false)
  const [alloc, setAlloc] = useState(false)
  const [active, setActive] = useState<number | null>(all[0]?.id ?? null)
  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  const deferred = useDeferredValue(q)
  // Выбранная в дереве подсеть отбирает адреса (TODO(API): параметр подсети в /list)
  const inNet = useMemo(() => all.filter((x) => inSubnet(x.f.ip, net)), [all, net])
  const list = useMemo(() => filterIps(inNet, deferred), [inNet, deferred])
  const pages0 = Math.max(1, Math.ceil(list.length / size))
  const srv = ipPlan.usePage(list, deferred, remote ? page : Math.min(page, pages0 - 1), size)
  const total = srv.total
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const shown = srv.rows
  // В API счётчики — только по текущей странице
  const rows = remote ? srv.rows : all
  const node = SUBNETS.find((n) => n.cidr === net) ?? SUBNETS[2]

  const options = {
    branch: withCounts(rows, FILTER_OF.branch, BRANCH_OPTIONS),
    prefix: withCounts(rows, FILTER_OF.prefix, remoteOpts.prefix ?? PREFIX_OPTIONS),
    status: withCounts(rows, FILTER_OF.status, STATUS_OPTIONS),
  }
  const setF = (k: string) => (v: string[]) => setQ({ ...q, f: { ...q.f, [k]: v } })
  const formRow = form === null ? undefined : rows.find((x) => x.id === form)

  return (
    <div className="relative isolate">
      <ListHero crumb="Сервисы" title="Единый IP-план" total={total} sub="Адресное пространство QMobile · доступ: admin, ip_manager" hero={HERO}>
        <HeroButton icon={FileSpreadsheet} label="Сводный отчёт" href="/summary-files?section=ip-plan" />
        <HeroButton icon={Download} label="Отчёт" onClick={() => setReport(true)} />
        <HeroButton icon={Plus} label="Добавить" primary onClick={() => setAlloc(true)} />
      </ListHero>

      <div className="relative z-[1] -mt-[148px] grid grid-cols-5 gap-3.5 px-(--page-gutter) max-[1279px]:mt-4 max-[1279px]:grid-cols-3 max-sm:grid-cols-2">
        {[{ t: "Записей", color: "#085eff", value: fmt(remote ? srv.total : all.length), note: "", pct: 100 }, ...KPIS].map((k) => (
          <KpiCard key={k.t} {...k} />
        ))}
      </div>

      <div className="mt-[18px] grid grid-cols-[440px_1fr] items-start gap-[18px] px-(--page-gutter) max-[1279px]:grid-cols-1">
        <SubnetTree
          value={net}
          onChange={(v) => {
            setNet(v)
            setPage(0)
          }}
        />

        <section className="min-w-0 rounded-3xl border border-border bg-[var(--glass-card)] px-3 pt-4 pb-3 backdrop-blur-[18px]">
          {view === "plan" ? (
            <Toolbar>
              <SearchBox value={q.search} onChange={(search) => setQ({ ...q, search })} placeholder="Поиск по IP, клиенту, локации…" />
              <FilterChip label="Филиал" all="Все филиалы" options={options.branch} value={q.f.branch ?? []} onChange={setF("branch")} short={(v) => v} />
              <FilterChip label="Префикс" options={options.prefix} value={q.f.prefix ?? []} onChange={setF("prefix")} />
              <button type="button" className={cn(btn(), "font-normal text-[var(--nav-text)]")} onClick={() => setMore(true)}>
                <Filter />
                Фильтр
              </button>
            </Toolbar>
          ) : (
            <header className="mx-1.5 mb-3 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[11px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                <GitFork className="size-[18px]" />
              </span>
              <h3 className="flex-1 text-base font-semibold">
                <span className="font-mono">{node.cidr}</span> · использование
              </h3>
            </header>
          )}
          <div className="mx-1.5 mb-3 flex flex-wrap gap-2">
            {(
              [
                ["plan", "Адресный план"],
                ["usage", "Распределение адресов (использование сетей)"],
              ] as const
            ).map(([k, t]) => (
              <button
                key={k}
                type="button"
                aria-pressed={view === k}
                onClick={() => setView(k)}
                className={cn(
                  "h-10 rounded-full border border-border px-4 text-[13.5px] text-[var(--nav-text)]",
                  view === k && "border-[#085eff] bg-[rgba(8,94,255,0.16)] text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {view === "plan" ? (
            <>
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
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((x) => {
                      const on = x.id === active
                      const [label, tone] = ipStatus(x)
                      return (
                        <tr key={x.id} onClick={() => setActive(x.id)} onDoubleClick={() => setForm(x.id)} className="group/r cursor-pointer">
                          {COLS.map((c, i) => (
                            <td
                              key={c.k}
                              className={cn(
                                "border-y border-transparent bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-3.5 py-3.5 whitespace-nowrap first:rounded-l-[14px] first:border-l group-hover/r:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
                                on && "border-[#2f6bff] bg-[rgba(8,94,255,0.1)] first:border-l",
                                c.k === "place" && "text-muted-foreground",
                              )}
                            >
                              {i === 0 ? (
                                <span className="flex items-center gap-2.5 font-mono font-semibold">
                                  <i className="size-2.5 rounded-[3px]" style={{ background: IP_DOT[x.status] }} />
                                  {x.f.ip}
                                </span>
                              ) : c.k === "st" ? (
                                <Pill tone={tone}>{label}</Pill>
                              ) : (
                                String(x.f[c.k] ?? "—")
                              )}
                            </td>
                          ))}
                          <td
                            className={cn(
                              "rounded-r-[14px] border-y border-r border-transparent bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-3.5 text-right group-hover/r:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
                              on && "border-[#2f6bff] bg-[rgba(8,94,255,0.1)]",
                            )}
                          >
                            <button
                              type="button"
                              className={circ}
                              aria-label="Изменить"
                              onClick={(e) => {
                                e.stopPropagation()
                                setForm(x.id)
                              }}
                            >
                              <Pencil />
                            </button>
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
            </>
          ) : (
            <AddressUsage net={node} />
          )}
        </section>
      </div>

      <FiltersPanel
        open={more}
        onOpenChange={setMore}
        title="Единый IP-план"
        unit={UNIT}
        total={rows.length}
        value={q.f}
        found={(f) => filterIps(rows, { ...q, f }).length}
        onApply={(f) => setQ({ ...q, f })}
        groups={[
          { k: "branch", t: "Филиал", ui: "tags", opts: options.branch, short: (v) => v },
          { k: "prefix", t: "Префикс", any: "Любой", opts: options.prefix },
          { k: "status", t: "Статус", any: "Любой", opts: options.status },
        ]}
      />
      {report && (
        <ReportDialog
          title="Единый IP-план"
          columns={ipPlanColumns}
          rows={rows}
          filtered={filterIps(rows, q)}
          active={describe(q, options)}
          branches={{ label: "Филиал", all: "Все филиалы", opts: BRANCH_OPTIONS }}
          onClose={() => setReport(false)}
        />
      )}
      {form !== null && <IpPlanForm key={form} row={formRow} onClose={() => setForm(null)} />}
      {alloc && <AllocDialog net={node} rows={all} onClose={() => setAlloc(false)} />}
    </div>
  )
}

type Options = Record<string, { v: string; label: string }[]>
const LABEL: Record<string, string> = { branch: "Филиал", prefix: "Префикс", status: "Статус" }
const label = (o: Options, k: string, v: string) => (k === "branch" ? v : (o[k]?.find((x) => x.v === v)?.label ?? v))

/** Плашки включённых фильтров под панелью. */
function activeChips(q: Query, setQ: (q: Query) => void, o: Options): ActiveChip[] {
  return Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => ({ label: `${LABEL[k]}: ${v.map((x) => label(o, k, x)).join(", ")}`, clear: () => setQ({ ...q, f: { ...q.f, [k]: [] } }) }))
}

/** Текущие фильтры одной строкой для отчёта. */
function describe(q: Query, o: Options) {
  const parts = Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => v.map((x) => label(o, k, x)).join(", "))
  if (q.search.trim()) parts.push(`поиск «${q.search.trim()}»`)
  return parts.join(" · ")
}
