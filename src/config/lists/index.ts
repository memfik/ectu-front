import type { ListConfig } from "@/lib/list/types"
import { nodesList } from "./nodes"
import { routersList, switchesList } from "./spd"
import { makeList } from "@/config/registry/make"
import { SPECS } from "@/config/registry/specs"

/** Разделы, у которых уже есть шаблон «Список». Ключ — slug из nav.ts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LISTS: Record<string, ListConfig<any>> = {
  nodes: nodesList,
  switches: switchesList,
  routers: routersList,
  ...Object.fromEntries(SPECS.map((s) => [s.key, makeList(s)])),
}

export const hasList = (slug: string) => slug in LISTS

