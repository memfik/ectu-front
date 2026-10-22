"use client"

import { useSyncExternalStore } from "react"

/*
 * Корзина (макет 19): удалённые записи с причиной; восстановить можно 30 дней.
 * TODO: API — пометка deleted_at и причина на сервере, список корзины оттуда же.
 */

export type TrashItem = {
  section: string
  sectionTitle: string
  id: number
  name: string
  reason: string
  at: string
  by: string
  branch?: string
  /** Сама запись — для «Восстановить» */
  row?: unknown
}

let items: TrashItem[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const trash = {
  add(list: TrashItem[]) {
    items = [...list, ...items]
    emit()
  },
  drop(section: string, ids: number[]) {
    items = items.filter((x) => !(x.section === section && ids.includes(x.id)))
    emit()
  },
}

export function useTrash() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => items,
    () => items
  )
}
