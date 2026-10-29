"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, FileSpreadsheet, Network, Plus, Upload } from "lucide-react"
import { DeleteDialog } from "@/components/blocks/delete-dialog"
import { FiltersPanel, type Picked } from "@/components/blocks/filters-panel"
import { ImportDialog } from "@/components/blocks/import-dialog"
import { HeroButton, KpiCard, KpiRow, ListHero } from "@/components/blocks/list-hero"
import { MapBlock, type ListPoint } from "@/components/blocks/map-block"
import { PreviewPanel } from "@/components/blocks/preview"
import { QrDialog } from "@/components/blocks/qr-dialog"
import { CardGrid, RecordCard } from "@/components/blocks/record-card"
import { ReportDialog } from "@/components/blocks/report-dialog"
import { DataTable, EmptyRow, HeadRow, HeadSelect, NothingFound, PAGE_SIZE, PAGE_SIZES, Pager, Row, RowSelect, Td, TdActions, Th, ThActions, type Sort } from "@/components/blocks/table"
import {
  ActiveChips,
  FilterChip,
  LayersButton,
  ListPanel,
  MoreButton,
  RemoveSelected,
  SearchBox,
  SortSelect,
  Toolbar,
  ToolbarSpacer,
  ViewSwitch,
  type ActiveChip,
  type ViewMode,
} from "@/components/blocks/toolbar"
import { Bar } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { SpdForm } from "@/components/spd/spd-form"
import { usePageTitle } from "@/hooks/use-page-title"
import { BRANCH_OPTIONS } from "@/lib/api/equipment"
import {
  branchFull,
  isHot,
  loadColor,
  pct,
  portList,
  SPD_NETWORKS,
  SPD_REMOVE,
  SPD_STATUS,
  spdDate,
  spdQrUrl,
  spdStatus,
  spdSub,
  smartnetExpiring,
  type SpdRow,
} from "@/lib/api/spd"
import { switchColumns, switches, switchesImport, useSwitches } from "@/lib/api/switches"
import { distinct, picked, sortRows, withCounts } from "@/lib/list/filter"
import { fmt } from "@/lib/list/query"

/*
 * 03 Коммутаторы — список (РФ-ДППП-20). Данные — useSwitches() / switches.usePage() из lib/api/switches,
 * вёрстка — блоки components/blocks. Паспорт — ./[id]/page.tsx, форма — components/spd/spd-form.tsx.
 */

const HERO = "/equipment/switch-hero.jpg"
const PHOTO = "/equipment/switch.jpg"
const UNIT: [string, string, string] = ["коммутатор", "коммутатора", "коммутаторов"]

/** По какому значению сортирует каждая колонка. */
const SORT_BY = {
  branch: (x: SpdRow) => x.branch,
  host: (x: SpdRow) => x.host,
  nodeCode: (x: SpdRow) => x.nodeCode,
  city: (x: SpdRow) => x.city,
  address: (x: SpdRow) => x.address,
  network: (x: SpdRow) => x.network,
  ip: (x: SpdRow) => x.ip,
  ports: (x: SpdRow) => x.portsUsed / x.portsTotal,
}
type SortKey = keyof typeof SORT_BY
const SORT_COLUMNS: { k: SortKey; t: string }[] = [
  { k: "branch", t: "Филиал" },
  { k: "host", t: "Hostname" },
  { k: "nodeCode", t: "Идентификатор УС" },
  { k: "city", t: "Населённый пункт" },
  { k: "address", t: "Адрес узла связи" },
  { k: "network", t: "Тип сети" },
  { k: "ip", t: "IP-адрес" },
  { k: "ports", t: "Порты" },
]

/** Отбор: поиск, фильтры и сортировка. */
type Query = { search: string; f: Picked; sort: Sort<SortKey> }
const EMPTY: Query = { search: "", f: {}, sort: ["", 1] }

/** Значение фильтра у записи; флаги — "1" / "0". */
const FILTER_OF: Record<string, (x: SpdRow) => string> = {
  branch: (x) => x.branch,
  network: (x) => x.network,
  model: (x) => x.model,
  vendor: (x) => x.vendor,
  status: (x) => x.status,
  hot: (x) => (isHot(x) ? "1" : "0"),
  smartnet: (x) => (smartnetExpiring(x) ? "1" : "0"),
  noMol: (x) => (x.mol ? "0" : "1"),
  noBackup: (x) => (x.backup ? "0" : "1"),
}
/** Фильтры только в шторке «Ещё фильтры» (число на кнопке). */
const MORE = ["vendor", "status", "hot", "smartnet", "noMol", "noBackup"]
const FLAG = [{ v: "1", label: "Да" }]

