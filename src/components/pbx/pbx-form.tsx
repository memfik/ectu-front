"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankPbx, checkPair, NETWORKS, PBX_STATUS, pbxName, pbxs, type Pbx } from "@/lib/api/pbx"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  object: string
  model: string
  capacity: string
  ota: string
  network: string
  status: string
}

const text = (v: string | number) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: Pbx): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  object: text(x.f.object),
  model: text(x.f.model),
  capacity: text(x.f.capacity),
  ota: text(x.f.ota),
  network: text(x.f.network),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(PBX_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка АТС — шторкой поверх списка или паспорта. `row` нет — новая запись. */
export function PbxForm({ row, onClose, onDelete }: { row?: Pbx; onClose: () => void; onDelete?: (x: Pbx) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankPbx()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("pbx", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    capacity: v.capacity ? checkPair(v.capacity) : undefined,
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankPbx(), num: String(pbxs.nextId()) }
    const next = withNode(
      { ...base, branch: v.branch, status: v.status, f: { ...base.f, object: v.object, model: v.model, capacity: v.capacity, ota: v.ota, network: v.network } },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await pbxs.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", pbxName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${pbxName(row)}` : "Новая запись · АТС"}
      sub={changedNote(isNew, changed)}
      busy={busy || pbxs.readOnly()}
      onClose={onClose}
      onSubmit={save}
      onDelete={row && onDelete ? () => onDelete(row) : undefined}
    >
      <PlaceFields branch={v.branch} nodeId={v.nodeId} onBranch={set("branch")} onNode={set("nodeId")} errors={{ branch: err("branch"), nodeId: err("nodeId") }} />
      <FormGroup title="Сведения">
        <TextField label="Объект связи" half value={v.object} onChange={set("object")} />
        <TextField label="Модель станции" half value={v.model} onChange={set("model")} />
        <TextField label="Ёмкость" half value={v.capacity} onChange={set("capacity")} placeholder="занято / всего" error={err("capacity")} />
        <TextField label="ОТА" half value={v.ota} onChange={set("ota")} />
        <SelectField label="Тип сети" half value={v.network} onChange={set("network")} options={opts(NETWORKS)} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => PBX_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
