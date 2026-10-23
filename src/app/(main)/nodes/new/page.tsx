import { ListPage } from "@/components/list/list-page"

export const metadata = { title: "Новый узел связи — ЕСТУ" }

/** «Создать узел связи» (меню, главная, ⌘K): список узлов с открытой формой создания. */
export default function Page() {
  return <ListPage list="nodes" create />
}
