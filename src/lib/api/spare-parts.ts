"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { lineDetail, type LineDetail } from "@/lib/api/lines"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi } from "./helpers"
import { createSource } from "./source"

/*
 * 35 ЗИП — данные раздела. Без API — примеры в памяти вкладки (первые 6 позиций из макета).
 * API техучёта: /api/replacements (/filter, /details?id=, /create, /update), удаление — /api/trash/soft-delete/replacements.
 * В примерах МОЛ, получение и замена заполнены не у всех — пустые поля в записи отсутствуют (`undefined`).
 */

export type SparePart = Equip<{
  name: string
  category: string
  /** Инвентарный номер */
  inv: string
  serial: string
  /** Стоимость за ед., тг без НДС («12589.29») */
  cost: string
  /** Принадлежность ЗИП: ГМС, ДЭ, ДППП */
  owner: string
  /** Адрес склада ФО */
  warehouse: string
  mol: string
  molEmail: string
  molPost: string
  molDept: string
  molPhone: string
  /** Реквизиты получения */
  received: string
  /** От кого */
  sender: string
  /** Реквизиты документа замены */
  replaceDoc: string
  /** Кому */
  receiver: string
  /** Адрес узла связи (места установки) */
  siteAddress: string
  eqType: string
  eqId: string
}>

export const SPARE_STATUS: Record<string, [string, Tone]> = {
  stock: ["На складе", "info"],
  issued: ["Выдано", "warn"],
  installed: ["Установлено", "ok"],
}
export const spareStatus = (x: SparePart) => SPARE_STATUS[x.status] ?? ["—", "muted" as Tone]

export const CATEGORIES = ["Оптические модули", "Блоки питания", "Платы", "Радиооборудование", "Шлюзы", "Спутниковое оборудование"]
export const OWNERS = ["ГМС", "ДЭ", "ДППП"]

/** Поле записи или «—» (в примерах поля бывают не заданы). */
export const spareField = (x: SparePart, k: keyof SparePart["f"], d = "—") => String(x.f[k] ?? d)

export const sparePartName = (x: SparePart) => spareField(x, "name")
export const sparePartSub = (x: SparePart) =>
  `инв. № ${spareField(x, "inv")} · ${x.status === "installed" ? `установлено на ${x.nodeCode}` : spareField(x, "warehouse", "склад")}`

const SEED: Record<string, Val>[] = [
  {
    num: 1567,
    branch: "ШФ",
    name: "Шлюз MediaPack 202",
    category: "Оптические модули",
    inv: "ВФ0701062",
    serial: "D04964290",
    cost: "12589.29",
    owner: "ГМС",
    warehouse: "РЦТ г.Шымкент",
    status: "installed",
    replaceDoc: "№ 77-з от 12.09.2026",
    receiver: "Б. Дегтярь",
    siteAddress: "ул. Маметовой 67Б",
    eqType: "СПД коммутатор",
    eqId: "sw1.alm1 · порт 0/25",
  },
  { num: 1568, branch: "ШФ", name: "Шлюз MediaPack 204", category: "Шлюзы", inv: "ВФ0701095", serial: "D04135430", cost: "34558.04" },
  { num: 99, branch: "АФ", name: "Блок питания PS AC/DC 24V/4/16A 100W Au…", category: "Блоки питания", inv: "АФ-IV00100650", serial: "—", cost: "8095.51" },
  { num: 36, name: "Передатчик BUC 4W Ku-band", category: "Спутниковое оборудование", inv: "ВФ-II00001351", serial: "0A11335A5Y", cost: "134158.78" },
  { num: 883, branch: "МФ", name: "Оптический мультиплексор FG-FOM16Е/8 V1…", category: "Платы", inv: "—", serial: "—", cost: "—" },
  { num: 253, branch: "ВФ", name: "Внешний блок ODU радиорелейной станции …", category: "Радиооборудование", inv: "ВФ0701267", serial: "20272", cost: "208474.49" },
]

const GEN_NAMES = [
  ["SFP GLC-LH-SMD 1310nm", "Оптические модули"],
  ["SFP+ 10G-LR", "Оптические модули"],
  ["Блок питания PS AC/DC 48V 150W", "Блоки питания"],
  ["Плата E1 16xE1 Huawei", "Платы"],
  ["Внешний блок ODU Ericsson MINI-LINK", "Радиооборудование"],
  ["Шлюз MediaPack 112", "Шлюзы"],
  ["Передатчик BUC 4W Ku-band", "Спутниковое оборудование"],
] as const

