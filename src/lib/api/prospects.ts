"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 12 Потенциальные клиенты — данные раздела. Без API — примеры в памяти вкладки (первые 6 компаний из макета).
 * API техучёта: /api/potential-clients (id-параметр `id`), удаление — /api/trash/soft-delete/potential_clients.
 */

export type Prospect = Equip<{
  bin: string
  company: string
  /** B2B / B2C / B2G */
  kind: string
  /** Размер предприятия («Малые (≤ 5)») */
  size: string
  /** Дистанция до узла, м (в примерах — число, из формы — строка) */
  dist: Val
}>

export const PROSPECT_STATUS: Record<string, [string, Tone]> = {
  none: ["Не обработан", "muted"],
  processed: ["Обработан", "warn"],
  client: ["Клиент", "ok"],
}
export const prospectStatus = (x: Prospect) => PROSPECT_STATUS[x.status] ?? ["—", "muted" as Tone]

export const KINDS = ["B2B", "B2C", "B2G"]

export const prospectName = (x: Prospect) => String(x.f.company)
export const prospectSub = (x: Prospect) => `БИН ${x.f.bin} · ${x.f.dist} м до ${x.nodeCode}`

const SEED = [
  { bin: "000440005502", company: "ТОО «Авиакомпания Орлан-2000»", branch: "АС", kind: "B2B", size: "Малые (41–50)", nodeCode: "url002.01.UF", dist: 115, status: "processed" },
  { bin: "070540014109", company: "ТОО «Асыл-Ана компаниясы»", branch: "АС", kind: "B2B", size: "Малые (≤ 5)", nodeCode: "url002.01.UF", dist: 229, status: "processed" },
  { bin: "100440017386", company: "ТОО «СП Универсал Сервис»", branch: "АС", kind: "B2B", size: "Малые (≤ 5)", dist: 115, status: "none" },
  { bin: "170640008446", company: "ТОО «Бота-2017»", branch: "АС", kind: "B2B", size: "Малые (6–10)", dist: 71, status: "client" },
  { bin: "190840025982", company: "ТОО «A&Meirim»", branch: "ЮФ", kind: "B2B", size: "Малые (≤ 5)", nodeCode: "alm001.01.YF", dist: 246, status: "none" },
  { bin: "210140011204", company: "ИП «Сапарова А.»", branch: "АС", kind: "B2C", size: "Микро (1)", nodeCode: "url002.01.UF", dist: 64, status: "client" },
]

export const prospects = createSource<Prospect>({
  key: "prospects",
  title: "Потенциальные клиенты",
  name: prospectName,
  seed: () =>
    seedEquip({
      key: "prospects",
      total: 43080,
      statuses: Object.keys(PROSPECT_STATUS),
      seed: SEED,
      gen: (i, r) => {
        const st = r() > 0.92 ? (r() > 0.8 ? "client" : "processed") : "none"
        return {
          bin: String(100000000000 + Math.floor(r() * 899999999999)),
          company: `${pick(r, ["ТОО", "ТОО", "ИП", "АО"])} «${pick(r, ["Нур", "Алтын", "Береке", "Самал", "Каспий", "Жайык", "Тулпар", "Сункар"])} ${pick(r, ["Групп", "Сервис", "Строй", "Трейд", "Логистик", "Агро"])}»`,
          kind: r() > 0.15 ? "B2B" : "B2C",
          size: pick(r, ["Микро (1)", "Малые (≤ 5)", "Малые (6–10)", "Малые (11–20)", "Средние (51–100)"]),
          dist: num(r, 10, 250) as Val,
          status: st,
        }
      },
    }),
  remote: genApi<Prospect["f"]>({
    base: "/api/potential-clients",
    idParam: "id",
    trashKey: "potential_clients",
    fields: { bin: "bin", company: "name", kind: "client_type", size: "size_category", dist: "distance_to_node" },
    status: (o) => {
      const v = s(o, "status", "").toLowerCase()
      return /клиент|client/.test(v) ? "client" : /обработ|processed/.test(v) && !/не /.test(v) ? "processed" : "none"
    },
    filter: { kind: "client_type", status: "status" },
  }),
})

