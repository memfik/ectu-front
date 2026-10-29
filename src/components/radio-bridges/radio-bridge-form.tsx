"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankRadioBridge, NETWORKS, RADIO_BRIDGE_STATUS, radioBridgeName, radioBridges, type RadioBridge } from "@/lib/api/radio-bridges"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  route: string
  model: string
  bw: string
  network: string
  vendor: string
  len: string
  status: string
}

const text = (v: string | undefined) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: RadioBridge): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  route: text(x.f.route),
  model: text(x.f.model),
  bw: text(x.f.bw),
  network: text(x.f.network),
  vendor: text(x.f.vendor),
  len: text(x.f.len),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(RADIO_BRIDGE_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка радиомоста — шторкой поверх списка или паспорта. `row` нет — новый. */
export function RadioBridgeForm({ row, onClose, onDelete }: { row?: RadioBridge; onClose: () => void; onDelete?: (x: RadioBridge) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankRadioBridge()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("radio-bridges", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankRadioBridge(), num: String(radioBridges.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, route: v.route, model: v.model, bw: v.bw, network: v.network, vendor: v.vendor, len: v.len },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await radioBridges.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", radioBridgeName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${radioBridgeName(row)}` : "Новая запись · Радиомосты"}
      sub={changedNote(isNew, changed)}
      busy={busy || radioBridges.readOnly()}
      onClose={onClose}
      onSubmit={save}
      onDelete={row && onDelete ? () => onDelete(row) : undefined}
    >
      <PlaceFields
        branch={v.branch}
        nodeId={v.nodeId}
        onBranch={set("branch")}
        onNode={set("nodeId")}
        errors={{ branch: err("branch"), nodeId: err("nodeId") }}
      />
      <FormGroup title="Сведения">
        <TextField label="Трасса" half value={v.route} onChange={set("route")} />
        <TextField label="Модель" half value={v.model} onChange={set("model")} />
        <TextField label="Пропускная" half value={v.bw} onChange={set("bw")} />
        <SelectField label="Тип сети" half value={v.network} onChange={set("network")} options={opts(NETWORKS)} />
        <TextField label="Вендор" half value={v.vendor} onChange={set("vendor")} />
        <TextField label="Протяжённость, км" half value={v.len} onChange={set("len")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => RADIO_BRIDGE_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
