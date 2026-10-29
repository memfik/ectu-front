"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { api, type Page } from "@/lib/api/client"
import { filialId } from "@/lib/api/session"

/*
 * Данные раздела из API техучёта (как BaseApiService в techaccaunt_front): `${base}/filter`, `/pasport`, `/create`, `/update`,
 * `/filter-params`; удаление — POST /api/trash/soft-delete/{trashKey}. Включается, когда задан NEXT_PUBLIC_API_URL.
 * После создания / правки / удаления `invalidate()` — списки и паспорта перезапрашиваются.
 */

export type Option = { v: string; label: string }

/** Отбор списка: поиск, фильтры (ключ → выбранные значения), сортировка ("" — исходный порядок). */
export type ListQuery = { search: string; f: Record<string, string[]>; sort: [string, 1 | -1] }

export type RemoteSource<T extends { id: number }> = {
  base: string
  /** Путь списка внутри base, по умолчанию "/filter" */
  list?: string
  /** Параметр id в /pasport ("node_id", "equipment_id", "vols_id"…) */
  idParam: string
  /** Своя запись вместо `/pasport` и ключ записи в ответе (ЗИП: `/details` → `replacement`) */
  record?: { path: string; key?: string }
  trashKey?: string
  /** Сырая запись API → запись раздела */
  map: (raw: Record<string, unknown>) => T
  /** Колонка → sort_by */
  sort?: Record<string, string>
  /** Фильтр → параметр запроса; branch переводится в id филиала */
  filter?: Record<string, string>
  /** Постоянные параметры (тип оборудования) */
  fixed?: Record<string, unknown>
  /** Имя параметра направления сортировки (onyma-clients ждёт sort_dir) */
  sortDir?: string
  /** Запись → тело /create и /update */
  payload?: (x: T) => Record<string, unknown>
  /** Нет создания / правки / удаления */
  readOnly?: boolean
}

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
function params<T extends { id: number }>(src: RemoteSource<T>, q: ListQuery, page: number, size: number) {
  const p: Record<string, unknown> = { ...src.fixed, page: page + 1, per_page: size, search: q.search.trim() }
  if (q.sort[0]) {
    p.sort_by = src.sort?.[q.sort[0]] ?? q.sort[0]
    p[src.sortDir ?? "sort_order"] = q.sort[1] > 0 ? "asc" : "desc"
  }
  for (const [k, v] of Object.entries(q.f)) {
    if (!v.length) continue
    const name = src.filter?.[k]
    if (!name) continue
    p[name] = k === "branch" ? v.map((x) => filialId(x) ?? x) : v
  }
  return p
}

type State<T> = { key: string; rows: T[]; total: number; error: string | null }

/** Страница списка с сервера: отбор, сортировка и страницы — на сервере. */
export function useRemotePage<T extends { id: number }>(src: RemoteSource<T> | undefined, on: boolean, q: ListQuery, page: number, size: number) {
  const v = useVersion()
  const key = JSON.stringify([src?.base, src?.fixed, on, q, page, size, v])
  const [s, set] = useState<State<T>>({ key: "", rows: [], total: 0, error: null })
  useEffect(() => {
    if (!on || !src) return
    const ctl = new AbortController()
    api
      .get<Page<Record<string, unknown>> | Record<string, unknown>[]>(`${src.base}${src.list ?? "/filter"}`, params(src, q, page, size), ctl.signal)
      .then((d) => {
        const raw = Array.isArray(d) ? d : (d.data ?? [])
        set({ key, rows: raw.map(src.map), total: Array.isArray(d) ? d.length : (d.total ?? raw.length), error: null })
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
export function useRemoteOptions<T extends { id: number }>(src: RemoteSource<T> | undefined, on: boolean) {
  const [opts, setOpts] = useState<Record<string, Option[]>>({})
  useEffect(() => {
    if (!on || !src) return
    api
      .get<{ params?: Record<string, unknown[]> } & Record<string, unknown[]>>(`${src.base}/filter-params`)
      .then((d) => {
        const all = (d.params ?? d.values ?? d) as Record<string, unknown[]>
        const out: Record<string, Option[]> = {}
        for (const [k, name] of Object.entries(src.filter ?? {})) {
          const list = all[name]
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
  }, [src, on])
  return opts
}

/** Одна запись: `${base}/pasport?{idParam}=id`. */
export function useRemoteRecord<T extends { id: number }>(src: RemoteSource<T> | undefined, on: boolean, id: number) {
  const v = useVersion()
  const key = `${src?.base}:${id}:${v}`
  const [s, set] = useState<{ key: string; row?: T; error?: string }>({ key: "" })
  useEffect(() => {
    if (!on || !src) return
    api
      .get<Record<string, unknown>>(`${src.base}${src.record?.path ?? "/pasport"}`, { [src.idParam]: id })
      .then((raw) => {
        const k = src.record?.key
        set({ key, row: src.map(((k ? raw[k] : raw.data) as Record<string, unknown>) ?? raw) })
      })
      .catch((e: Error) => set({ key, error: e.message }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, on])
  return { row: s.key === key ? s.row : undefined, loading: s.key !== key, error: s.key === key ? s.error : undefined }
}

/** Создать / изменить запись в API. */
export async function saveRemote<T extends { id: number }>(src: RemoteSource<T>, row: T, isNew: boolean) {
  const body = src.payload ? src.payload(row) : { ...row }
  await api.post(`${src.base}/${isNew ? "create" : "update"}`, isNew ? body : { ...body, id: row.id })
  invalidate()
}

/** Мягкое удаление с причиной: POST /api/trash/soft-delete/{key} { id, delete_reason }. */
export async function removeRemote<T extends { id: number }>(src: RemoteSource<T>, ids: number[], reason: string) {
  if (!src.trashKey) throw new Error("Удаление для раздела в API не настроено")
  for (const id of ids) await api.post(`/api/trash/soft-delete/${src.trashKey}`, { id, delete_reason: reason })
  invalidate()
}
