"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pair, pick, seedEquip, used, withNode, type Equip } from "./equipment"
import { genApi, pairOf } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"

/*
 * 22 PDH — данные раздела. Без API — примеры в памяти вкладки (первые 4 устройства — из макета).
 * API техучёта: /api/pdh-equipments, удаление — /api/trash/soft-delete/pdh_equipments.
 */

export type PdhDevice = Equip<{
  model: string
  /** E1 «задействовано / монтировано» */
  e1: string
  client: string
  vendor: string
  serial: string
}>

export const PDH_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const pdhStatus = (x: PdhDevice) => PDH_STATUS[x.status] ?? ["—", "muted" as Tone]

export const pdhName = (x: PdhDevice) => `PDH · ${x.f.model}`
export const pdhSub = (x: PdhDevice) => `${x.nodeCode} · E1 ${x.f.e1}`

const SEED = [
  { num: 1, branch: "МФ", model: "OP-108", e1: "1 / 4", client: "852007701", vendor: "RAD" },
  { num: 3, branch: "МФ", model: "OP-108", e1: "3 / 4", client: "933002594", vendor: "RAD" },
  { num: 7, branch: "АС", model: "FOM-4R-FE-T40", e1: "1 / 4", client: "АС-II00000470", vendor: "Fiberhome" },
  { num: 16, branch: "ЮФ", model: "FMUX01A+", e1: "1 / 4", client: "—", vendor: "Raisecom" },
]

export const pdhDevices = createSource<PdhDevice>({
  key: "pdh",
  title: "PDH",
  name: pdhName,
  seed: () =>
    seedEquip({
      key: "pdh",
      total: 118,
      statuses: Object.keys(PDH_STATUS),
      seed: SEED,
      gen: (i, r) => ({
        num: i + 1,
        model: pick(r, ["OP-108", "RAD Optimux-108", "FMUX01A+", "FOM-4R-FE-T40"]),
        e1: used(r, pick(r, [4, 8, 16])),
        client: String(num(r, 100000000, 999999999)),
        vendor: pick(r, ["RAD", "Raisecom", "Fiberhome"]),
        serial: `PD${num(r, 10000, 99999)}`,
      }),
    }),
  remote: genApi<PdhDevice["f"]>({
    base: "/api/pdh-equipments",
    trashKey: "pdh_equipments",
    node: "node1",
    fields: { model: "model", e1: pairOf("e1_used", "e1_total"), client: "client", vendor: "vendor", serial: "serial_number" },
  }),
})

export const usePdhDevices = pdhDevices.useAll
export const usePdhDevice = pdhDevices.useRecord

export const blankPdhDevice = (): PdhDevice => blankEquip("work", { model: "", e1: "", client: "", vendor: "", serial: "" })

/** «8 / 24» или «—» — иначе ошибка формата. */
export const checkPair = (v: string) => (pair(v) || v === "—" ? undefined : "Формат: 8 / 24")

const v = (x: PdhDevice, k: keyof PdhDevice["f"]) => x.f[k] ?? "—"

/** Колонки отчёта и аналитики заполненности — все поля устройства. */
export const pdhColumns: ReportCol<PdhDevice>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "model", t: "Модель", value: (x) => v(x, "model") },
  { k: "e1", t: "E1 (З./М.)", value: (x) => v(x, "e1") },
  { k: "client", t: "Клиент", value: (x) => v(x, "client") },
  { k: "vendor", t: "Вендор", value: (x) => v(x, "vendor") },
  { k: "serial", t: "S/N", value: (x) => v(x, "serial") },
]

/** Импорт Excel: поля — как в форме. */
export const pdhImport: ImportSpec<PdhDevice> = {
  key: "pdh",
  title: "PDH",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "model", t: "Модель" },
    { k: "e1", t: "E1 (З./М.)", check: checkPair },
    { k: "client", t: "Клиент" },
    { k: "vendor", t: "Вендор" },
    { k: "serial", t: "S/N" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(PDH_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankPdhDevice(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, model: str("model"), e1: str("e1"), client: str("client"), vendor: str("vendor"), serial: str("serial") },
      },
      Number(v.nodeId),
    )
  },
  name: pdhName,
  all: pdhDevices.all,
  nextId: pdhDevices.nextId,
  save: pdhDevices.save,
}

/* ---------- паспорт ---------- */

/** Ёмкость: тип, монтировано (m), задействовано (z). */
export type CapRow = { t: string; m: number; z: number }

/** E1 из записи: задействовано (z) и монтировано (m). */
export const pdhE1 = (x: PdhDevice) => {
  const [a, b] = String(x.f.e1 ?? "0 / 4")
    .split(" / ")
    .map(Number)
  return { z: a || 0, m: b || 4 }
}
/** Ёмкость интерфейсов. TODO(API): E3, Ethernet 10/100/1000 — в /api/pdh их нет, пока цифры макета. */
export const pdhCap = (x: PdhDevice): CapRow[] => [
  { t: "E1", m: pdhE1(x).m, z: pdhE1(x).z },
  { t: "E3", m: 2, z: 1 },
  { t: "10", m: 4, z: 2 },
  { t: "100", m: 4, z: 3 },
  { t: "1000", m: 2, z: 1 },
]
/** Ethernet 10/100/1000 вместе. */
export const pdhEth = (x: PdhDevice) =>
  pdhCap(x)
    .slice(2)
    .reduce((s, r) => ({ m: s.m + r.m, z: s.z + r.z }), { m: 0, z: 0 })
/** TODO(API): клиент, производитель, дата ввода — нет в /api/pdh. */
export const PDH_CLIENT = "АО «КазТрансКом»"

/**
 * Документы, история и фон-карта паспорта. TODO(API): документы и история — пока примеры по номеру записи.
 */
export const pdhDetail = (x: PdhDevice): LineDetail =>
  lineDetail(x, {
    section: "pdh",
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
    lastEdit: (_, r) => {
      const { z } = pdhE1(r as PdhDevice)
      return ["Изменено «З. (E1)»", String(Math.max(0, z - 1)), String(z)]
    },
  })
