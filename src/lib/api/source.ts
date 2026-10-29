"use client"

import { apiOn } from "@/lib/api/client"
import { CURRENT_USER } from "@/lib/current-user"
import { trash } from "@/lib/list/trash"
import { createCollection } from "./collection"
import { removeRemote, saveRemote, useRemoteOptions, useRemotePage, useRemoteRecord, type ListQuery, type RemoteSource } from "./remote"

/*
 * Данные раздела: примеры в памяти вкладки или API техучёта (когда задан NEXT_PUBLIC_API_URL).
 * Страница не знает, откуда записи: список — usePage(), запись — useRecord(), изменения — save() / remove().
 */

const NONE: never[] = []

export function createSource<T extends { id: number; branch?: string }>(o: {
  /** Раздел (slug из nav.ts) — для Корзины */
  key: string
  title: string
  /** Название записи — в Корзине и уведомлениях */
  name: (x: T) => string
  seed: () => T[]
  remote?: RemoteSource<T>
}) {
  const rows = createCollection<T>(o.seed)
  const isRemote = () => !!o.remote && apiOn()

  return {
    remote: o.remote,
    isRemote,
    /** В API раздел только для чтения */
    readOnly: () => isRemote() && !!o.remote?.readOnly,
    /** Все записи примера; в режиме API — пусто (записи приходят страницами). */
    useAll(): T[] {
      const all = rows.useAll()
      return isRemote() ? NONE : all
    },
    all: () => rows.all(),
    /** Страница списка: в API — с сервера (отбор там же), иначе — срез уже отобранного `list`. */
    usePage(list: T[], q: ListQuery, page: number, size: number) {
      const on = isRemote()
      const srv = useRemotePage(o.remote, on, q, page, size)
      if (on) return srv
      return { rows: list.slice(page * size, page * size + size), total: list.length, error: null, loading: false }
    },
    /** Варианты фильтров из API (/filter-params); без API — пусто. */
    useOptions: () => useRemoteOptions(o.remote, isRemote()),
    useRecord(id: number) {
      const local = rows.useAll().find((x) => x.id === id)
      const on = isRemote()
      const r = useRemoteRecord(o.remote, on, id)
      return on ? r : { row: local, loading: false, error: undefined }
    },
    /** Номер следующей новой записи (в API его даёт сервер — 0) */
    nextId: () => (isRemote() ? 0 : rows.nextId()),
    /** Создать (isNew) или сохранить запись; локально новая получает следующий id. */
    async save(row: T, isNew: boolean): Promise<T> {
      if (isRemote()) {
        await saveRemote(o.remote!, row, isNew)
        return row
      }
      const next = isNew ? { ...row, id: rows.nextId() } : row
      rows.save(next)
      return next
    },
    /** Удалить с причиной: в Корзину; локально возвращает отмену. */
    async remove(list: T[], reason: string): Promise<(() => void) | undefined> {
      const ids = list.map((x) => x.id)
      if (isRemote()) {
        await removeRemote(o.remote!, ids, reason)
        return
      }
      const undo = rows.remove(ids)
      trash.add(
        list.map((x) => ({
          section: o.key,
          sectionTitle: o.title,
          id: x.id,
          name: o.name(x),
          reason,
          at: new Date().toLocaleString("ru-RU"),
          by: CURRENT_USER.name,
          branch: x.branch,
          row: x,
          restore: () => rows.save(x),
        })),
      )
      return () => {
        undo()
        trash.drop(o.key, ids)
      }
    },
  }
}

export type Source<T extends { id: number }> = ReturnType<typeof createSource<T>>
