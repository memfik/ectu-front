"use client"

import { useSyncExternalStore } from "react"

/*
 * Записи раздела в памяти вкладки — пока нет API (или он выключен). Список и паспорт читают одно и то же,
 * поэтому правка в форме сразу видна везде. С API это станет кешем.
 */

export type Collection<T extends { id: number }> = ReturnType<typeof createCollection<T>>

export function createCollection<T extends { id: number }>(seed: () => T[]) {
  let rows: T[] | null = null
  const listeners = new Set<() => void>()
  const get = () => (rows ??= seed())
  const commit = (next: T[]) => {
    rows = next
    listeners.forEach((l) => l())
  }
  const subscribe = (l: () => void) => {
    listeners.add(l)
    return () => void listeners.delete(l)
  }

  return {
    /** Все записи — с подпиской на изменения. */
    useAll: () => useSyncExternalStore(subscribe, get, get),
    all: get,
    find: (id: number) => get().find((x) => x.id === id),
    nextId: () => Math.max(0, ...get().map((x) => x.id)) + 1,
    /** Новая (нет такого id) — в начало списка, иначе замена. */
    save(row: T) {
      const list = get()
      commit(list.some((x) => x.id === row.id) ? list.map((x) => (x.id === row.id ? row : x)) : [row, ...list])
    },
    saveMany(next: T[]) {
      const byId = new Map(next.map((x) => [x.id, x]))
      const list = get()
      commit([...next.filter((x) => !list.some((y) => y.id === x.id)), ...list.map((x) => byId.get(x.id) ?? x)])
    },
    /** Удаляет и возвращает отмену. */
    remove(ids: number[]) {
      const before = get()
      const drop = new Set(ids)
      commit(before.filter((x) => !drop.has(x.id)))
      return () => commit(before)
    },
  }
}
