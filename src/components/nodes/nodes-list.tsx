"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChartColumn, Download, Plus, RadioTower, Upload } from "lucide-react"
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
import { Bar, Pill, Tag } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { NodeForm } from "@/components/nodes/node-form"
import {
  BRANCHES,
  NETWORKS,
  NODE_STATUSES,
  nodeColumns,
  nodeName,
  nodes,
  nodesImport,
  nodeStatus,
  OBJECT_TYPES,
  opsLabel,
  OWNERSHIP,
  REGIONS,
  STATUS_LABEL,
  TECH_FILTER,
  useNodes,
  type NodeRow,
} from "@/lib/api/nodes"
import { picked, sortRows, withCounts } from "@/lib/list/filter"
import { fmt, plural } from "@/lib/list/query"

/*
 * 02 Узлы связи — список (страницы /nodes и /nodes/new). Данные — useNodes() / nodes.usePage() из lib/api/nodes,
 * вёрстка — блоки components/blocks. Паспорт узла — app/(main)/nodes/[id]/page.tsx, форма — node-form.tsx.
 */

const HERO = "/nodes/hero.jpg"
const UNIT: [string, string, string] = ["узел", "узла", "узлов"]
const pct = (a: number, b: number) => (b ? Math.floor((a / b) * 100) : 0)

/** По какому значению сортирует каждая колонка («Технологии» — без сортировки). */
const SORT_BY = {
  code: (x: NodeRow) => x.code,
  branch: (x: NodeRow) => x.branch,
  city: (x: NodeRow) => x.city,
  network: (x: NodeRow) => x.network,
  ownership: (x: NodeRow) => OWNERSHIP[x.ownership],
  fibers: (x: NodeRow) => (x.fibers ? x.fibers[0] / x.fibers[1] : null),
  status: (x: NodeRow) => STATUS_LABEL[x.status],
}
type SortKey = keyof typeof SORT_BY
const SORT_COLUMNS: { k: SortKey; t: string }[] = [
  { k: "code", t: "Узел" },
  { k: "branch", t: "Филиал" },
  { k: "city", t: "Населённый пункт" },
  { k: "network", t: "Тип сети" },
  { k: "ownership", t: "Владение" },
  { k: "fibers", t: "Волокна" },
  { k: "status", t: "Статус" },
]
/** Колонок в таблице: 7 сортируемых + «Технологии». */
const COLS = SORT_COLUMNS.length + 1

/** Отбор: поиск, фильтры и сортировка. */
type Query = { search: string; f: Picked; sort: Sort<SortKey> }
const EMPTY: Query = { search: "", f: {}, sort: ["", 1] }

/** Значение фильтра у записи; флаги — "1". */
const FILTER_OF: Record<string, (x: NodeRow) => string | string[]> = {
  branch: (x) => x.branch,
  region: (x) => x.region,
  objectType: (x) => x.objectType,
  network: (x) => x.network,
  ownership: (x) => x.ownership,
  status: (x) => x.status,
  tech: (x) => x.tech,
  onMap: (x) => (x.onMap ? "1" : "0"),
  noDocs: (x) => (x.hasDocs ? "0" : "1"),
}
/** Фильтры только в «Ещё фильтры» (без кнопки в панели). */
const MORE = ["region", "objectType", "tech", "onMap", "noDocs"]
const FLAGS = ["onMap", "noDocs"]

const searchText = (x: NodeRow) => `${x.code} ${x.object} ${x.address} ${x.city}`.toLowerCase()

function filterNodes(rows: NodeRow[], q: Query) {
  const needle = q.search.trim().toLowerCase()
  const out = rows.filter((x) => (!needle || searchText(x).includes(needle)) && Object.entries(FILTER_OF).every(([k, get]) => picked(q.f[k], get(x))))
  return q.sort[0] ? sortRows(out, SORT_BY[q.sort[0]], q.sort[1]) : out
}

