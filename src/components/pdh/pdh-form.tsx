"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankPdhDevice, checkPair, PDH_STATUS, pdhDevices, pdhName, type PdhDevice } from "@/lib/api/pdh"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  model: string
  e1: string
  client: string
  vendor: string
  serial: string
  status: string
}

const text = (v: string | undefined) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: PdhDevice): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  model: text(x.f.model),
  e1: text(x.f.e1),
  client: text(x.f.client),
  vendor: text(x.f.vendor),
  serial: text(x.f.serial),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(PDH_STATUS).map(([v, [label]]) => ({ v, label }))

/** Создание и правка устройства PDH — шторкой поверх списка или паспорта. `row` нет — новое. */
export function PdhForm({ row, onClose, onDelete }: { row?: PdhDevice; onClose: () => void; onDelete?: (x: PdhDevice) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankPdhDevice()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("pdh", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    e1: v.e1 ? checkPair(v.e1) : undefined,
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankPdhDevice(), num: String(pdhDevices.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, model: v.model, e1: v.e1, client: v.client, vendor: v.vendor, serial: v.serial },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await pdhDevices.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", pdhName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${pdhName(row)}` : "Новая запись · PDH"}
      sub={changedNote(isNew, changed)}
      busy={busy || pdhDevices.readOnly()}
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
        <TextField label="Модель" half value={v.model} onChange={set("model")} />
        <TextField label="E1 (З./М.)" half value={v.e1} onChange={set("e1")} placeholder="занято / всего" error={err("e1")} />
        <TextField label="Клиент" half value={v.client} onChange={set("client")} />
        <TextField label="Вендор" half value={v.vendor} onChange={set("vendor")} />
        <TextField label="S/N" half value={v.serial} onChange={set("serial")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => PDH_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
