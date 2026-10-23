import type { GenRow } from "@/sections/make"
import { filialShort, filialId } from "@/lib/api/session"
import type { ApiSource } from "@/lib/list/types"

/*
 * Помощники источников API техучёта: чтение полей по пути, филиал, координаты, конструктор источника раздела.
 * Поля и эндпоинты — из ../techaccaunt_front (columnConfigs, services/api, Action*Panel.vue).
 * Живой API не проверялся — расхождения в docs/backlog.md «Подключение API».
 */

export type Raw = Record<string, unknown>

/** Значение по пути «node.nodes_name_id». */
export const get = (o: Raw, path: string): unknown =>
  path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Raw)[k] : undefined), o)
export const s = (o: Raw, path: string, def = "—") => {
  const v = get(o, path)
  return v === null || v === undefined || v === "" ? def : String(v)
}
export const n = (o: Raw, path: string) => Number(get(o, path)) || 0
export const branchOf = (o: Raw) => s(o, "filial.short_name", "") || filialShort(get(o, "filial_id") as number) || s(o, "filial", "—")

/** Координаты: в API встречаются разные имена — берём первое найденное. TODO(API): уточнить поле. */
export function coords(o: Raw): [number, number] | null {
  for (const [a, b] of [
    ["latitude", "longitude"],
    ["lat", "lng"],
    ["lat", "lon"],
    ["node.latitude", "node.longitude"],
  ]) {
    const la = Number(get(o, a))
    const lo = Number(get(o, b))
    if (la && lo) return [la, lo]
  }
  const c = String(get(o, "coordinates") ?? get(o, "ys_jm_coordinates") ?? "").match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/)
  return c ? [Number(c[1]), Number(c[2])] : null
}
export const ASTANA: [number, number] = [51.1282, 71.4304]

/* ---------- Разделы из конструктора (07…25) ---------- */

export type Gen = {
  base: string
  list?: string
  idParam?: string
  record?: { path: string; key?: string }
  trashKey?: string
  readOnly?: boolean
  sortDir?: string
  /** Поле раздела → путь в записи API */
  fields: Record<string, string | ((o: Raw) => string | number)>
  /** Статус API → ключ статуса раздела */
  status?: (o: Raw) => string
  node?: string
  filter?: Record<string, string>
}

export const pairOf = (a: string, b: string) => (o: Raw) => (get(o, b) ? `${s(o, a, "0")} / ${s(o, b)}` : "—")

export function genApi(g: Gen): ApiSource<GenRow> {
  return {
    base: g.base,
    list: g.list,
    idParam: g.idParam ?? "equipment_id",
    record: g.record,
    trashKey: g.trashKey,
    readOnly: g.readOnly,
    sortDir: g.sortDir,
    sort: {
      branch: "filial_id",
      ...Object.fromEntries(
        Object.entries(g.fields)
          .filter(([, v]) => typeof v === "string")
          .map(([k, v]) => [k, (v as string).split(".")[0]]),
      ),
    },
    filter: { branch: "filial", ...g.filter },
    map: (o) => {
      const f: Record<string, string | number> = {}
      for (const [k, p] of Object.entries(g.fields)) f[k] = typeof p === "function" ? p(o) : s(o, p)
      const ll = coords(o)
      return {
        id: n(o, "id"),
        num: s(o, "number", s(o, "num", String(n(o, "id")))),
        branch: branchOf(o),
        nodeId: n(o, "node_id") || n(o, `${g.node ?? "node"}.id`),
        nodeCode: s(o, `${g.node ?? "node"}.nodes_name_id`, s(o, "node_code")),
        city: s(o, `${g.node ?? "node"}.ys_jm_locality`, ""),
        address: s(o, `${g.node ?? "node"}.ys_jm_address`, ""),
        ll: ll ?? ASTANA,
        status: g.status?.(o) ?? "work",
        f,
      }
    },
    // Обратно — те же поля (только простые пути)
    payload: (x) => ({
      filial_id: filialId(x.branch),
      node_id: x.nodeId || undefined,
      ...Object.fromEntries(
        Object.entries(g.fields)
          .filter(([, p]) => typeof p === "string" && !p.includes("."))
          .map(([k, p]) => [p as string, x.f[k]]),
      ),
    }),
  }
}
