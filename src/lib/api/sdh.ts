"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pair, pick, seedEquip, used, withNode, type Equip } from "./equipment"
import { genApi, pairOf } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 23 SDH — данные раздела. Без API — примеры в памяти вкладки.
 * API техучёта: /api/sdh-equipments, удаление — /api/trash/soft-delete/sdh_equipments.
 */

export type SdhDevice = Equip<{
  model: string
  /** STM-1 «задействовано / монтировано» */
  stm: string
  /** VC-12 «задействовано / монтировано» */
  vc: string
  vendor: string
}>

export const SDH_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const sdhStatus = (x: SdhDevice) => SDH_STATUS[x.status] ?? ["—", "muted" as Tone]

export const sdhName = (x: SdhDevice) => `SDH · ${x.f.model}`
export const sdhSub = (x: SdhDevice) => `${x.nodeCode} · VC-12 ${x.f.vc}`

export const sdhDevices = createSource<SdhDevice>({
  key: "sdh",
  title: "SDH",
  name: sdhName,
  seed: () =>
    seedEquip({
      key: "sdh",
      total: 519,
      statuses: Object.keys(SDH_STATUS),
      gen: (_, r) => ({
        num: `${num(r, 1, 12)}.${num(r, 1, 4)}`,
        model: pick(r, ["CISCO ONS 15454", "CISCO ONS 15305", "SDH S325", "TN-4XE", "FCD-155E/8E1"]),
        stm: used(r, pick(r, [2, 4, 8])),
        vc: used(r, 63, 0.8),
        vendor: pick(r, ["CISCO", "Huawei", "RAD"]),
      }),
    }),
  remote: genApi<SdhDevice["f"]>({
    base: "/api/sdh-equipments",
    trashKey: "sdh_equipments",
    fields: {
      model: "sdh_multiplexer_model",
      stm: pairOf("stm_used", "stm_total"),
      vc: pairOf("vc12_used", "vc12_total"),
      vendor: "vendor",
    },
  }),
})

export const useSdhDevices = sdhDevices.useAll
export const useSdhDevice = sdhDevices.useRecord

export const blankSdhDevice = (): SdhDevice => blankEquip("work", { model: "", stm: "", vc: "", vendor: "" })

/** «8 / 24» или «—» — иначе ошибка формата. */
export const checkPair = (v: string) => (pair(v) || v === "—" ? undefined : "Формат: 8 / 24")

const v = (x: SdhDevice, k: keyof SdhDevice["f"]) => x.f[k] ?? "—"

/** Колонки отчёта и аналитики заполненности — все поля устройства. */
export const sdhColumns: ReportCol<SdhDevice>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "model", t: "Модель", value: (x) => v(x, "model") },
  { k: "stm", t: "STM-1 (З./М.)", value: (x) => v(x, "stm") },
  { k: "vc", t: "VC-12 (З./М.)", value: (x) => v(x, "vc") },
  { k: "vendor", t: "Производитель", value: (x) => v(x, "vendor") },
]

/** Импорт Excel: поля — как в форме. */
export const sdhImport: ImportSpec<SdhDevice> = {
  key: "sdh",
  title: "SDH",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "model", t: "Модель" },
    { k: "stm", t: "STM-1 (З./М.)", check: checkPair },
    { k: "vc", t: "VC-12 (З./М.)", check: checkPair },
    { k: "vendor", t: "Производитель" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(SDH_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankSdhDevice(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, model: str("model"), stm: str("stm"), vc: str("vc"), vendor: str("vendor") },
      },
      Number(v.nodeId),
    )
  },
  name: sdhName,
  all: sdhDevices.all,
  nextId: sdhDevices.nextId,
  save: sdhDevices.save,
}

/* ---------- паспорт ---------- */

/** Ёмкость: тип, монтировано (m), задействовано (z). */
export type CapRow = { t: string; m: number; z: number }

const zm = (v: unknown, d: number) => {
  const [a, b] = String(v ?? `0 / ${d}`)
    .split(" / ")
    .map(Number)
  return { z: a || 0, m: b || d }
}
/** STM-1 и VC-12 из записи: задействовано (z) и монтировано (m). */
export const sdhStm = (x: SdhDevice) => zm(x.f.stm, 8)
export const sdhVc = (x: SdhDevice) => zm(x.f.vc, 252)

/** Ёмкость SDH. TODO(API): STM-4/16, VC-3/4, E1/E3, Ethernet — нет в /api/sdh, пока цифры макета. */
export const sdhCap = (x: SdhDevice): CapRow[] => [
  { t: "STM-1", m: sdhStm(x).m, z: sdhStm(x).z },
  { t: "STM-4", m: 4, z: 2 },
  { t: "STM-16", m: 2, z: 1 },
  { t: "VC-12", m: sdhVc(x).m, z: sdhVc(x).z },
  { t: "VC-3", m: 6, z: 2 },
  { t: "VC-4", m: 4, z: 3 },
  { t: "E1", m: 63, z: Math.min(63, Math.round(sdhVc(x).z * 0.27)) },
  { t: "E3", m: 3, z: 1 },
  { t: "10", m: 8, z: 2 },
  { t: "100", m: 8, z: 6 },
  { t: "1000", m: 4, z: 3 },
]
/** STM-1/4/16 вместе. */
export const sdhStmAll = (x: SdhDevice) =>
  sdhCap(x)
    .slice(0, 3)
    .reduce((s, r) => ({ m: s.m + r.m, z: s.z + r.z }), { m: 0, z: 0 })

/** Платы по слотам. TODO(API): иерархия шасси → платы по parent_id. */
export const SDH_BOARDS = [
  { slot: "1", board: "SL16 (STM-16)", port: "1", sn: "030HJT10A7" },
  { slot: "3", board: "SL4 (STM-4)", port: "1–2", sn: "030HJT11B2" },
  { slot: "7", board: "PQ1 (63×E1)", port: "1–63", sn: "030HJT12C9" },
  { slot: "10", board: "EFS8 (FE)", port: "1–8", sn: "030HJT14E1" },
  { slot: "13", board: "GXCSA (кросс)", port: "—", sn: "030HJT15F3" },
]

/**
 * Документы, история и фон-карта паспорта. TODO(API): документы и история — пока примеры по номеру записи.
 */
export const sdhDetail = (x: SdhDevice): LineDetail =>
  lineDetail(x, {
    section: "sdh",
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
      const { z } = sdhVc(r as SdhDevice)
      return ["Изменено «З. (VC-12)»", String(Math.max(0, z - 4)), String(z)]
    },
  })
