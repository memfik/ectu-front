"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"

/*
 * 34 ГЭУ — данные раздела. Без API — примеры в памяти вкладки (первые 6 — из макета).
 * API техучёта: /api/gey (/filter, /pasport, /create, /update), удаление — /api/trash/soft-delete/gey.
 */

export type GenUnit = Equip<{
  model: string
  /** Мощность «кВА/кВт» («5,5», «150kVA/120kW») */
  power: string
  /** Топливо: «бензин», «дизель», «газ» */
  fuel: string
  serial: string
  phases: string
  engine: string
  generator: string
  /** Ёмкость бака, л */
  tank: string
  execution: string
  mobility: string
  /** Степень автоматизации I–IV */
  automation: string
  /** Год ввода в эксплуатацию */
  since: string
}>

export const GEN_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const genStatus = (x: GenUnit) => GEN_STATUS[x.status] ?? ["—", "muted" as Tone]

export const FUELS = ["бензин", "дизель", "газ"]
export const PHASES = ["1", "3"]
export const GENERATORS = ["синхронный", "асинхронный"]
export const EXECUTIONS = ["открытое", "в кожухе", "в контейнере"]
export const MOBILITY = ["стационарный", "передвижной"]
export const AUTOMATION = ["I", "II", "III", "IV"]

export const genName = (x: GenUnit) => `ГЭУ · ${x.f.model}`
export const genSub = (x: GenUnit) => `${x.nodeCode} · ${x.f.power}`

const SEED: Record<string, Val>[] = [
  {
    num: 7,
    branch: "УФ",
    nodeCode: "url002.01.UF",
    model: "ТЕМП БЭ 6500",
    power: "5,5",
    fuel: "бензин",
    serial: "QF1104220251",
    phases: "1",
    engine: "4-х тактный, одноцилиндровый",
    generator: "синхронный",
    tank: "25",
    execution: "открытое",
    mobility: "передвижной",
    automation: "I",
    since: "2011",
  },
  { num: 8, branch: "УФ", nodeCode: "url002.01.UF", model: "Etalon/ SPG 6500", power: "5,5", fuel: "бензин" },
  { num: 2, branch: "АС", model: "FG Wilson P150-1", power: "150kVA/120kW", fuel: "дизель", tank: "300", phases: "3" },
  { num: 2, branch: "АФ", model: "Е20ДМА", power: "20кВА", fuel: "дизель", phases: "3" },
  { num: 1, branch: "ВФ", model: "Honda Elemax SH5000DX", power: "5/3,8", fuel: "бензин" },
  { num: 1, branch: "ШФ", model: "Honda Elemax SH 7000 dx", power: "5,6 кВA", fuel: "бензин" },
]

export const genUnits = createSource<GenUnit>({
  key: "gen",
  title: "ГЭУ",
  name: genName,
  seed: () =>
    seedEquip({
      key: "gen",
      total: 139,
      statuses: Object.keys(GEN_STATUS),
      seed: SEED,
      gen: (i, r) => {
        const diesel = r() > 0.45
        return {
          num: i + 1,
          model: diesel
            ? pick(r, ["FG Wilson P18-6", "FG Wilson P150-1", "Е20ДМА", "SDMO J22", "Gesan DPAS 22"])
            : pick(r, ["ТЕМП БЭ 6500", "Honda Elemax SH5000DX", "Etalon/ SPG 6500", "Huter DY6500L"]),
          power: diesel ? pick(r, ["18кВА/14кВт", "22кВА/17,6кВт", "20кВА", "150kVA/120kW"]) : pick(r, ["5,5", "5/3,8", "5,6 кВA"]),
          fuel: diesel ? "дизель" : "бензин",
          serial: `QF${num(r, 1000000000, 9999999999)}`,
          phases: diesel ? "3" : "1",
          engine: diesel ? pick(r, ["Perkins 404D-22G", "Perkins 1106A-70TG1", "Mitsubishi S4S"]) : "4-х тактный, одноцилиндровый",
          generator: "синхронный",
          tank: diesel ? pick(r, ["60", "120", "300"]) : pick(r, ["15", "25"]),
          execution: diesel ? pick(r, ["в кожухе", "в контейнере"]) : "открытое",
          mobility: diesel ? pick(r, ["стационарный", "стационарный", "передвижной"]) : "передвижной",
          automation: diesel ? pick(r, ["II", "II", "III"]) : "I",
          since: String(num(r, 2008, 2024)),
        }
      },
    }),
  remote: genApi<GenUnit["f"]>({
    base: "/api/gey",
    trashKey: "gey",
    fields: {
      model: "equipment_model",
      serial: "serial_number",
      power: "power_kva",
      fuel: "fuel_type",
      phases: "phases_count",
      engine: "engine_type",
      generator: "generator_type",
      tank: "fuel_tank_capacity",
      execution: "execution",
      mobility: "mobility",
      automation: "automation_level",
      since: "commissioning_date",
    },
    filter: { model: "equipment_model", fuel: "fuel_type" },
  }),
})

