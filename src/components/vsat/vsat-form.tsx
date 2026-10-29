"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankVsat, VSAT_STATUS, VSAT_TYPES, vsatName, vsats, type Vsat } from "@/lib/api/vsat"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  name: string
  client: string
  type: string
  antenna: string
  topology: string
  status: string
}

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: Vsat): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  name: text(String(x.f.name)),
  client: text(String(x.f.client)),
  type: text(String(x.f.type)),
  antenna: text(String(x.f.antenna)),
  topology: text(String(x.f.topology)),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(VSAT_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка станции VSAT — шторкой поверх списка или паспорта. `row` нет — новая. */
export function VsatForm({ row, onClose, onDelete }: { row?: Vsat; onClose: () => void; onDelete?: (x: Vsat) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankVsat()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("vsat", isNew, initial)
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
    const base = row ?? { ...blankVsat(), num: String(vsats.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, name: v.name, client: v.client, type: v.type, antenna: v.antenna, topology: v.topology },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await vsats.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", vsatName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${vsatName(row)}` : "Новая запись · ЗССС SkyEdge II GEO"}
      sub={changedNote(isNew, changed)}
      busy={busy || vsats.readOnly()}
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
        <TextField label="Наименование" half value={v.name} onChange={set("name")} />
        <TextField label="Клиент" half value={v.client} onChange={set("client")} />
        <SelectField label="Тип" half value={v.type} onChange={set("type")} options={opts(VSAT_TYPES)} />
        <TextField label="Антенна, м" half value={v.antenna} onChange={set("antenna")} />
        <TextField label="Topology" half value={v.topology} onChange={set("topology")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => VSAT_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