export const spareParts = createSource<SparePart>({
  key: "spare-parts",
  title: "ЗИП",
  name: sparePartName,
  seed: () =>
    seedEquip<SparePart["f"]>({
      key: "spare-parts",
      total: 1591,
      statuses: Object.keys(SPARE_STATUS),
      seed: SEED,
      gen: (i, r, n) => {
        const st = pick(r, ["stock", "stock", "stock", "installed", "issued"])
        const [name, category] = pick(r, GEN_NAMES)
        // Поля МОЛ, получения и замены (кроме установленных) в примерах не заданы
        return {
          num: i + 1,
          name,
          category,
          inv: `${n.branch}0${num(r, 700000, 709999)}`,
          serial: r() > 0.2 ? `D0${num(r, 1000000, 9999999)}` : "—",
          cost: `${num(r, 4000, 220000)}.${String(num(r, 0, 99)).padStart(2, "0")}`,
          owner: pick(r, ["ГМС", "ГМС", "ДЭ", "ДППП"]),
          warehouse: `РЦТ г.${n.city}`,
          status: st,
          ...(st === "installed"
            ? { replaceDoc: `№ ${num(r, 10, 99)}-з от ${num(r, 10, 28)}.0${num(r, 1, 9)}.2026`, eqType: "СПД коммутатор", eqId: `sw1.${n.code.slice(0, 3)}1 · порт 0/${num(r, 1, 48)}` }
            : {}),
        } as unknown as SparePart["f"]
      },
    }),
  remote: genApi<SparePart["f"]>({
    base: "/api/replacements",
    idParam: "id",
    record: { path: "/details", key: "replacement" },
    trashKey: "replacements",
    fields: {
      name: "equipment_name",
      category: "category.name",
      inv: "inventory_number",
      serial: "serial_number",
      cost: "unit_cost",
      owner: "replacement_ownership",
      warehouse: "warehouse_address",
      mol: "responsible_person",
      molEmail: "responsible_email",
      molPost: "responsible_position",
      molDept: "responsible_department",
      molPhone: "responsible_phone",
      received: "requisites",
      sender: "sender",
      replaceDoc: "replacement_requisites",
      receiver: "recipient",
      siteAddress: "installation_address",
      eqType: "equipment_type",
      eqId: "equipment_id",
    },
    filter: { category: "category", owner: "replacement_ownership" },
  }),
})

export const useSpareParts = spareParts.useAll
export const useSparePart = spareParts.useRecord

const EMPTY_F: SparePart["f"] = {
  name: "",
  category: "",
  inv: "",
  serial: "",
  cost: "",
  owner: "",
  warehouse: "",
  mol: "",
  molEmail: "",
  molPost: "",
  molDept: "",
  molPhone: "",
  received: "",
  sender: "",
  replaceDoc: "",
  receiver: "",
  siteAddress: "",
  eqType: "",
  eqId: "",
}
export const blankSparePart = (): SparePart => blankEquip("stock", { ...EMPTY_F })

/** Поля «Сведений» по порядку — колонки отчёта, импорт и форма. */
export const SPARE_FIELDS: { k: keyof SparePart["f"]; t: string }[] = [
  { k: "name", t: "Наименование ЗИП" },
  { k: "category", t: "Категория" },
  { k: "inv", t: "Инвентарный номер" },
  { k: "serial", t: "Серийный номер (S/N)" },
  { k: "cost", t: "Стоимость, тг" },
  { k: "owner", t: "Принадлежность ЗИП" },
  { k: "warehouse", t: "Адрес склада ФО" },
  { k: "mol", t: "МОЛ, ФИО" },
  { k: "molEmail", t: "Email МОЛ" },
  { k: "molPost", t: "Должность МОЛ" },
  { k: "molDept", t: "Отдел МОЛ" },
  { k: "molPhone", t: "Телефон МОЛ" },
  { k: "received", t: "Реквизиты получения" },
  { k: "sender", t: "От кого" },
  { k: "replaceDoc", t: "Реквизиты документа замены" },
  { k: "receiver", t: "Кому" },
  { k: "siteAddress", t: "Адрес узла связи (места установки)" },
  { k: "eqType", t: "Тип оборудования" },
  { k: "eqId", t: "ID оборудования" },
]

