"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankTrunkBs, TRUNK_STATUS, trunkName, trunkStations, type TrunkBs } from "@/lib/api/trunk-bs"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  model: string
  terminals: string
  state: string
  place: string
  status: string
}

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: TrunkBs): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  model: text(String(x.f.model)),
  terminals: text(String(x.f.terminals)),
  state: text(String(x.f.state)),
  place: text(String(x.f.place)),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(TRUNK_STATUS).map(([v, [label]]) => ({ v, label }))

/** Создание и правка БС Транк — шторкой поверх списка или паспорта. `row` нет — новая. */
export function TrunkBsForm({ row, onClose, onDelete }: { row?: TrunkBs; onClose: () => void; onDelete?: (x: TrunkBs) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankTrunkBs()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("trunk-bs", isNew, initial)
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
    const base = row ?? { ...blankTrunkBs(), num: String(trunkStations.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, model: v.model, terminals: v.terminals, state: v.state, place: v.place },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await trunkStations.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", trunkName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${trunkName(row)}` : "Новая запись · БС Транк"}
      sub={changedNote(isNew, changed)}
      busy={busy || trunkStations.readOnly()}
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
        <TextField label="Тип/модель БС" half value={v.model} onChange={set("model")} />
        <TextField label="Терминалов" half value={v.terminals} onChange={set("terminals")} />
        <TextField label="Состояние" half value={v.state} onChange={set("state")} />
        <TextField label="Место установки" half value={v.place} onChange={set("place")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => TRUNK_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
