"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankOnymaClient, ONYMA_STATUS, onyma, onymaName, SEGMENTS, type OnymaClient } from "@/lib/api/onyma"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  company: string
  account: string
  contract: string
  segment: string
  ip: string
  speed: string
  status: string
}

const text = (v: string) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: OnymaClient): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  company: text(x.f.company),
  account: text(x.f.account),
  contract: text(x.f.contract),
  segment: text(x.f.segment),
  ip: text(x.f.ip),
  speed: text(x.f.speed),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(ONYMA_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/**
 * Правка абонента Onyma — шторкой поверх списка (раздел только для просмотра: создания и импорта нет,
 * в API сохранение закрыто). Узел связи необязателен — у раздела нет карты.
 */
export function OnymaForm({ row, onClose, onDelete }: { row?: OnymaClient; onClose: () => void; onDelete?: (x: OnymaClient) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankOnymaClient()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("onyma", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankOnymaClient(), num: String(onyma.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, company: v.company, account: v.account, contract: v.contract, segment: v.segment, ip: v.ip, speed: v.speed },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await onyma.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", onymaName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${onymaName(row)}` : "Новая запись · Клиенты Onyma"}
      sub={changedNote(isNew, changed)}
      busy={busy || onyma.readOnly()}
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
        <TextField label="Наименование" half value={v.company} onChange={set("company")} />
        <TextField label="Лицевой счёт" half value={v.account} onChange={set("account")} />
        <TextField label="Договор" half value={v.contract} onChange={set("contract")} />
        <SelectField label="Сегмент" half value={v.segment} onChange={set("segment")} options={opts(SEGMENTS)} />
        <TextField label="Статический IP" half value={v.ip} onChange={set("ip")} />
        <TextField label="Скорость" half value={v.speed} onChange={set("speed")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => ONYMA_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
