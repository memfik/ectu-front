"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { BWA_STATUS, blankBwa, bwaName, checkPair, NETWORKS, type Bwa, type BwaSource } from "@/lib/api/bwa"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  model: string
  place: string
  subs: string
  sectors: string
  freq: string
  vendor: string
  network: string
  serial: string
  status: string
}

const text = (v: string | number | undefined) => (v === undefined || v === "—" ? "" : String(v))
const toValues = (x: Bwa): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  model: text(x.f.model),
  place: text(x.f.place),
  subs: text(x.f.subs),
  sectors: text(x.f.sectors),
  freq: text(x.f.freq),
  vendor: text(x.f.vendor),
  network: text(x.f.network),
  serial: text(x.f.serial),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(BWA_STATUS).map(([v, [label]]) => ({ v, label }))
const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/**
 * Создание и правка базовой станции БШД (WiMAX, Telrad LTE, WLL) — шторкой поверх списка или паспорта. `row` нет — новая.
 * `source` и `vendors` — раздела (lib/api/bwa-<x>.ts).
 */
export function BwaForm({
  section,
  title,
  source,
  vendors,
  row,
  onClose,
  onDelete,
}: {
  section: string
  title: string
  source: BwaSource
  vendors: string[]
  row?: Bwa
  onClose: () => void
  onDelete?: (x: Bwa) => void
}) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankBwa()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>(section, isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    subs: v.subs ? checkPair(v.subs) : undefined,
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankBwa(), num: String(source.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: {
          ...base.f,
          model: v.model,
          place: v.place,
          subs: v.subs,
          sectors: v.sectors,
          freq: v.freq,
          vendor: v.vendor,
          network: v.network,
          serial: v.serial,
        },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await source.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", bwaName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${bwaName(row)}` : `Новая запись · ${title}`}
      sub={changedNote(isNew, changed)}
      busy={busy || source.readOnly()}
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
        <TextField label="Базовая станция" half value={v.model} onChange={set("model")} />
        <TextField label="Адрес установки" half value={v.place} onChange={set("place")} />
        <TextField label="Абоненты / лицензии" half value={v.subs} onChange={set("subs")} placeholder="занято / всего" error={err("subs")} />
        <TextField label="Сектора" half value={v.sectors} onChange={set("sectors")} />
        <TextField label="Частота, МГц" half value={v.freq} onChange={set("freq")} />
        <SelectField label="Вендор" half value={v.vendor} onChange={set("vendor")} options={opts(vendors)} />
        <SelectField label="Тип сети" half value={v.network} onChange={set("network")} options={opts(NETWORKS)} />
        <TextField label="Серийный номер" half value={v.serial} onChange={set("serial")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => BWA_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
