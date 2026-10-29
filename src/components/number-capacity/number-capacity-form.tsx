"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankNumberCapacity, checkPair, KINDS, NUMBER_STATUS, numberCapacities, numberName, type NumberCapacity } from "@/lib/api/number-capacity"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  code: string
  town: string
  mounted: string
  used: string
  kind: string
  tu: string
  status: string
}

const text = (v: string | number) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: NumberCapacity): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  code: text(x.f.code),
  town: text(x.f.town),
  mounted: text(x.f.mounted),
  used: text(x.f.used),
  kind: text(x.f.kind),
  tu: text(x.f.tu),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(NUMBER_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка номерной ёмкости — шторкой поверх списка или паспорта. Узел связи необязателен (у раздела нет карты). */
export function NumberCapacityForm({ row, onClose, onDelete }: { row?: NumberCapacity; onClose: () => void; onDelete?: (x: NumberCapacity) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankNumberCapacity()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("number-capacity", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    mounted: v.mounted ? checkPair(v.mounted) : undefined,
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankNumberCapacity(), num: String(numberCapacities.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, code: v.code, town: v.town, mounted: v.mounted, used: v.used, kind: v.kind, tu: v.tu },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await numberCapacities.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", numberName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${numberName(row)}` : "Новая запись · Номерная ёмкость"}
      sub={changedNote(isNew, changed)}
      busy={busy || numberCapacities.readOnly()}
      onClose={onClose}
      onSubmit={save}
      onDelete={row && onDelete ? () => onDelete(row) : undefined}
    >
      <PlaceFields
        branch={v.branch}
        nodeId={v.nodeId}
        onBranch={set("branch")}
        onNode={set("nodeId")}
        nodeRequired={false}
        errors={{ branch: err("branch") }}
      />
      <FormGroup title="Сведения">
        <TextField label="Код и диапазон" half value={v.code} onChange={set("code")} />
        <TextField label="Город / область" half value={v.town} onChange={set("town")} />
        <TextField label="Монтировано / ресурс" half value={v.mounted} onChange={set("mounted")} placeholder="занято / всего" error={err("mounted")} />
        <TextField label="Задействовано" half value={v.used} onChange={set("used")} />
        <SelectField label="Назначение" half value={v.kind} onChange={set("kind")} options={opts(KINDS)} />
        <TextField label="Реквизиты ТУ и Приказа Регулятора" half value={v.tu} onChange={set("tu")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => NUMBER_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
