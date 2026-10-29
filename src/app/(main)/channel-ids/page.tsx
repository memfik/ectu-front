"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, FileSpreadsheet, Link as LinkIcon, Plus, Upload } from "lucide-react"
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
import { ChannelForm } from "@/components/channel-ids/channel-form"
import { Bold, Muted, Text } from "@/components/equipment/cells"
import { Pill } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { usePageTitle } from "@/hooks/use-page-title"
import { BRANCH_OPTIONS, branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import {
  CHANNEL_STATUS,
  CHANNEL_TYPES,
  channelColumns,
  channelName,
  channels,
  channelsImport,
  channelStatus,
  channelSub,
  TRAFFIC,
  useChannels,
  type Channel,
} from "@/lib/api/channel-ids"
import { picked, sortRows, withCounts } from "@/lib/list/filter"
import { fmt } from "@/lib/list/query"

/*
 * 14 ID-каналы — список. Данные — useChannels() / channels.usePage() из lib/api/channel-ids, вёрстка — блоки components/blocks.
 * Паспорт канала — ./[id]/page.tsx, форма — components/channel-ids/channel-form.tsx.
 */

const HERO = "/equipment/switch-hero.jpg"
const UNIT: [string, string, string] = ["канал", "канала", "каналов"]

/** По какому значению сортирует каждая колонка. */
const SORT_BY = {
  cid: (x: Channel) => x.f.cid,
  branch: (x: Channel) => x.branch,
  client: (x: Channel) => x.f.client,
  type: (x: Channel) => x.f.type,
  speed: (x: Channel) => x.f.speed,
  iface: (x: Channel) => x.f.iface,
  vlan: (x: Channel) => x.f.vlan,
  st: (x: Channel) => channelStatus(x)[0],
}
type SortKey = keyof typeof SORT_BY
const SORT_COLUMNS: { k: SortKey; t: string }[] = [
  { k: "cid", t: "ID-канала" },
  { k: "branch", t: "Филиал" },
  { k: "client", t: "Клиент" },
  { k: "type", t: "Тип канала" },
  { k: "speed", t: "Скорость" },
  { k: "iface", t: "Router / Interface" },
  { k: "vlan", t: "VLAN" },
  { k: "st", t: "Статус" },
]

/** Отбор: поиск, фильтры (branch, type, traffic, status) и сортировка. */
type Query = { search: string; f: Picked; sort: Sort<SortKey> }
const EMPTY: Query = { search: "", f: {}, sort: ["", 1] }

/** Значение фильтра у записи. */
const FILTER_OF: Record<string, (x: Channel) => string> = {
  branch: (x) => x.branch,
  type: (x) => x.f.type,
  traffic: (x) => x.f.traffic ?? "—",
  status: (x) => x.status,
}

const searchText = (x: Channel) =>
  `${x.f.cid} ${x.branch} ${x.f.client} ${x.f.type} ${x.f.speed} ${x.f.iface} ${x.f.vlan} ${x.f.traffic} ${x.nodeCode} ${x.city}`.toLowerCase()

function filterChannels(rows: Channel[], q: Query) {
  const needle = q.search.trim().toLowerCase()
  const out = rows.filter((x) => (!needle || searchText(x).includes(needle)) && Object.entries(FILTER_OF).every(([k, get]) => picked(q.f[k], get(x))))
  return q.sort[0] ? sortRows(out, SORT_BY[q.sort[0]], q.sort[1]) : out
}

const STATUS_OPTIONS = Object.entries(CHANNEL_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

const href = (id: number) => `/channel-ids/${id}`

export default function ChannelIdsPage() {
  usePageTitle("ID-каналы")
  const router = useRouter()
  const all = useChannels()
  const remote = channels.isRemote()
  // Варианты фильтров из /filter-params (в API значения не совпадают с примерами)
  const remoteOpts = channels.useOptions()
  const [q, setQState] = useState<Query>(EMPTY)
  const [page, setPage] = useState(0)
  const [mode, setModeState] = useState<ViewMode>("table")
  const [size, setSize] = useState(PAGE_SIZE.table)
  const [more, setMore] = useState(false)
  // Шторка формы: {} — новая запись
  const [form, setForm] = useState<{ id?: number } | null>(null)
  const [importing, setImporting] = useState(false)
  const [report, setReport] = useState(false)
  const [del, setDel] = useState<Channel[] | null>(null)
  const [qr, setQr] = useState<Channel | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<number | null>(all[0]?.id ?? null)

  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  // Отбор — отложенно: ввод в поиске не ждёт пересчёта всех строк
  const deferred = useDeferredValue(q)
  const list = useMemo(() => filterChannels(all, deferred), [all, deferred])
  const pages0 = Math.max(1, Math.ceil(list.length / size))
  const srv = channels.usePage(list, deferred, remote ? page : Math.min(page, pages0 - 1), size)
  const total = srv.total
  const pages = Math.max(1, Math.ceil(total / size))
  const pg = Math.min(page, pages - 1)
  const view = srv.rows
  // В API счётчики и KPI — только по текущей странице
  const rows = remote ? srv.rows : all
  const current = rows.find((x) => x.id === active) ?? (remote ? srv.rows[0] : undefined)
  const allOnPage = view.length > 0 && view.every((x) => checked.has(x.id))
  const canCreate = !channels.readOnly()

  /* ---------- фильтры: варианты с числом записей ---------- */
  const options = {
    branch: withCounts(rows, FILTER_OF.branch, BRANCH_OPTIONS),
    type: withCounts(rows, FILTER_OF.type, remoteOpts.type ?? opts(CHANNEL_TYPES)),
    traffic: withCounts(rows, FILTER_OF.traffic, remoteOpts.traffic ?? opts(TRAFFIC)),
    status: withCounts(rows, FILTER_OF.status, remoteOpts.status ?? STATUS_OPTIONS),
  }
  const setF = (k: string) => (v: string[]) => setQ({ ...q, f: { ...q.f, [k]: v } })

  /* ---------- KPI ---------- */
  const branches = new Set(all.map((x) => x.branch)).size
  // TODO(API): сводка раздела (/summary) — форма ответа неизвестна; пока только «Всего», остальное — цифры макета
  const kpis = [
    { t: "Каналов", color: "#085eff", value: fmt(remote ? total : all.length), note: remote ? "в API" : `в ${branches} филиалах`, pct: 100 },
    { t: "Активных", color: "var(--status-ok)", value: "2 291", note: "95%", pct: 95 },
    { t: "Авария", color: "#ff5257", value: "8", note: "", pct: 1 },
    { t: "Суммарно", color: "#a78bfa", value: "184", note: "Гбит/с", pct: 50 },
    { t: "Без клиента Onyma", color: "var(--status-nolink)", value: "64", note: "3%", pct: 3 },
    { t: "На карте", color: "#22d3ee", value: "2 380", note: "98%", pct: 98 },
  ].map((k, i) => (remote && i > 0 ? { ...k, value: "—", note: "", pct: 0 } : k))

  const points = useMemo<ListPoint[]>(
    () =>
      list.map((x) => ({
        id: x.id,
        ll: x.ll,
        title: channelName(x),
        sub: channelSub(x),
        tone: channelStatus(x)[1],
        note: channelSub(x),
        status: channelStatus(x)[0],
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
  const status = (x: Channel) => ({ label: channelStatus(x)[0], tone: channelStatus(x)[1] })

  const empty = <NothingFound search={q.search} onReset={() => setQ(EMPTY)} onCreate={canCreate ? () => setForm({}) : undefined} />
  const toolbar = (
    <>
      <Toolbar>
        <SearchBox value={q.search} onChange={(search) => setQ({ ...q, search })} placeholder="ID-канала, клиент, IP, VLAN, лицевой счёт…" />
        <FilterChip label="Филиал" all="Все филиалы" options={options.branch} value={q.f.branch ?? []} onChange={setF("branch")} short={(v) => v} />
        <FilterChip label="Тип канала" options={options.type} value={q.f.type ?? []} onChange={setF("type")} />
        <FilterChip label="Тип трафика" options={options.traffic} value={q.f.traffic ?? []} onChange={setF("traffic")} />
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
      <ListHero crumb="Клиенты" title="ID-каналы" total={remote ? total : all.length} sub="Реестр каналов: от точки 1 до точки 2, со всеми устройствами по пути" hero={HERO}>
        <HeroButton icon={FileSpreadsheet} label="Сводный файл" href="/summary-files?section=channel-ids" />
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
          <MapBlock points={points} icon={LinkIcon} hrefOf={href} active={active} setActive={setActive} />
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
                title={channelName(x)}
                sub={channelSub(x)}
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
                      <Bold v={x.f.cid} />
                    </Td>
                    <Td>
                      <Text v={x.branch} />
                    </Td>
                    <Td>
                      <Text v={x.f.client} />
                    </Td>
                    <Td>
                      <Text v={x.f.type} />
                    </Td>
                    <Td>
                      <Text v={x.f.speed} />
                    </Td>
                    <Td>
                      <Muted v={x.f.iface} />
                    </Td>
                    <Td>
                      <Text v={x.f.vlan} />
                    </Td>
                    <Td>
                      <Pill tone={channelStatus(x)[1]}>{channelStatus(x)[0]}</Pill>
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
              title={channelName(current)}
              sub={channelSub(current)}
              facts={[
                { t: "Филиал", v: branchName(current.branch) },
                { t: "ID-канала", v: current.f.cid },
                { t: "Клиент", v: current.f.client },
                { t: "Тип канала", v: current.f.type },
                { t: "Скорость", v: current.f.speed },
              ]}
              more="Открыть паспорт"
            />
          )}
        </div>
      )}

      <FiltersPanel
        open={more}
        onOpenChange={setMore}
        title="ID-каналы"
        unit={UNIT}
        total={rows.length}
        value={q.f}
        found={(f) => filterChannels(rows, { ...q, f }).length}
        onApply={(f) => setQ({ ...q, f })}
        groups={[
          { k: "branch", t: "Филиал", ui: "tags", opts: options.branch, short: (v) => v },
          { k: "type", t: "Тип канала", any: "Любой", opts: options.type },
          { k: "traffic", t: "Тип трафика", any: "Любой", opts: options.traffic },
          { k: "status", t: "Статус", any: "Любой", opts: options.status },
        ]}
      />
      {del && (
        <DeleteDialog
          icon={LinkIcon}
          noun={UNIT}
          items={del.map((x) => ({ id: x.id, name: channelName(x), sub: channelSub(x).split(" · ")[0] }))}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => channels.remove(del, reason)}
          onClose={() => setDel(null)}
          onDone={() => setChecked(new Set())}
        />
      )}
      {qr && <QrDialog title={channelName(qr)} sub={channelSub(qr)} url={qrUrl("channel-ids", qr.id)} onClose={() => setQr(null)} />}
      {report && (
        <ReportDialog
          title="ID-каналы"
          columns={channelColumns}
          rows={rows}
          filtered={filterChannels(rows, q)}
          active={describe(q, options)}
          branches={{ label: "Филиал", all: "Все филиалы", opts: BRANCH_OPTIONS }}
          onClose={() => setReport(false)}
        />
      )}
      {importing && <ImportDialog spec={channelsImport} onClose={() => setImporting(false)} />}
      {form && (
        <ChannelForm
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
const LABEL: Record<string, string> = { branch: "Филиал", type: "Тип канала", traffic: "Тип трафика", status: "Статус" }
const label = (o: Options, k: string, v: string) => (k === "branch" ? v : (o[k]?.find((x) => x.v === v)?.label ?? v))

/** Плашки включённых фильтров под панелью. */
function activeChips(q: Query, setQ: (q: Query) => void, o: Options): ActiveChip[] {
  return Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => ({ label: `${LABEL[k]}: ${v.map((x) => label(o, k, x)).join(", ")}`, clear: () => setQ({ ...q, f: { ...q.f, [k]: [] } }) }))
}

/** «АС, ЮФ · L2VPN · поиск «…»» — текущие фильтры одной строкой для отчёта. */
function describe(q: Query, o: Options) {
  const parts = Object.entries(q.f)
    .filter(([, v]) => v.length)
    .map(([k, v]) => v.map((x) => label(o, k, x)).join(", "))
  if (q.search.trim()) parts.push(`поиск «${q.search.trim()}»`)
  return parts.join(" · ")
}
