"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankChannel, CHANNEL_STATUS, CHANNEL_TYPES, channelName, channels, TRAFFIC, type Channel } from "@/lib/api/channel-ids"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  cid: string
  client: string
  type: string
  speed: string
  iface: string
  vlan: string
  traffic: string
  status: string
}

const text = (v: string) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: Channel): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  cid: text(x.f.cid),
  client: text(x.f.client),
  type: text(x.f.type),
  speed: text(x.f.speed),
  iface: text(x.f.iface),
  vlan: text(x.f.vlan),
  traffic: text(x.f.traffic),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(CHANNEL_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка ID-канала — шторкой поверх списка или паспорта. `row` нет — новая запись. */
export function ChannelForm({ row, onClose, onDelete }: { row?: Channel; onClose: () => void; onDelete?: (x: Channel) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankChannel()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("channel-ids", isNew, initial)
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
    const base = row ?? { ...blankChannel(), num: String(channels.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, cid: v.cid, client: v.client, type: v.type, speed: v.speed, iface: v.iface, vlan: v.vlan, traffic: v.traffic },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await channels.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", channelName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${channelName(row)}` : "Новая запись · ID-каналы"}
      sub={changedNote(isNew, changed)}
      busy={busy || channels.readOnly()}
      onClose={onClose}
      onSubmit={save}
      onDelete={row && onDelete ? () => onDelete(row) : undefined}
    >
      <PlaceFields branch={v.branch} nodeId={v.nodeId} onBranch={set("branch")} onNode={set("nodeId")} errors={{ branch: err("branch"), nodeId: err("nodeId") }} />
      <FormGroup title="Сведения">
        <TextField label="ID-канала" half value={v.cid} onChange={set("cid")} />
        <TextField label="Клиент" half value={v.client} onChange={set("client")} />
        <SelectField label="Тип канала" half value={v.type} onChange={set("type")} options={opts(CHANNEL_TYPES)} />
        <TextField label="Скорость" half value={v.speed} onChange={set("speed")} />
        <TextField label="Router / Interface" half value={v.iface} onChange={set("iface")} />
        <TextField label="VLAN" half value={v.vlan} onChange={set("vlan")} />
        <SelectField label="Тип трафика" half value={v.traffic} onChange={set("traffic")} options={opts(TRAFFIC)} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => CHANNEL_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