const searchText = (x: SpdRow) => `${x.host} ${x.ip} ${x.nodeCode} ${x.serial} ${x.model} ${x.city}`.toLowerCase()

function filterSwitches(rows: SpdRow[], q: Query) {
  const needle = q.search.trim().toLowerCase()
  const out = rows.filter((x) => (!needle || searchText(x).includes(needle)) && Object.entries(FILTER_OF).every(([k, get]) => picked(q.f[k], get(x))))
  return q.sort[0] ? sortRows(out, SORT_BY[q.sort[0]], q.sort[1]) : out
}

const STATUS_OPTIONS = Object.entries(SPD_STATUS).map(([v, [label]]) => ({ v, label }))
const NETWORK_OPTIONS = SPD_NETWORKS.map((v) => ({ v, label: v }))

const href = (id: number) => `/switches/${id}`
const status = (x: SpdRow) => ({ label: spdStatus(x)[0], tone: spdStatus(x)[1] })

export default function SwitchesPage() {
  usePageTitle("Коммутаторы")
  const router = useRouter()
  const all = useSwitches()
  const remote = switches.isRemote()
  // Варианты фильтров из /filter-params (в API значения не совпадают с примерами)
  const remoteOpts = switches.useOptions()
  const [q, setQState] = useState<Query>(EMPTY)
  const [page, setPage] = useState(0)
  const [mode, setModeState] = useState<ViewMode>("table")
  const [size, setSize] = useState(PAGE_SIZE.table)
  const [more, setMore] = useState(false)
  // Шторка формы: {} — новая запись
  const [form, setForm] = useState<{ id?: number } | null>(null)
  const [importing, setImporting] = useState(false)
  const [report, setReport] = useState(false)
  const [del, setDel] = useState<SpdRow[] | null>(null)
  const [qr, setQr] = useState<SpdRow | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<number | null>(all[0]?.id ?? null)

  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  // Отбор — отложенно: ввод в поиске не ждёт пересчёта всех строк
  const deferred = useDeferredValue(q)
  const list = useMemo(() => filterSwitches(all, deferred), [all, deferred])
  const pages0 = Math.max(1, Math.ceil(list.length / size))
  const srv = switches.usePage(list, deferred, remote ? page : Math.min(page, pages0 - 1), size)
  const total = srv.total
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const view = srv.rows
  // В API счётчики фильтров — только по текущей странице
  const rows = remote ? srv.rows : all
  const current = rows.find((x) => x.id === active) ?? (remote ? srv.rows[0] : undefined)
  const allOnPage = view.length > 0 && view.every((x) => checked.has(x.id))
  const canCreate = !switches.readOnly()

  /* ---------- фильтры: варианты с числом записей ---------- */
  const models = useMemo(() => distinct(all, (x) => x.model), [all])
  const vendors = useMemo(() => distinct(all, (x) => x.vendor), [all])
  const options = {
    branch: withCounts(rows, FILTER_OF.branch, BRANCH_OPTIONS),
    network: withCounts(rows, FILTER_OF.network, remoteOpts.network ?? NETWORK_OPTIONS),
    model: withCounts(rows, FILTER_OF.model, remoteOpts.model ?? models),
    vendor: withCounts(rows, FILTER_OF.vendor, remoteOpts.vendor ?? vendors),
    status: withCounts(rows, FILTER_OF.status, STATUS_OPTIONS),
    hot: withCounts(rows, FILTER_OF.hot, FLAG),
    smartnet: withCounts(rows, FILTER_OF.smartnet, FLAG),
    noMol: withCounts(rows, FILTER_OF.noMol, FLAG),
    noBackup: withCounts(rows, FILTER_OF.noBackup, FLAG),
  }
  const setF = (k: string) => (v: string[]) => setQ({ ...q, f: { ...q.f, [k]: v } })

  /* ---------- KPI ---------- */
  const kpis = useMemo(() => {
    const used = all.reduce((a, x) => a + x.portsUsed, 0)
    const ports = all.reduce((a, x) => a + x.portsTotal, 0)
    const hot = all.filter(isHot).length
    const expiring = all.filter(smartnetExpiring).length
    const noMol = all.filter((x) => !x.mol).length
    const backup = all.filter((x) => x.backup).length
    const branches = new Set(all.map((x) => x.branch)).size
    return [
      { t: "Всего коммутаторов", color: "#085eff", value: fmt(all.length), note: `в ${branches} филиалах`, pct: 100 },
      { t: "Портовая ёмкость", color: "#a78bfa", value: `${pct(used, ports)}%`, note: `${fmt(ports)} портов`, pct: pct(used, ports) },
      { t: "Загрузка > 90%", color: "var(--status-alarm)", value: fmt(hot), note: "коммутатор" + (hot % 10 >= 2 && hot % 10 <= 4 ? "а" : "ов"), pct: pct(hot, all.length) },
      { t: "SmartNET истекает", color: "var(--status-nolink)", value: fmt(expiring), note: "за 90 дней", pct: pct(expiring, all.length) },
      { t: "Без МОЛ", color: "#22d3ee", value: fmt(noMol), note: `${pct(noMol, all.length)}%`, pct: pct(noMol, all.length) },
      { t: "С бэкапом конфига", color: "var(--status-ok)", value: fmt(backup), note: `${pct(backup, all.length)}%`, pct: pct(backup, all.length) },
    ]
  }, [all])
  // TODO(API): сводка раздела (/summary) — форма ответа неизвестна; пока только «Всего»
  const shown = remote ? kpis.map((k, i) => (i === 0 ? { ...k, value: fmt(total), note: "в API", pct: 100 } : { ...k, value: "—", note: "", pct: 0 })) : kpis

  const points = useMemo<ListPoint[]>(
    () =>
      list.map((x) => ({
        id: x.id,
        ll: x.ll,
        title: x.host,
        sub: `${x.model} · ${x.nodeCode}`,
        tone: spdStatus(x)[1],
        note: `${x.model} · ${x.nodeCode} · ${x.ip}`,
        status: spdStatus(x)[0],
      })),
    [list],
  )

  const toggle = (id: number) => {
    const s = new Set(checked)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setChecked(s)
  }
  const togglePage = () => {
    const s = new Set(checked)
    view.forEach((x) => (allOnPage ? s.delete(x.id) : s.add(x.id)))
    setChecked(s)
  }
  const setMode = (m: ViewMode) => {
    setModeState(m)
    setSize(PAGE_SIZE[m])
    setPage(0)
  }

  const empty = <NothingFound search={q.search} onReset={() => setQ(EMPTY)} onCreate={canCreate ? () => setForm({}) : undefined} />
  const toolbar = (
    <>
      <Toolbar>
        <SearchBox value={q.search} onChange={(search) => setQ({ ...q, search })} placeholder="Hostname, IP, ID УС, S/N…" />
        <FilterChip label="Филиал" all="Все филиалы" options={options.branch} value={q.f.branch ?? []} onChange={setF("branch")} short={(v) => v} />
        <FilterChip label="Тип сети" options={options.network} value={q.f.network ?? []} onChange={setF("network")} />
        <FilterChip label="Модель" options={options.model} value={q.f.model ?? []} onChange={setF("model")} />
        <MoreButton active={MORE.filter((k) => q.f[k]?.length).length} onClick={() => setMore(true)} />
        <RemoveSelected count={checked.size} onClick={() => setDel(rows.filter((x) => checked.has(x.id)))} />
        {/* TODO: «Слои» — узлы, ВОЛС, клиенты, участки; подложка 2D / спутник (макет 05) */}
        {mode === "map" && <LayersButton onClick={() => toast("Слои карты — на экране «Карта сети» (05)")} />}
        <ToolbarSpacer />
        {mode === "cards" && <SortSelect value={q.sort} columns={SORT_COLUMNS} onChange={(sort) => setQ({ ...q, sort })} />}
        <ViewSwitch mode={mode} onChange={setMode} map />
      </Toolbar>
      <ActiveChips chips={activeChips(q, setQ, options)} onClearAll={() => setQ({ ...q, f: {} })} />
    </>
  )
  const pager = (
    <Pager
      total={total}
      page={pg}
      pages={pages}
      size={size}
      sizes={PAGE_SIZES[mode]}
      onSize={(n) => {
        setSize(n)
        setPage(0)
      }}
      onPage={setPage}
    />
  )

  return (
    <div className="relative isolate">
      <ListHero
        crumb="Оборудование / Системы передачи данных"
        title="Коммутаторы"
        total={remote ? total : all.length}
        sub="РФ-ДППП-20. Форма учёта коммутаторов на сети АО «QMobile»"
        hero={HERO}
      >
        <HeroButton icon={FileSpreadsheet} label="Сводный файл" href="/summary-files?section=switches" />
        <HeroButton icon={Download} label="Отчёт" onClick={() => setReport(true)} />
        <HeroButton icon={Upload} label="Импорт Excel" onClick={() => setImporting(true)} />
        <HeroButton icon={Plus} label="Создать" primary onClick={() => setForm({})} />
      </ListHero>

      <KpiRow>
        {shown.map((k) => (
          <KpiCard key={k.t} {...k} />
        ))}
      </KpiRow>

      {mode === "map" ? (
        <div className="mt-[18px] px-(--page-gutter)">
          <ListPanel flush>{toolbar}</ListPanel>
          <MapBlock points={points} icon={Network} hrefOf={href} active={active} setActive={setActive} />
        </div>
      ) : mode === "cards" ? (
        <div className="mt-[18px] px-(--page-gutter)">
          <ListPanel flush>{toolbar}</ListPanel>
          <CardGrid empty={!view.length && empty}>
            {view.map((x) => (
              <RecordCard
                key={x.id}
                href={href(x.id)}
                photo={PHOTO}
                status={status(x)}
                title={x.host}
                sub={spdSub(x)}
                tags={[x.network, x.vendor]}
                bar={{ t: "Порты", v: `${x.portsUsed}/${x.portsTotal}`, pct: pct(x.portsUsed, x.portsTotal) }}
                selected={checked.has(x.id)}
                onSelect={() => toggle(x.id)}
                onQr={() => setQr(x)}
                onEdit={() => setForm({ id: x.id })}
                onDelete={() => setDel([x])}
              />
            ))}
          </CardGrid>
          {pager}
        </div>
      ) : (
        <div className="mt-[18px] flex items-start gap-[18px] px-(--page-gutter)">
          <ListPanel className="min-w-0 flex-1">
            {toolbar}
            <DataTable>
              <HeadRow>
                <HeadSelect on={allOnPage} onToggle={togglePage} />
                {SORT_COLUMNS.map((c) => (
                  <Th key={c.k} k={c.k} sort={q.sort} onSort={(sort) => setQ({ ...q, sort })} num={c.k === "ports"}>
                    {c.t}
                  </Th>
                ))}
                <ThActions />
              </HeadRow>
              <tbody>
                {view.map((x, i) => {
                  const p = pct(x.portsUsed, x.portsTotal)
                  return (
                    <Row key={x.id} on={x.id === active} onClick={() => setActive(x.id)} onDoubleClick={() => router.push(href(x.id))}>
                      <RowSelect on={checked.has(x.id)} n={pg * size + i + 1} onToggle={() => toggle(x.id)} />
                      <Td>{x.branch}</Td>
                      <Td>
                        <span className="flex items-center gap-3">
                          <span className="grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                            <Network className="size-[17px]" strokeWidth={1.75} />
                          </span>
                          <span>
                            <b className="block font-semibold text-[var(--link)]">{x.host}</b>
                            <span className="block text-xs text-muted-foreground">{x.model}</span>
                          </span>
                        </span>
                      </Td>
                      <Td>{x.nodeCode}</Td>
                      <Td>{x.city}</Td>
                      <Td>
                        <span className="text-muted-foreground">{x.address}</span>
                      </Td>
                      <Td>{x.network}</Td>
                      <Td>
                        <span className="tabular-nums">{x.ip}</span>
                      </Td>
                      <Td num>
                        <span className="flex items-center gap-2.5">
                          <Bar pct={p} color={loadColor(p)} className="h-1 w-[60px]" />
                          {x.portsUsed}/{x.portsTotal}
                        </span>
                      </Td>
                      <TdActions onQr={() => setQr(x)} onEdit={() => setForm({ id: x.id })} onDelete={() => setDel([x])} />
                    </Row>
                  )
                })}
                {!view.length && <EmptyRow cols={SORT_COLUMNS.length + 3}>{srv.loading ? "Загрузка…" : srv.error ? `Ошибка API: ${srv.error}` : empty}</EmptyRow>}
              </tbody>
            </DataTable>
            {pager}
          </ListPanel>

          {current && (
            <PreviewPanel
              href={href(current.id)}
              onClose={() => setActive(null)}
              onEdit={() => setForm({ id: current.id })}
              photo={PHOTO}
              status={status(current)}
              title={current.host}
              sub={`${current.model} · ${current.ip}`}
              facts={[
                { t: "Филиал", v: branchFull(current.branch).replace(" филиал", "") },
                { t: "Узел связи", v: current.nodeCode },
                { t: "Тип сети", v: current.network },
                { t: "S/N", v: current.serial },
              ]}
              ports={portList(current)}
              more="Паспорт оборудования"
            />
          )}
        </div>
      )}

      <FiltersPanel
        open={more}
        onOpenChange={setMore}
        title="Коммутаторы"
        unit={UNIT}
        total={rows.length}
        value={q.f}
        found={(f) => filterSwitches(rows, { ...q, f }).length}
        onApply={(f) => setQ({ ...q, f })}
        groups={[
          { k: "branch", t: "Филиал", ui: "tags", opts: options.branch, short: (v) => v },
          { k: "network", t: "Тип сети", any: "Любой", opts: options.network },
          { k: "model", t: "Модель", any: "Любая", opts: options.model },
          { k: "vendor", t: "Производитель", any: "Любой", opts: options.vendor },
          { k: "status", t: "Статус", any: "Любой", opts: options.status },
          { k: "hot", t: "Загрузка портов > 90%", ui: "flag", opts: options.hot },
          { k: "smartnet", t: "SmartNET истекает за 90 дней", ui: "flag", opts: options.smartnet },
          { k: "noMol", t: "Без МОЛ", ui: "flag", opts: options.noMol },
          { k: "noBackup", t: "Без бэкапа конфига", ui: "flag", opts: options.noBackup },
        ]}
      />
      {del && (
        <DeleteDialog
          icon={Network}
          noun={UNIT}
          items={del.map((x) => ({ id: x.id, name: x.host, sub: x.model }))}
          {...SPD_REMOVE}
          onConfirm={(reason) => switches.remove(del, reason)}
          onClose={() => setDel(null)}
          onDone={() => setChecked(new Set())}
        />
      )}
      {qr && <QrDialog title={qr.host} sub={spdSub(qr)} url={spdQrUrl(qr)} onClose={() => setQr(null)} />}
      {report && (
        <ReportDialog
          title="Коммутаторы"
          columns={switchColumns}
          rows={rows}
          filtered={filterSwitches(rows, q)}
          active={describe(q, options)}
          branches={{ label: "Филиал", all: "Все филиалы", opts: BRANCH_OPTIONS }}
          date={spdDate}
          onClose={() => setReport(false)}
        />
      )}
      {importing && <ImportDialog spec={switchesImport} onClose={() => setImporting(false)} />}
      {form && (
        <SpdForm
          key={form.id ?? "new"}
          kind="switch"
          row={form.id === undefined ? undefined : rows.find((x) => x.id === form.id)}
          onClose={() => setForm(null)}
          onDelete={(x) => {
            setForm(null)
            setDel([x])
          }}
        />
      )}
    </div>
  )
}

