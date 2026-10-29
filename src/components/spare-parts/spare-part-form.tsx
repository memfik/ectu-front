"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankSparePart, CATEGORIES, OWNERS, SPARE_STATUS, sparePartName, spareParts, type SparePart } from "@/lib/api/spare-parts"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = { branch: string; nodeId: string; status: string } & { [K in keyof SparePart["f"]]: string }

const text = (v: string | undefined) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: SparePart): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  name: text(x.f.name),
  category: text(x.f.category),
  inv: text(x.f.inv),
  serial: text(x.f.serial),
  cost: text(x.f.cost),
  owner: text(x.f.owner),
  warehouse: text(x.f.warehouse),
  mol: text(x.f.mol),
  molEmail: text(x.f.molEmail),
  molPost: text(x.f.molPost),
  molDept: text(x.f.molDept),
  molPhone: text(x.f.molPhone),
  received: text(x.f.received),
  sender: text(x.f.sender),
  replaceDoc: text(x.f.replaceDoc),
  receiver: text(x.f.receiver),
  siteAddress: text(x.f.siteAddress),
  eqType: text(x.f.eqType),
  eqId: text(x.f.eqId),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(SPARE_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/**
 * Создание и правка позиции ЗИП — шторкой поверх списка или паспорта. `row` нет — новая.
 */
export function SparePartForm({ row, onClose, onDelete }: { row?: SparePart; onClose: () => void; onDelete?: (x: SparePart) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankSparePart()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("spare-parts", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    name: required(v.name),
    category: required(v.category),
    inv: required(v.inv),
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankSparePart(), num: String(spareParts.nextId()) }
    const { branch, nodeId, status, ...f } = v
    const next = withNode({ ...base, branch, status, f: { ...base.f, ...f } }, Number(nodeId))
    setBusy(true)
    try {
      const saved = await spareParts.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", sparePartName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${sparePartName(row)}` : "Новая запись · ЗИП"}
      sub={changedNote(isNew, changed)}
      busy={busy || spareParts.readOnly()}
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
        <TextField label="Наименование ЗИП" required half value={v.name} onChange={set("name")} error={err("name")} />
        <SelectField label="Категория" required half value={v.category} onChange={set("category")} options={opts(CATEGORIES)} error={err("category")} />
        <TextField label="Инвентарный номер" required half value={v.inv} onChange={set("inv")} error={err("inv")} />
        <TextField label="Серийный номер (S/N)" half value={v.serial} onChange={set("serial")} />
        <TextField label="Стоимость, тг" half value={v.cost} onChange={set("cost")} />
        <SelectField label="Принадлежность ЗИП" half value={v.owner} onChange={set("owner")} options={opts(OWNERS)} />
        <TextField label="Адрес склада ФО" half value={v.warehouse} onChange={set("warehouse")} />
        <TextField label="МОЛ, ФИО" half value={v.mol} onChange={set("mol")} />
        <TextField label="Email МОЛ" half value={v.molEmail} onChange={set("molEmail")} />
        <TextField label="Должность МОЛ" half value={v.molPost} onChange={set("molPost")} />
        <TextField label="Отдел МОЛ" half value={v.molDept} onChange={set("molDept")} />
        <TextField label="Телефон МОЛ" half value={v.molPhone} onChange={set("molPhone")} />
        <TextField label="Реквизиты получения" half value={v.received} onChange={set("received")} />
        <TextField label="От кого" half value={v.sender} onChange={set("sender")} />
        <TextField label="Реквизиты документа замены" half value={v.replaceDoc} onChange={set("replaceDoc")} />
        <TextField label="Кому" half value={v.receiver} onChange={set("receiver")} />
        <TextField label="Адрес узла связи (места установки)" half value={v.siteAddress} onChange={set("siteAddress")} />
        <TextField label="Тип оборудования" half value={v.eqType} onChange={set("eqType")} />
        <TextField label="ID оборудования" half value={v.eqId} onChange={set("eqId")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => SPARE_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
