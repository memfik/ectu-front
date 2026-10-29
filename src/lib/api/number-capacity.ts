"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pair, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi, pairOf, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 21 Номерная ёмкость — данные раздела (без карты). Без API — примеры в памяти вкладки.
 * API техучёта: /api/phone_number_capacities (id-параметр `phone_id`), удаление — /api/trash/soft-delete/phone_capacities.
 */

export type NumberCapacity = Equip<{
  /** «7172 · 220000–689999» — код и диапазон */
  code: string
  town: string
  /** «монтировано / ресурс» */
  mounted: string
  /** Задействовано номеров (в примерах — число, из формы — строка) */
  used: Val
  /** ОПТС / АМТС / резерв */
  kind: string
  /** Реквизиты ТУ и Приказа Регулятора */
  tu: string
}>

/** Статусы оборудования (без своих у раздела). */
export const NUMBER_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const numberStatus = (x: NumberCapacity) => NUMBER_STATUS[x.status] ?? ["—", "muted" as Tone]

export const KINDS = ["ОПТС", "АМТС", "резерв"]

/** Код без диапазона: «7172». */
export const numberCode = (x: NumberCapacity) => String(x.f.code ?? "—").split(" · ")[0]
export const numberName = (x: NumberCapacity) => `Код ${String(x.f.code).split(" ·")[0]}`
export const numberSub = (x: NumberCapacity) => `${x.f.code} · ${x.f.town}`

export const numberCapacities = createSource<NumberCapacity>({
  key: "number-capacity",
  title: "Номерная ёмкость",
  name: numberName,
  seed: () =>
    seedEquip({
      key: "number-capacity",
      total: 112,
      statuses: Object.keys(NUMBER_STATUS),
      gen: (i, r, n) => {
        const code = pick(r, ["7172", "7273", "7112", "7292", "7252", "7212"])
        const res = pick(r, [10000, 20000, 50000])
        const m = Math.round(res * (0.4 + r() * 0.5))
        return {
          num: `${num(r, 1, 6)}.${num(r, 1, 120)}`,
          code: `${code} · ${num(r, 20, 59)}0000–${num(r, 60, 99)}9999`,
          town: n.city,
          mounted: `${m} / ${res}`,
          used: Math.round(m * (0.6 + r() * 0.3)) as Val,
          kind: pick(r, ["ОПТС", "ОПТС", "АМТС", "резерв"]),
          tu: `ТУ № 18-04/${num(r, 1000, 2999)}, Приказ № ${num(r, 100, 499)}`,
        }
      },
    }),
  remote: genApi<NumberCapacity["f"]>({
    base: "/api/phone_number_capacities",
    idParam: "phone_id",
    trashKey: "phone_capacities",
    fields: {
      code: (o) => `${s(o, "allocated_code")} · ${s(o, "allocated_start")}–${s(o, "allocated_end")}`,
      town: "city_or_region",
      mounted: pairOf("mounted_resource", "allocated_resource"),
      used: "used_resource",
      tu: "regulator_order_number_date_issuer",
    },
  }),
})

export const useNumberCapacities = numberCapacities.useAll
export const useNumberCapacity = numberCapacities.useRecord

export const blankNumberCapacity = (): NumberCapacity => blankEquip("work", { code: "", town: "", mounted: "", used: "", kind: "", tu: "" })

/** «71000 / 100000» или «—» — иначе ошибка формата. */
export const checkPair = (v: string) => (pair(v) || v === "—" ? undefined : "Формат: 8 / 24")

/** Колонки отчёта и аналитики заполненности. */
export const numberCapacityColumns: ReportCol<NumberCapacity>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "code", t: "Код и диапазон", value: (x) => x.f.code },
  { k: "town", t: "Город / область", value: (x) => x.f.town },
  { k: "mounted", t: "Монтировано / ресурс", value: (x) => x.f.mounted },
  { k: "used", t: "Задействовано", value: (x) => x.f.used },
  { k: "kind", t: "Назначение", value: (x) => x.f.kind ?? "—" },
  { k: "tu", t: "Реквизиты ТУ и Приказа Регулятора", value: (x) => x.f.tu },
]

