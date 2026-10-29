"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, FileSpreadsheet, Hash, Plus, Upload } from "lucide-react"
import { DeleteDialog } from "@/components/blocks/delete-dialog"
import { FiltersPanel, type Picked } from "@/components/blocks/filters-panel"
import { ImportDialog } from "@/components/blocks/import-dialog"
import { HeroButton, KpiCard, KpiRow, ListHero } from "@/components/blocks/list-hero"
import { PreviewPanel } from "@/components/blocks/preview"
import { QrDialog } from "@/components/blocks/qr-dialog"
import { CardGrid, RecordCard } from "@/components/blocks/record-card"
import { ReportDialog } from "@/components/blocks/report-dialog"
import { DataTable, EmptyRow, HeadRow, HeadSelect, NothingFound, PAGE_SIZE, PAGE_SIZES, Pager, Row, RowSelect, Td, TdActions, Th, ThActions, type Sort } from "@/components/blocks/table"
import {
  ActiveChips,
  FilterChip,
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
import { Bold, PairCell, pairValue, Text } from "@/components/equipment/cells"
import { NumberCapacityForm } from "@/components/number-capacity/number-capacity-form"
import { usePageTitle } from "@/hooks/use-page-title"
import { BRANCH_OPTIONS, branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import {
  KINDS,
  NUMBER_STATUS,
  numberCapacities,
  numberCapacityColumns,
  numberCapacityImport,
  numberName,
  numberStatus,
  numberSub,
  useNumberCapacities,
  type NumberCapacity,
} from "@/lib/api/number-capacity"
import { picked, sortRows, withCounts } from "@/lib/list/filter"
import { fmt } from "@/lib/list/query"

/*
 * 21 Номерная ёмкость — список (без карты). Данные — useNumberCapacities() / numberCapacities.usePage() из lib/api/number-capacity,
 * вёрстка — блоки components/blocks. Паспорт кода — ./[id]/page.tsx, форма — components/number-capacity/number-capacity-form.tsx.
 */

const HERO = "/equipment/switch-hero.jpg"
const UNIT: [string, string, string] = ["код", "кода", "кодов"]

/** По какому значению сортирует каждая колонка. */
const SORT_BY = {
  branch: (x: NumberCapacity) => x.branch,
  code: (x: NumberCapacity) => x.f.code,
  town: (x: NumberCapacity) => x.f.town,
  mounted: (x: NumberCapacity) => pairValue(x.f.mounted),
  used: (x: NumberCapacity) => x.f.used,
  kind: (x: NumberCapacity) => x.f.kind ?? "—",
}
type SortKey = keyof typeof SORT_BY
const SORT_COLUMNS: { k: SortKey; t: string }[] = [
  { k: "branch", t: "Филиал" },
  { k: "code", t: "Код и диапазон" },
  { k: "town", t: "Город / область" },
  { k: "mounted", t: "Монтировано / ресурс" },
  { k: "used", t: "Задействовано" },
  { k: "kind", t: "Назначение" },
]

/** Отбор: поиск, фильтры (branch, kind, status) и сортировка. */
type Query = { search: string; f: Picked; sort: Sort<SortKey> }
const EMPTY: Query = { search: "", f: {}, sort: ["", 1] }

/** Значение фильтра у записи. */
const FILTER_OF: Record<string, (x: NumberCapacity) => string> = {
  branch: (x) => x.branch,
  kind: (x) => x.f.kind ?? "—",
  status: (x) => x.status,
}

const searchText = (x: NumberCapacity) => `${x.branch} ${x.f.code} ${x.f.town} ${x.f.mounted} ${x.f.used} ${x.f.kind} ${x.f.tu} ${x.nodeCode} ${x.city}`.toLowerCase()

function filterNumbers(rows: NumberCapacity[], q: Query) {
  const needle = q.search.trim().toLowerCase()
  const out = rows.filter((x) => (!needle || searchText(x).includes(needle)) && Object.entries(FILTER_OF).every(([k, get]) => picked(q.f[k], get(x))))
  return q.sort[0] ? sortRows(out, SORT_BY[q.sort[0]], q.sort[1]) : out
}

const STATUS_OPTIONS = Object.entries(NUMBER_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

const href = (id: number) => `/number-capacity/${id}`

export default function NumberCapacityPage() {
  usePageTitle("Номерная ёмкость")
  const router = useRouter()
  const all = useNumberCapacities()
  const remote = numberCapacities.isRemote()
  // Варианты фильтров из /filter-params (в API значения не совпадают с примерами)
  const remoteOpts = numberCapacities.useOptions()
  const [q, setQState] = useState<Query>(EMPTY)
  const [page, setPage] = useState(0)
  const [mode, setModeState] = useState<ViewMode>("table")
  const [size, setSize] = useState(PAGE_SIZE.table)
  const [more, setMore] = useState(false)
  // Шторка формы: {} — новая запись
  const [form, setForm] = useState<{ id?: number } | null>(null)
  const [importing, setImporting] = useState(false)
  const [report, setReport] = useState(false)
  const [del, setDel] = useState<NumberCapacity[] | null>(null)
  const [qr, setQr] = useState<NumberCapacity | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<number | null>(all[0]?.id ?? null)

  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  // Отбор — отложенно: ввод в поиске не ждёт пересчёта всех строк
  const deferred = useDeferredValue(q)
  const list = useMemo(() => filterNumbers(all, deferred), [all, deferred])
  const pages0 = Math.max(1, Math.ceil(list.length / size))
  const srv = numberCapacities.usePage(list, deferred, remote ? page : Math.min(page, pages0 - 1), size)
  const total = srv.total
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const view = srv.rows
  // В API счётчики и KPI — только по текущей странице
  const rows = remote ? srv.rows : all
  const current = rows.find((x) => x.id === active) ?? (remote ? srv.rows[0] : undefined)
  const allOnPage = view.length > 0 && view.every((x) => checked.has(x.id))
  const canCreate = !numberCapacities.readOnly()

  /* ---------- фильтры: варианты с числом записей ---------- */
  const options = {
    branch: withCounts(rows, FILTER_OF.branch, BRANCH_OPTIONS),
    kind: withCounts(rows, FILTER_OF.kind, remoteOpts.kind ?? opts(KINDS)),
    status: withCounts(rows, FILTER_OF.status, remoteOpts.status ?? STATUS_OPTIONS),
  }
  const setF = (k: string) => (v: string[]) => setQ({ ...q, f: { ...q.f, [k]: v } })

  /* ---------- KPI ---------- */
  const branches = new Set(all.map((x) => x.branch)).size
  // TODO(API): сводка раздела (/summary) — форма ответа неизвестна; пока только «Всего», остальное — цифры макета
  const kpis = [
    { t: "Кодов", color: "#085eff", value: fmt(remote ? total : all.length), note: remote ? "в API" : `в ${branches} филиалах`, pct: 100 },
    { t: "Ресурс номеров", color: "#a78bfa", value: "1,2 млн", note: "", pct: 50 },
    { t: "Монтировано", color: "#22d3ee", value: "71%", note: "", pct: 71 },
    { t: "Задействовано", color: "#085eff", value: "58%", note: "", pct: 58 },
    { t: "Без ТУ", color: "#ff5257", value: "9", note: "", pct: 8 },
    { t: "Резерв", color: "var(--status-nolink)", value: "142 000", note: "", pct: 50 },
  ].map((k, i) => (remote && i > 0 ? { ...k, value: "—", note: "", pct: 0 } : k))

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
  const status = (x: NumberCapacity) => ({ label: numberStatus(x)[0], tone: numberStatus(x)[1] })

  const empty = <NothingFound search={q.search} onReset={() => setQ(EMPTY)} onCreate={canCreate ? () => setForm({}) : undefined} />
  const toolbar = (
    <>
      <Toolbar>
        <SearchBox value={q.search} onChange={(search) => setQ({ ...q, search })} placeholder="Код, город, ТУ…" />
        <FilterChip label="Филиал" all="Все филиалы" options={options.branch} value={q.f.branch ?? []} onChange={setF("branch")} short={(v) => v} />
        <FilterChip label="Назначение" options={options.kind} value={q.f.kind ?? []} onChange={setF("kind")} />
        <MoreButton active={q.f.status?.length ? 1 : 0} onClick={() => setMore(true)} />
        <RemoveSelected count={checked.size} onClick={() => setDel(rows.filter((x) => checked.has(x.id)))} />
        <ToolbarSpacer />
        {mode === "cards" && <SortSelect value={q.sort} columns={SORT_COLUMNS} onChange={(sort) => setQ({ ...q, sort })} />}
        <ViewSwitch mode={mode} onChange={setMode} />
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
      <ListHero crumb="Оборудование / Автоматическая электросвязь" title="Номерная ёмкость" total={remote ? total : all.length} sub="Форма учёта · Номерная ёмкость" hero={HERO}>
        <HeroButton icon={FileSpreadsheet} label="Сводный файл" href="/summary-files?section=number-capacity" />
        <HeroButton icon={Download} label="Отчёт" onClick={() => setReport(true)} />
        <HeroButton icon={Upload} label="Импорт Excel" onClick={() => setImporting(true)} />
        <HeroButton icon={Plus} label="Создать" primary onClick={() => setForm({})} />
      </ListHero>

      <KpiRow>
        {kpis.map((k) => (
          <KpiCard key={k.t} {...k} />
        ))}
      </KpiRow>

      {mode === "cards" ? (
        <div className="mt-[18px] px-(--page-gutter)">
          <ListPanel flush>{toolbar}</ListPanel>
          <CardGrid empty={!view.length && empty}>
            {view.map((x) => (
              <RecordCard
                key={x.id}
                href={href(x.id)}
                photo={HERO}
                status={status(x)}
                title={numberName(x)}
                sub={numberSub(x)}
                tags={[x.branch]}
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
                  <Th key={c.k} k={c.k} sort={q.sort} onSort={(sort) => setQ({ ...q, sort })} num={c.k === "mounted" || c.k === "used"}>
                    {c.t}
                  </Th>
                ))}
                <ThActions />
              </HeadRow>
              <tbody>
                {view.map((x, i) => (
                  <Row key={x.id} on={x.id === active} onClick={() => setActive(x.id)} onDoubleClick={() => router.push(href(x.id))}>
                    <RowSelect on={checked.has(x.id)} n={pg * size + i + 1} onToggle={() => toggle(x.id)} />
                    <Td>
                      <Text v={x.branch} />
                    </Td>
                    <Td>
                      <Bold v={x.f.code} />
                    </Td>
                    <Td>
                      <Text v={x.f.town} />
                    </Td>
                    <Td num>
                      <PairCell v={x.f.mounted} />
                    </Td>
                    <Td num>
                      <Text v={x.f.used} />
                    </Td>
                    <Td>
                      <Text v={x.f.kind ?? "—"} />
                    </Td>
                    <TdActions onQr={() => setQr(x)} onEdit={() => setForm({ id: x.id })} onDelete={() => setDel([x])} />
                  </Row>
                ))}
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
              photo={HERO}
              status={status(current)}
              title={numberName(current)}
              sub={numberSub(current)}
              facts={[
                { t: "Филиал", v: branchName(current.branch) },
                { t: "Код и диапазон", v: current.f.code },
                { t: "Город / область", v: current.f.town },
                { t: "Монтировано / ресурс", v: current.f.mounted },
                { t: "Задействовано", v: String(current.f.used) },
              ]}
              more="Открыть паспорт"
            />
          )}
        </div>
      )}

      <FiltersPanel
        open={more}
        onOpenChange={setMore}
        title="Номерная ёмкость"
        unit={UNIT}
        total={rows.length}
        value={q.f}
        found={(f) => filterNumbers(rows, { ...q, f }).length}
        onApply={(f) => setQ({ ...q, f })}
        groups={[
          { k: "branch", t: "Филиал", ui: "tags", opts: options.branch, short: (v) => v },
          { k: "kind", t: "Назначение", any: "Любой", opts: options.kind },
          { k: "status", t: "Статус", any: "Любой", opts: options.status },
        ]}
      />
      {del && (
        <DeleteDialog
          icon={Hash}
          noun={UNIT}
          items={del.map((x) => ({ id: x.id, name: numberName(x), sub: numberSub(x).split(" · ")[0] }))}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => numberCapacities.remove(del, reason)}
          onClose={() => setDel(null)}
          onDone={() => setChecked(new Set())}
        />
      )}
      {qr && <QrDialog title={numberName(qr)} sub={numberSub(qr)} url={qrUrl("number-capacity", qr.id)} onClose={() => setQr(null)} />}
      {report && (
        <ReportDialog
          title="Номерная ёмкость"
          columns={numberCapacityColumns}
          rows={rows}
          filtered={filterNumbers(rows, q)}
          active={describe(q, options)}
          branches={{ label: "Филиал", all: "Все филиалы", opts: BRANCH_OPTIONS }}
          onClose={() => setReport(false)}
        />
      )}
      {importing && <ImportDialog spec={numberCapacityImport} onClose={() => setImporting(false)} />}
      {form && (
        <NumberCapacityForm
          key={form.id ?? "new"}
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
const LABEL: Record<string, string> = { branch: "Филиал", kind: "Назначение", status: "Статус" }
const label = (o: Options, k: string, v: string) => (k === "branch" ? v : (o[k]?.find((x) => x.v === v)?.label ?? v))

/** Плашки включённых фильтров под панелью. */
function activeChips(q: Query, setQ: (q: Query) => void, o: Options): ActiveChip[] {
  return Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => ({ label: `${LABEL[k]}: ${v.map((x) => label(o, k, x)).join(", ")}`, clear: () => setQ({ ...q, f: { ...q.f, [k]: [] } }) }))
}

/** «АС, ЮФ · ОПТС · поиск «…»» — текущие фильтры одной строкой для отчёта. */
function describe(q: Query, o: Options) {
  const parts = Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => v.map((x) => label(o, k, x)).join(", "))
  if (q.search.trim()) parts.push(`поиск «${q.search.trim()}»`)
  return parts.join(" · ")
}
