"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { ChevronDown, CircleCheck, FileSpreadsheet, Filter, GitFork, Pencil, Plus, Search } from "lucide-react"
import { FilterDrawer } from "@/components/list/filter-drawer"
import { ActiveChips, FilterChip } from "@/components/list/filters"
import { Input, Select } from "@/components/list/form-controls"
import { FormDrawer } from "@/components/list/form-drawer"
import { Hero, Pager } from "@/components/list/list-page"
import { ReportDialog } from "@/components/list/report-dialog"
import { Bar, btn, circ, Pill } from "@/components/list/ui"
import { Label, Modal } from "@/components/passport/modal"
import { toast } from "@/components/shared/toast"
import type { GenRow } from "@/sections/make"
import { isRemote, useFilterOptions, useRemoteList } from "@/lib/list/remote"
import { applyQuery, emptyQuery, fmt, type Query } from "@/lib/list/query"
import { rowsStore, useRows } from "@/lib/list/store"
import type { HeroButton, ListConfig } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { list as base, spec } from "./config"

/*
 * Единый IP-план (макет 15): дерево подсетей слева, справа — «Адресный план» (таблица) или
 * «Распределение адресов» (сетка использования сети), окно «Выделить подсеть» (ip-04), правка — шторка (ip-03),
 * отчёт (ip-05). TODO(API): дерево подсетей и использование — /api/ip-address-plan/tree (нет в старом API).
 */

