"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankDwdmDevice, checkPair, DWDM_STATUS, dwdmDevices, dwdmName, type DwdmDevice } from "@/lib/api/dwdm"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  model: string
  lambda: string
  dir: string
  status: string
}

const text = (v: string | undefined) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: DwdmDevice): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  model: text(x.f.model),
  lambda: text(x.f.lambda),
  dir: text(x.f.dir),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(DWDM_STATUS).map(([v, [label]]) => ({ v, label }))

/** Создание и правка устройства DWDM — шторкой поверх списка или паспорта. `row` нет — новое. */
export function DwdmForm({ row, onClose, onDelete }: { row?: DwdmDevice; onClose: () => void; onDelete?: (x: DwdmDevice) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankDwdmDevice()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("dwdm", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    lambda: v.lambda ? checkPair(v.lambda) : undefined,
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankDwdmDevice(), num: String(dwdmDevices.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, model: v.model, lambda: v.lambda, dir: v.dir },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await dwdmDevices.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", dwdmName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${dwdmName(row)}` : "Новая запись · DWDM"}
      sub={changedNote(isNew, changed)}
      busy={busy || dwdmDevices.readOnly()}
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
        <TextField label="λ (З./М.)" half value={v.lambda} onChange={set("lambda")} placeholder="занято / всего" error={err("lambda")} />
        <TextField label="Направление" half value={v.dir} onChange={set("dir")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => DWDM_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
