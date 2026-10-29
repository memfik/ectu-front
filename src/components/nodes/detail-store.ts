"use client"

import { useSyncExternalStore } from "react"
import { nodeDetail, type NodeDetail } from "@/lib/api/node-detail"
import type { NodeRow } from "@/lib/api/node-data"

/*
 * Содержимое паспорта узла в памяти вкладки: привязка ВОЛС, загрузка документов, ответственные, покрытие.
 * Изменения видны во всех вкладках паспорта сразу. TODO: API — сохранение на сервере.
 */

const cache = new Map<number, NodeDetail>()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l))

function get(x: NodeRow) {
  let d = cache.get(x.id)
  if (!d) {
    d = nodeDetail(x)
    cache.set(x.id, d)
  }
  return d
}

export function useNodeDetail(x: NodeRow | undefined) {
  return useSyncExternalStore(
    subscribe,
    () => (x ? get(x) : null),
    () => (x ? get(x) : null),
  )
}

export function updateDetail(x: NodeRow, fn: (d: NodeDetail) => NodeDetail) {
  cache.set(x.id, fn(get(x)))
  listeners.forEach((l) => l())
}
