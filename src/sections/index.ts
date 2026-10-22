import type { ListConfig } from "@/lib/list/types"
import { makeList } from "@/sections/make"
import { nodesList } from "@/sections/nodes/config"
import { routersList, switchesList } from "@/sections/spd/config"
import { SPECS } from "@/sections/specs"

/**
 * Реестр разделов с шаблоном «Список» (ключ — slug из nav.ts). Каждый раздел — папка src/sections/<раздел>/:
 * config (описание, форма, источник API), у узлов и СПД ещё data, detail, passport, tabs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LISTS: Record<string, ListConfig<any>> = {
  nodes: nodesList,
  switches: switchesList,
  routers: routersList,
  ...Object.fromEntries(SPECS.map((s) => [s.key, makeList(s)])),
}

export const hasList = (slug: string) => slug in LISTS