type Options = Record<string, { v: string; label: string }[]>
const LABEL: Record<string, string> = {
  branch: "Филиал",
  network: "Тип сети",
  model: "Модель",
  vendor: "Производитель",
  status: "Статус",
  hot: "Загрузка портов > 90%",
  smartnet: "SmartNET истекает за 90 дней",
  noMol: "Без МОЛ",
  noBackup: "Без бэкапа конфига",
}
const isFlag = (k: string) => ["hot", "smartnet", "noMol", "noBackup"].includes(k)
const label = (o: Options, k: string, v: string) => (k === "branch" ? v : (o[k]?.find((x) => x.v === v)?.label ?? v))

/** Плашки включённых фильтров под панелью; флаг — только название. */
function activeChips(q: Query, setQ: (q: Query) => void, o: Options): ActiveChip[] {
  return Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => ({
      label: isFlag(k) ? LABEL[k] : `${LABEL[k]}: ${v.map((x) => label(o, k, x)).join(", ")}`,
      clear: () => setQ({ ...q, f: { ...q.f, [k]: [] } }),
    }))
}

/** «АС, ЮФ · ГМС · поиск «…»» — текущие фильтры одной строкой для отчёта. */
function describe(q: Query, o: Options) {
  const parts = Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => (isFlag(k) ? LABEL[k] : v.map((x) => label(o, k, x)).join(", ")))
  if (q.search.trim()) parts.push(`поиск «${q.search.trim()}»`)
  return parts.join(" · ")
}
