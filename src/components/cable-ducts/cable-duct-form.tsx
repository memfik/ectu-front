"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankCableDuct, CABLE_DUCT_STATUS, cableDuctName, cableDucts, PUNCTURE, type CableDuct } from "@/lib/api/cable-ducts"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  name: string
  wells: string
  len: string
  channels: string
  puncture: string
  desc: string
  status: string
}

const text = (v: string | number) => (v === "—" ? "" : String(v))
const toValues = (x: CableDuct): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  name: text(x.f.name),
  wells: text(x.f.wells),
  len: text(x.f.len),
  channels: text(x.f.channels),
  puncture: text(x.f.puncture),
  desc: text(x.f.desc),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(CABLE_DUCT_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка участка кабельной канализации — шторкой поверх списка или паспорта. `row` нет — новый. */
export function CableDuctForm({ row, onClose, onDelete }: { row?: CableDuct; onClose: () => void; onDelete?: (x: CableDuct) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankCableDuct()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("cable-ducts", isNew, initial)
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
    const base = row ?? { ...blankCableDuct(), num: String(cableDucts.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, name: v.name, wells: v.wells, len: v.len, channels: v.channels, puncture: v.puncture, desc: v.desc },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await cableDucts.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", cableDuctName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${cableDuctName(row)}` : "Новая запись · Кабельная канализация"}
      sub={changedNote(isNew, changed)}
      busy={busy || cableDucts.readOnly()}
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
        <TextField label="Наименование участка" half value={v.name} onChange={set("name")} />
        <TextField label="Колодцев" half value={v.wells} onChange={set("wells")} />
        <TextField label="Длина, м" half value={v.len} onChange={set("len")} />
        <TextField label="Каналов" half value={v.channels} onChange={set("channels")} />
        <SelectField label="Прокол" half value={v.puncture} onChange={set("puncture")} options={opts(PUNCTURE)} />
        <TextField label="Описание" half value={v.desc} onChange={set("desc")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => CABLE_DUCT_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
