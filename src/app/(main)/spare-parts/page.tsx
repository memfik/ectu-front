"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, FileSpreadsheet, Package, Plus, Upload } from "lucide-react"
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
import { Bold, Text } from "@/components/equipment/cells"
import { SparePartForm } from "@/components/spare-parts/spare-part-form"
import { toast } from "@/components/shared/toast"
import { usePageTitle } from "@/hooks/use-page-title"
import { BRANCH_OPTIONS, branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import {
  CATEGORIES,
  OWNERS,
  SPARE_FIELDS,
  SPARE_STATUS,
  sparePartColumns,
  sparePartName,
  spareParts,
  sparePartsImport,
  sparePartSub,
  spareStatus,
  useSpareParts,
  type SparePart,
} from "@/lib/api/spare-parts"
import { picked, sortRows, withCounts } from "@/lib/list/filter"
import { fmt } from "@/lib/list/query"

/*
 * 35 ЗИП — список. Данные — useSpareParts() / spareParts.usePage() из lib/api/spare-parts, вёрстка — блоки components/blocks.
 * Паспорт позиции — ./[id]/page.tsx, форма — components/spare-parts/spare-part-form.tsx.
 */

const KEY = "spare-parts"
const TITLE = "ЗИП"
const HERO = "/equipment/switch-hero.jpg"
const UNIT: [string, string, string] = ["позиция", "позиции", "позиций"]

/** По какому значению сортирует каждая колонка. */
const SORT_BY = {
  branch: (x: SparePart) => x.branch,
  name: (x: SparePart) => x.f.name ?? "—",
  category: (x: SparePart) => x.f.category ?? "—",
  inv: (x: SparePart) => x.f.inv ?? "—",
  cost: (x: SparePart) => x.f.cost ?? "—",
}
type SortKey = keyof typeof SORT_BY
const SORT_COLUMNS: { k: SortKey; t: string }[] = [
  { k: "branch", t: "Филиал" },
  { k: "name", t: "Наименование ЗИП" },
  { k: "category", t: "Категория" },
  { k: "inv", t: "Инвентарный номер" },
  { k: "cost", t: "Стоимость, тг" },
]
const NUM_COLS: SortKey[] = ["cost"]

/** Отбор: поиск, фильтры (branch, category, owner, status) и сортировка. */
type Query = { search: string; f: Picked; sort: Sort<SortKey> }
const EMPTY: Query = { search: "", f: {}, sort: ["", 1] }

/** Значение фильтра у записи. */
const FILTER_OF: Record<string, (x: SparePart) => string> = {
  branch: (x) => x.branch,
  category: (x) => x.f.category ?? "—",
  owner: (x) => x.f.owner ?? "—",
  status: (x) => x.status,
}

const searchText = (x: SparePart) => `${x.branch} ${SPARE_FIELDS.map((c) => x.f[c.k] ?? "—").join(" ")} ${x.nodeCode} ${x.city}`.toLowerCase()

function filterRows(rows: SparePart[], q: Query) {
  const needle = q.search.trim().toLowerCase()
  const out = rows.filter((x) => (!needle || searchText(x).includes(needle)) && Object.entries(FILTER_OF).every(([k, get]) => picked(q.f[k], get(x))))
  return q.sort[0] ? sortRows(out, SORT_BY[q.sort[0]], q.sort[1]) : out
}

const STATUS_OPTIONS = Object.entries(SPARE_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

const href = (id: number) => `/${KEY}/${id}`

export default function SparePartsPage() {
  usePageTitle(TITLE)
  const router = useRouter()
  const all = useSpareParts()
  const remote = spareParts.isRemote()
  // Варианты фильтров из /filter-params (в API значения не совпадают с примерами)
  const remoteOpts = spareParts.useOptions()
  const [q, setQState] = useState<Query>(EMPTY)
  const [page, setPage] = useState(0)
  const [mode, setModeState] = useState<ViewMode>("table")
  const [size, setSize] = useState(PAGE_SIZE.table)
  const [more, setMore] = useState(false)
  // Шторка формы: {} — новая запись
  const [form, setForm] = useState<{ id?: number } | null>(null)
  const [importing, setImporting] = useState(false)
  const [report, setReport] = useState(false)
  const [del, setDel] = useState<SparePart[] | null>(null)
  const [qr, setQr] = useState<SparePart | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<number | null>(all[0]?.id ?? null)

  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  // Отбор — отложенно: ввод в поиске не ждёт пересчёта всех строк
  const deferred = useDeferredValue(q)
  const list = useMemo(() => filterRows(all, deferred), [all, deferred])
  const pages0 = Math.max(1, Math.ceil(list.length / size))
  const srv = spareParts.usePage(list, deferred, remote ? page : Math.min(page, pages0 - 1), size)
  const total = srv.total
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const view = srv.rows
  // В API счётчики и KPI — только по текущей странице
  const rows = remote ? srv.rows : all
  const current = rows.find((x) => x.id === active) ?? (remote ? srv.rows[0] : undefined)
  const allOnPage = view.length > 0 && view.every((x) => checked.has(x.id))
  const canCreate = !spareParts.readOnly()

  /* ---------- фильтры: варианты с числом записей ---------- */
  const options = {
    branch: withCounts(rows, FILTER_OF.branch, BRANCH_OPTIONS),
    category: withCounts(rows, FILTER_OF.category, remoteOpts.category ?? opts(CATEGORIES)),
    owner: withCounts(rows, FILTER_OF.owner, remoteOpts.owner ?? opts(OWNERS)),
    status: withCounts(rows, FILTER_OF.status, STATUS_OPTIONS),
  }
  const setF = (k: string) => (v: string[]) => setQ({ ...q, f: { ...q.f, [k]: v } })

  /* ---------- KPI ---------- */
  const branches = new Set(all.map((x) => x.branch)).size
  // TODO(API): сводка раздела (/summary) — форма ответа неизвестна; пока только «Всего», остальное — цифры макета
  const kpis = [
    { t: "Позиций", color: "#085eff", value: fmt(remote ? total : all.length), note: remote ? "в API" : `в ${branches} филиалах`, pct: 100 },
    { t: "На складе", color: "#a78bfa", value: "2 410", note: "", pct: 50 },
    { t: "Установлено", color: "var(--status-ok)", value: "710", note: "", pct: 50 },
    { t: "Стоимость склада", color: "#22d3ee", value: "184", note: "млн тг", pct: 50 },
    { t: "Без МОЛ", color: "var(--status-nolink)", value: "61%", note: "", pct: 61 },
    { t: "Без документов", color: "#22d3ee", value: "4%", note: "", pct: 4 },
  ].map((k, i) => (remote && i > 0 ? { ...k, value: "—", note: "", pct: 0 } : k))

  const points = useMemo<ListPoint[]>(
    () =>
      list.map((x) => ({
        id: x.id,
        ll: x.ll,
        title: sparePartName(x),
        sub: sparePartSub(x),
        tone: spareStatus(x)[1],
        note: sparePartSub(x),
        status: spareStatus(x)[0],
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
  const status = (x: SparePart) => ({ label: spareStatus(x)[0], tone: spareStatus(x)[1] })

  const empty = <NothingFound search={q.search} onReset={() => setQ(EMPTY)} onCreate={canCreate ? () => setForm({}) : undefined} />
  const toolbar = (
    <>
      <Toolbar>
        <SearchBox value={q.search} onChange={(search) => setQ({ ...q, search })} placeholder="Поиск по наименованию, инв. номеру, S/N…" />
        <FilterChip label="Филиал" all="Все филиалы" options={options.branch} value={q.f.branch ?? []} onChange={setF("branch")} short={(v) => v} />
        <FilterChip label="Категория" options={options.category} value={q.f.category ?? []} onChange={setF("category")} />
        <FilterChip label="Принадлежность ЗИП" options={options.owner} value={q.f.owner ?? []} onChange={setF("owner")} />
        <MoreButton active={q.f.status?.length ? 1 : 0} onClick={() => setMore(true)} />
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
      <ListHero crumb="Оборудование / Склад" title={TITLE} total={remote ? total : all.length} sub={`Форма учёта · ${TITLE}`} hero={HERO}>
        <HeroButton icon={FileSpreadsheet} label="Сводный файл" href={`/summary-files?section=${KEY}`} />
        <HeroButton icon={Download} label="Отчёт" onClick={() => setReport(true)} />
        <HeroButton icon={Upload} label="Импорт Excel" onClick={() => setImporting(true)} />
        <HeroButton icon={Plus} label="Создать" primary onClick={() => setForm({})} />
      </ListHero>

      <KpiRow>
        {kpis.map((k) => (
          <KpiCard key={k.t} {...k} />
        ))}
      </KpiRow>

      {mode === "map" ? (
        <div className="mt-[18px] px-(--page-gutter)">
          <ListPanel flush>{toolbar}</ListPanel>
          <MapBlock points={points} icon={Package} hrefOf={href} active={active} setActive={setActive} />
        </div>
      ) : mode === "cards" ? (
        <div className="mt-[18px] px-(--page-gutter)">
          <ListPanel flush>{toolbar}</ListPanel>
          <CardGrid empty={!view.length && empty}>
            {view.map((x) => (
              <RecordCard
                key={x.id}
                href={href(x.id)}
                photo={HERO}
                status={status(x)}
                title={sparePartName(x)}
                sub={sparePartSub(x)}
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
                  <Th key={c.k} k={c.k} sort={q.sort} onSort={(sort) => setQ({ ...q, sort })} num={NUM_COLS.includes(c.k)}>
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
                      <Bold v={x.f.name ?? "—"} />
                    </Td>
                    <Td>
                      <Text v={x.f.category ?? "—"} />
                    </Td>
                    <Td>
                      <Text v={x.f.inv ?? "—"} />
                    </Td>
                    <Td num>
                      <Text v={x.f.cost ?? "—"} />
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
              title={sparePartName(current)}
              sub={sparePartSub(current)}
              facts={[
                { t: "Филиал", v: branchName(current.branch) },
                { t: "Наименование ЗИП", v: String(current.f.name ?? "—") },
                { t: "Категория", v: String(current.f.category ?? "—") },
                { t: "Инвентарный номер", v: String(current.f.inv ?? "—") },
                { t: "Серийный номер (S/N)", v: String(current.f.serial ?? "—") },
              ]}
              more="Открыть паспорт"
            />
          )}
        </div>
      )}

      <FiltersPanel
        open={more}
        onOpenChange={setMore}
        title={TITLE}
        unit={UNIT}
        total={rows.length}
        value={q.f}
        found={(f) => filterRows(rows, { ...q, f }).length}
        onApply={(f) => setQ({ ...q, f })}
        groups={[
          { k: "branch", t: "Филиал", ui: "tags", opts: options.branch, short: (v) => v },
          { k: "category", t: "Категория", any: "Любой", opts: options.category },
          { k: "owner", t: "Принадлежность ЗИП", any: "Любой", opts: options.owner },
          { k: "status", t: "Статус", any: "Любой", opts: options.status },
        ]}
      />
      {del && (
        <DeleteDialog
          icon={Package}
          noun={UNIT}
          items={del.map((x) => ({ id: x.id, name: sparePartName(x), sub: sparePartSub(x).split(" · ")[0] }))}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => spareParts.remove(del, reason)}
          onClose={() => setDel(null)}
          onDone={() => setChecked(new Set())}
        />
      )}
      {qr && <QrDialog title={sparePartName(qr)} sub={sparePartSub(qr)} url={qrUrl(KEY, qr.id)} onClose={() => setQr(null)} />}
      {report && (
        <ReportDialog
          title={TITLE}
          columns={sparePartColumns}
          rows={rows}
          filtered={filterRows(rows, q)}
          active={describe(q, options)}
          branches={{ label: "Филиал", all: "Все филиалы", opts: BRANCH_OPTIONS }}
          onClose={() => setReport(false)}
        />
      )}
      {importing && <ImportDialog spec={sparePartsImport} onClose={() => setImporting(false)} />}
      {form && (
        <SparePartForm
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
const LABEL: Record<string, string> = { branch: "Филиал", category: "Категория", owner: "Принадлежность ЗИП", status: "Статус" }
const label = (o: Options, k: string, v: string) => (k === "branch" ? v : (o[k]?.find((x) => x.v === v)?.label ?? v))

/** Плашки включённых фильтров под панелью. */
function activeChips(q: Query, setQ: (q: Query) => void, o: Options): ActiveChip[] {
  return Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => ({ label: `${LABEL[k]}: ${v.map((x) => label(o, k, x)).join(", ")}`, clear: () => setQ({ ...q, f: { ...q.f, [k]: [] } }) }))
}

/** «АС, ЮФ · ГМС · поиск «…»» — текущие фильтры одной строкой для отчёта. */
function describe(q: Query, o: Options) {
  const parts = Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => v.map((x) => label(o, k, x)).join(", "))
  if (q.search.trim()) parts.push(`поиск «${q.search.trim()}»`)
  return parts.join(" · ")
}
