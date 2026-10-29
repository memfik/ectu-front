"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankCableLine, CABLE_LINE_STATUS, cableLineName, cableLines, type CableLine } from "@/lib/api/cable-lines"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  name: string
  route: string
  len: string
  pairs: string
  owner: string
  status: string
}

const text = (v: string | number) => (v === "—" ? "" : String(v))
const toValues = (x: CableLine): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  name: text(x.f.name),
  route: text(x.f.route),
  len: text(x.f.len),
  pairs: text(x.f.pairs),
  owner: text(x.f.owner),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(CABLE_LINE_STATUS).map(([v, [label]]) => ({ v, label }))

/** Создание и правка трассы КЛС — шторкой поверх списка или паспорта. `row` нет — новая. */
export function CableLineForm({ row, onClose, onDelete }: { row?: CableLine; onClose: () => void; onDelete?: (x: CableLine) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankCableLine()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("cable-lines", isNew, initial)
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
    const base = row ?? { ...blankCableLine(), num: String(cableLines.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, name: v.name, route: v.route, len: v.len, pairs: v.pairs, owner: v.owner },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await cableLines.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", cableLineName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${cableLineName(row)}` : "Новая запись · КЛС"}
      sub={changedNote(isNew, changed)}
      busy={busy || cableLines.readOnly()}
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
        <TextField label="Наименование трассы" half value={v.name} onChange={set("name")} />
        <TextField label="Начало → конец" half value={v.route} onChange={set("route")} />
        <TextField label="Длина, км" half value={v.len} onChange={set("len")} />
        <TextField label="Пары" half value={v.pairs} onChange={set("pairs")} />
        <TextField label="Принадлежность" half value={v.owner} onChange={set("owner")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => CABLE_LINE_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