/** Импорт Excel: поля — как в форме (узел связи необязателен — у раздела нет карты). */
export const numberCapacityImport: ImportSpec<NumberCapacity> = {
  key: "number-capacity",
  title: "Номерная ёмкость",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", opts: nodeOptions() },
    { k: "code", t: "Код и диапазон" },
    { k: "town", t: "Город / область" },
    { k: "mounted", t: "Монтировано / ресурс", check: checkPair },
    { k: "used", t: "Задействовано" },
    { k: "kind", t: "Назначение", opts: KINDS.map((v) => ({ v, label: v })) },
    { k: "tu", t: "Реквизиты ТУ и Приказа Регулятора" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(NUMBER_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankNumberCapacity(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, code: str("code"), town: str("town"), mounted: str("mounted"), used: str("used"), kind: str("kind"), tu: str("tu") },
      },
      Number(v.nodeId),
    )
  },
  name: numberName,
  all: numberCapacities.all,
  nextId: numberCapacities.nextId,
  save: numberCapacities.save,
}

/* ---------- паспорт ---------- */

/** Начало и конец диапазона из «7172 · 220000–689999». */
export const numberRange = (x: NumberCapacity) => {
  const [a = "", b = ""] = (String(x.f.code ?? "").split(" · ")[1] ?? "").split("–")
  return { a, b }
}
/** Ресурс, монтировано, задействовано, свободно. */
export const numberCounts = (x: NumberCapacity) => {
  const [mounted, res] = String(x.f.mounted ?? "0 / 0")
    .split(" / ")
    .map(Number)
  const used = Number(x.f.used) || 0
  return { res: res || 0, mounted: mounted || 0, used, free: Math.max(0, (mounted || 0) - used) }
}
/** Распределение задействованных номеров (num-t2). TODO(API): клиенты / служебные / оператору — нет в API. */
export const numberShares = (x: NumberCapacity) => {
  const { mounted, used } = numberCounts(x)
  return [
    { t: "Клиенты", m: Math.round(mounted * 0.75), z: Math.round(used * 0.78), color: "#0d5bff" },
    { t: "Служебные нужды", m: Math.round(mounted * 0.1), z: Math.round(used * 0.1), color: "#22d3ee" },
    { t: "Выдано оператору связи", m: Math.round(mounted * 0.15), z: Math.round(used * 0.12), color: "#a78bfa" },
  ]
}
/** Станции в ёмкости: две станции и резерв, диапазоны делят монтированное. TODO(API): оборудование в ёмкости. */
export const numberStations = (x: NumberCapacity) => {
  const { a } = numberRange(x)
  const { mounted, used } = numberCounts(x)
  const start = Number(a) || 220000
  const s1 = Math.round(mounted * 0.66)
  const s2 = mounted - s1
  return [
    { eq: "Iskratel SI 2000", sub: "АТС-21", type: "Цифровая", from: start, to: start + s1 - 1, z: Math.round(used * 0.73), owner: "QMobile", note: "" },
    { eq: "Huawei UA5000", sub: "АТС-14", type: "MSAN", from: start + s1, to: start + mounted - 1, z: used - Math.round(used * 0.73), owner: "QMobile", note: "" },
    { eq: "Резерв", sub: "", type: "—", from: start + mounted, to: start + mounted + Math.max(0, s2 - 1), z: 0, owner: "—", note: "резерв под SIP" },
  ]
}

const n0 = (v: number) => v.toLocaleString("ru-RU")

/** Концы (узел), документы и история кода — примеры по номеру записи. */
export const numberCapacityDetail = (x: NumberCapacity): LineDetail =>
  lineDetail(x, {
    section: "number-capacity",
    point: (i) => `Станция ${i + 1}`,
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
      const used = numberCounts(r as NumberCapacity).used
      return ["Изменено «Задействовано номеров»", n0(used - 40), n0(used)]
    },
  })