export const useGenUnits = genUnits.useAll
export const useGenUnit = genUnits.useRecord

export const blankGenUnit = (): GenUnit =>
  blankEquip("work", {
    model: "",
    power: "",
    fuel: "",
    serial: "",
    phases: "",
    engine: "",
    generator: "",
    tank: "",
    execution: "",
    mobility: "",
    automation: "",
    since: "",
  })

/** Колонки отчёта и аналитики заполненности — все поля ГЭУ. */
export const genColumns: ReportCol<GenUnit>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "model", t: "Модель", value: (x) => x.f.model },
  { k: "power", t: "Мощность", value: (x) => x.f.power },
  { k: "fuel", t: "Топливо", value: (x) => x.f.fuel },
  { k: "serial", t: "S/N", value: (x) => x.f.serial },
  { k: "phases", t: "Кол-во фаз", value: (x) => x.f.phases },
  { k: "engine", t: "Тип двигателя", value: (x) => x.f.engine },
  { k: "generator", t: "Генератор", value: (x) => x.f.generator },
  { k: "tank", t: "Емкость бака, литров", value: (x) => x.f.tank },
  { k: "execution", t: "Исполнение", value: (x) => x.f.execution },
  { k: "mobility", t: "Степень подвижности", value: (x) => x.f.mobility },
  { k: "automation", t: "Степень автоматизации (I-IV)", value: (x) => x.f.automation },
  { k: "since", t: "Дата ввода в эксплуатацию", value: (x) => x.f.since },
]

const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Импорт Excel: поля — как в форме. */
export const genImport: ImportSpec<GenUnit> = {
  key: "gen",
  title: "ГЭУ",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "model", t: "Модель" },
    { k: "power", t: "Мощность" },
    { k: "fuel", t: "Топливо", opts: opts(FUELS) },
    { k: "serial", t: "S/N" },
    { k: "phases", t: "Кол-во фаз", opts: opts(PHASES) },
    { k: "engine", t: "Тип двигателя" },
    { k: "generator", t: "Генератор", opts: opts(GENERATORS) },
    { k: "tank", t: "Емкость бака, литров" },
    { k: "execution", t: "Исполнение", opts: opts(EXECUTIONS) },
    { k: "mobility", t: "Степень подвижности", opts: opts(MOBILITY) },
    { k: "automation", t: "Степень автоматизации (I-IV)", opts: opts(AUTOMATION) },
    { k: "since", t: "Дата ввода в эксплуатацию" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(GEN_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankGenUnit(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: {
          ...x.f,
          model: str("model"),
          power: str("power"),
          fuel: str("fuel"),
          serial: str("serial"),
          phases: str("phases"),
          engine: str("engine"),
          generator: str("generator"),
          tank: str("tank"),
          execution: str("execution"),
          mobility: str("mobility"),
          automation: str("automation"),
          since: str("since"),
        },
      },
      Number(v.nodeId),
    )
  },
  name: genName,
  all: genUnits.all,
  nextId: genUnits.nextId,
  save: genUnits.save,
}

/* ---------- паспорт ---------- */

/** Поле ГЭУ строкой (пустое — `d`). */
export const genField = (x: GenUnit, k: keyof GenUnit["f"], d = "—") => String(x.f[k] ?? d)

/**
 * Документы, фото и история ГЭУ (общий шаблон оборудования). TODO(API): документы и история — пока примеры по номеру записи.
 */
export const genDetail = (x: GenUnit): LineDetail =>
  lineDetail(x, {
    section: "gen",
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
    lastEdit: (_, r) => ["Изменена «Степень автоматизации»", "I", genField(r as GenUnit, "automation")],
  })
