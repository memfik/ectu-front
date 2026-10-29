"use client"

import { useMemo } from "react"
import { FormGroup, SelectField } from "@/components/blocks/form-panel"
import { BRANCH_FULL, nodeOptions } from "@/lib/api/equipment"

/** Блок формы «Размещение» разделов 07–37: филиал и узел связи (с поиском по ID). */
export function PlaceFields({
  branch,
  nodeId,
  onBranch,
  onNode,
  nodeRequired = true,
  errors,
}: {
  branch: string
  nodeId: string
  onBranch: (v: string) => void
  onNode: (v: string) => void
  /** Без карты (IP-план, бэкапы) узел необязателен */
  nodeRequired?: boolean
  errors: { branch?: string; nodeId?: string }
}) {
  const nodes = useMemo(() => nodeOptions(), [])
  return (
    <FormGroup title="Размещение">
      <SelectField label="Филиал" required half value={branch} onChange={onBranch} options={BRANCH_FULL} placeholder="Выберите филиал" error={errors.branch} />
      <SelectField
        label="Узел связи"
        required={nodeRequired}
        half
        value={nodeId}
        onChange={onNode}
        options={nodes}
        placeholder="Начните вводить ID…"
        error={errors.nodeId}
      />
    </FormGroup>
  )
}
