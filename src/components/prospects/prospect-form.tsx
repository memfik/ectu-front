"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankProspect, KINDS, PROSPECT_STATUS, prospectName, prospects, type Prospect } from "@/lib/api/prospects"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  bin: string
  company: string
  kind: string
  size: string
  dist: string
  status: string
}

const text = (v: string | number) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: Prospect): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  bin: text(x.f.bin),
  company: text(x.f.company),
  kind: text(x.f.kind),
  size: text(x.f.size),
  dist: text(x.f.dist),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(PROSPECT_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка потенциального клиента — шторкой поверх списка или паспорта. `row` нет — новая запись. */
export function ProspectForm({ row, onClose, onDelete }: { row?: Prospect; onClose: () => void; onDelete?: (x: Prospect) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankProspect()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("prospects", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    company: required(v.company),
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankProspect(), num: String(prospects.nextId()) }
    const next = withNode(
      { ...base, branch: v.branch, status: v.status, f: { ...base.f, bin: v.bin, company: v.company, kind: v.kind, size: v.size, dist: v.dist } },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await prospects.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", prospectName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${prospectName(row)}` : "Новая запись · Потенциальные клиенты"}
      sub={changedNote(isNew, changed)}
      busy={busy || prospects.readOnly()}
      onClose={onClose}
      onSubmit={save}
      onDelete={row && onDelete ? () => onDelete(row) : undefined}
    >
      <PlaceFields branch={v.branch} nodeId={v.nodeId} onBranch={set("branch")} onNode={set("nodeId")} errors={{ branch: err("branch"), nodeId: err("nodeId") }} />
      <FormGroup title="Сведения">
        <TextField label="БИН" half value={v.bin} onChange={set("bin")} />
        <TextField label="Наименование" required half value={v.company} onChange={set("company")} error={err("company")} />
        <SelectField label="Тип клиента" half value={v.kind} onChange={set("kind")} options={opts(KINDS)} />
        <TextField label="Размер" half value={v.size} onChange={set("size")} />
        <TextField label="Дистанция, м" half value={v.dist} onChange={set("dist")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => PROSPECT_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
