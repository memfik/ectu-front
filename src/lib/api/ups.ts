"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 33 ИБП — данные раздела. Без API — примеры в памяти вкладки (первые 3 — из макета).
 * API техучёта: /api/ibp (/filter, /pasport, /create, /update), удаление — /api/trash/soft-delete/ibp_equipments.
 */

export type Ups = Equip<{
  /** Модель UPS */
  model: string
  /** Мощность «кВА/кВт» («1/0,9») */
  power: string
  /** Дата замены АБ («24.09.2024», «2023» или «—») */
  battery: string
  /** Классификация: «Онлайн», «Линейно-интерактивный», «Резервный» */
  cls: string
  serial: string
}>

export const UPS_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const upsStatus = (x: Ups) => UPS_STATUS[x.status] ?? ["—", "muted" as Tone]

export const UPS_CLASSES = ["Онлайн", "Линейно-интерактивный", "Резервный"]

export const upsName = (x: Ups) => `ИБП · ${x.f.model}`
export const upsSub = (x: Ups) => `${x.nodeCode} · ${x.f.power}`

const SEED: Record<string, Val>[] = [
  { num: 33, branch: "УФ", nodeCode: "url002.01.UF", model: "Delta 60kVa HPH-Series", power: "60", battery: "24.09.2024", cls: "Онлайн" },
  { num: 16, branch: "ВФ", model: "Delta RT-1K", power: "1/0,9", battery: "2023", cls: "Онлайн" },
  { num: 7, branch: "ЮФ", model: "UPS SVC, V650F-LCD", power: "3/2,7", battery: "—", cls: "Линейно-интерактивный" },
]

export const ups = createSource<Ups>({
  key: "ups",
  title: "ИБП",
  name: upsName,
  seed: () =>
    seedEquip({
      key: "ups",
      total: 584,
      statuses: Object.keys(UPS_STATUS),
      seed: SEED,
      gen: (i, r) => ({
        num: i + 1,
        model: pick(r, ["Delta Amplon RT-10k", "Delta RT-1K", "APC SRT 3000", "NetPro", "SVC V650F-LCD"]),
        power: pick(r, ["1/0,9", "3/2,7", "10kVA/9kW", "30kVA/30кВт", "60"]),
        battery: r() > 0.3 ? `${String(num(r, 1, 28)).padStart(2, "0")}.${String(num(r, 1, 12)).padStart(2, "0")}.${num(r, 2019, 2025)}` : "—",
        cls: pick(r, ["Онлайн", "Онлайн", "Линейно-интерактивный", "Резервный"]),
        serial: `UPS${num(r, 10000, 99999)}`,
      }),
    }),
  remote: genApi<Ups["f"]>({
    base: "/api/ibp",
    trashKey: "ibp_equipments",
    fields: { model: "ups_model", power: "power_kva", battery: "battery_replacement_date", cls: "classification", serial: "serial_number" },
    filter: { cls: "classification", model: "ups_model" },
  }),
})

export const useUpsList = ups.useAll
export const useUps = ups.useRecord

export const blankUps = (): Ups => blankEquip("work", { model: "", power: "", battery: "", cls: "", serial: "" })

/** Колонки отчёта и аналитики заполненности — все поля ИБП. */
export const upsColumns: ReportCol<Ups>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "model", t: "Модель UPS", value: (x) => x.f.model },
  { k: "power", t: "Мощность", value: (x) => x.f.power },
  { k: "battery", t: "Замена АБ", value: (x) => x.f.battery },
  { k: "cls", t: "Классификация", value: (x) => x.f.cls },
  { k: "serial", t: "S/N", value: (x) => x.f.serial },
]

/** Импорт Excel: поля — как в форме. */
export const upsImport: ImportSpec<Ups> = {
  key: "ups",
  title: "ИБП",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "model", t: "Модель UPS" },
    { k: "power", t: "Мощность" },
    { k: "battery", t: "Замена АБ" },
    { k: "cls", t: "Классификация", opts: UPS_CLASSES.map((v) => ({ v, label: v })) },
    { k: "serial", t: "S/N" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(UPS_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankUps(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, model: str("model"), power: str("power"), battery: str("battery"), cls: str("cls"), serial: str("serial") },
      },
      Number(v.nodeId),
    )
  },
  name: upsName,
  all: ups.all,
  nextId: ups.nextId,
  save: ups.save,
}

/* ---------- паспорт ---------- */

/** Дата последней замены АБ. */
export const upsReplaced = (x: Ups) => String(x.f.battery ?? "—")

/**
 * Документы, фото и история ИБП (общий шаблон оборудования). TODO(API): документы и история — пока примеры по номеру записи.
 */
export const upsDetail = (x: Ups): LineDetail =>
  lineDetail(x, {
    section: "ups",
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
    lastEdit: (_, r) => ["Изменена «Дата последней замены АБ»", "12.02.2021", upsReplaced(r as Ups)],
  })