type Net = { cidr: string; t: string; pct: number; depth: number; open?: boolean }
const TREE: Net[] = [
  { cidr: "185.12.0.0/16", t: "Публичные · ГО", pct: 64, depth: 0, open: true },
  { cidr: "185.12.32.0/20", t: "АС · клиенты", pct: 72, depth: 1, open: true },
  { cidr: "185.12.40.0/24", t: "АС · Кенесары", pct: 81, depth: 2 },
  { cidr: "185.12.41.0/24", t: "АС · Республики", pct: 54, depth: 2 },
  { cidr: "185.14.0.0/20", t: "ЮФ · клиенты", pct: 58, depth: 1 },
  { cidr: "10.0.0.0/8", t: "Внутренние", pct: 34, depth: 0, open: true },
  { cidr: "10.40.0.0/16", t: "АС · управление", pct: 47, depth: 1 },
  { cidr: "10.110.0.0/16", t: "VRF CLIENTS", pct: 22, depth: 1 },
  { cidr: "2a03:6f00::/32", t: "IPv6", pct: 3, depth: 0 },
]
const DOT: Record<string, string> = { active: "#085eff", test: "#ffc53d", free: "#5b606b", mismatch: "#ff3b3b" }
/** Входит ли IPv4-адрес в подсеть (IPv6 — нет). */
function inSubnet(ip: string, cidr: string) {
  const [net, bits] = cidr.split("/")
  const num = (a: string) => a.split(".").reduce((v, o) => v * 256 + (Number(o) || 0), 0)
  if (cidr.includes(":") || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return false
  const size = 2 ** (32 - Number(bits))
  return Math.floor(num(ip) / size) === Math.floor(num(net) / size)
}

/** Адреса последней /24 выбранной сети: занято (по доле из дерева), тест, резерв, свободно. */
function usage(net: Net) {
  const n = 256
  const busy = Math.round((n * net.pct) / 100 / 1.18)
  const test = Math.round(n * 0.03)
  const reserve = Math.round(n * 0.05)
  return { n, busy, test, reserve, free: Math.max(0, n - busy - test - reserve) }
}
const BLOCK: Record<string, number> = { "/30": 4, "/29": 8, "/28": 16 }
/** Сколько свободных блоков /30, /29, /28 помещается в свободные адреса. */
const freeBlocks = (net: Net, blk: string) => Math.floor(usage(net).free / (BLOCK[blk] ?? 4))

const SIZE_OPTS = [
  { v: "/30", label: "/30 · 4 адреса" },
  { v: "/29", label: "/29 · 8 адресов" },
  { v: "/28", label: "/28 · 16 адресов" },
]

/** Ещё не задано — колонки таблицы как в макете, без «Филиала». */
const COLS = spec.cols.filter((c) => c.k !== "branch")

export function IpPlanPage() {
  const remote = isRemote(base)
  const local = useRows(base)
  const remoteOpts = useFilterOptions(base, remote)
  const cfg = useMemo<ListConfig<GenRow>>(
    () => ({
      ...base,
      buttons: [
        { icon: FileSpreadsheet, label: "Сводный отчёт", href: "/summary-files?section=ip-plan" },
        base.buttons.find((b) => b.onClick === "export")!,
        { icon: Plus, label: "Добавить", primary: true, onClick: "create" },
      ],
      filters: remote ? base.filters.map((f) => (remoteOpts[f.k] ? { ...f, opts: remoteOpts[f.k] } : f)) : base.filters,
    }),
    [remote, remoteOpts],
  )
  const [net, setNet] = useState("185.12.40.0/24")
  const [view, setView] = useState<"plan" | "usage">("plan")
  const [q, setQState] = useState<Query>(() => emptyQuery(cfg))
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [more, setMore] = useState(false)
  const [form, setForm] = useState<{ id: number | null } | null>(null)
  const [report, setReport] = useState(false)
  const [alloc, setAlloc] = useState(false)
  const [active, setActive] = useState<number | null>(local[0]?.id ?? null)
  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  const deferred = useDeferredValue(q)
  const srv = useRemoteList(cfg, remote, deferred, page, size)
  // Выбранная в дереве подсеть отбирает адреса (TODO(API): параметр подсети в /list)
  const inNet = useMemo(() => local.filter((x) => inSubnet(String(x.f.ip), net)), [local, net])
  const filtered = useMemo(() => (remote ? [] : applyQuery(cfg, inNet, deferred)), [cfg, inNet, deferred, remote])
  const rows = remote ? srv.rows : local
  const total = remote ? srv.total : filtered.length
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const shown = remote ? srv.rows : filtered.slice(pg * size, pg * size + size)
  const node = TREE.find((n) => n.cidr === net) ?? TREE[2]

  const action = (b: HeroButton) => {
    if (b.onClick === "export") return setReport(true)
    if (b.onClick === "create") return setAlloc(true)
  }

  return (
    <div className="relative isolate">
      <FilterDrawer cfg={cfg} rows={rows} q={q} open={more} onOpenChange={setMore} onApply={setQ} />
      {report && <ReportDialog cfg={cfg} rows={rows} q={q} onClose={() => setReport(false)} />}
      {form && (
        <FormDrawer
          key={form.id ?? "new"}
          cfg={cfg}
          id={form.id}
          row={form.id === null ? undefined : rows.find((x) => x.id === form.id)}
          onClose={() => setForm(null)}
        />
      )}
      {alloc && <AllocDialog net={node} rows={local} onClose={() => setAlloc(false)} />}
      <Hero cfg={cfg} total={total} onAction={action} />

      <div className="relative z-[1] -mt-[148px] grid grid-cols-5 gap-3.5 px-(--page-gutter) max-[1279px]:mt-4 max-[1279px]:grid-cols-3 max-sm:grid-cols-2">
        {[
          { t: "Записей", color: "#085eff", value: fmt(remote ? srv.total : local.length), note: "", pct: 100 },
          ...cfg.kpis(local).slice(1, 5),
        ].map((k) => (
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

      <div className="mt-[18px] grid grid-cols-[440px_1fr] items-start gap-[18px] px-(--page-gutter) max-[1279px]:grid-cols-1">
        <Tree
          value={net}
          onChange={(v) => {
            setNet(v)
            setPage(0)
          }}
        />

        <section className="min-w-0 rounded-3xl border border-border bg-[var(--glass-card)] px-3 pt-4 pb-3 backdrop-blur-[18px]">
          {view === "plan" ? (
            <div className="mx-1.5 mb-2 flex flex-wrap items-center gap-2.5">
              <Input
                icon={<Search />}
                value={q.q}
                onChange={(e) => setQ({ ...q, q: e.target.value })}
                placeholder={cfg.search}
                className="h-11 min-w-[200px] flex-[1_1_220px] rounded-full"
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
              <button type="button" className={cn(btn(), "font-normal text-[var(--nav-text)]")} onClick={() => setMore(true)}>
                <Filter />
                Фильтр
              </button>
            </div>
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
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((x) => {
                      const on = x.id === active
                      const st = cfg.card(x).status
                      return (
                        <tr
                          key={x.id}
                          onClick={() => setActive(x.id)}
                          onDoubleClick={() => setForm({ id: x.id })}
                          className="group/r cursor-pointer"
                        >
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
                                  <i className="size-2.5 rounded-[3px]" style={{ background: DOT[x.status] }} />
                                  {String(x.f.ip)}
                                </span>
                              ) : c.show === "status" ? (
                                <Pill tone={st.tone}>{st.label}</Pill>
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
                                setForm({ id: x.id })
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
                          {srv.loading
                            ? "Загрузка…"
                            : srv.error
                              ? `Ошибка API: ${srv.error}`
                              : "Ничего не найдено — измените поиск или фильтры"}
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
            <Usage net={node} />
          )}
        </section>
      </div>
    </div>
  )
}

/** Дерево подсетей: свёрнутые ветки, поиск по подсети и описанию, доля занятых адресов. */
function Tree({ value, onChange }: { value: string; onChange: (cidr: string) => void }) {
  const [q, setQ] = useState("")
  const [closed, setClosed] = useState<Set<string>>(new Set())
  // Узел скрыт, если свёрнут кто-то из его предков
  const visible = TREE.filter((n, i) => {
    if (q.trim()) return `${n.cidr} ${n.t}`.toLowerCase().includes(q.trim().toLowerCase())
    let d = n.depth
    for (let j = i - 1; j >= 0 && d > 0; j--)
      if (TREE[j].depth < d) {
        if (closed.has(TREE[j].cidr)) return false
        d = TREE[j].depth
      }
    return true
  })
  const hasKids = (n: Net) => {
    const i = TREE.indexOf(n)
    return TREE[i + 1]?.depth > n.depth
  }
  return (
    <section className="rounded-3xl border border-border bg-[var(--glass-card)] p-[22px] backdrop-blur-[18px]">
      <header className="mb-4 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-[11px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
          <GitFork className="size-[18px]" />
        </span>
        <h3 className="text-base font-semibold">Дерево подсетей</h3>
      </header>
      <Input
        icon={<Search />}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Подсеть или описание…"
        className="mb-3 rounded-full"
      />
      {visible.map((n) => {
        const on = n.cidr === value
        const kids = hasKids(n)
        return (
          <div
            key={n.cidr}
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl border border-transparent pr-3 text-[13px]",
              on && "border-[#2f6bff] bg-[rgba(8,94,255,0.12)]",
            )}
            style={{ paddingLeft: 8 + n.depth * 22 }}
          >
            <button
              type="button"
              aria-label={closed.has(n.cidr) ? "Развернуть" : "Свернуть"}
              disabled={!kids}
              onClick={() => {
                const s = new Set(closed)
                if (s.has(n.cidr)) s.delete(n.cidr)
                else s.add(n.cidr)
                setClosed(s)
              }}
              className="grid size-5 flex-none place-items-center text-muted-foreground disabled:invisible"
            >
              <ChevronDown className={cn("size-3.5 transition-transform", closed.has(n.cidr) && "-rotate-90")} />
            </button>
            <button type="button" onClick={() => onChange(n.cidr)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <b className="font-mono font-semibold whitespace-nowrap">{n.cidr}</b>
              <span className="truncate text-muted-foreground">{n.t}</span>
              <span className="ml-auto flex flex-none items-center gap-3">
                <Bar pct={n.pct} color={n.pct > 80 ? "#ff5257" : "#085eff"} className="h-[5px] w-14" />
                <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{n.pct}%</span>
              </span>
            </button>
          </div>
        )
      })}
    </section>
  )
}

/** Распределение адресов (ip-02): сетка блоков выбранного размера, занято / тест / резерв / свободно. */
function Usage({ net }: { net: Net }) {
  const [blk, setBlk] = useState<"/30" | "/29" | "/28">("/30")
  const { n, busy, test, reserve, free } = usage(net)
  const color = (i: number) =>
    i < busy ? "#0d5bff" : i < busy + test ? "#ffc53d" : i < busy + test + reserve ? "#a78bfa" : "var(--chip-bg)"
  const [a, b, c] = net.cidr.split(".")
  return (
    <div className="px-1.5 pb-2">
      <div className="mb-3 flex justify-end gap-2">
        {(["/30", "/29", "/28"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={blk === s}
            onClick={() => setBlk(s)}
            className={cn(
              "h-9 rounded-full border border-border px-3.5 text-[13px]",
              blk === s && "border-[#085eff] bg-[#085eff] text-white",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(32, minmax(0, 1fr))` }}>
        {Array.from({ length: n }, (_, i) => (
          <i
            key={i}
            title={`${a}.${b}.${c}.${i}`}
            className={cn("block h-5 rounded-[4px]", i === 0 && "ring-2 ring-white")}
            style={{ background: color(i) }}
          />
        ))}
      </div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {(
          [
            ["Занято", busy, "#0d5bff"],
            ["Тестовый доступ", test, "#ffc53d"],
            ["Резерв", reserve, "#a78bfa"],
            ["Свободно", free, "#5b606b"],
          ] as const
        ).map(([t, v, col]) => (
          <span key={t} className="flex items-center gap-1.5">
            <i className="size-2 rounded-full" style={{ background: col }} />
            {t} {v}
          </span>
        ))}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
        {(
          [
            ["Сеть", net.cidr],
            ["Шлюз", `${a}.${b}.${c}.254`],
            [`Свободных ${blk}`, String(freeBlocks(net, blk))],
          ] as const
        ).map(([t, v]) => (
          <div key={t} className="rounded-2xl border border-border px-4 py-3">
            <span className="block text-xs text-muted-foreground">{t}</span>
            <b className="font-mono text-[15px] font-semibold">{v}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

/** «Выделить подсеть» (ip-04): сеть, размер, первая свободная, клиент, заявка KCRM. TODO(API): POST /api/ip-address-plan/create. */
function AllocDialog({ net, rows, onClose }: { net: Net; rows: GenRow[]; onClose: () => void }) {
  const nets = TREE.filter((n) => !n.cidr.includes(":")).map((n) => ({ v: n.cidr, label: `${n.cidr} · ${n.t}`, net: n }))
  const [from, setFrom] = useState(net.cidr)
  const [blk, setBlk] = useState("/30")
  const [client, setClient] = useState("")
  const [kcrm, setKcrm] = useState("")
  const [tried, setTried] = useState(false)
  const [a, b, c] = from.split(".")
  // Первая свободная — первый адрес сети, не занятый в плане
  const taken = new Set(rows.filter((x) => x.status !== "free").map((x) => String(x.f.ip)))
  const step = BLOCK[blk] ?? 4
  let first = 1
  while (taken.has(`${a}.${b}.${c}.${first}`) && first < 250) first += step
  const ip = `${a}.${b}.${c}.${first}`
  return (
    <Modal title="Выделить подсеть" icon={Plus} width={600} onClose={onClose}>
      <form
        className="flex flex-col gap-4 px-6 pt-5 pb-6"
        onSubmit={(e) => {
          e.preventDefault()
          setTried(true)
          if (!client.trim()) return
          const id = rowsStore.nextId(base)
          rowsStore.save(base, {
            id,
            num: String(id),
            branch: "АС",
            nodeId: 0,
            nodeCode: "",
            city: "Астана",
            address: "",
            ll: [51.16, 71.43],
            status: "active",
            f: { ip, prefix: blk, client: client.trim(), place: "—", speed: "—", kcrm: kcrm || "—", eng: "—" },
          })
          toast(`Выделена ${ip}${blk}`)
          onClose()
        }}
      >
        <div>
          <Label t="Из сети" />
          <Select value={from} opts={nets} onChange={setFrom} />
        </div>
        <div>
          <Label t="Размер" />
          <Select value={blk} opts={SIZE_OPTS} onChange={setBlk} />
        </div>
        <p className="flex gap-3 rounded-2xl border border-[rgba(43,212,99,0.35)] bg-[rgba(43,212,99,0.08)] px-4 py-3">
          <CircleCheck className="mt-0.5 size-4 flex-none text-[var(--status-ok)]" />
          <span>
            <b className="block text-[13.5px] font-semibold">
              Первая свободная: {ip}
              {blk}
            </b>
            <span className="text-xs text-muted-foreground">
              ещё {Math.max(0, freeBlocks(nets.find((x) => x.v === from)?.net ?? net, blk) - 1)} свободных {blk} в этой сети
            </span>
          </span>
        </p>
        <label>
          <Label t="Клиент" req />
          <Input value={client} onChange={(e) => setClient(e.target.value)} invalid={tried && !client.trim()} placeholder="ТОО «…»" />
        </label>
        <label>
          <Label t="Заявка KCRM" />
          <Input value={kcrm} onChange={(e) => setKcrm(e.target.value)} inputMode="numeric" placeholder="88630" />
        </label>
        <div className="mt-3 flex justify-end gap-2.5">
          <button type="button" className={btn()} onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className={btn({ primary: true })}>
            <CircleCheck />
            Выделить
          </button>
        </div>
      </form>
    </Modal>
  )
}