const opts = (list: string[]) => list.map((v) => ({ v, label: v }))
const BRANCH_OPTIONS = BRANCHES.map((b) => ({ v: b.v, label: b.label }))
const STATUS_OPTIONS = NODE_STATUSES.map((v) => ({ v, label: STATUS_LABEL[v] }))
const OWNERSHIP_OPTIONS = Object.entries(OWNERSHIP).map(([v, label]) => ({ v, label }))
const YES = [{ v: "1", label: "Да" }]

const href = (id: number) => `/nodes/${id}`
const photo = (x: NodeRow) => `/nodes/photo-${((x.id - 1) % 5) + 1}.jpg`
const fibersText = (x: NodeRow) => (x.fibers ? `${x.fibers[0]}/${x.fibers[1]}` : "0/—")

/** Список узлов связи; `create` — сразу открыть шторку нового узла (/nodes/new, «Создать узел» в меню и на главной). */
export function NodesList({ create }: { create?: boolean }) {
  const router = useRouter()
  const all = useNodes()
  const remote = nodes.isRemote()
  // Варианты фильтров из /filter-params (в API значения не совпадают с примерами)
  const remoteOpts = nodes.useOptions()
  const [q, setQState] = useState<Query>(EMPTY)
  const [page, setPage] = useState(0)
  const [mode, setModeState] = useState<ViewMode>("table")
  const [size, setSize] = useState(PAGE_SIZE.table)
  const [more, setMore] = useState(false)
  // Шторка формы: {} — новый узел
  const [form, setForm] = useState<{ id?: number } | null>(create ? {} : null)
  const [importing, setImporting] = useState(false)
  const [report, setReport] = useState(false)
  const [del, setDel] = useState<NodeRow[] | null>(null)
  const [qr, setQr] = useState<NodeRow | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<number | null>(all[0]?.id ?? null)

  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  // Отбор — отложенно: ввод в поиске не ждёт пересчёта всех строк
  const deferred = useDeferredValue(q)
  const list = useMemo(() => filterNodes(all, deferred), [all, deferred])
  const pages0 = Math.max(1, Math.ceil(list.length / size))
  const srv = nodes.usePage(list, deferred, remote ? page : Math.min(page, pages0 - 1), size)
  const total = srv.total
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const view = srv.rows
  // В API счётчики, карта и отчёт — только по текущей странице
  const rows = remote ? srv.rows : all
  const shown = remote ? srv.rows : list
  const current = rows.find((x) => x.id === active) ?? (remote ? srv.rows[0] : undefined)
  const allOnPage = view.length > 0 && view.every((x) => checked.has(x.id))
  const canCreate = !nodes.readOnly()

  /* ---------- фильтры: варианты с числом записей ---------- */
  const options: Record<string, { v: string; label: string; n: number }[]> = {
    branch: withCounts(rows, FILTER_OF.branch, BRANCH_OPTIONS),
    region: withCounts(rows, FILTER_OF.region, remoteOpts.region ?? opts(REGIONS)),
    objectType: withCounts(rows, FILTER_OF.objectType, remoteOpts.objectType ?? opts(OBJECT_TYPES)),
    network: withCounts(rows, FILTER_OF.network, remoteOpts.network ?? opts(NETWORKS)),
    ownership: withCounts(rows, FILTER_OF.ownership, remoteOpts.ownership ?? OWNERSHIP_OPTIONS),
    status: withCounts(rows, FILTER_OF.status, remoteOpts.status ?? STATUS_OPTIONS),
    tech: withCounts(rows, FILTER_OF.tech, opts(TECH_FILTER)),
    onMap: withCounts(rows, FILTER_OF.onMap, YES),
    noDocs: withCounts(rows, FILTER_OF.noDocs, YES),
  }
  const setF = (k: string) => (v: string[]) => setQ({ ...q, f: { ...q.f, [k]: v } })

  /* ---------- KPI ---------- */
  // TODO: портовая ёмкость (spd_equipment_ports) и ёмкость волокон (трассы ВОЛС) — из API; сейчас цифры макета
  const kpis = useMemo(() => {
    const n = all.length
    const by = (st: NodeRow["status"]) => all.filter((x) => x.status === st).length
    const noDocs = all.filter((x) => !x.hasDocs).length
    const list = [
      { t: "В работе", color: "var(--status-ok)", value: fmt(by("work")), note: `${pct(by("work"), n)}%`, pct: pct(by("work"), n) },
      { t: "На реконструкции", color: "var(--status-nolink)", value: fmt(by("rebuild")), note: `${pct(by("rebuild"), n)}%`, pct: pct(by("rebuild"), n) },
      { t: "Выведены", color: "var(--status-alarm)", value: fmt(by("off")), note: `${pct(by("off"), n)}%`, pct: pct(by("off"), n) },
      { t: "Портовая ёмкость", color: "#a78bfa", value: "100%", note: "568 / 569", pct: 100 },
      { t: "Ёмкость волокон", color: "#22d3ee", value: "98%", note: "370 / 379", pct: 98 },
      { t: "Без документов", color: "#085eff", value: fmt(noDocs), note: `${pct(noDocs, n)}%`, pct: pct(noDocs, n) },
    ]
    // TODO(API): сводка раздела (/summary) — форма ответа неизвестна; пока только «Всего»
    return remote ? list.map((k, i) => (i === 0 ? { ...k, value: fmt(total), note: "в API", pct: 100 } : { ...k, value: "—", note: "", pct: 0 })) : list
  }, [all, remote, total])

  const points = useMemo<ListPoint[]>(
    () =>
      shown
        .filter((x) => x.onMap)
        .map((x) => ({
          id: x.id,
          ll: x.ll,
          title: x.code,
          sub: x.object,
          tone: nodeStatus(x)[1],
          note: `${x.object}${x.fibers ? ` · ${x.fibers[1]} ${plural(x.fibers[1], ["волокно", "волокна", "волокон"])}` : ""}`,
          status: nodeStatus(x)[0],
        })),
    [shown],
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
  const status = (x: NodeRow) => ({ label: nodeStatus(x)[0], tone: nodeStatus(x)[1] })

  const empty = <NothingFound search={q.search} onReset={() => setQ(EMPTY)} onCreate={canCreate ? () => setForm({}) : undefined} />
  const toolbar = (
    <>
      <Toolbar>
        <SearchBox value={q.search} onChange={(search) => setQ({ ...q, search })} placeholder="Поиск по ID, адресу, объекту…" />
        <FilterChip label="Филиал" all="Все филиалы" options={options.branch} value={q.f.branch ?? []} onChange={setF("branch")} short={(v) => v} />
        <FilterChip label="Тип сети" options={options.network} value={q.f.network ?? []} onChange={setF("network")} />
        <FilterChip label="Форма владения" options={options.ownership} value={q.f.ownership ?? []} onChange={setF("ownership")} />
        <FilterChip label="Статус" options={options.status} value={q.f.status ?? []} onChange={setF("status")} />
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
      <ListHero crumb="Сеть" title="Узлы связи" total={remote ? total : all.length} sub="Все узлы связи QMobile по филиалам · обновлено сегодня в 06:30" hero={HERO}>
        <HeroButton icon={ChartColumn} label="Сводный отчёт" href="/summary-files?section=nodes" />
        <HeroButton icon={Download} label="Отчёт" onClick={() => setReport(true)} />
        <HeroButton icon={Upload} label="Импорт Excel" onClick={() => setImporting(true)} />
        <HeroButton icon={Plus} label="Создать узел" primary onClick={() => setForm({})} />
      </ListHero>

      <KpiRow>
        {kpis.map((k) => (
          <KpiCard key={k.t} {...k} />
        ))}
      </KpiRow>

      {mode === "map" ? (
        <div className="mt-[18px] px-(--page-gutter)">
          <ListPanel flush>{toolbar}</ListPanel>
          <MapBlock points={points} icon={RadioTower} hrefOf={href} active={active} setActive={setActive} />
        </div>
      ) : mode === "cards" ? (
        <div className="mt-[18px] px-(--page-gutter)">
          <ListPanel flush>{toolbar}</ListPanel>
          <CardGrid empty={!view.length && empty}>
            {view.map((x) => (
              <RecordCard
                key={x.id}
                href={href(x.id)}
                photo={photo(x)}
                status={status(x)}
                title={x.code}
                sub={`${x.object} · ${x.city}`}
                tags={x.tech}
                bar={{ t: "Волокна", v: fibersText(x), pct: x.fibers ? pct(x.fibers[0], x.fibers[1]) : 0 }}
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
                {SORT_COLUMNS.slice(0, 5).map((c) => (
                  <Th key={c.k} k={c.k} sort={q.sort} onSort={(sort) => setQ({ ...q, sort })}>
                    {c.t}
                  </Th>
                ))}
                <Th>Технологии</Th>
                <Th k="fibers" sort={q.sort} onSort={(sort) => setQ({ ...q, sort })} num>
                  Волокна
                </Th>
                <Th k="status" sort={q.sort} onSort={(sort) => setQ({ ...q, sort })}>
                  Статус
                </Th>
                <ThActions />
              </HeadRow>
              <tbody>
                {view.map((x, i) => (
                  <Row key={x.id} on={x.id === active} onClick={() => setActive(x.id)} onDoubleClick={() => router.push(href(x.id))}>
                    <RowSelect on={checked.has(x.id)} n={pg * size + i + 1} onToggle={() => toggle(x.id)} />
                    <Td>
                      <span className="flex items-center gap-3">
                        <span className="grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                          <RadioTower className="size-[17px]" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0">
                          <b className="block font-semibold">{x.code}</b>
                          <span className="block max-w-[200px] truncate text-xs text-muted-foreground">{x.object}</span>
                        </span>
                      </span>
                    </Td>
                    <Td>{x.branch}</Td>
                    <Td>{x.city}</Td>
                    <Td>{x.network}</Td>
                    <Td>{x.ownership === "own" ? "Собств." : "Аренда"}</Td>
                    <Td>
                      <span className="flex gap-1.5">
                        {x.tech.map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </span>
                    </Td>
                    <Td num>
                      {x.fibers ? (
                        <span className="flex items-center gap-2">
                          <Bar pct={pct(x.fibers[0], x.fibers[1])} className="h-[5px] w-[70px]" />
                          {x.fibers[0]}/{x.fibers[1]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td>
                      <Pill tone={nodeStatus(x)[1]}>{nodeStatus(x)[0]}</Pill>
                    </Td>
                    <TdActions onQr={() => setQr(x)} onEdit={() => setForm({ id: x.id })} onDelete={() => setDel([x])} />
                  </Row>
                ))}
                {!view.length && <EmptyRow cols={COLS + 3}>{srv.loading ? "Загрузка…" : srv.error ? `Ошибка API: ${srv.error}` : empty}</EmptyRow>}
              </tbody>
            </DataTable>
            {pager}
          </ListPanel>

          {current && (
            <PreviewPanel
              href={href(current.id)}
              onClose={() => setActive(null)}
              onEdit={() => setForm({ id: current.id })}
              photo="/nodes/tower.jpg"
              status={status(current)}
              title={current.code}
              sub={current.object === current.address.replace(/^[^,]+, /, "") ? current.address : `${current.object} · ${current.address}`}
              facts={[
                { t: "Филиал", v: BRANCHES.find((b) => b.v === current.branch)?.label ?? current.branch },
                { t: "Тип сети", v: current.network },
                { t: "Форма владения", v: OWNERSHIP[current.ownership] },
                { t: "Группа эксплуатации", v: opsLabel(current) },
              ]}
              stats={[
                { t: "Волокон", v: current.fibers?.[1] ?? "—" },
                { t: "Оборуд.", v: current.equipment },
                { t: "ID-кан.", v: current.idChannels },
                { t: "Клиенты", v: current.clients },
              ]}
              tags={current.tech}
              more="Подробнее об узле"
            />
          )}
        </div>
      )}

      <FiltersPanel
        open={more}
        onOpenChange={setMore}
        title="Узлы связи"
        unit={UNIT}
        total={rows.length}
        value={q.f}
        found={(f) => filterNodes(rows, { ...q, f }).length}
        onApply={(f) => setQ({ ...q, f })}
        groups={[
          { k: "branch", t: "Филиал", ui: "tags", opts: options.branch, short: (v) => v },
          { k: "region", t: "Регион", any: "Все регионы", opts: options.region },
          { k: "objectType", t: "Объект", any: "Все объекты", opts: options.objectType },
          { k: "network", t: "Тип сети", any: "Любой", opts: options.network },
          { k: "ownership", t: "Форма владения", any: "Любая", opts: options.ownership },
          { k: "status", t: "Статус", any: "Любой", opts: options.status },
          { k: "tech", t: "Технология", any: "Любая", opts: options.tech },
          { k: "onMap", t: "Занесена на карту", ui: "flag", opts: options.onMap },
          { k: "noDocs", t: "Без документов", ui: "flag", opts: options.noDocs },
        ]}
      />
      {del && (
        <DeleteDialog
          icon={RadioTower}
          noun={["узел связи", "узла связи", "узлов связи"]}
          items={del.map((x) => ({ id: x.id, name: nodeName(x) }))}
          warning="Связанные ВОЛС, оборудование и ID-каналы останутся, но потеряют привязку к узлу."
          reasons={["Демонтаж", "Дубликат записи", "Ошибка ввода", "Передано другому филиалу", "Списание"]}
          onConfirm={(reason) => nodes.remove(del, reason)}
          onClose={() => setDel(null)}
          onDone={() => setChecked(new Set())}
        />
      )}
      {/* TODO: адрес короткой ссылки — от бэкенда */}
      {qr && <QrDialog title={qr.code} sub={`${qr.object} · ${qr.address}`} url={`https://estu.qmobile.kz/q/${qr.code}`} onClose={() => setQr(null)} />}
      {report && (
        <ReportDialog
          title="Узлы связи"
          columns={nodeColumns}
          rows={rows}
          filtered={filterNodes(rows, q)}
          active={describe(q, options)}
          branches={{ label: "Филиал", all: "Все филиалы", opts: BRANCH_OPTIONS }}
          date={(x) => x.updated}
          onClose={() => setReport(false)}
        />
      )}
      {importing && <ImportDialog spec={nodesImport} onClose={() => setImporting(false)} />}
      {form && (
        <NodeForm
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
const LABEL: Record<string, string> = {
  branch: "Филиал",
  region: "Регион",
  objectType: "Объект",
  network: "Тип сети",
  ownership: "Форма владения",
  status: "Статус",
  tech: "Технология",
  onMap: "Занесена на карту",
  noDocs: "Без документов",
}
const label = (o: Options, k: string, v: string) => (k === "branch" ? v : (o[k]?.find((x) => x.v === v)?.label ?? v))

/** Плашки включённых фильтров под панелью; у флагов — только название. */
function activeChips(q: Query, setQ: (q: Query) => void, o: Options): ActiveChip[] {
  return Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => ({
      label: FLAGS.includes(k) ? LABEL[k] : `${LABEL[k]}: ${v.map((x) => label(o, k, x)).join(", ")}`,
      clear: () => setQ({ ...q, f: { ...q.f, [k]: [] } }),
    }))
}

/** «АС, ЮФ · ГМС · поиск «…»» — текущие фильтры одной строкой для отчёта. */
function describe(q: Query, o: Options) {
  const parts = Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => (FLAGS.includes(k) ? LABEL[k] : v.map((x) => label(o, k, x)).join(", ")))
  if (q.search.trim()) parts.push(`поиск «${q.search.trim()}»`)
  return parts.join(" · ")
}
