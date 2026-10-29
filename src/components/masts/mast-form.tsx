"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankMast, MAST_STATUS, MAST_TYPES, mastName, masts, type Mast } from "@/lib/api/masts"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка (ID УС — в «Размещении»). */
type Values = {
  branch: string
  nodeId: string
  town: string
  type: string
  height: string
  owner: string
  place: string
  status: string
}

const text = (v: string | number) => (v === "—" ? "" : String(v))
const toValues = (x: Mast): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  town: text(x.f.town),
  type: text(x.f.type),
  height: text(x.f.height),
  owner: text(x.f.owner),
  place: text(x.f.place),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(MAST_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка АМС — шторкой поверх списка или паспорта. `row` нет — новое. */
export function MastForm({ row, onClose, onDelete }: { row?: Mast; onClose: () => void; onDelete?: (x: Mast) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankMast()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("masts", isNew, initial)
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
    const base = row ?? { ...blankMast(), num: String(masts.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, town: v.town, type: v.type, height: v.height, owner: v.owner, place: v.place },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await masts.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", mastName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${mastName(row)}` : "Новая запись · АМС"}
      sub={changedNote(isNew, changed)}
      busy={busy || masts.readOnly()}
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
        <TextField label="Населённый пункт" half value={v.town} onChange={set("town")} />
        <SelectField label="Тип" half value={v.type} onChange={set("type")} options={opts(MAST_TYPES)} />
        <TextField label="Высота, м" half value={v.height} onChange={set("height")} />
        <TextField label="Собственник площадки" half value={v.owner} onChange={set("owner")} />
        <TextField label="Адрес установки" half value={v.place} onChange={set("place")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => MAST_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