export const useProspects = prospects.useAll
export const useProspect = prospects.useRecord

export const blankProspect = (): Prospect => blankEquip("none", { bin: "", company: "", kind: "", size: "", dist: "" })

/** Колонки отчёта и аналитики заполненности. */
export const prospectColumns: ReportCol<Prospect>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "bin", t: "БИН", value: (x) => x.f.bin },
  { k: "company", t: "Наименование", value: (x) => x.f.company },
  { k: "kind", t: "Тип клиента", value: (x) => x.f.kind },
  { k: "size", t: "Размер", value: (x) => x.f.size },
  { k: "dist", t: "Дистанция, м", value: (x) => x.f.dist },
  { k: "st", t: "Статус", value: (x) => prospectStatus(x)[0] },
]

/** Импорт Excel: поля — как в форме. */
export const prospectsImport: ImportSpec<Prospect> = {
  key: "prospects",
  title: "Потенциальные клиенты",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "bin", t: "БИН" },
    { k: "company", t: "Наименование", required: true },
    { k: "kind", t: "Тип клиента", opts: KINDS.map((v) => ({ v, label: v })) },
    { k: "size", t: "Размер" },
    { k: "dist", t: "Дистанция, м" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(PROSPECT_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankProspect(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      { ...x, branch: str("branch"), status: str("status") || x.status, f: { ...x.f, bin: str("bin"), company: str("company"), kind: str("kind"), size: str("size"), dist: str("dist") } },
      Number(v.nodeId),
    )
  },
  name: prospectName,
  all: prospects.all,
  nextId: prospects.nextId,
  save: prospects.save,
}

/* ---------- паспорт ---------- */

/** Дистанция до узла, м. */
export const prospectDist = (x: Prospect) => Number(x.f.dist) || 0
/** Категория дистанции. */
export const distBand = (m: number) => (m <= 30 ? "до 30" : m <= 50 ? "30–50" : m <= 100 ? "50–100" : "100–250")
/** Потенциальный доход, тыс ₸/мес — по размеру компании. */
export const prospectIncome = (x: Prospect) => {
  const sz = String(x.f.size ?? "")
  return /Средн/.test(sz) ? 420 : /41|21|11/.test(sz) ? 180 : /6–10/.test(sz) ? 120 : 60
}
/** Путь клиента по сети (цифры макета). */
export const FUNNEL = [
  { k: "none", t: "Не обработан", n: "38 912", w: 100 },
  { k: "processed", t: "Обработан", n: "3 506", w: 60 },
  { k: "kcrm", t: "Заявка KCRM", n: "1 120", w: 34 },
  { k: "client", t: "Клиент", n: "662", w: 26 },
]
/** TODO(API): заявки — из kCRM, контакты — нет в /api/potential-clients. */
export const KCRM = { num: "№ 88412", date: "06.10.2026", service: "Интернет FTTB", speed: "100 Мбит/с", manager: "Д. Темирханова" }
export const CONTACT = { phone: "+7 717 *** 44 10", email: "info@orlan2000.kz", person: "Ахметов Б. К.", activity: "Авиаперевозки" }

/** Концы (узел — клиент), документы ввода и история клиента — примеры по номеру записи. */
export const prospectDetail = (x: Prospect): LineDetail =>
  lineDetail(x, {
    section: "prospects",
    point: (i) => `Точка ${i + 1}`,
    count: () => ({ total: 0, a: 0, b: 0 }),
    ends: (r, a) => [
      { code: r.nodeCode, title: a ? a.object : r.nodeCode, nodeId: a?.id },
      { code: "—", title: prospectName(r as Prospect) },
    ],
    inputDocs: (r) => [
      { t: "Юридический адрес", n: r.address },
      { t: "Фактический адрес", n: `${r.address}, оф. 4` },
      { t: "Координаты", n: `${r.ll[0].toFixed(4)}, ${r.ll[1].toFixed(4)}` },
    ],
    docs: [],
    lastEdit: (_, r) => ["Статус клиента изменён", "Не обработан", prospectStatus(r as Prospect)[0]],
  })
