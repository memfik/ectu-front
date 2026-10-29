"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { AUTOMATION, blankGenUnit, EXECUTIONS, FUELS, GEN_STATUS, genName, GENERATORS, genUnits, MOBILITY, PHASES, type GenUnit } from "@/lib/api/gen"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  model: string
  power: string
  fuel: string
  serial: string
  phases: string
  engine: string
  generator: string
  tank: string
  execution: string
  mobility: string
  automation: string
  since: string
  status: string
}
type FieldKey = keyof GenUnit["f"]
const FIELDS: FieldKey[] = ["model", "power", "fuel", "serial", "phases", "engine", "generator", "tank", "execution", "mobility", "automation", "since"]

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: GenUnit): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  ...(Object.fromEntries(FIELDS.map((k) => [k, text(String(x.f[k] ?? ""))])) as Record<FieldKey, string>),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(GEN_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка ГЭУ — шторкой поверх списка или паспорта. `row` нет — новая. */
export function GenForm({ row, onClose, onDelete }: { row?: GenUnit; onClose: () => void; onDelete?: (x: GenUnit) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankGenUnit()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("gen", isNew, initial)
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
    const base = row ?? { ...blankGenUnit(), num: String(genUnits.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, ...Object.fromEntries(FIELDS.map((k) => [k, v[k]])) },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await genUnits.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", genName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${genName(row)}` : "Новая запись · ГЭУ"}
      sub={changedNote(isNew, changed)}
      busy={busy || genUnits.readOnly()}
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
        <TextField label="Мощность" half value={v.power} onChange={set("power")} />
        <SelectField label="Топливо" half value={v.fuel} onChange={set("fuel")} options={opts(FUELS)} />
        <TextField label="S/N" half value={v.serial} onChange={set("serial")} />
        <SelectField label="Кол-во фаз" half value={v.phases} onChange={set("phases")} options={opts(PHASES)} />
        <TextField label="Тип двигателя" half value={v.engine} onChange={set("engine")} />
        <SelectField label="Генератор" half value={v.generator} onChange={set("generator")} options={opts(GENERATORS)} />
        <TextField label="Емкость бака, литров" half value={v.tank} onChange={set("tank")} />
        <SelectField label="Исполнение" half value={v.execution} onChange={set("execution")} options={opts(EXECUTIONS)} />
        <SelectField label="Степень подвижности" half value={v.mobility} onChange={set("mobility")} options={opts(MOBILITY)} />
        <SelectField label="Степень автоматизации (I-IV)" half value={v.automation} onChange={set("automation")} options={opts(AUTOMATION)} />
        <TextField label="Дата ввода в эксплуатацию" half value={v.since} onChange={set("since")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => GEN_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
