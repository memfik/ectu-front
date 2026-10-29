"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, pair, pick, seedEquip, used, withNode, type Equip } from "./equipment"
import { genApi, pairOf } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 24 DWDM — данные раздела. Без API — примеры в памяти вкладки.
 * API техучёта: /api/dwdm-equipments, удаление — /api/trash/soft-delete/dwdm_equipments.
 */

export type DwdmDevice = Equip<{
  model: string
  /** Длины волн «задействовано / монтировано» */
  lambda: string
  /** Направление «Город — город» */
  dir: string
}>

export const DWDM_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const dwdmStatus = (x: DwdmDevice) => DWDM_STATUS[x.status] ?? ["—", "muted" as Tone]

export const dwdmName = (x: DwdmDevice) => `DWDM · ${x.f.model}`
export const dwdmSub = (x: DwdmDevice) => `${x.nodeCode} · ${x.f.dir}`

export const dwdmDevices = createSource<DwdmDevice>({
  key: "dwdm",
  title: "DWDM",
  name: dwdmName,
  seed: () =>
    seedEquip({
      key: "dwdm",
      total: 24,
      statuses: Object.keys(DWDM_STATUS),
      gen: (i, r, n) => ({
        num: i + 1,
        model: pick(r, ["CISCO ONS 15454 (Shelf 3)", "Huawei OptiX OSN 1800 II", "EKINOPS", "Cisco ONS 15454 М6"]),
        lambda: used(r, 40, 0.5),
        dir: `${n.city} — ${pick(r, ["Астана", "Алматы", "Актобе", "Атырау"])}`,
      }),
    }),
  remote: genApi<DwdmDevice["f"]>({
    base: "/api/dwdm-equipments",
    trashKey: "dwdm_equipments",
    fields: { model: "model", lambda: pairOf("lambda_used", "lambda_total"), dir: "direction" },
  }),
})

export const useDwdmDevices = dwdmDevices.useAll
export const useDwdmDevice = dwdmDevices.useRecord

export const blankDwdmDevice = (): DwdmDevice => blankEquip("work", { model: "", lambda: "", dir: "" })

/** «8 / 24» или «—» — иначе ошибка формата. */
export const checkPair = (v: string) => (pair(v) || v === "—" ? undefined : "Формат: 8 / 24")

const v = (x: DwdmDevice, k: keyof DwdmDevice["f"]) => x.f[k] ?? "—"

/** Колонки отчёта и аналитики заполненности — все поля устройства. */
export const dwdmColumns: ReportCol<DwdmDevice>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "model", t: "Модель", value: (x) => v(x, "model") },
  { k: "lambda", t: "λ (З./М.)", value: (x) => v(x, "lambda") },
  { k: "dir", t: "Направление", value: (x) => v(x, "dir") },
]

/** Импорт Excel: поля — как в форме. */
export const dwdmImport: ImportSpec<DwdmDevice> = {
  key: "dwdm",
  title: "DWDM",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "model", t: "Модель" },
    { k: "lambda", t: "λ (З./М.)", check: checkPair },
    { k: "dir", t: "Направление" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(DWDM_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankDwdmDevice(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, model: str("model"), lambda: str("lambda"), dir: str("dir") },
      },
      Number(v.nodeId),
    )
  },
  name: dwdmName,
  all: dwdmDevices.all,
  nextId: dwdmDevices.nextId,
  save: dwdmDevices.save,
}

/* ---------- паспорт ---------- */

/** Длины волн из записи: задействовано (z) и монтировано (m). */
export const dwdmLambda = (x: DwdmDevice) => {
  const [a, b] = String(x.f.lambda ?? "0 / 40")
    .split(" / ")
    .map(Number)
  return { z: a || 0, m: b || 40 }
}
/** Производитель по модели: «Cisco» или первое слово. */
export const dwdmVendor = (x: DwdmDevice) => (/cisco/i.test(String(x.f.model)) ? "Cisco" : String(x.f.model).split(" ")[0])
/** Ёмкость, Тбит/с: «1,6». */
export const dwdmTbit = (x: DwdmDevice) => (dwdmLambda(x).z / 10).toFixed(1).replace(".", ",")

/** Платы и трансиверы. TODO(API): платы, трансиверы, ошибки LOS — нет в /api/dwdm. */
export const DWDM_BOARDS = [
  { slot: "2", board: "M40V (мультиплексор)", sfp: "—", sn: "030RKT11A1", port: "—" },
  { slot: "6", board: "N402 (2×100G)", sfp: "CFP2 100G LR4", sn: "FNS2101AB1", port: "1–2" },
  { slot: "9", board: "TN54 (10×10G)", sfp: "SFP+ 10G LR", sn: "FNS2101CD4", port: "1–10" },
  { slot: "11", board: "TN54 (10×10G)", sfp: "SFP+ 10G ZR", sn: "FNS2101EF7", port: "3 — ошибка" },
]

/**
 * Документы, история и фон-карта паспорта. TODO(API): документы и история — пока примеры по номеру записи.
 */
export const dwdmDetail = (x: DwdmDevice): LineDetail =>
  lineDetail(x, {
    section: "dwdm",
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
      const { z } = dwdmLambda(r as DwdmDevice)
      return ["Изменено «Длин волн занято»", String(Math.max(0, z - 2)), String(z)]
    },
  })
