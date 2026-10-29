"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankFiberLine, checkPair, FIBER_STATUS, fiberLineName, fiberLines, NETWORKS, OWNERS, type FiberLine } from "@/lib/api/fiber-lines"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  name: string
  route: string
  len: string
  fibers: string
  cable: string
  owner: string
  network: string
  total: string
  status: string
}

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: FiberLine): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  name: text(x.f.name),
  route: text(x.f.route),
  len: text(x.f.len),
  fibers: text(x.f.fibers),
  cable: text(x.f.cable),
  owner: text(x.f.owner),
  network: text(x.f.network),
  total: text(x.f.total),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(FIBER_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/**
 * Создание и правка трассы ВОЛС (экраны n-04, n-05) — шторкой поверх списка или паспорта. `row` нет — новая.
 */
export function FiberLineForm({ row, onClose, onDelete }: { row?: FiberLine; onClose: () => void; onDelete?: (x: FiberLine) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankFiberLine()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("fiber-lines", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    fibers: v.fibers ? checkPair(v.fibers) : undefined,
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankFiberLine(), num: String(fiberLines.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, name: v.name, route: v.route, len: v.len, fibers: v.fibers, cable: v.cable, owner: v.owner, network: v.network, total: v.total },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await fiberLines.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", fiberLineName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${fiberLineName(row)}` : "Новая запись · ВОЛС"}
      sub={changedNote(isNew, changed)}
      busy={busy || fiberLines.readOnly()}
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
        <TextField label="Наименование трассы" half value={v.name} onChange={set("name")} />
        <TextField label="Начало → конец" half value={v.route} onChange={set("route")} />
        <TextField label="Длина, км" half value={v.len} onChange={set("len")} />
        <TextField label="Волокна" half value={v.fibers} onChange={set("fibers")} placeholder="занято / всего" error={err("fibers")} />
        <TextField label="Тип прокладки / кабель" half value={v.cable} onChange={set("cable")} />
        <SelectField label="Собственник ВОК" half value={v.owner} onChange={set("owner")} options={opts(OWNERS)} />
        <SelectField label="Тип сети" half value={v.network} onChange={set("network")} options={opts(NETWORKS)} />
        <TextField label="Суммарная длина кабеля, км" half value={v.total} onChange={set("total")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => FIBER_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
