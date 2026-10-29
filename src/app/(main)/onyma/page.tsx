"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, FileSpreadsheet, SquareUserRound } from "lucide-react"
import { DeleteDialog } from "@/components/blocks/delete-dialog"
import { FiltersPanel, type Picked } from "@/components/blocks/filters-panel"
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
import { Bold, Muted, Text } from "@/components/equipment/cells"
import { Pill } from "@/components/list/ui"
import { OnymaForm } from "@/components/onyma/onyma-form"
import { RoleGate } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { BRANCH_OPTIONS, branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { ONYMA_STATUS, onyma, onymaColumns, onymaName, onymaStatus, onymaSub, SEGMENTS, useOnymaClients, type OnymaClient } from "@/lib/api/onyma"
import { picked, sortRows, withCounts } from "@/lib/list/filter"
import { fmt } from "@/lib/list/query"

/*
 * 13 Клиенты Onyma — список (только просмотр: без создания и импорта, без карты; доступ — admin, ip_manager).
 * Данные — useOnymaClients() / onyma.usePage() из lib/api/onyma, вёрстка — блоки components/blocks.
 * Паспорт абонента — ./[id]/page.tsx, форма правки — components/onyma/onyma-form.tsx.
 */

const HERO = "/nodes/clients.jpg"
const UNIT: [string, string, string] = ["абонент", "абонента", "абонентов"]

/** По какому значению сортирует каждая колонка. */
const SORT_BY = {
  company: (x: OnymaClient) => x.f.company,
  account: (x: OnymaClient) => x.f.account,
  contract: (x: OnymaClient) => x.f.contract,
  branch: (x: OnymaClient) => x.branch,
  segment: (x: OnymaClient) => x.f.segment,
  ip: (x: OnymaClient) => x.f.ip,
  speed: (x: OnymaClient) => x.f.speed,
  st: (x: OnymaClient) => onymaStatus(x)[0],
}
type SortKey = keyof typeof SORT_BY
const SORT_COLUMNS: { k: SortKey; t: string }[] = [
  { k: "company", t: "Наименование" },
  { k: "account", t: "Лицевой счёт" },
  { k: "contract", t: "Договор" },
  { k: "branch", t: "Филиал" },
  { k: "segment", t: "Сегмент" },
  { k: "ip", t: "Статический IP" },
  { k: "speed", t: "Скорость" },
  { k: "st", t: "Статус" },
]

/** Отбор: поиск, фильтры (branch, segment, status) и сортировка. */
type Query = { search: string; f: Picked; sort: Sort<SortKey> }
const EMPTY: Query = { search: "", f: {}, sort: ["", 1] }

/** Значение фильтра у записи. */
const FILTER_OF: Record<string, (x: OnymaClient) => string> = {
  branch: (x) => x.branch,
  segment: (x) => x.f.segment,
  status: (x) => x.status,
}

const searchText = (x: OnymaClient) =>
  `${x.f.company} ${x.f.account} ${x.f.contract} ${x.branch} ${x.f.segment} ${x.f.ip} ${x.f.speed} ${x.nodeCode} ${x.city}`.toLowerCase()

function filterOnyma(rows: OnymaClient[], q: Query) {
  const needle = q.search.trim().toLowerCase()
  const out = rows.filter((x) => (!needle || searchText(x).includes(needle)) && Object.entries(FILTER_OF).every(([k, get]) => picked(q.f[k], get(x))))
  return q.sort[0] ? sortRows(out, SORT_BY[q.sort[0]], q.sort[1]) : out
}

const STATUS_OPTIONS = Object.entries(ONYMA_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

const href = (id: number) => `/onyma/${id}`

export default function OnymaPage() {
  usePageTitle("Клиенты Onyma")
  return (
    <RoleGate section="Клиенты Onyma" roles={["admin", "ip_manager"]}>
      <OnymaList />
    </RoleGate>
  )
}

function OnymaList() {
  const router = useRouter()
  const all = useOnymaClients()
  const remote = onyma.isRemote()
  // Варианты фильтров из /filter-params (в API значения не совпадают с примерами)
  const remoteOpts = onyma.useOptions()
  const [q, setQState] = useState<Query>(EMPTY)
  const [page, setPage] = useState(0)
  const [mode, setModeState] = useState<ViewMode>("table")
  const [size, setSize] = useState(PAGE_SIZE.table)
  const [more, setMore] = useState(false)
  // Шторка формы — только правка (создания нет)
  const [form, setForm] = useState<{ id: number } | null>(null)
  const [report, setReport] = useState(false)
  const [del, setDel] = useState<OnymaClient[] | null>(null)
  const [qr, setQr] = useState<OnymaClient | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<number | null>(all[0]?.id ?? null)

  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  // Отбор — отложенно: ввод в поиске не ждёт пересчёта всех строк
  const deferred = useDeferredValue(q)
  const list = useMemo(() => filterOnyma(all, deferred), [all, deferred])
  const pages0 = Math.max(1, Math.ceil(list.length / size))
  const srv = onyma.usePage(list, deferred, remote ? page : Math.min(page, pages0 - 1), size)
  const total = srv.total
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const view = srv.rows
  // В API счётчики и KPI — только по текущей странице
  const rows = remote ? srv.rows : all
  const current = rows.find((x) => x.id === active) ?? (remote ? srv.rows[0] : undefined)
  const allOnPage = view.length > 0 && view.every((x) => checked.has(x.id))

  /* ---------- фильтры: варианты с числом записей ---------- */
  const options = {
    branch: withCounts(rows, FILTER_OF.branch, BRANCH_OPTIONS),
    segment: withCounts(rows, FILTER_OF.segment, remoteOpts.segment ?? opts(SEGMENTS)),
    status: withCounts(rows, FILTER_OF.status, remoteOpts.status ?? STATUS_OPTIONS),
  }
  const setF = (k: string) => (v: string[]) => setQ({ ...q, f: { ...q.f, [k]: v } })

  /* ---------- KPI ---------- */
  const branches = new Set(all.map((x) => x.branch)).size
  // TODO(API): сводка раздела (/summary) — форма ответа неизвестна; пока только «Всего», остальное — цифры макета
  const kpis = [
    { t: "Абонентов", color: "#085eff", value: fmt(remote ? total : all.length), note: remote ? "в API" : `в ${branches} филиалах`, pct: 100 },
    { t: "Активно", color: "var(--status-ok)", value: "5 212", note: "93%", pct: 93 },
    { t: "Закрыто", color: "#ff5257", value: "392", note: "7%", pct: 7 },
    { t: "Enterprise", color: "#a78bfa", value: "318", note: "", pct: 50 },
    { t: "Со статическим IP", color: "#22d3ee", value: "2 140", note: "38%", pct: 38 },
    { t: "Синхронизация", color: "#085eff", value: "06:30", note: "сегодня", pct: 100 },
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
  const status = (x: OnymaClient) => ({ label: onymaStatus(x)[0], tone: onymaStatus(x)[1] })

  const empty = <NothingFound search={q.search} onReset={() => setQ(EMPTY)} />
  const toolbar = (
    <>
      <Toolbar>
        <SearchBox value={q.search} onChange={(search) => setQ({ ...q, search })} placeholder="Наименование, лицевой счёт, договор, IP…" />
        <FilterChip label="Филиал" all="Все филиалы" options={options.branch} value={q.f.branch ?? []} onChange={setF("branch")} short={(v) => v} />
        <FilterChip label="Бизнес-сегмент" options={options.segment} value={q.f.segment ?? []} onChange={setF("segment")} />
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
      <ListHero crumb="Клиенты" title="Клиенты Onyma" total={remote ? total : all.length} sub="Действующие абоненты из биллинга Onyma · только просмотр" hero={HERO}>
        <HeroButton icon={FileSpreadsheet} label="Сводный файл" href="/summary-files?section=onyma" />
        <HeroButton icon={Download} label="Отчёт" onClick={() => setReport(true)} />
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
                title={onymaName(x)}
                sub={onymaSub(x)}
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
                  <Th key={c.k} k={c.k} sort={q.sort} onSort={(sort) => setQ({ ...q, sort })}>
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
                      <Bold v={x.f.company} />
                    </Td>
                    <Td>
                      <Text v={x.f.account} />
                    </Td>
                    <Td>
                      <Muted v={x.f.contract} />
                    </Td>
                    <Td>
                      <Text v={x.branch} />
                    </Td>
                    <Td>
                      <Text v={x.f.segment} />
                    </Td>
                    <Td>
                      <Text v={x.f.ip} />
                    </Td>
                    <Td>
                      <Text v={x.f.speed} />
                    </Td>
                    <Td>
                      <Pill tone={onymaStatus(x)[1]}>{onymaStatus(x)[0]}</Pill>
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
              title={onymaName(current)}
              sub={onymaSub(current)}
              facts={[
                { t: "Филиал", v: branchName(current.branch) },
                { t: "Наименование", v: current.f.company },
                { t: "Лицевой счёт", v: current.f.account },
                { t: "Договор", v: current.f.contract },
                { t: "Сегмент", v: current.f.segment },
              ]}
              more="Открыть паспорт"
            />
          )}
        </div>
      )}

      <FiltersPanel
        open={more}
        onOpenChange={setMore}
        title="Клиенты Onyma"
        unit={UNIT}
        total={rows.length}
        value={q.f}
        found={(f) => filterOnyma(rows, { ...q, f }).length}
        onApply={(f) => setQ({ ...q, f })}
        groups={[
          { k: "branch", t: "Филиал", ui: "tags", opts: options.branch, short: (v) => v },
          { k: "segment", t: "Бизнес-сегмент", any: "Любой", opts: options.segment },
          { k: "status", t: "Статус", any: "Любой", opts: options.status },
        ]}
      />
      {del && (
        <DeleteDialog
          icon={SquareUserRound}
          noun={UNIT}
          items={del.map((x) => ({ id: x.id, name: onymaName(x), sub: onymaSub(x).split(" · ")[0] }))}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => onyma.remove(del, reason)}
          onClose={() => setDel(null)}
          onDone={() => setChecked(new Set())}
        />
      )}
      {qr && <QrDialog title={onymaName(qr)} sub={onymaSub(qr)} url={qrUrl("onyma", qr.id)} onClose={() => setQr(null)} />}
      {report && (
        <ReportDialog
          title="Клиенты Onyma"
          columns={onymaColumns}
          rows={rows}
          filtered={filterOnyma(rows, q)}
          active={describe(q, options)}
          branches={{ label: "Филиал", all: "Все филиалы", opts: BRANCH_OPTIONS }}
          onClose={() => setReport(false)}
        />
      )}
      {form && (
        <OnymaForm
          key={form.id}
          row={rows.find((x) => x.id === form.id)}
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
const LABEL: Record<string, string> = { branch: "Филиал", segment: "Бизнес-сегмент", status: "Статус" }
const label = (o: Options, k: string, v: string) => (k === "branch" ? v : (o[k]?.find((x) => x.v === v)?.label ?? v))

/** Плашки включённых фильтров под панелью. */
function activeChips(q: Query, setQ: (q: Query) => void, o: Options): ActiveChip[] {
  return Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => ({ label: `${LABEL[k]}: ${v.map((x) => label(o, k, x)).join(", ")}`, clear: () => setQ({ ...q, f: { ...q.f, [k]: [] } }) }))
}

/** «АС, ЮФ · SME · поиск «…»» — текущие фильтры одной строкой для отчёта. */
function describe(q: Query, o: Options) {
  const parts = Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => v.map((x) => label(o, k, x)).join(", "))
  if (q.search.trim()) parts.push(`поиск «${q.search.trim()}»`)
  return parts.join(" · ")
}
