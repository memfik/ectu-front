import { BRANCHES, nodeRows, type NodeRow } from "@/sections/nodes/data"

/*
 * Записи разделов 07–37 (линии, оборудование, площадки): место (филиал, узел связи, координаты), статус и поля раздела `f`.
 * Пока нет API — примеры собираются генератором по номеру записи; первые строки — из макета.
 */

export type Val = string | number

export type Equip<F extends Record<string, Val> = Record<string, Val>> = {
  id: number
  num: string
  branch: string
  nodeId: number
  nodeCode: string
  city: string
  address: string
  ll: [number, number]
  /** Ключ статуса раздела */
  status: string
  f: F
}

/** Запись без уточнения полей — для общих шаблонов паспорта. */
export type GenRow = Equip

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/**
 * Примеры раздела: `total` записей, поля — `gen(i, r, n)` (r — ГСЧ, n — узел связи), первые — `seed` из макета.
 * Статус: из seed / gen (`status`), иначе первый, изредка — один из остальных.
 */
export function seedEquip<F extends Record<string, Val>>(o: {
  key: string
  total: number
  statuses: string[]
  gen: (i: number, r: () => number, n: NodeRow) => F
  seed?: Record<string, Val>[]
}): Equip<F>[] {
  const r = rng([...o.key].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 100000)
  const nodes = nodeRows()
  const byBranch = (b: string) => nodes.filter((n) => n.branch === b)
  const rows: Equip<F>[] = []
  for (let i = 0; i < o.total; i++) {
    const seed = o.seed?.[i]
    const pool = seed?.branch ? byBranch(String(seed.branch)) : nodes
    const n = (seed?.nodeCode && nodes.find((x) => x.code === seed.nodeCode)) || pool[Math.floor(r() * pool.length)] || nodes[i % nodes.length]
    const f = { ...o.gen(i, r, n), ...seed } as F
    const st = String(f.status ?? (r() > 0.94 ? o.statuses[1 + Math.floor(r() * (o.statuses.length - 1))] : o.statuses[0]))
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
  return rows
}

/** Пустая запись для формы создания. */
export function blankEquip<F extends Record<string, Val>>(status: string, f: F): Equip<F> {
  return { id: 0, num: "", branch: "", nodeId: 0, nodeCode: "", city: "", address: "", ll: [51.1282, 71.4304], status, f }
}

/** Привязать к узлу связи: код УС, город, адрес и координаты — от узла. */
export function withNode<T extends Equip>(x: T, nodeId: number): T {
  const n = nodeRows().find((o) => o.id === nodeId)
  return n ? { ...x, nodeId: n.id, nodeCode: n.code, city: n.city, address: n.address, ll: n.ll } : x
}

/** Филиалы: в фильтре — «Астана (АС)», в форме — «Северный филиал (АС)». */
export const BRANCH_OPTIONS = BRANCHES.map((b) => ({ v: b.v, label: b.label }))
export const BRANCH_FULL = BRANCHES.map((b) => ({ v: b.v, label: b.full }))
export const branchName = (v: string) => BRANCHES.find((b) => b.v === v)?.full ?? v

/** Узлы связи для выбора в форме. */
export const nodeOptions = () => nodeRows().map((n) => ({ v: String(n.id), label: `${n.code} · ${n.object}` }))

/** Удаление записи раздела: что станет со связанными и быстрые причины. */
export const EQUIP_REMOVE = {
  warning: "Связанные записи останутся, но потеряют привязку. Запись можно восстановить из Корзины в течение 30 дней.",
  reasons: ["Демонтаж", "Дубликат записи", "Ошибка ввода", "Списание", "Передано другому филиалу"],
}

/** Ссылка QR-наклейки. TODO: адрес короткой ссылки — от бэкенда. */
export const qrUrl = (section: string, id: number) => `https://estu.qmobile.kz/q/${section}/${id}`

/** Поле записи: место (филиал, УС, №) или поле раздела. */
export const val = (x: Equip, k: string): Val =>
  k === "branch" ? x.branch : k === "nodeCode" ? x.nodeCode : k === "num" ? x.num : (x.f[k] ?? "—")

/** Пара «занято / всего» в поле: "8/24" → [8, 24] */
export const pair = (v: Val | undefined): [number, number] | null => {
  const m = String(v ?? "").match(/^(\d+)\s*\/\s*(\d+)$/)
  return m ? [Number(m[1]), Number(m[2])] : null
}

/* ---------- помощники генераторов ---------- */

export const pick = <T,>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)]
export const num = (r: () => number, a: number, b: number) => Math.round(a + r() * (b - a))
export const km = (r: () => number, a: number, b: number) => (a + r() * (b - a)).toFixed(2).replace(".", ",")
export const used = (r: () => number, total: number, k = 0.75) => `${Math.max(0, Math.round(total * (0.2 + r() * k)))} / ${total}`
export const obj = (n: NodeRow) => n.object
