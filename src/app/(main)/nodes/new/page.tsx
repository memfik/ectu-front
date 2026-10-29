"use client"

import { NodesList } from "@/components/nodes/nodes-list"
import { usePageTitle } from "@/hooks/use-page-title"

/** «Создать узел связи» (меню, главная, ⌘K): список узлов с открытой формой создания. */
export default function NewNodePage() {
  usePageTitle("Новый узел связи")
  return <NodesList create />
}
