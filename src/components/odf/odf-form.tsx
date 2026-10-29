"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankOdf, checkPorts, CONNECTORS, MOUNTS, ODF_STATUS, odfName, odfs, type Odf } from "@/lib/api/odf"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка (узел А — в «Размещении»). */
type Values = {
  branch: string
  nodeId: string
  nodeB: string
  mount: string
  ports: string
  conn: string
  status: string
}

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: Odf): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  nodeB: text(x.f.nodeB),
  mount: text(x.f.mount),
  ports: text(x.f.ports),
  conn: text(x.f.conn),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(ODF_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка оптического кросса — шторкой поверх списка или паспорта. `row` нет — новый. */
export function OdfForm({ row, onClose, onDelete }: { row?: Odf; onClose: () => void; onDelete?: (x: Odf) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankOdf()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("odf", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    ports: v.ports ? checkPorts(v.ports) : undefined,
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankOdf(), num: String(odfs.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, nodeB: v.nodeB, mount: v.mount, ports: v.ports, conn: v.conn },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await odfs.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", odfName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${odfName(row)}` : "Новая запись · ODF"}
      sub={changedNote(isNew, changed)}
      busy={busy || odfs.readOnly()}
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
        <TextField label="Узел Б" half value={v.nodeB} onChange={set("nodeB")} />
        <SelectField label="Монтаж" half value={v.mount} onChange={set("mount")} options={opts(MOUNTS)} />
        <TextField label="Порты" half value={v.ports} onChange={set("ports")} placeholder="занято / всего" error={err("ports")} />
        <SelectField label="Коннектор" half value={v.conn} onChange={set("conn")} options={opts(CONNECTORS)} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => ODF_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