/** Колонки отчёта (n-08) и аналитики заполненности — все поля ЗИП. */
export const sparePartColumns: ReportCol<SparePart>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  ...SPARE_FIELDS.map((c) => ({ k: c.k, t: c.t, value: (x: SparePart) => x.f[c.k] ?? "—" })),
]

const REQUIRED = new Set(["name", "category", "inv"])
const OPTS: Partial<Record<keyof SparePart["f"], string[]>> = { category: CATEGORIES, owner: OWNERS }

/** Импорт Excel: поля — как в форме. */
export const sparePartsImport: ImportSpec<SparePart> = {
  key: "spare-parts",
  title: "ЗИП",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    ...SPARE_FIELDS.map((c) => ({ k: c.k, t: c.t, required: REQUIRED.has(c.k) || undefined, opts: OPTS[c.k]?.map((v) => ({ v, label: v })) })),
    { k: "status", t: "Статус", required: true, opts: Object.entries(SPARE_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankSparePart(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    const f = { ...x.f }
    for (const c of SPARE_FIELDS) f[c.k] = str(c.k)
    return withNode({ ...x, branch: str("branch"), status: str("status") || x.status, f }, Number(v.nodeId))
  },
  name: sparePartName,
  all: spareParts.all,
  nextId: spareParts.nextId,
  save: spareParts.save,
}

/* ---------- паспорт ---------- */

export const isInstalled = (x: SparePart) => x.status === "installed"
/** Стоимость «12589.29» → «12 589». */
export const money = (v: string) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n).toLocaleString("ru-RU") : "—"
}
const SHORT: Record<string, [string, string]> = {
  "Оптические модули": ["Оптика", "модули"],
  "Блоки питания": ["Питание", "блоки"],
  "Спутниковое оборудование": ["Спутник", "оборудование"],
  "Радиооборудование": ["Радио", "оборудование"],
}
/** Категория коротко: «Оптика» + «модули». */
export const spareCat = (x: SparePart) => SHORT[spareField(x, "category")] ?? [spareField(x, "category"), ""]
/** МОЛ — из записи, иначе пример. */
export const spareMol = (x: SparePart) => (spareField(x, "mol") === "—" ? "Ержан К. Сапаров" : spareField(x, "mol"))
/** «Ержан К. Сапаров» → «Е. Сапаров». */
export const shortName = (v: string) => v.replace(/^(\S+) \S+ (\S+)$/, (_, a: string, b: string) => `${a[0]}. ${b}`)
/** Дата замены из документа замены. */
export const replacedAt = (x: SparePart) => spareField(x, "replaceDoc").match(/\d{2}\.\d{2}\.\d{4}/)?.[0] ?? "—"

/** Движение ЗИП: дата, операция, откуда, куда, пользователь, примечание. TODO(API): /api/replacements/movement-history. */
export function spareMoves(x: SparePart) {
  const m = shortName(spareMol(x))
  const rows = [["04.02.2026", "Поступление", spareField(x, "sender", "ГО Астана"), `Склад ${x.branch}`, m, `накладная № 2211`]]
  if (x.status !== "stock") rows.push(["10.09.2026", "Выдача", `Склад ${x.branch}`, "Б. Дегтярь", m, "под замену"])
  if (isInstalled(x)) rows.push([replacedAt(x), "Установка", "Б. Дегтярь", spareField(x, "eqId"), "Б. Дегтярь", `документ ${spareField(x, "replaceDoc").split(" от")[0]}`])
  return rows
}

/** Точка между участками (для карты паспорта): у оборудования — «Плата N». */
export const sparePoint = (i: number) => `Плата ${i + 1}`

const DOCS = [
  { name: "Паспорт оборудования", req: "PDF · производитель", uploaded: true },
  { name: "Номер и дата акта о вводе в эксплуатацию", req: "№ 154 от 12.03.2019", uploaded: true },
  { name: "Распоряжение / наряд", req: "№ 007-р", uploaded: true },
  { name: "Схема подключения", req: "—", uploaded: false },
]

/** Документы, фото, история и точка на карте для паспорта. TODO(API): документы и история — пока примеры. */
export const sparePartDetail = (x: SparePart): LineDetail =>
  lineDetail(x, {
    section: "spare-parts",
    point: sparePoint,
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
    docs: DOCS,
    lastEdit: (_, r) => ["Изменён «Статус»", "Выдано", SPARE_STATUS[r.status]?.[0] ?? "—"],
  })
