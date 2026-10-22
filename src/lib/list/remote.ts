"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { api, apiOn, type Page } from "@/lib/api/client"
import { filialId } from "@/lib/api/session"
import type { Query } from "./query"
import type { ListConfig, Option, Row } from "./types"

/*
 * Данные раздела из API техучёта: страница списка, варианты фильтров, одна запись, изменения.
 * После создания / правки / удаления `invalidate()` — списки и паспорта перезапрашиваются.
 */

export const isRemote = <T extends Row>(cfg: ListConfig<T>) => !!cfg.api && apiOn()

let version = 0
const listeners = new Set<() => void>()
export function invalidate() {
  version++
  listeners.forEach((l) => l())
}
const useVersion = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => version,
    () => 0
  )

/** Параметры /filter: page, per_page, search, sort_by, sort_order + фильтры (массивы). */
function params<T extends Row>(cfg: ListConfig<T>, q: Query, page: number, size: number) {
  const a = cfg.api!
  const p: Record<string, unknown> = { ...a.fixed, page: page + 1, per_page: size, search: q.q.trim() }
  if (q.sort[0]) {
    p.sort_by = a.sort?.[q.sort[0]] ?? q.sort[0]
    p[a.sortDir ?? "sort_order"] = q.sort[1] > 0 ? "asc" : "desc"
  }
  for (const [k, v] of Object.entries(q.f)) {
    if (!v.length) continue
    const name = a.filter?.[k]
    if (!name) continue
    p[name] = k === "branch" ? v.map((x) => filialId(x) ?? x) : v
  }
  return p
}

type State<T> = { key: string; rows: T[]; total: number; error: string | null }

export function useRemoteList<T extends Row>(cfg: ListConfig<T>, on: boolean, q: Query, page: number, size: number) {
  const v = useVersion()
  const key = JSON.stringify([cfg.key, on, q, page, size, v])
  const [s, set] = useState<State<T>>({ key: "", rows: [], total: 0, error: null })
  useEffect(() => {
    if (!on) return
    const ctl = new AbortController()
    api
      .get<Page<Record<string, unknown>> | Record<string, unknown>[]>(`${cfg.api!.base}${cfg.api!.list ?? "/filter"}`, params(cfg, q, page, size), ctl.signal)
      .then((d) => {
        const raw = Array.isArray(d) ? d : (d.data ?? [])
        set({ key, rows: raw.map(cfg.api!.map), total: Array.isArray(d) ? d.length : (d.total ?? raw.length), error: null })
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") set({ key, rows: [], total: 0, error: e.message })
      })
    return () => ctl.abort()
    // key включает всё, от чего зависит запрос
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return { rows: s.rows, total: s.total, error: s.error, loading: on && s.key !== key }
}

/** Варианты фильтров из `${base}/filter-params` → { params: { field: [...] } }. */
export function useFilterOptions<T extends Row>(cfg: ListConfig<T>, on: boolean) {
  const [opts, setOpts] = useState<Record<string, Option[]>>({})
  useEffect(() => {
    if (!on) return
    api
      .get<{ params?: Record<string, unknown[]> } & Record<string, unknown[]>>(`${cfg.api!.base}/filter-params`)
      .then((d) => {
        const src = (d.params ?? d.values ?? d) as Record<string, unknown[]>
        const out: Record<string, Option[]> = {}
        for (const [k, name] of Object.entries(cfg.api!.filter ?? {})) {
          const list = src[name]
          if (!Array.isArray(list) || k === "branch") continue
          out[k] = list
            .filter((x) => x !== null && x !== "")
            .map((x) =>
              typeof x === "object" && x
                ? { v: String((x as { id?: unknown; value?: unknown }).id ?? (x as { value?: unknown }).value), label: String((x as { name?: unknown; title?: unknown }).name ?? (x as { title?: unknown }).title) }
                : { v: String(x), label: String(x) }
            )
        }
        setOpts(out)
      })
      .catch(() => {})
  }, [cfg, on])
  return opts
}

/** Одна запись: в API — `${base}/pasport?{idParam}=id`, иначе — из списка примеров. */
export function useRemoteRecord<T extends Row>(cfg: ListConfig<T>, id: number, local: T | undefined) {
  const on = isRemote(cfg)
  const v = useVersion()
  const key = `${cfg.key}:${id}:${v}`
  const [s, set] = useState<{ key: string; row?: T; error?: string }>({ key: "" })
  useEffect(() => {
    if (!on) return
    api
      .get<Record<string, unknown>>(`${cfg.api!.base}/pasport`, { [cfg.api!.idParam]: id })
      .then((raw) => set({ key, row: cfg.api!.map((raw.data as Record<string, unknown>) ?? raw) }))
      .catch((e: Error) => set({ key, error: e.message }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, on])
  if (!on) return { row: local, loading: false, error: undefined }
  return { row: s.key === key ? s.row : undefined, loading: s.key !== key, error: s.key === key ? s.error : undefined }
}

/** Создать / изменить запись в API. */
export async function saveRemote<T extends Row>(cfg: ListConfig<T>, row: T, isNew: boolean) {
  const a = cfg.api!
  const body = a.payload ? a.payload(row) : { ...row }
  await api.post(`${a.base}/${isNew ? "create" : "update"}`, isNew ? body : { ...body, id: row.id })
  invalidate()
}

/** Мягкое удаление с причиной: POST /api/trash/soft-delete/{key} { id, delete_reason }. */
export async function removeRemote<T extends Row>(cfg: ListConfig<T>, ids: number[], reason: string) {
  const key = cfg.api!.trashKey
  if (!key) throw new Error("Удаление для раздела в API не настроено")
  for (const id of ids) await api.post(`/api/trash/soft-delete/${key}`, { id, delete_reason: reason })
  invalidate()
}
