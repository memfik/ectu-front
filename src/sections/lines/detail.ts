import type { LucideIcon } from "lucide-react"
import type { GenRow, Spec } from "@/sections/make"
import { nodeRows, type NodeRow } from "@/sections/nodes/data"
import type { ListConfig } from "@/lib/list/types"

/*
 * Паспорт линии связи — ВОЛС (макет 07) и КЛС (08): участки трассы, муфты / боксы, жилы (волокна или медные пары),
 * документы ввода, фото, история. Пока примерные данные из записи списка.
 * TODO(API): участки и жилы — /api/bols/children, /api/kls/children; файлы и история — нет в старом API.
 */

export type Segment = { id: number; num: number; from: string; to: string; laying: string; len: number; cable: number; channels?: number }
/** Жила: a — занята (ВОЛС) / своя JM (КЛС), b — резерв (ВОЛС) / аренда (КЛС). */
export type Strand = "a" | "b" | "free"
export type LineDoc = { id: number; name: string; req: string; uploaded: boolean }
export type LineEvent = {
  id: number
  kind: "edit" | "upload" | "link" | "create"
  what: string
  who: string
  date: string
  diff?: [string, string]
}
export type End = { code: string; title: string; nodeId?: number }
export type Related = { icon: LucideIcon; t: string; sub: string; href?: string }

export type LineDetail = {
  start: End
  end: End
  segments: Segment[]
  strands: Strand[]
  note: string
  rent: { len: string; pay: string; basis: string; tu: string; confirmed: boolean }
  inputDocs: { t: string; n: string }[]
  docs: LineDoc[]
  media: string[]
  route: [number, number][]
  pointLl: [number, number][]
  history: LineEvent[]
}

/** Всё о записи для настраиваемых частей паспорта (шапка, сводка, вкладки). */
export type LineCtx = {
  x: GenRow
  d: LineDetail
  k: LineKind
  /** Жилы a, b и «занято» */
  a: number
  b: number
  busy: number
  /** Сумма длин и кабеля участков */
  len: number
  cable: number
  /** Муфт / боксов / колодцев между концами */
  points: number
  docsUp: number
  setSegments: (s: Segment[]) => void
  open: (tab: string) => void
  gallery: (i: number) => void
}
export type LineStat = { icon: LucideIcon; t: string; v: React.ReactNode; em?: string }
export type LineSum = { icon: LucideIcon; title: string; tab: string; v: React.ReactNode; bar?: React.ReactNode }
export type LineTab = { k: string; t: string; icon: LucideIcon; n?: number; node: React.ReactNode }

/** Чем ВОЛС, КЛС и КК отличаются в паспорте. */
export type LineKind = {
  section: string
  spec: Spec
  list: ListConfig<GenRow>
  /** Точка между участками: «Муфта М-1», «Бокс М-1», «К-112» */
  point: (i: number) => string
  /** Колодцы — квадраты, муфты и боксы — круги */
  square?: boolean
  color: string
  /** Картинка 3D-сцены из макета; без неё — своя сцена `sceneNode` (передняя панель ODF) */
  scene?: string
  sceneNode?: (c: LineCtx) => React.ReactNode
  /** Своя схема вместо трассы А — Б (схема портов ODF) */
  schemaNode?: (c: LineCtx) => React.ReactNode
  /** Подписи и значки первых двух кнопок сцены (по умолчанию «3D», «Схема») */
  stageLabels?: [[string, LucideIcon], [string, LucideIcon]]
  /** Длины на схеме: км (линии) или м (канализация) */
  meters?: boolean
  /** Подпись под участком на схеме (по умолчанию — тип прокладки) */
  segLabel?: (s: Segment) => string
  /** Жилы: вкладка, подписи и цвета a / b */
  strand: { tab: string; stat: string; a: [string, string]; b: [string, string] }
  /** Ряд под схемой: полосы волокон, кружки медных пар, сечение каналов */
  strip: "bars" | "dots" | "duct"
  stripTitle: (c: LineCtx) => string
  /** Сколько жил в записи: всего, a, b */
  count: (x: GenRow) => { total: number; a: number; b: number }
  /** «Занято» — только a (ВОЛС) или a + b (КЛС) */
  busyB?: boolean
  /** Тип прокладки у участков — только у ВОЛС */
  laying?: boolean
  /** Плашка рядом со статусом в шапке */
  pill: (x: GenRow) => string
  stats: (c: LineCtx) => LineStat[]
  summary: (c: LineCtx) => LineSum[]
  /** Вкладки между «Обзором» и «Документацией» */
  tabs: (c: LineCtx) => LineTab[]
  rows: (x: GenRow, d: LineDetail) => { t: string; v: React.ReactNode }[]
  related: (x: GenRow, d: LineDetail) => Related[]
  strandRows: (x: GenRow, d: LineDetail) => { t: string; v: React.ReactNode }[]
  inputDocs: { t: string; n: string }[]
  docs: Omit<LineDoc, "id">[]
  /** Первое событие истории: что изменено и было → стало */
  lastEdit: (d: { total: number; a: number; b: number }, x: GenRow) => [string, string, string]
  /** Сколько точек между концами (у КК — колодцы из записи минус два крайних) */
  pointsOf?: (x: GenRow) => number
  /** Протяжённость трассы в км из записи (у КК длина в метрах) */
  length?: (x: GenRow) => number
  /** Начало и конец трассы по узлу записи */
  ends: (x: GenRow, a: NodeRow | undefined, b: NodeRow | undefined) => [End, End]
}

