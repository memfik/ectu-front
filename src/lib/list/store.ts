"use client"

import { useSyncExternalStore } from "react"
import type { ListConfig, Row } from "./types"

/*
 * Записи разделов в памяти вкладки: создание, правка и удаление сразу видны в списке.
 * TODO: API — сохранение и удаление на сервере; это хранилище станет кешем.
 */

type Slot = { rows: Row[]; listeners: Set<() => void>; subscribe: (l: () => void) => () => void }
const slots = new Map<string, Slot>()

function slot<T extends Row>(cfg: ListConfig<T>): Slot {
  let s = slots.get(cfg.key)
  if (!s) {
    const listeners = new Set<() => void>()
    s = { rows: cfg.rows(), listeners, subscribe: (l) => (listeners.add(l), () => void listeners.delete(l)) }
    slots.set(cfg.key, s)
  }
  return s
}

function commit(s: Slot, rows: Row[]) {
  s.rows = rows
  s.listeners.forEach((l) => l())
}

export function useRows<T extends Row>(cfg: ListConfig<T>): T[] {
  const s = slot(cfg)
  return useSyncExternalStore(
    s.subscribe,
    () => s.rows,
    () => s.rows
  ) as T[]
}

export const rowsStore = {
  all<T extends Row>(cfg: ListConfig<T>) {
    return slot(cfg).rows as T[]
  },
  find<T extends Row>(cfg: ListConfig<T>, id: number) {
    return (slot(cfg).rows as T[]).find((x) => x.id === id)
  },
  nextId<T extends Row>(cfg: ListConfig<T>) {
    return Math.max(0, ...slot(cfg).rows.map((x) => x.id)) + 1
  },
  /** Новая запись — в начало списка, существующая — на своё место. */
  save<T extends Row>(cfg: ListConfig<T>, row: T) {
    const s = slot(cfg)
    const i = s.rows.findIndex((x) => x.id === row.id)
    commit(s, i < 0 ? [row, ...s.rows] : s.rows.map((x) => (x.id === row.id ? row : x)))
  },
  /** Удаляет и возвращает функцию отмены. */
  remove<T extends Row>(cfg: ListConfig<T>, ids: number[]) {
    const s = slot(cfg)
    const before = s.rows
    commit(
      s,
      s.rows.filter((x) => !ids.includes(x.id))
    )
    return () => commit(s, before)
  },
}
