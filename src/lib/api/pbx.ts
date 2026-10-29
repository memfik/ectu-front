"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, obj, pair, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi, pairOf } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 20 АТС — данные раздела. Без API — примеры в памяти вкладки (первые 6 станций из макета).
 * API техучёта: /api/phone_station (id-параметр `equipment_id`), удаление — /api/trash/soft-delete/phone_stations.
 */

export type Pbx = Equip<{
  /** Объект связи («УС «Уральск Центральный»») */
  object: string
  model: string
  /** Ёмкость «задействовано / монтировано», портов */
  capacity: string
  /** Кол-во ОТА (в примерах — число, из формы — строка) */
  ota: Val
  network: string
}>

/** Статусы оборудования (без своих у раздела). */
export const PBX_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const pbxStatus = (x: Pbx) => PBX_STATUS[x.status] ?? ["—", "muted" as Tone]

export const NETWORKS = ["ГМС", "ГРС", "ГАС", "МС"]

export const pbxName = (x: Pbx) => `АТС ${x.nodeCode}`
export const pbxSub = (x: Pbx) => `${x.f.model} · ${x.f.object}`

const SEED = [
  { num: 2, branch: "УФ", object: "УС «Уральск Центральный»", nodeCode: "url002.01.UF", model: "Iskratel SI3000 CS (MEA)", capacity: "843 / 2175", ota: 736 },
  { num: 5, branch: "ЗФ", object: "УС Атырау", model: "SSW Si3000 Iskratel", capacity: "7460 / 12200", ota: 7375 },
  { num: 1, branch: "МФ", object: "УС Актау", model: "SI 2000 МСА (АМТС/ОПТС)", capacity: "20 / 559", ota: 20 },
  { num: 7, branch: "АФ", object: "БЦ «Қазына»", model: "Iskratel SI2000 MSAN", capacity: "2 / 128", ota: 5 },
  { num: 2, branch: "ЮФ", object: "БЦ «Sirius»", model: "Panasonic KX-TDA600", capacity: "85 / 256", ota: 11 },
  { num: 1, branch: "ВФ", object: "УС Павлодар", model: "Iskratel Si-2000 ICS(MLC)", capacity: "263 / 449", ota: 217 },
]

export const pbxs = createSource<Pbx>({
  key: "pbx",
  title: "АТС",
  name: pbxName,
  seed: () =>
    seedEquip({
      key: "pbx",
      total: 222,
      statuses: Object.keys(PBX_STATUS),
      seed: SEED,
      gen: (i, r, n) => {
        const t = pick(r, [128, 256, 449, 1024, 2175])
        const u = Math.round(t * (0.3 + r() * 0.6))
        return {
          num: String(i + 1),
          object: obj(n),
          model: pick(r, ["Iskratel SI3000", "Iskratel SI2000 MSAN", "Panasonic KX-TDA600", "Huawei UA5000"]),
          capacity: `${u} / ${t}`,
          ota: Math.round(u * 0.9) as Val,
          network: n.network,
        }
      },
    }),
  remote: genApi<Pbx["f"]>({
    base: "/api/phone_station",
    trashKey: "phone_stations",
    fields: {
      object: "object_name",
      model: "station_model",
      capacity: pairOf("used_capacity", "mounted_capacity"),
      ota: "ota_count",
      network: "network_type",
    },
    filter: { network: "network_type", model: "station_model" },
  }),
})

export const usePbxs = pbxs.useAll
export const usePbx = pbxs.useRecord

export const blankPbx = (): Pbx => blankEquip("work", { object: "", model: "", capacity: "", ota: "", network: "" })

/** «843 / 2175» или «—» — иначе ошибка формата. */
export const checkPair = (v: string) => (pair(v) || v === "—" ? undefined : "Формат: 8 / 24")

/** Колонки отчёта и аналитики заполненности. */
export const pbxColumns: ReportCol<Pbx>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "object", t: "Объект связи", value: (x) => x.f.object },
  { k: "model", t: "Модель станции", value: (x) => x.f.model },
  { k: "capacity", t: "Ёмкость", value: (x) => x.f.capacity },
  { k: "ota", t: "ОТА", value: (x) => x.f.ota },
  { k: "network", t: "Тип сети", value: (x) => x.f.network },
]

/** Импорт Excel: поля — как в форме. */
export const pbxImport: ImportSpec<Pbx> = {
  key: "pbx",
  title: "АТС",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "object", t: "Объект связи" },
    { k: "model", t: "Модель станции" },
    { k: "capacity", t: "Ёмкость", check: checkPair },
    { k: "ota", t: "ОТА" },
    { k: "network", t: "Тип сети", opts: NETWORKS.map((v) => ({ v, label: v })) },
    { k: "status", t: "Статус", required: true, opts: Object.entries(PBX_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankPbx(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, object: str("object"), model: str("model"), capacity: str("capacity"), ota: str("ota"), network: str("network") },
      },
      Number(v.nodeId),
    )
  },
  name: pbxName,
  all: pbxs.all,
  nextId: pbxs.nextId,
  save: pbxs.save,
}

/* ---------- паспорт ---------- */

/** Ёмкость станции: задействовано / монтировано. */
export const pbxPair = (x: Pbx) => {
  const [a, b] = String(x.f.capacity ?? "0 / 0")
    .split(" / ")
    .map(Number)
  return { used: a || 0, total: b || 0 }
}
/** Порты станции и абоненты: монтировано (m) / задействовано (z). TODO(API): ОТА МГ / МН — нет в /api/phone_station. */
export const pbxCapacity = (x: Pbx) => {
  const { used, total } = pbxPair(x)
  const ota = Number(x.f.ota) || 0
  return [
    { t: "Порты станции", m: total, z: used },
    { t: "ОТА", m: total, z: ota },
    { t: "ОТА с выходом на МГ", m: ota, z: Math.round(ota * 0.89) },
    { t: "ОТА с выходом на МН", m: ota, z: Math.round(ota * 0.33) },
  ]
}
/** Потоки Е1 и порты E&M (примеры). */
export const PBX_E1 = { m: 32, z: 24 }
export const PBX_EM = { m: 24, z: 16 }

/** Концы (узел), документы и история станции — примеры по номеру записи. */
export const pbxDetail = (x: Pbx): LineDetail =>
  lineDetail(x, {
    section: "pbx",
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
    lastEdit: (_, r) => ["Изменено «Кол-во ОТА»", String((Number(r.f.ota) || 1) - 6), String(r.f.ota)],
  })
