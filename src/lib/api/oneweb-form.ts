"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 42 Форма учёта OneWeb — станции из мониторинга OneWeb (в старом фронте — `oneweb-monitor`, РФ-ДИППП-08).
 * TODO(API): эндпоинт списка станций мониторинга не найден в techaccaunt_front — пока только примеры в памяти вкладки.
 */

export type OneWebStation = Equip<{
  /** Название станции («SHI-012») */
  station: string
  serial: string
  ip: string
  /** «Широта, долгота» */
  coords: string
  imei: string
}>

export const STATION_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  idle: ["Простой", "warn"],
  never: ["Не запускалась", "muted"],
}
export const stationStatus = (x: OneWebStation) => STATION_STATUS[x.status] ?? ["—", "muted" as Tone]

export const stationName = (x: OneWebStation) => String(x.f.station)
export const stationSub = (x: OneWebStation) => `${x.f.serial} · ${x.f.ip}`

const SEED: Record<string, Val>[] = [
  { branch: "ЮФ", station: "SHI-012", serial: "HL1120-88231", imei: "35 881231 004412 7", ip: "100.64.12.18", coords: "44.1712, 66.7412", status: "work" },
  { branch: "ЮФ", station: "ZHN-004", serial: "HL1120-77120", imei: "35 881231 007120 2", ip: "100.64.12.40", coords: "44.7311, 66.7052", status: "work" },
  { branch: "ВФ", station: "KRK-002", serial: "OW50L-11823", imei: "35 881231 011823 9", ip: "100.64.18.2", coords: "49.4071, 75.4721", status: "work" },
  { branch: "ВФ", station: "AKS-019", serial: "HL1120-90011", imei: "35 881231 090011 4", ip: "100.64.18.90", coords: "47.7601, 82.8102", status: "work" },
]

export const onewebStations = createSource<OneWebStation>({
  key: "oneweb-form",
  title: "Форма учёта OneWeb",
  name: stationName,
  seed: () =>
    seedEquip({
      key: "oneweb-form",
      total: 442,
      statuses: Object.keys(STATION_STATUS),
      seed: SEED,
      gen: (i, r, n) => {
        const st = r() > 0.82 ? pick(r, ["idle", "idle", "never"]) : "work"
        return {
          num: i + 1,
          station: `${n.code.slice(0, 3).toUpperCase()}-${String(num(r, 1, 40)).padStart(3, "0")}`,
          serial: `${pick(r, ["HL1120", "HL1120", "OW50L"])}-${num(r, 10000, 99999)}`,
          imei: `35 881231 ${num(r, 100000, 999999)} ${num(r, 0, 9)}`,
          ip: `100.64.${num(r, 10, 30)}.${num(r, 2, 250)}`,
          coords: `${n.ll[0].toFixed(4)}, ${n.ll[1].toFixed(4)}`,
          status: st,
        }
      },
    }),
})

export const useOneWebStations = onewebStations.useAll
export const useOneWebStation = onewebStations.useRecord

export const blankStation = (): OneWebStation => blankEquip("work", { station: "", serial: "", ip: "", coords: "", imei: "" })

/** Колонки отчёта и аналитики заполненности — все поля станции. */
export const stationColumns: ReportCol<OneWebStation>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "station", t: "Название станции", value: (x) => x.f.station },
  { k: "serial", t: "Серийный номер", value: (x) => x.f.serial },
  { k: "ip", t: "IP-адрес", value: (x) => x.f.ip },
  { k: "coords", t: "Широта, долгота", value: (x) => x.f.coords },
  { k: "imei", t: "IMEI", value: (x) => x.f.imei },
]

/** Импорт Excel: поля — как в форме. */
export const stationsImport: ImportSpec<OneWebStation> = {
  key: "oneweb-form",
  title: "Форма учёта OneWeb",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "station", t: "Название станции", required: true },
    { k: "serial", t: "Серийный номер", required: true },
    { k: "ip", t: "IP-адрес" },
    { k: "coords", t: "Широта, долгота" },
    { k: "imei", t: "IMEI", required: true },
    { k: "status", t: "Статус", required: true, opts: Object.entries(STATION_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankStation(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, station: str("station"), serial: str("serial"), ip: str("ip"), coords: str("coords"), imei: str("imei") },
      },
      Number(v.nodeId),
    )
  },
  name: stationName,
  all: onewebStations.all,
  nextId: onewebStations.nextId,
  save: onewebStations.save,
}

/* ---------- паспорт ---------- */

/**
 * Документы, фото и история станции (общий шаблон оборудования). TODO(API): документы и история — пока примеры по номеру записи.
 */
export const stationDetail = (x: OneWebStation): LineDetail =>
  lineDetail(x, {
    section: "oneweb-form",
    point: (i) => `Плата ${i + 1}`,
    count: () => ({ total: 0, a: 0, b: 0 }),
    ends: (r, a) => [
      { code: r.nodeCode, title: a ? a.object : r.nodeCode, nodeId: a?.id },
      { code: "—", title: "—" },
    ],
    inputDocs: [
      { t: "Паспорт оборудования", n: "PDF" },
      { t: "Акт ввода", n: "есть" },
      { t: "Фото", n: "6" },
    ],
    docs: [
      { name: "Паспорт оборудования", req: "PDF · производитель", uploaded: true },
      { name: "Номер и дата акта о вводе в эксплуатацию", req: "№ 154 от 12.03.2019", uploaded: true },
      { name: "Распоряжение / наряд", req: "№ 007-р", uploaded: true },
      { name: "Схема подключения", req: "—", uploaded: false },
    ],
    lastEdit: () => ["Изменён IP-адрес", "100.64.12.17", "100.64.12.18"],
  })
