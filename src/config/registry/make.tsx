import type { LucideIcon } from "lucide-react"
import { Download, FileSpreadsheet, Plus, Upload } from "lucide-react"
import { Bar, Pill, Tag } from "@/components/list/ui"
import { BRANCHES, nodeRows, type NodeRow } from "@/data/nodes"
import { fmt } from "@/lib/list/query"
import type { Column, Field, Filter, Kpi, ListConfig, Tone } from "@/lib/list/types"

/*
 * Конструктор раздела по описанию (макеты 07…25): пример данных, список, фильтры, форма, отчёт и паспорт
 * из одного `Spec`. Поля записи лежат в `f` — ключи совпадают с колонками и полями формы.
 * TODO: API — у каждого раздела своя таблица БД (см. docs/design-handoff.md §5).
 */

export type Val = string | number
export type GenRow = {
  id: number
  num: string
  branch: string
  nodeId: number
  nodeCode: string
  city: string
  address: string
  ll: [number, number]
  /** Ключ статуса из `Spec.statuses` */
  status: string
  f: Record<string, Val>
}

/** Колонка / поле записи. `show` — вид в таблице. */
export type SpecCol = {
  k: string
  t: string
  show?: "bold" | "muted" | "num" | "pair" | "tag" | "status"
  /** Только в форме и паспорте, не в таблице */
  hidden?: boolean
  /** Поле формы: варианты (select) */
  opts?: string[]
  required?: boolean
  /** Фильтр-кнопка в панели списка */
  filter?: string
}

export type Spec = {
  key: string
  num: string
  title: string
  crumb: string
  sub: string
  icon: LucideIcon
  hero: string
  total: number
  unit: [string, string, string]
  search: string
  /** KPI после «Всего»: цифры макета (TODO: из API) */
  kpis: (Omit<Kpi, "pct"> & { pct?: number })[]
  statuses?: Record<string, [string, Tone]>
  cols: SpecCol[]
  /** Значения полей i-й записи (r — ГСЧ, n — узел связи) */
  gen: (i: number, r: () => number, n: NodeRow) => Record<string, Val>
  /** Первые строки — из макета */
  seed?: Record<string, Val>[]
  /** Заголовок и подзаголовок записи (паспорт, превью, карточка) */
  name: (x: GenRow) => string
  sub2: (x: GenRow) => string
  /** Полоса на карточке: [подпись, занято, всего] */
  bar?: (x: GenRow) => [string, number, number] | null
  /** Без карты (IP-план, бэкапы) */
  noMap?: boolean
  /** Свои кнопки шапки (по умолчанию: сводный, отчёт, импорт, создать) */
  readOnly?: boolean
}

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const cache = new Map<string, GenRow[]>()
const DEFAULT_STATUS: Record<string, [string, Tone]> = { work: ["В работе", "ok"], repair: ["Ремонт", "warn"], off: ["Выведен", "bad"] }

