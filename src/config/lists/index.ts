import type { ListConfig } from "@/lib/list/types"
import { nodesList } from "./nodes"

/** Разделы, у которых уже есть шаблон «Список». Ключ — slug из nav.ts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LISTS: Record<string, ListConfig<any>> = {
  nodes: nodesList,
}

export const hasList = (slug: string) => slug in LISTS

