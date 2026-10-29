"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankIpAddress, IP_STATUS, ipName, ipPlan, PREFIXES, type IpAddress } from "@/lib/api/ip-plan"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  ip: string
  prefix: string
  client: string
  place: string
  speed: string
  kcrm: string
  eng: string
  status: string
}

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: IpAddress): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  ip: text(x.f.ip),
  prefix: text(x.f.prefix),
  client: text(x.f.client),
  place: text(x.f.place),
  speed: text(x.f.speed),
  kcrm: text(x.f.kcrm),
  eng: text(x.f.eng),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(IP_STATUS).map(([v, [label]]) => ({ v, label }))
const PREFIX_OPTIONS = PREFIXES.map((v) => ({ v, label: v }))

/**
 * Правка адреса IP-плана (ip-03) — шторкой поверх списка или паспорта. `row` нет — новая запись
 * (в списке новые выделяются окном «Выделить подсеть»). Узел связи необязателен.
 */
export function IpPlanForm({ row, onClose, onDelete }: { row?: IpAddress; onClose: () => void; onDelete?: (x: IpAddress) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankIpAddress()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("ip-plan", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = { branch: required(v.branch), status: required(v.status) }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankIpAddress(), num: String(ipPlan.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, ip: v.ip, prefix: v.prefix, client: v.client, place: v.place, speed: v.speed, kcrm: v.kcrm, eng: v.eng },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await ipPlan.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", ipName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${ipName(row)}` : "Новая запись · Единый IP-план"}
      sub={changedNote(isNew, changed)}
      busy={busy || ipPlan.readOnly()}
      onClose={onClose}
      onSubmit={save}
      onDelete={row && onDelete ? () => onDelete(row) : undefined}
    >
      <PlaceFields branch={v.branch} nodeId={v.nodeId} onBranch={set("branch")} onNode={set("nodeId")} nodeRequired={false} errors={{ branch: err("branch") }} />
      <FormGroup title="Сведения">
        <TextField label="IP-адрес" half value={v.ip} onChange={set("ip")} />
        <SelectField label="Префикс" half value={v.prefix} onChange={set("prefix")} options={PREFIX_OPTIONS} />
        <TextField label="Клиент" half value={v.client} onChange={set("client")} />
        <TextField label="Локация" half value={v.place} onChange={set("place")} />
        <TextField label="Скорость" half value={v.speed} onChange={set("speed")} />
        <TextField label="Заявка KCRM" half value={v.kcrm} onChange={set("kcrm")} />
        <TextField label="Менеджер/Инженер" half value={v.eng} onChange={set("eng")} />
        <SelectField label="Статус" required half value={v.status} onChange={set("status")} options={STATUS_OPTIONS} tone={(s) => IP_STATUS[s]?.[1]} error={err("status")} />
      </FormGroup>
    </FormPanel>
  )
}
