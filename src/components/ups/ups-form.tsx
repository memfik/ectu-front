"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankUps, ups, UPS_CLASSES, UPS_STATUS, upsName, type Ups } from "@/lib/api/ups"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  model: string
  power: string
  battery: string
  cls: string
  serial: string
  status: string
}

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: Ups): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  model: text(x.f.model),
  power: text(x.f.power),
  battery: text(x.f.battery),
  cls: text(x.f.cls),
  serial: text(x.f.serial),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(UPS_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка ИБП — шторкой поверх списка или паспорта. `row` нет — новая. */
export function UpsForm({ row, onClose, onDelete }: { row?: Ups; onClose: () => void; onDelete?: (x: Ups) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankUps()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("ups", isNew, initial)
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
    const base = row ?? { ...blankUps(), num: String(ups.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, model: v.model, power: v.power, battery: v.battery, cls: v.cls, serial: v.serial },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await ups.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", upsName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${upsName(row)}` : "Новая запись · ИБП"}
      sub={changedNote(isNew, changed)}
      busy={busy || ups.readOnly()}
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
        <TextField label="Модель UPS" half value={v.model} onChange={set("model")} />
        <TextField label="Мощность" half value={v.power} onChange={set("power")} />
        <TextField label="Замена АБ" half value={v.battery} onChange={set("battery")} />
        <SelectField label="Классификация" half value={v.cls} onChange={set("cls")} options={opts(UPS_CLASSES)} />
        <TextField label="S/N" half value={v.serial} onChange={set("serial")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => UPS_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
