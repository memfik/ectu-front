"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankRrlSpan, RRL_STATUS, rrlSpans, rrlName, type RrlSpan } from "@/lib/api/rrl"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  route: string
  model: string
  bw: string
  len: string
  vendor: string
  freq: string
  status: string
}

const text = (v: string | undefined) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: RrlSpan): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  route: text(x.f.route),
  model: text(x.f.model),
  bw: text(x.f.bw),
  len: text(x.f.len),
  vendor: text(x.f.vendor),
  freq: text(x.f.freq),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(RRL_STATUS).map(([v, [label]]) => ({ v, label }))

/** Создание и правка пролёта РРЛ — шторкой поверх списка или паспорта. `row` нет — новый. */
export function RrlForm({ row, onClose, onDelete }: { row?: RrlSpan; onClose: () => void; onDelete?: (x: RrlSpan) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankRrlSpan()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("rrl", isNew, initial)
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
    const base = row ?? { ...blankRrlSpan(), num: String(rrlSpans.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, route: v.route, model: v.model, bw: v.bw, len: v.len, vendor: v.vendor, freq: v.freq },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await rrlSpans.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", rrlName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${rrlName(row)}` : "Новая запись · РРЛ"}
      sub={changedNote(isNew, changed)}
      busy={busy || rrlSpans.readOnly()}
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
        <TextField label="Длина, км" half value={v.len} onChange={set("len")} />
        <TextField label="Вендор" half value={v.vendor} onChange={set("vendor")} />
        <TextField label="Частота" half value={v.freq} onChange={set("freq")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => RRL_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
