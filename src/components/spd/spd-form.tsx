"use client"

import { useMemo, useState } from "react"
import { changedNote, DateField, FormGroup, FormPanel, required, SelectField, TextField, useFormValues } from "@/components/blocks/form-panel"
import { notify, toast } from "@/components/shared/toast"
import { BRANCH_FULL, nodeOptions } from "@/lib/api/equipment"
import { routers } from "@/lib/api/routers"
import { blankSpd, checkDate, checkIp, SPD_NETWORKS, spdFromValues, spdName, type SpdKind, type SpdRow } from "@/lib/api/spd"
import { switches } from "@/lib/api/switches"

/** Поля формы — строками, как в инпутах (РФ-ДППП-20 / 21, поля `spd_equipments`). */
type Values = {
  branch: string
  nodeId: string
  num: string
  network: string
  kind: string
  host: string
  ip: string
  model: string
  os: string
  serial: string
  slot: string
  board: string
  boardSn: string
  port: string
  module: string
  moduleSn: string
  act: string
  contract: string
  contractEnd: string
  note: string
}

const toValues = (x: SpdRow): Values => ({
  branch: x.branch,
  nodeId: x.nodeId ? String(x.nodeId) : "",
  num: x.num ? String(x.num) : "",
  network: x.network,
  kind: x.kind,
  host: x.host,
  ip: x.ip,
  model: x.model,
  os: x.os,
  serial: x.serial,
  slot: x.slot ?? "",
  board: x.board ?? "",
  boardSn: x.boardSn ?? "",
  port: x.port ?? "",
  module: x.module ?? "",
  moduleSn: x.moduleSn ?? "",
  act: x.act ?? "",
  contract: x.contract,
  contractEnd: x.contractEnd ?? "",
  note: x.note ?? "",
})

const NETWORK_OPTIONS = SPD_NETWORKS.map((v) => ({ v, label: v }))
const KIND_OPTIONS = [
  { v: "switch", label: "switch" },
  { v: "router", label: "router" },
]
/** Ошибка необязательного поля — только если оно заполнено. */
const opt = (v: string, check: (v: string) => string | undefined) => (v.trim() ? check(v) : undefined)

/**
 * Создание и правка коммутатора / маршрутизатора (экраны n-04, n-05) — шторкой поверх списка или паспорта. `row` нет — новый.
 */
export function SpdForm({ kind, row, onClose, onDelete }: { kind: SpdKind; row?: SpdRow; onClose: () => void; onDelete?: (x: SpdRow) => void }) {
  const sw = kind === "switch"
  const src = sw ? switches : routers
  const isNew = !row
  const initial = useMemo(() => toValues(row ?? blankSpd(kind)), [row, kind])
  const { v, set, tried, setTried, changed, clearDraft } = useFormValues<Values>(sw ? "switches" : "routers", isNew, initial)
  const nodes = useMemo(() => nodeOptions(), [])
  const [busy, setBusy] = useState(false)

  const errors = {
    branch: required(v.branch),
    nodeId: required(v.nodeId),
    num: required(v.num),
    network: required(v.network),
    kind: required(v.kind),
    host: required(v.host),
    ip: required(v.ip) ?? checkIp(v.ip),
    model: required(v.model),
    contractEnd: opt(v.contractEnd, checkDate),
  }
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined)
  const text = (k: keyof Values, label: string, placeholder?: string, w: { half?: boolean; third?: boolean } = { half: true }) => (
    <TextField label={label} {...w} value={v[k]} onChange={set(k)} placeholder={placeholder} />
  )

  const save = async () => {
    setTried(true)
    const bad = Object.values(errors).filter(Boolean).length
    if (bad) return toast(`Заполните поля: ${bad}`)
    const next = spdFromValues(row ?? { ...blankSpd(kind), id: src.nextId() }, v)
    setBusy(true)
    try {
      const saved = await src.save(next, isNew)
      if (isNew) clearDraft()
      notify("ok", isNew ? "Запись создана" : "Запись сохранена", spdName(saved))
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось сохранить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <FormPanel
      isNew={isNew}
      title={row ? `Редактирование · ${spdName(row)}` : sw ? "Новый коммутатор" : "Новый маршрутизатор"}
      sub={changedNote(isNew, changed)}
      submit="Создать"
      busy={busy || src.readOnly()}
      onClose={onClose}
      onSubmit={save}
      onDelete={row && onDelete ? () => onDelete(row) : undefined}
    >
      <FormGroup title="Размещение">
        <SelectField label="Филиал" required half value={v.branch} onChange={set("branch")} options={BRANCH_FULL} placeholder="Выберите филиал" error={err("branch")} />
        <SelectField label="Узел связи" required half value={v.nodeId} onChange={set("nodeId")} options={nodes} placeholder="Начните вводить ID…" error={err("nodeId")} />
        <TextField label="Нумерация" required half numeric value={v.num} onChange={set("num")} placeholder="Например: 1" error={err("num")} />
        <SelectField label="Тип сети" required half value={v.network} onChange={set("network")} options={NETWORK_OPTIONS} placeholder="Выберите тип сети" error={err("network")} />
      </FormGroup>
      <FormGroup title="Устройство">
        <SelectField label="Тип оборудования" required half value={v.kind} onChange={set("kind")} options={KIND_OPTIONS} error={err("kind")} />
        <TextField label="Hostname" required half value={v.host} onChange={set("host")} placeholder={`Например: ${sw ? "sw2.atr2" : "bb1.url2"}`} error={err("host")} />
        <TextField label="IP-адрес управления (X.X.X.X/Y)" required half value={v.ip} onChange={set("ip")} error={err("ip")} />
        <TextField label="Модель оборудования" required half value={v.model} onChange={set("model")} placeholder={`Например: ${sw ? "X440-24t" : "CISCO3845"}`} error={err("model")} />
        {text("os", "Тип ОС / версия прошивки", "Например: IOS-XE 16.9")}
        {text("serial", "Серийный номер S/N", "S/N с шильдика")}
      </FormGroup>
      {/* TODO(API): комплектация — отдельная таблица; пока хранится только в записи на странице */}
      <FormGroup title="Комплектация">
        {text("slot", "№ слота", "—", { third: true })}
        {text("board", "Модель платы", "—", { third: true })}
        {text("boardSn", "S/N платы", "—", { third: true })}
        {text("port", "№ порта", "—", { third: true })}
        {text("module", "Тип модуля", "—", { third: true })}
        {text("moduleSn", "S/N модуля", "—", { third: true })}
      </FormGroup>
      <FormGroup title="Ввод и сервис">
        {text("act", "Номер и дата Акта о вводе в эксплуатацию", "Например: № 154 от 12.03.2019", {})}
        {text("contract", "Contract Number (SmartNET)", "Номер контракта")}
        <DateField label="Дата завершения" half value={v.contractEnd} onChange={set("contractEnd")} placeholder="Выберите дату" error={err("contractEnd")} />
        {text("note", "Примечание", "Необязательно", {})}
      </FormGroup>
    </FormPanel>
  )
}
