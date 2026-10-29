"use client"

import { useMemo, useState } from "react"
import { changedNote, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { PlaceFields } from "@/components/equipment/place-fields"
import { notify, toast } from "@/components/shared/toast"
import { withNode } from "@/lib/api/equipment"
import { blankStation, onewebStations, STATION_STATUS, stationName, type OneWebStation } from "@/lib/api/oneweb-form"

/** Поля формы — строками, как в инпутах. Порядок — как колонки списка. */
type Values = {
  branch: string
  nodeId: string
  station: string
  serial: string
  ip: string
  coords: string
  imei: string
  status: string
}

const text = (v: string) => (v === "—" ? "" : v)
const toValues = (x: OneWebStation): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  station: text(String(x.f.station)),
  serial: text(String(x.f.serial)),
  ip: text(String(x.f.ip)),
  coords: text(String(x.f.coords)),
  imei: text(String(x.f.imei)),
  status: x.status,
})

const STATUS_OPTIONS = Object.entries(STATION_STATUS).map(([v, [label]]) => ({ v, label }))

/** Создание и правка станции OneWeb (мониторинг) — шторкой поверх списка или паспорта. `row` нет — новая. */
export function StationForm({ row, onClose, onDelete }: { row?: OneWebStation; onClose: () => void; onDelete?: (x: OneWebStation) => void }) {
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankStation()), [row])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>("oneweb-form", isNew, initial)
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    station: required(v.station),
    serial: required(v.serial),
    imei: required(v.imei),
    status: required(v.status),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const base = row ?? { ...blankStation(), num: String(onewebStations.nextId()) }
    const next = withNode(
      {
        ...base,
        branch: v.branch,
        status: v.status,
        f: { ...base.f, station: v.station, serial: v.serial, ip: v.ip, coords: v.coords, imei: v.imei },
      },
      Number(v.nodeId),
    )
    setBusy(true)
    try {
      const saved = await onewebStations.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", stationName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${stationName(row)}` : "Новая запись · Форма учёта OneWeb"}
      sub={changedNote(isNew, changed)}
      busy={busy || onewebStations.readOnly()}
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
        <TextField label="Название станции" required half value={v.station} onChange={set("station")} error={err("station")} />
        <TextField label="Серийный номер" required half value={v.serial} onChange={set("serial")} error={err("serial")} />
        <TextField label="IP-адрес" half value={v.ip} onChange={set("ip")} />
        <TextField label="Широта, долгота" half value={v.coords} onChange={set("coords")} />
        <TextField label="IMEI" required half value={v.imei} onChange={set("imei")} error={err("imei")} />
        <SelectField
          label="Статус"
          required
          half
          value={v.status}
          onChange={set("status")}
          options={STATUS_OPTIONS}
          tone={(s) => STATION_STATUS[s]?.[1]}
          error={err("status")}
        />
      </FormGroup>
    </FormPanel>
  )
}
