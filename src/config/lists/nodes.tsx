import { ChartColumn, Download, Plus, RadioTower, Upload } from "lucide-react"
import { Bar, Pill, Tag } from "@/components/list/ui"
import { BRANCHES, nodeRows, STATUS_LABEL, type NodeRow } from "@/data/nodes"
import { fmt, plural } from "@/lib/list/query"
import type { ListConfig, Tone } from "@/lib/list/types"

const TONE: Record<NodeRow["status"], Tone> = { work: "ok", rebuild: "warn", off: "bad" }
const OWN = { own: "Собственный", rent: "Аренда" }
const pct = (a: number, b: number) => (b ? Math.floor((a / b) * 100) : 0)

/** Узлы связи (макет 02). */
export const nodesList: ListConfig<NodeRow> = {
  key: "nodes",
  title: "Узлы связи",
  crumb: "Сеть",
  sub: "Все узлы связи QMobile по филиалам · обновлено сегодня в 06:30",
  hero: "/nodes/hero.jpg",
  icon: RadioTower,
  search: "Поиск по ID, адресу, объекту…",
  buttons: [
    { icon: ChartColumn, label: "Сводный отчёт", href: "/summary-files?section=nodes" },
    { icon: Download, label: "Отчёт", onClick: "export" },
    { icon: Upload, label: "Импорт Excel", onClick: "import" },
    { icon: Plus, label: "Создать узел", primary: true, onClick: "create" },
  ],
  rows: nodeRows,
  text: (x) => `${x.code} ${x.object} ${x.address} ${x.city}`,
  name: (x) => x.code,
  kpis: (rows) => {
    const n = rows.length
    const by = (s: NodeRow["status"]) => rows.filter((x) => x.status === s).length
    // TODO: портовая ёмкость (spd_equipment_ports) и ёмкость волокон (трассы ВОЛС) — из API; сейчас цифры макета
    const noDocs = rows.filter((x) => !x.hasDocs).length
    return [
      { t: "В работе", color: "var(--status-ok)", value: fmt(by("work")), note: `${pct(by("work"), n)}%`, pct: pct(by("work"), n) },
      {
        t: "На реконструкции",
        color: "var(--status-nolink)",
        value: fmt(by("rebuild")),
        note: `${pct(by("rebuild"), n)}%`,
        pct: pct(by("rebuild"), n),
      },
      { t: "Выведены", color: "var(--status-alarm)", value: fmt(by("off")), note: `${pct(by("off"), n)}%`, pct: pct(by("off"), n) },
      { t: "Портовая ёмкость", color: "#a78bfa", value: "100%", note: "568 / 569", pct: 100 },
      { t: "Ёмкость волокон", color: "#22d3ee", value: "98%", note: "370 / 379", pct: 98 },
      { t: "Без документов", color: "#085eff", value: fmt(noDocs), note: `${pct(noDocs, n)}%`, pct: pct(noDocs, n) },
    ]
  },
  filters: [
    {
      k: "branch",
      t: "Филиал",
      all: "Все филиалы",
      get: (x) => x.branch,
      opts: BRANCHES.map((b) => ({ v: b.v, label: b.label })),
      short: (v) => v,
    },
    { k: "network", t: "Тип сети", get: (x) => x.network, opts: ["ГМС", "ГРС", "ГАС", "МС"].map((v) => ({ v, label: v })) },
    {
      k: "ownership",
      t: "Форма владения",
      get: (x) => x.ownership,
      opts: [
        { v: "own", label: "Собственный" },
        { v: "rent", label: "Аренда" },
      ],
    },
    {
      k: "status",
      t: "Статус",
      get: (x) => x.status,
      opts: (["work", "rebuild", "off"] as const).map((v) => ({ v, label: STATUS_LABEL[v] })),
    },
    { k: "tech", t: "Технология", get: (x) => x.tech, opts: ["FTTH", "FTTB", "xDSL", "РРЛ"].map((v) => ({ v, label: v })), more: true },
  ],
  sort: ["", 1],
  cols: [
    {
      k: "code",
      t: "Узел",
      value: (x) => x.code,
      render: (x) => (
        <span className="flex items-center gap-3">
          <span className="grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
            <RadioTower className="size-[17px]" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <b className="block font-semibold">{x.code}</b>
            <span className="block max-w-[200px] truncate text-xs text-muted-foreground">{x.object}</span>
          </span>
        </span>
      ),
    },
    { k: "branch", t: "Филиал", value: (x) => x.branch, render: (x) => x.branch },
    { k: "city", t: "Населённый пункт", value: (x) => x.city, render: (x) => x.city },
    { k: "network", t: "Тип сети", value: (x) => x.network, render: (x) => x.network },
    { k: "ownership", t: "Владение", value: (x) => OWN[x.ownership], render: (x) => (x.ownership === "own" ? "Собств." : "Аренда") },
    {
      k: "tech",
      t: "Технологии",
      noSort: true,
      value: (x) => x.tech.join(", "),
      render: (x) => (
        <span className="flex gap-1.5">
          {x.tech.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </span>
      ),
    },
    {
      k: "fibers",
      t: "Волокна",
      num: true,
      value: (x) => (x.fibers ? x.fibers[0] / x.fibers[1] : null),
      render: (x) =>
        x.fibers ? (
          <span className="flex items-center gap-2">
            <Bar pct={pct(x.fibers[0], x.fibers[1])} className="h-[5px] w-[70px]" />
            {x.fibers[0]}/{x.fibers[1]}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      k: "status",
      t: "Статус",
      value: (x) => STATUS_LABEL[x.status],
      render: (x) => <Pill tone={TONE[x.status]}>{STATUS_LABEL[x.status]}</Pill>,
    },
  ],
  card: (x) => ({
    photo: `/nodes/photo-${((x.id - 1) % 5) + 1}.jpg`,
    status: { label: STATUS_LABEL[x.status], tone: TONE[x.status] },
    title: x.code,
    sub: `${x.object} · ${x.city}`,
    tags: x.tech,
    bar: { t: "Волокна", v: x.fibers ? `${x.fibers[0]}/${x.fibers[1]}` : "0/—", pct: x.fibers ? pct(x.fibers[0], x.fibers[1]) : 0 },
    open: "Паспорт",
  }),
  map: (x) =>
    x.onMap
      ? {
          ll: x.ll,
          title: x.code,
          sub: x.object,
          tone: TONE[x.status],
          note: `${x.object}${x.fibers ? ` · ${x.fibers[1]} ${plural(x.fibers[1], ["волокно", "волокна", "волокон"])}` : ""}`,
        }
      : null,
  preview: (x) => ({
    photo: "/nodes/tower.jpg",
    status: { label: STATUS_LABEL[x.status], tone: TONE[x.status] },
    title: x.code,
    sub: x.object === x.address.replace(/^[^,]+, /, "") ? x.address : `${x.object} · ${x.address}`,
    facts: [
      { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.label ?? x.branch },
      { t: "Тип сети", v: x.network },
      { t: "Форма владения", v: OWN[x.ownership] },
      { t: "Группа эксплуатации", v: x.ops },
    ],
    stats: [
      { t: "Волокон", v: x.fibers?.[1] ?? "—" },
      { t: "Оборуд.", v: x.equipment },
      { t: "ID-кан.", v: x.idChannels },
      { t: "Клиенты", v: x.clients },
    ],
    tags: x.tech,
    more: "Подробнее об узле",
  }),
}
