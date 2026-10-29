"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, km, nodeOptions, num, obj, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi } from "./helpers"
import { createSource } from "./source"
import { lineDetail, parseKm, usTitle, type LineDetail } from "@/sections/lines/detail"

/*
 * 09 Кабельная канализация — данные раздела. Без API — примеры в памяти вкладки (первые 4 участка из макета).
 * API техучёта: /api/kk, удаление — /api/trash/soft-delete/kk.
 */

export type CableDuct = Equip<{
  name: string
  /** Колодцев */
  wells: Val
  /** Длина, м («519,70») */
  len: string
  /** Каналов */
  channels: Val
  /** Прокол: «Да» / «Нет» */
  puncture: string
  desc: string
}>

export const CABLE_DUCT_STATUS: Record<string, [string, Tone]> = {
  work: ["В эксплуатации", "ok"],
  off: ["Выведен", "bad"],
}
export const cableDuctStatus = (x: CableDuct) => CABLE_DUCT_STATUS[x.status] ?? ["—", "muted" as Tone]

export const PUNCTURE = ["Да", "Нет"]

export const cableDuctName = (x: CableDuct) => `КК №${x.num}`
export const cableDuctSub = (x: CableDuct) => `${x.f.name} · ${x.f.len} м`

const SEED = [
  { num: 7, branch: "УФ", name: "ПЧ-11 - УС Аксай - АТС-3 (промзона Аксай)", wells: 8, len: "519,70", channels: 1, puncture: "Да" },
  { num: 5, branch: "УФ", name: "колодец № 1 ул. М.Маметовой - ТД «Нафта»", wells: 4, len: "108,00", channels: 1, puncture: "Да" },
  { num: 66, branch: "АС", name: "Шоссе Коргальжин от колодца 01-01 до колодца 01-09", wells: 8, len: "547,93", channels: 4, puncture: "Нет" },
  { num: 1, branch: "МФ", name: "УС Тениз - гост. Holiday Inn", wells: 12, len: "781", channels: 1, puncture: "Да" },
]

export const cableDucts = createSource<CableDuct>({
  key: "cable-ducts",
  title: "Кабельная канализация",
  name: cableDuctName,
  seed: () =>
    seedEquip({
      key: "cable-ducts",
      total: 116,
      statuses: Object.keys(CABLE_DUCT_STATUS),
      seed: SEED,
      gen: (i, r, n) => ({
        num: String(i + 1),
        name: `${obj(n)} - ${pick(r, ["АТС-3", "ТД", "колодец № 1", "БЦ"])}`,
        wells: num(r, 2, 14) as Val,
        len: km(r, 80, 900),
        channels: num(r, 1, 6) as Val,
        puncture: r() > 0.5 ? "Да" : "Нет",
        desc: "Одноканальная кабельная канализация",
      }),
    }),
  remote: genApi<CableDuct["f"]>({
    base: "/api/kk",
    trashKey: "kk",
    fields: {
      name: "section_name",
      wells: "well_count",
      len: "length",
      channels: "channel_count",
      puncture: "puncture",
      desc: "description",
    },
  }),
})

export const useCableDucts = cableDucts.useAll
export const useCableDuct = cableDucts.useRecord

export const blankCableDuct = (): CableDuct => blankEquip("work", { name: "", wells: "", len: "", channels: "", puncture: "", desc: "" })

/** Колонки отчёта и аналитики заполненности — все поля участка. */
export const cableDuctColumns: ReportCol<CableDuct>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "name", t: "Наименование участка", value: (x) => x.f.name },
  { k: "wells", t: "Колодцев", value: (x) => x.f.wells },
  { k: "len", t: "Длина, м", value: (x) => x.f.len },
  { k: "channels", t: "Каналов", value: (x) => x.f.channels },
  { k: "puncture", t: "Прокол", value: (x) => x.f.puncture },
  { k: "desc", t: "Описание", value: (x) => x.f.desc },
]

/** Импорт Excel: поля — как в форме. */
export const cableDuctsImport: ImportSpec<CableDuct> = {
  key: "cable-ducts",
  title: "Кабельная канализация",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "name", t: "Наименование участка" },
    { k: "wells", t: "Колодцев" },
    { k: "len", t: "Длина, м" },
    { k: "channels", t: "Каналов" },
    { k: "puncture", t: "Прокол", opts: PUNCTURE.map((v) => ({ v, label: v })) },
    { k: "desc", t: "Описание" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(CABLE_DUCT_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankCableDuct(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, name: str("name"), wells: str("wells"), len: str("len"), channels: str("channels"), puncture: str("puncture"), desc: str("desc") },
      },
      Number(v.nodeId),
    )
  },
  name: cableDuctName,
  all: cableDucts.all,
  nextId: cableDucts.nextId,
  save: cableDucts.save,
}

/* ---------- паспорт ---------- */

/** Каналы из записи: всего (не меньше 4), занято (a) — все, кроме одного. */
export function cableDuctCount(x: CableDuct) {
  const total = Math.max(4, Number(x.f.channels) || 4)
  return { total, a: total - 1, b: 0 }
}

/** Колодец по порядку: К-110, К-112… */
export const well = (i: number) => `К-${110 + i * 2}`

/**
 * Участки между колодцами, каналы, документы, история. Длина участка в записи — в метрах.
 * TODO(API): колодцы и каналы — нет в /api/kk; документы и история — пока примеры по номеру записи.
 */
export const cableDuctDetail = (x: CableDuct): LineDetail =>
  lineDetail(x, {
    section: "cable-ducts",
    point: (i) => well(i + 1),
    pointsOf: (r) => Math.min(6, Math.max(1, (Number(r.f.wells) || 6) - 2)),
    length: (r) => parseKm(r.f.len) / 1000,
    count: (r) => cableDuctCount(r as CableDuct),
    ends: (r, a, b) => [
      { code: a?.code ?? r.nodeCode, title: a ? usTitle(a) : "колодец", nodeId: a?.id },
      { code: b?.code ?? "—", title: b ? usTitle(b) : "УС «РТПЦ»", nodeId: b?.id },
    ],
    inputDocs: [
      { t: "Документ о вводе", n: "Акт № 33" },
      { t: "ТУ", n: "№ 88 от 2011" },
      { t: "Договор аренды", n: "ТОО «Казтелепорт»" },
    ],
    docs: [
      { name: "Документ о вводе в эксплуатацию", req: "Акт № 33 от 14.06.2011", uploaded: true },
      { name: "Реквизиты технических условий (ТУ)", req: "№ 88 от 2011", uploaded: true },
      { name: "Основание (номер договора, письмо)", req: "Договор № 2024/14", uploaded: true },
    ],
    lastEdit: (_, r) => {
      const n = Number(r.f.wells) || 6
      return ["Изменено «Кол-во колодцев»", String(n - 1), String(n)]
    },
  })