/** Название УС для концов трассы: «УС «Центральный»», без двойного «УС». */
export const usTitle = (n: NodeRow) => (/^(УС|ТД|БЦ|АТС)\b/.test(n.object) ? n.object : `УС «${n.object}»`)

export const LAYING = ["Канализация", "Подвес", "В грунте", "По стене здания"]

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const n2 = (v: number) => Math.round(v * 100) / 100
export const kmStr = (v: number) => String(n2(v)).replace(".", ",")
export const parseKm = (v: string | number) => parseFloat(String(v).replace(",", ".")) || 0

const cache = new Map<string, LineDetail>()

export function lineDetail(x: GenRow, k: LineKind): LineDetail {
  const key = `${k.section}:${x.id}:${JSON.stringify(x.f)}`
  const hit = cache.get(key)
  if (hit) return hit
  const r = rng(x.id * 7919 + k.section.length)
  const nodes = nodeRows()
  const na = nodes.find((n) => n.id === x.nodeId)
  const nb = nodes.filter((n) => n.city === x.city && n.id !== x.nodeId)[Math.floor(r() * 5)]
  const [start, end] = k.ends(x, na, nb)

  // Участки: от начала через муфты / боксы до конца, длины в сумме — протяжённость трассы
  const rnd = 2 + Math.floor(r() * 3)
  const points = k.pointsOf ? k.pointsOf(x) : rnd
  const total = Math.max(k.length ? k.length(x) : parseKm(x.f.len), 0.1 * (points + 1))
  const w = Array.from({ length: points + 1 }, () => 0.5 + r())
  const sum = w.reduce((s, v) => s + v, 0)
  const names = [start.title, ...Array.from({ length: points }, (_, i) => k.point(i)), end.title]
  const segments: Segment[] = w.map((v, i) => {
    const len = n2((v / sum) * total) || 0.01
    return {
      id: i + 1,
      num: i + 1,
      from: names[i],
      to: names[i + 1],
      laying: i === points ? "В грунте" : r() > 0.75 ? "Подвес" : "Канализация",
      len,
      cable: n2(len * (1.04 + r() * 0.08)),
      channels: r() > 0.5 ? 4 : 2,
    }
  })

  const c = k.count(x)
  const strands: Strand[] = Array.from({ length: c.total }, (_, i) => (i < c.a ? "a" : i < c.a + c.b ? "b" : "free"))

  // Трасса на карте: ступеньки по кварталам от узла
  const route: [number, number][] = [x.ll]
  for (let i = 0; i < 6; i++) {
    const [la, lo] = route[route.length - 1]
    route.push(i % 2 ? [la + 0.0012 + r() * 0.002, lo] : [la, lo + 0.0018 + r() * 0.003])
  }
  const pointLl = Array.from({ length: points }, (_, i) => route[Math.min(route.length - 1, 1 + Math.round(((i + 1) * 5) / (points + 1)))])
  const [what, was, now] = k.lastEdit(c, x)

  const d: LineDetail = {
    start,
    end,
    segments,
    strands,
    note: c.a ? "sw1.ast009 uplink, ID-канал" : "",
    rent: { len: "0", pay: "", basis: "", tu: "№ 1203 от 10.10.2025", confirmed: true },
    inputDocs: k.inputDocs,
    docs: k.docs.map((doc, i) => ({ ...doc, id: i + 1 })),
    media: [
      "/nodes/photo-1.jpg",
      "/nodes/photo-2.jpg",
      "/nodes/tower.jpg",
      "/nodes/photo-3.jpg",
      "/nodes/photo-4.jpg",
      "/nodes/photo-5.jpg",
    ],
    route,
    pointLl,
    history: [
      { id: 4, kind: "edit", what, who: "Артем С. Галустьян", date: "06.10.2026", diff: [was, now] },
      { id: 3, kind: "upload", what: "Загружен документ ввода в эксплуатацию", who: "Борис Б. Дегтярь", date: "14.01.2026" },
      { id: 2, kind: "link", what: "Привязка к узлу связи изменена", who: "Нурдаулет С. Осербай", date: "03.12.2025" },
      { id: 1, kind: "create", what: "Запись создана", who: "Импорт Excel", date: "12.05.2024" },
    ],
  }
  cache.set(key, d)
  return d
}
