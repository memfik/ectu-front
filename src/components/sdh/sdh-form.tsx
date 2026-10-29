"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankSdhDevice, checkPair, SDH_STATUS, sdhDevices, sdhName, type SdhDevice } from "@/lib/api/sdh"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  model: string
  stm: string
  vc: string
  vendor: string
  status: string
}

const text = (v: string | undefined) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: SdhDevice): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  model: text(x.f.model),
  stm: text(x.f.stm),
  vc: text(x.f.vc),
  vendor: text(x.f.vendor),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(SDH_STATUS).map(([v, [label]]) => ({ v, label }))

/** Создание и правка устройства SDH — шторкой поверх списка или паспорта. `row` нет — новое. */
export function SdhForm({ row, onClose, onDelete }: { row?: SdhDevice; onClose: () => void; onDelete?: (x: SdhDevice) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankSdhDevice()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("sdh", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    stm: v.stm ? checkPair(v.stm) : undefined,
    vc: v.vc ? checkPair(v.vc) : undefined,
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankSdhDevice(), num: String(sdhDevices.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, model: v.model, stm: v.stm, vc: v.vc, vendor: v.vendor },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await sdhDevices.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", sdhName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${sdhName(row)}` : "Новая запись · SDH"}
      sub={changedNote(isNew, changed)}
      busy={busy || sdhDevices.readOnly()}
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
        <TextField label="STM-1 (З./М.)" half value={v.stm} onChange={set("stm")} placeholder="занято / всего" error={err("stm")} />
        <TextField label="VC-12 (З./М.)" half value={v.vc} onChange={set("vc")} placeholder="занято / всего" error={err("vc")} />
        <TextField label="Производитель" half value={v.vendor} onChange={set("vendor")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => SDH_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
