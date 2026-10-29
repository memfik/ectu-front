"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankOneWeb, ONEWEB_CATEGORIES, ONEWEB_STATUS, onewebName, onewebs, type OneWeb } from "@/lib/api/oneweb"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  station: string
  terminal: string
  client: string
  category: string
  oblast: string
  ip: string
  status: string
}

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: OneWeb): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  station: text(String(x.f.station)),
  terminal: text(String(x.f.terminal)),
  client: text(String(x.f.client)),
  category: text(String(x.f.category)),
  oblast: text(String(x.f.oblast)),
  ip: text(String(x.f.ip)),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(ONEWEB_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка станции OneWeb — шторкой поверх списка или паспорта. `row` нет — новая. */
export function OneWebForm({ row, onClose, onDelete }: { row?: OneWeb; onClose: () => void; onDelete?: (x: OneWeb) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankOneWeb()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("oneweb", isNew, initial)
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
    const base = row ?? { ...blankOneWeb(), num: String(onewebs.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, station: v.station, terminal: v.terminal, client: v.client, category: v.category, oblast: v.oblast, ip: v.ip },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await onewebs.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", onewebName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${onewebName(row)}` : "Новая запись · OneWeb LEO"}
      sub={changedNote(isNew, changed)}
      busy={busy || onewebs.readOnly()}
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
        <TextField label="Станция" half value={v.station} onChange={set("station")} />
        <TextField label="Терминал" half value={v.terminal} onChange={set("terminal")} />
        <TextField label="Клиент" half value={v.client} onChange={set("client")} />
        <SelectField label="Категория" half value={v.category} onChange={set("category")} options={opts(ONEWEB_CATEGORIES)} />
        <TextField label="Область" half value={v.oblast} onChange={set("oblast")} />
        <TextField label="IP address" half value={v.ip} onChange={set("ip")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => ONEWEB_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
