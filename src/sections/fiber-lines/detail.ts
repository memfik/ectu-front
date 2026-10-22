import type { GenRow } from "@/sections/make"
import { nodeRows } from "@/sections/nodes/data"

/*
 * Паспорт ВОЛС (макет 07, экраны vols-04 и vols-t1…t5): участки трассы, муфты, волокна, аренда КК,
 * документы ввода, фото, история. Пока примерные данные из записи списка.
 * TODO(API): участки и волокна — /api/bols/children?vols_id=…, документы — /api/bols/files (как в techaccaunt_front).
 */

export type Segment = {
  id: number
  num: number
  from: string
  to: string
  laying: string
  len: number
  cable: number
}
export type FiberState = "used" | "reserve" | "free"
export type VolsDoc = {
  id: number
  name: string
  req: string
  uploaded: boolean
}
export type VolsEvent = {
  id: number
  kind: "edit" | "upload" | "link" | "create"
  what: string
  who: string
  date: string
  diff?: [string, string]
}
export type VolsDetail = {
  start: { code: string; title: string; nodeId?: number }
  end: { code: string; title: string; nodeId?: number }
  odf: string
  segments: Segment[]
  fibers: FiberState[]
  fiberNote: string
  rent: {
    len: string
    pay: string
    basis: string
    tu: string
    confirmed: boolean
  }
  inputDocs: { t: string; n: string }[]
  docs: VolsDoc[]
  media: string[]
  route: [number, number][]
  muftaLl: [number, number][]
  history: VolsEvent[]
}

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

const cache = new Map<string, VolsDetail>()

export function volsDetail(x: GenRow): VolsDetail {
  const key = `${x.id}:${x.f.len}:${x.f.fibers}`
  const hit = cache.get(key)
  if (hit) return hit
  const r = rng(x.id * 7919 + 13)
  const nodes = nodeRows()
  const a = nodes.find((n) => n.id === x.nodeId)
  const b = nodes.filter((n) => n.city === x.city && n.id !== x.nodeId)[Math.floor(r() * 5)]
  const start = {
    code: a?.code ?? x.nodeCode,
    title: a ? `УС «${a.object}»` : "муфта",
    nodeId: a?.id,
  }
  const end = {
    code: b?.code ?? "—",
    title: b ? `УС «${b.object}»` : "УС «РТПЦ»",
    nodeId: b?.id,
  }

  // Участки: от УС начала через муфты до УС конца, длины в сумме — протяжённость трассы
  const muftas = 2 + Math.floor(r() * 3)
  const total = Math.max(parseKm(x.f.len), 0.1 * (muftas + 1))
  const w = Array.from({ length: muftas + 1 }, () => 0.5 + r())
  const sum = w.reduce((s, v) => s + v, 0)
  const points = [start.title, ...Array.from({ length: muftas }, (_, i) => `Муфта М-${i + 1}`), end.title]
  const segments: Segment[] = w.map((v, i) => {
    const len = n2((v / sum) * total) || 0.01
    return {
      id: i + 1,
      num: i + 1,
      from: points[i],
      to: points[i + 1],
      laying: i === muftas ? "В грунте" : r() > 0.75 ? "Подвес" : "Канализация",
      len,
      cable: n2(len * (1.04 + r() * 0.08)),
    }
  })

  // Волокна: занятые подряд с начала, одно в резерве
  const m = String(x.f.fibers).match(/(\d+|—) \/ (\d+)/)
  const all = m ? +m[2] : 8
  const used = m && m[1] !== "—" ? Math.min(+m[1], all) : 0
  const fibers: FiberState[] = Array.from({ length: all }, (_, i) => (i < used ? "used" : i === used && used < all ? "reserve" : "free"))

  // Трасса на карте: ступеньки по кварталам от узла
  const route: [number, number][] = [x.ll]
  for (let i = 0; i < 6; i++) {
    const [la, lo] = route[route.length - 1]
    route.push(i % 2 ? [la + 0.0012 + r() * 0.002, lo] : [la, lo + 0.0018 + r() * 0.003])
  }
  const muftaLl = Array.from({ length: muftas }, (_, i) => route[Math.min(route.length - 1, 1 + Math.round(((i + 1) * 5) / (muftas + 1)))])

  const d: VolsDetail = {
    start,
    end,
    odf: "ODF-1",
    segments,
    fibers,
    fiberNote: used ? "sw1.ast009 uplink, ID-канал" : "",
    rent: {
      len: "0",
      pay: "",
      basis: "",
      tu: "№ 1203 от 10.10.2025",
      confirmed: true,
    },
    inputDocs: [
      { t: "Ввод в эксплуатацию", n: "№ 77 от 03.12.2025" },
      { t: "Акт приёмной комиссии", n: "№ 77-п от 01.12.2025" },
      { t: "ТУ", n: "№ 1203 от 10.10.2025" },
    ],
    docs: [
      {
        id: 1,
        name: "№, дата документа о вводе в эксплуатацию",
        req: "№ 77 от 03.12.2025",
        uploaded: true,
      },
      {
        id: 2,
        name: "№, дата акта приёмной комиссии",
        req: "№ 77-п от 01.12.2025",
        uploaded: true,
      },
      {
        id: 3,
        name: "Реквизиты технических условий (ТУ)",
        req: "№ 1203 от 10.10.2025",
        uploaded: true,
      },
      {
        id: 4,
        name: "Основание аренды КК (договор)",
        req: "—",
        uploaded: false,
      },
      { id: 5, name: "Исполнительная схема", req: "PDF", uploaded: true },
    ],
    media: [
      "/nodes/photo-1.jpg",
      "/nodes/photo-2.jpg",
      "/nodes/tower.jpg",
      "/nodes/photo-3.jpg",
      "/nodes/photo-4.jpg",
      "/nodes/photo-5.jpg",
    ],
    route,
    muftaLl,
    history: [
      {
        id: 4,
        kind: "edit",
        what: "Изменено «Кол-во волокон занятых»",
        who: "Артем С. Галустьян",
        date: "06.10.2026",
        diff: [String(Math.max(0, used - 1)), String(used)],
      },
      {
        id: 3,
        kind: "upload",
        what: "Загружен документ ввода в эксплуатацию",
        who: "Борис Б. Дегтярь",
        date: "14.01.2026",
      },
      {
        id: 2,
        kind: "link",
        what: "Привязка к узлу связи изменена",
        who: "Нурдаулет С. Осербай",
        date: "03.12.2025",
      },
      {
        id: 1,
        kind: "create",
        what: "Запись создана",
        who: "Импорт Excel",
        date: "12.05.2024",
      },
    ],
  }
  cache.set(key, d)
  return d
}
