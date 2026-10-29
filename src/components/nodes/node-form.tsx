"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TagsField, TextareaField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { notify, toast } from "@/components/shared/toast"
import {
  applyNodeValues,
  blankNode,
  BRANCHES,
  checkCode,
  NETWORKS,
  NODE_STATUSES,
  NODE_TONE,
  nodeName,
  nodes,
  nodeValues,
  OWNERSHIP,
  STATUS_LABEL,
  TECH,
  type NodeRow,
  type NodeStatus,
  type NodeValues,
} from "@/lib/api/nodes"

const BRANCH_OPTIONS = BRANCHES.map((b) => ({ v: b.v, label: b.full }))
const NETWORK_OPTIONS = NETWORKS.map((v) => ({ v, label: v }))
const OWNERSHIP_OPTIONS = Object.entries(OWNERSHIP).map(([v, label]) => ({ v, label }))
const STATUS_OPTIONS = NODE_STATUSES.map((v) => ({ v, label: STATUS_LABEL[v] }))
const TECH_OPTIONS = TECH.map((v) => ({ v, label: v }))

/**
 * Создание и правка узла связи (экраны n-04, n-05) — шторкой поверх списка или паспорта. `row` нет — новый узел.
 */
export function NodeForm({ row, onClose, onDelete }: { row?: NodeRow; onClose: () => void; onDelete?: (x: NodeRow) => void }) {
  const isNew = !row
  const initial = useMemo(() => nodeValues(row ?? blankNode()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<NodeValues>("nodes", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    num: required(v.num),
    code: required(v.code) ?? checkCode(v.code),
    object: required(v.object),
    city: required(v.city),
    network: required(v.network),
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const next = applyNodeValues(row ?? blankNode(nodes.nextId()), v)
    setBusy(true)
    try {
      const saved = await nodes.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", nodeName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${nodeName(row)}` : "Новый узел связи"}
      sub={row ? `${changedNote(false, changed)}${row.updated ? ` · последнее изменение ${row.updated}` : ""}` : "Поля со * обязательны · координаты укажете на карте после создания"}
      submit="Создать узел"
      busy={busy || nodes.readOnly()}
      onClose={onClose}
      onSubmit={save}
      onDelete={row && onDelete ? () => onDelete(row) : undefined}
    >
      <FormGroup title="Основное">
        <SelectField label="Филиал" required half value={v.branch} onChange={set("branch")} options={BRANCH_OPTIONS} placeholder="Выберите филиал" error={err("branch")} />
        <TextField label="Нумерация" required half numeric value={v.num} onChange={set("num")} placeholder="Например: 12" error={err("num")} />
        <TextField
          label="Идентификатор (ID) узла связи"
          required
          hint="формат: город+№.№.филиал"
          value={v.code}
          onChange={set("code")}
          placeholder="Например: url002.01.UF"
          error={err("code")}
        />
        <TextField label="Наименование объекта связи" required value={v.object} onChange={set("object")} placeholder="Например: УС «Уральск Центральный»" error={err("object")} />
        <TextField label="Населённый пункт узла связи" required half value={v.city} onChange={set("city")} placeholder="Город / село" error={err("city")} />
        <TextField label="Адрес" half value={v.address} onChange={set("address")} placeholder="Улица, дом" />
        <SelectField label="Тип сети" required half value={v.network} onChange={set("network")} options={NETWORK_OPTIONS} placeholder="Выберите тип сети" error={err("network")} />
        <SelectField label="Форма владения" half value={v.ownership} onChange={set("ownership")} options={OWNERSHIP_OPTIONS} placeholder="Выберите" />
        <SelectField
          label="Статус"
          required
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          placeholder="Выберите статус"
          tone={(s) => NODE_TONE[s as NodeStatus]}
          error={err("status")}
        />
      </FormGroup>
      <FormGroup title="Эксплуатация">
        <TextField label="Группа эксплуатации" half value={v.opsGroup} onChange={set("opsGroup")} placeholder="Например: ЦТ" />
        <TextField label="Удалённость УС от ГЭ, км" half numeric value={v.opsKm} onChange={set("opsKm")} placeholder="0,0" />
        <TextField label="Место расположения ГЭ" value={v.opsPlace} onChange={set("opsPlace")} placeholder="Адрес группы эксплуатации" />
      </FormGroup>
      <FormGroup title="Технологии">
        <TagsField label="Технологии подключения УС / ТП" value={v.techNode} onChange={set("techNode")} options={TECH_OPTIONS} />
        <TagsField label="Технологии подключения клиентов в ТП" value={v.tech} onChange={set("tech")} options={TECH_OPTIONS} />
        <TextareaField label="Комментарий" value={v.comment} onChange={set("comment")} placeholder="Необязательно" />
      </FormGroup>
    </FormPanel>
  )
}
