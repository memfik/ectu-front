"use client"

import { NodesList } from "@/components/nodes/nodes-list"
import { usePageTitle } from "@/hooks/use-page-title"

/** 02 Узлы связи — список. Вёрстка и данные — components/nodes/nodes-list.tsx (общий с /nodes/new). */
export default function NodesPage() {
  usePageTitle("Узлы связи")
  return <NodesList />
}
