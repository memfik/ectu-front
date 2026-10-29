"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankLandPlot, LAND_STATUS, landPlotName, landPlots, OBJECT_KINDS, OWNERSHIP, REGISTERED, type LandPlot } from "@/lib/api/land-plots"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка (узел связи — в «Размещении»). */
type Values = {
  branch: string
  nodeId: string
  name: string
  area: string
  own: string
  vols: string
  cadastre: string
  kind: string
  registered: string
  lease: string
  status: string
}

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: LandPlot): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  name: text(x.f.name),
  area: text(x.f.area),
  own: text(x.f.own),
  vols: text(x.f.vols),
  cadastre: text(x.f.cadastre),
  kind: text(x.f.kind),
  registered: text(x.f.registered),
  lease: text(x.f.lease),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(LAND_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Создание и правка земельного участка — шторкой поверх списка или паспорта. `row` нет — новый. */
export function LandPlotForm({ row, onClose, onDelete }: { row?: LandPlot; onClose: () => void; onDelete?: (x: LandPlot) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankLandPlot()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("land-plots", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    name: required(v.name),
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankLandPlot(), num: String(landPlots.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: {
          ...base.f,
          name: v.name,
          area: v.area,
          own: v.own,
          vols: v.vols,
          cadastre: v.cadastre,
          kind: v.kind,
          registered: v.registered,
          lease: v.lease,
        },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await landPlots.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", landPlotName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${landPlotName(row)}` : "Новая запись · Земельные участки"}
      sub={changedNote(isNew, changed)}
      busy={busy || landPlots.readOnly()}
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
        <TextField label="Наименование" required half value={v.name} onChange={set("name")} error={err("name")} />
        <TextField label="Площадь" half value={v.area} onChange={set("area")} />
        <SelectField label="Вид собственности" half value={v.own} onChange={set("own")} options={opts(OWNERSHIP)} />
        <TextField label="ВОЛС" half value={v.vols} onChange={set("vols")} />
        <TextField label="Кадастровый номер" half value={v.cadastre} onChange={set("cadastre")} />
        <SelectField label="Вид объекта" half value={v.kind} onChange={set("kind")} options={opts(OBJECT_KINDS)} />
        <SelectField label="Зарегистрирован" half value={v.registered} onChange={set("registered")} options={opts(REGISTERED)} />
        <TextField label="Сроки аренды" half value={v.lease} onChange={set("lease")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => LAND_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