export function genRows(spec: Spec): GenRow[] {
  const hit = cache.get(spec.key)
  if (hit) return hit
  const r = rng([...spec.key].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 100000)
  const nodes = nodeRows()
  const statuses = Object.keys(spec.statuses ?? DEFAULT_STATUS)
  const byBranch = (b: string) => nodes.filter((n) => n.branch === b)
  const rows: GenRow[] = []
  for (let i = 0; i < spec.total; i++) {
    const seed = spec.seed?.[i]
    const pool = seed?.branch ? byBranch(String(seed.branch)) : nodes
    const n =
      (seed?.nodeCode && nodes.find((x) => x.code === seed.nodeCode)) || pool[Math.floor(r() * pool.length)] || nodes[i % nodes.length]
    const f = { ...spec.gen(i, r, n), ...seed }
    const st = String(f.status ?? (r() > 0.94 ? statuses[1 + Math.floor(r() * (statuses.length - 1))] : statuses[0]))
    rows.push({
      id: i + 1,
      num: String(f.num ?? i + 1),
      branch: String(f.branch ?? n.branch),
      nodeId: n.id,
      nodeCode: String(f.nodeCode ?? n.code),
      city: n.city,
      address: n.address,
      ll: [n.ll[0] + (r() - 0.5) * 0.004, n.ll[1] + (r() - 0.5) * 0.006],
      status: st,
      f,
    })
  }
  cache.set(spec.key, rows)
  return rows
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
const val = (x: GenRow, k: string): Val =>
  k === "branch" ? x.branch : k === "nodeCode" ? x.nodeCode : k === "num" ? x.num : (x.f[k] ?? "—")

/** Пара «занято / всего» в поле: "8/24" → [8, 24] */
export const pair = (v: Val): [number, number] | null => {
  const m = String(v).match(/^(\d+)\s*\/\s*(\d+)$/)
  return m ? [Number(m[1]), Number(m[2])] : null
}

export function makeList(spec: Spec): ListConfig<GenRow> {
  const statuses = spec.statuses ?? DEFAULT_STATUS
  const st = (x: GenRow) => statuses[x.status] ?? ["—", "muted" as Tone]
  const rows = () => genRows(spec)
  const visible = spec.cols.filter((c) => !c.hidden)

  const cols: Column<GenRow>[] = visible.map((c) => ({
    k: c.k,
    t: c.t,
    num: c.show === "num" || c.show === "pair",
    noSort: c.show === "tag",
    value: (x) => {
      const v = c.show === "status" ? st(x)[0] : val(x, c.k)
      const p = c.show === "pair" ? pair(v) : null
      return p ? p[0] / (p[1] || 1) : typeof v === "number" ? v : String(v)
    },
    render: (x) => {
      const v = val(x, c.k)
      if (c.show === "status") return <Pill tone={st(x)[1]}>{st(x)[0]}</Pill>
      if (c.show === "bold") return <b className="font-semibold text-[var(--link)]">{String(v)}</b>
      if (c.show === "muted") return <span className="block max-w-[260px] truncate text-muted-foreground">{String(v)}</span>
      if (c.show === "tag") return <Tag>{String(v)}</Tag>
      if (c.show === "pair") {
        const p = pair(v)
        return p ? (
          <span className="flex items-center gap-2">
            <Bar pct={pct(p[0], p[1])} color={pct(p[0], p[1]) > 90 ? "#ff5257" : undefined} className="h-1 w-[56px]" />
            {String(v)}
          </span>
        ) : (
          String(v)
        )
      }
      return <span className="block max-w-[300px] truncate">{typeof v === "number" ? fmt(v) : String(v)}</span>
    },
  }))

  const options = (k: string) =>
    [...new Set(rows().map((x) => String(val(x, k))))]
      .filter((v) => v && v !== "—")
      .sort()
      .map((v) => ({ v, label: v }))
  const filters: Filter<GenRow>[] = [
    {
      k: "branch",
      t: "Филиал",
      all: "Все филиалы",
      ui: "tags",
      get: (x) => x.branch,
      opts: BRANCHES.map((b) => ({ v: b.v, label: b.label })),
      short: (v) => v,
    },
    ...spec.cols
      .filter((c) => c.filter)
      .map((c): Filter<GenRow> => ({
        k: c.k,
        t: c.filter!,
        any: "Любой",
        get: (x) => String(val(x, c.k)),
        opts: c.opts?.map((v) => ({ v, label: v })) ?? options(c.k),
      })),
    {
      k: "status",
      t: "Статус",
      any: "Любой",
      more: true,
      get: (x) => x.status,
      opts: Object.entries(statuses).map(([v, [label]]) => ({ v, label })),
    },
  ]

  const nodes = nodeRows()
  const fields: Field<GenRow>[] = [
    {
      k: "branch",
      t: "Филиал",
      section: "Размещение",
      type: "select",
      half: true,
      required: true,
      placeholder: "Выберите филиал",
      opts: BRANCHES.map((b) => ({ v: b.v, label: b.full })),
      get: (x) => x.branch,
      set: (x, v) => ({ ...x, branch: String(v) }),
    },
    {
      k: "nodeId",
      t: "Узел связи",
      section: "Размещение",
      type: "select",
      half: true,
      required: !spec.noMap,
      placeholder: "Начните вводить ID…",
      opts: nodes.map((n) => ({ v: String(n.id), label: `${n.code} · ${n.object}` })),
      get: (x) => (x.nodeId ? String(x.nodeId) : ""),
      set: (x, v) => {
        const n = nodes.find((o) => o.id === Number(v))
        return n ? { ...x, nodeId: n.id, nodeCode: n.code, city: n.city, address: n.address, ll: n.ll } : x
      },
    },
    ...spec.cols
      .filter((c) => !["branch", "nodeCode", "num"].includes(c.k) && c.show !== "status")
      .map((c): Field<GenRow> => ({
        k: c.k,
        t: c.t,
        section: "Сведения",
        type: c.opts ? "select" : "text",
        half: true,
        required: c.required,
        opts: c.opts?.map((v) => ({ v, label: v })),
        placeholder: c.show === "pair" ? "занято / всего" : undefined,
        check: c.show === "pair" ? (v) => (pair(String(v)) || String(v) === "—" ? undefined : "Формат: 8 / 24") : undefined,
        get: (x) => (x.f[c.k] === undefined || x.f[c.k] === "—" ? "" : String(x.f[c.k])),
        set: (x, v) => ({ ...x, f: { ...x.f, [c.k]: String(v) } }),
      })),
    {
      k: "status",
      t: "Статус",
      section: "Сведения",
      type: "select",
      half: true,
      required: true,
      opts: Object.entries(statuses).map(([v, [label]]) => ({ v, label })),
      tone: (v) => statuses[v]?.[1],
      get: (x) => x.status,
      set: (x, v) => ({ ...x, status: String(v) }),
    },
  ]

  const facts = (x: GenRow) =>
    spec.cols
      .filter((c) => c.show !== "status" && c.k !== "branch")
      .slice(0, 5)
      .map((c) => ({ t: c.t, v: String(val(x, c.k)) }))

  return {
    key: spec.key,
    title: spec.title,
    crumb: spec.crumb,
    sub: spec.sub,
    hero: spec.hero,
    icon: spec.icon,
    search: spec.search,
    buttons: spec.readOnly
      ? [
          { icon: FileSpreadsheet, label: "Сводный файл", href: `/summary-files?section=${spec.key}` },
          { icon: Download, label: "Отчёт", onClick: "export" },
        ]
      : [
          { icon: FileSpreadsheet, label: "Сводный файл", href: `/summary-files?section=${spec.key}` },
          { icon: Download, label: "Отчёт", onClick: "export" },
          { icon: Upload, label: "Импорт Excel", onClick: "import" },
          { icon: Plus, label: "Создать", primary: true, onClick: "create" },
        ],
    rows,
    text: (x) => `${spec.cols.map((c) => val(x, c.k)).join(" ")} ${x.nodeCode} ${x.city}`,
    name: spec.name,
    unit: spec.unit,
    noun: spec.unit,
    remove: {
      warning: "Связанные записи останутся, но потеряют привязку. Запись можно восстановить из Корзины в течение 30 дней.",
      reasons: ["Демонтаж", "Дубликат записи", "Ошибка ввода", "Списание", "Передано другому филиалу"],
    },
    qr: (x) => ({ title: spec.name(x), sub: spec.sub2(x), url: `https://estu.qmobile.kz/q/${spec.key}/${x.id}` }),
    kpis: (list) => {
      const branches = new Set(list.map((x) => x.branch)).size
      return [
        { t: spec.unit[2][0].toUpperCase() + spec.unit[2].slice(1), color: "#085eff", value: fmt(list.length), note: `в ${branches} филиалах`, pct: 100 },
        ...spec.kpis.map((k) => ({ ...k, pct: k.pct ?? 50 })),
      ].slice(0, 6)
    },
    filters,
    sort: ["", 1],
    cols,
    card: (x) => {
      const b = spec.bar?.(x)
      return {
        photo: spec.hero,
        status: { label: st(x)[0], tone: st(x)[1] },
        title: spec.name(x),
        sub: spec.sub2(x),
        tags: [x.branch],
        bar: b ? { t: b[0], v: `${b[1]}/${b[2]}`, pct: pct(b[1], b[2]) } : undefined,
        open: "Паспорт",
      }
    },
    map: spec.noMap ? undefined : (x) => ({ ll: x.ll, title: spec.name(x), sub: spec.sub2(x), tone: st(x)[1], note: spec.sub2(x) }),
    preview: (x) => ({
      photo: spec.hero,
      status: { label: st(x)[0], tone: st(x)[1] },
      title: spec.name(x),
      sub: spec.sub2(x),
      facts: [{ t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch }, ...facts(x).slice(0, 4)],
      stats: [],
      more: "Открыть паспорт",
    }),
    form: {
      create: { title: `Новая запись · ${spec.title}`, sub: "Поля со * обязательны", submit: "Создать" },
      blank: (id) => ({
        id,
        num: String(id),
        branch: "",
        nodeId: 0,
        nodeCode: "",
        city: "",
        address: "",
        ll: [51.1282, 71.4304],
        status: Object.keys(statuses)[0],
        f: {},
      }),
      fields,
    },
    report: {
      cols: [
        { k: "branch", t: "Филиал", value: (x) => x.branch },
        { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
        ...spec.cols
          .filter((c) => !["branch", "nodeCode"].includes(c.k))
          .map((c) => ({ k: c.k, t: c.t, value: (x: GenRow) => (c.show === "status" ? st(x)[0] : val(x, c.k)) })),
      ],
    },
  }
}

export { val }
