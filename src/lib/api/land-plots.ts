"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 37 Земельные участки — данные раздела. Без API — примеры в памяти вкладки (первые 6 участков из макета).
 * API техучёта: /api/land-plots (?id=), удаление — /api/trash/soft-delete/land_plot.
 */

export type LandPlot = Equip<{
  name: string
  /** Площадь, га («1.80») */
  area: string
  /** Вид собственности */
  own: string
  /** ВОЛС к участку («ВОЛС №88» или «—») */
  vols: string
  cadastre: string
  /** Вид объекта */
  kind: string
  /** «Да» / «Нет» */
  registered: string
  /** Сроки аренды */
  lease: string
}>

export const LAND_STATUS: Record<string, [string, Tone]> = {
  reg: ["Зарегистрирован", "ok"],
  noreg: ["Не зарегистрирован", "warn"],
}
export const landPlotStatus = (x: LandPlot) => LAND_STATUS[x.status] ?? ["—", "muted" as Tone]

export const OWNERSHIP = ["Собственность", "Аренда", "Сервитут"]
export const OBJECT_KINDS = ["Узел связи", "Офис", "АМС", "Коридор ВОЛС"]
export const REGISTERED = ["Да", "Нет"]

export const landPlotName = (x: LandPlot) => String(x.f.name)
export const landPlotSub = (x: LandPlot) => `${x.nodeCode} · ${x.address}`

const SEED: Record<string, Val>[] = [
  {
    num: 1,
    branch: "УФ",
    nodeCode: "url002.01.UF",
    name: "Административное здание г. Уральск,п. Желаево, промзона 7.",
    area: "1.80",
    own: "Собственность",
    vols: "ВОЛС №88",
    cadastre: "08-130---034-160, 08-130-034-160-7",
    kind: "Офис",
    registered: "Да",
    lease: "до 31.12.2035",
    status: "reg",
  },
  { num: 45, branch: "УФ", nodeCode: "url002.01.UF", name: "Объект «Модернизация действующего газопровода»", area: "0.09", own: "Аренда" },
  { num: 1, branch: "ЗФ", name: "Узел Связи Карабатан", area: "0.13", own: "—" },
  { num: 15, branch: "МФ", name: "Коридор для ВОЛС", area: "0.04", own: "—", kind: "Коридор ВОЛС" },
  { num: 1, branch: "АФ", name: "УС «Заречный»", area: "13337.00", own: "Собственность" },
  { num: 13, branch: "ШФ", name: "УС Керемет", area: "0.01", own: "Собственность" },
]

export const landPlots = createSource<LandPlot>({
  key: "land-plots",
  title: "Земельные участки",
  name: landPlotName,
  seed: () =>
    seedEquip({
      key: "land-plots",
      total: 374,
      statuses: Object.keys(LAND_STATUS),
      seed: SEED,
      gen: (i, r, n) => {
        const own = pick(r, ["Аренда", "Аренда", "Сервитут", "Собственность"])
        const reg = r() > 0.09
        return {
          num: String(i + 1),
          name: pick(r, [`УС «${n.object}»`, `Узел связи ${n.city}`, "Коридор для ВОЛС", `АМС ${n.code}`]),
          area: (r() * 0.3 + 0.01).toFixed(2),
          own,
          vols: r() > 0.5 ? `ВОЛС №${num(r, 1, 380)}` : "—",
          cadastre: `0${num(r, 1, 9)}-${num(r, 100, 399)}-0${num(r, 10, 99)}-${num(r, 100, 999)}`,
          kind: pick(r, ["Узел связи", "Узел связи", "АМС", "Коридор ВОЛС"]),
          registered: reg ? "Да" : "Нет",
          lease: own === "Собственность" ? "—" : `до 31.12.20${num(r, 27, 40)}`,
          status: reg ? "reg" : "noreg",
        }
      },
    }),
  remote: genApi<LandPlot["f"]>({
    base: "/api/land-plots",
    idParam: "id",
    trashKey: "land_plot",
    fields: {
      name: "property_name",
      vols: "bols.name",
      cadastre: "cadastral_number",
      own: "ownership_type",
      kind: "object_type",
      area: "area",
      registered: (o) => (o.is_registered ? "Да" : "Нет"),
      lease: "lease_terms",
    },
    status: (o) => (o.is_registered ? "reg" : "noreg"),
    filter: { own: "ownership_type", kind: "object_type" },
  }),
})

export const useLandPlots = landPlots.useAll
export const useLandPlot = landPlots.useRecord

export const blankLandPlot = (): LandPlot =>
  blankEquip("reg", { name: "", area: "", own: "", vols: "", cadastre: "", kind: "", registered: "", lease: "" })

/** Колонки отчёта и аналитики заполненности — все поля участка. */
export const landPlotColumns: ReportCol<LandPlot>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "name", t: "Наименование", value: (x) => x.f.name },
  { k: "area", t: "Площадь", value: (x) => x.f.area },
  { k: "own", t: "Вид собственности", value: (x) => x.f.own },
  { k: "vols", t: "ВОЛС", value: (x) => x.f.vols },
  { k: "cadastre", t: "Кадастровый номер", value: (x) => x.f.cadastre },
  { k: "kind", t: "Вид объекта", value: (x) => x.f.kind },
  { k: "registered", t: "Зарегистрирован", value: (x) => x.f.registered },
  { k: "lease", t: "Сроки аренды", value: (x) => x.f.lease },
]

const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Импорт Excel: поля — как в форме. */
export const landPlotsImport: ImportSpec<LandPlot> = {
  key: "land-plots",
  title: "Земельные участки",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "name", t: "Наименование", required: true },
    { k: "area", t: "Площадь" },
    { k: "own", t: "Вид собственности", opts: opts(OWNERSHIP) },
    { k: "vols", t: "ВОЛС" },
    { k: "cadastre", t: "Кадастровый номер" },
    { k: "kind", t: "Вид объекта", opts: opts(OBJECT_KINDS) },
    { k: "registered", t: "Зарегистрирован", opts: opts(REGISTERED) },
    { k: "lease", t: "Сроки аренды" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(LAND_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankLandPlot(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: {
          ...x.f,
          name: str("name"),
          area: str("area"),
          own: str("own"),
          vols: str("vols"),
          cadastre: str("cadastre"),
          kind: str("kind"),
          registered: str("registered"),
          lease: str("lease"),
        },
      },
      Number(v.nodeId),
    )
  },
  name: landPlotName,
  all: landPlots.all,
  nextId: landPlots.nextId,
  save: landPlots.save,
}

/* ---------- паспорт ---------- */

/** Правоустанавливающие документы участка (вкладка lp-t1): первые TITLE_UP загружены. */
export const TITLE_DOCS = ["Гос. акт", "Постановление", "Тех. паспорт", "Договор купли/аренды", "Свидетельство о регистрации", "Акт приёма-передачи", "Акт ввода в эксплуатацию"]
export const TITLE_UP = 5

/** Площадь в га с запятой. */
export const landArea = (x: LandPlot) => String(x.f.area ?? "0").replace(".", ",")
/** Год окончания аренды или «—». */
export const leaseYear = (x: LandPlot) => String(x.f.lease ?? "—").match(/\d{4}/)?.[0] ?? "—"

/**
 * Документы и история участка (паспорт на шаблоне линии, жил нет). TODO(API): контур и размеры участка, файлы
 * правоустанавливающих документов — нет в /api/land-plots.
 */
export const landPlotDetail = (x: LandPlot): LineDetail =>
  lineDetail(x, {
    section: "land-plots",
    point: (i) => `Точка ${i + 1}`,
    count: () => ({ total: 0, a: 0, b: 0 }),
    ends: (r, a) => [
      { code: r.nodeCode, title: a ? a.object : r.nodeCode, nodeId: a?.id },
      { code: "—", title: "—" },
    ],
    inputDocs: [
      { t: "Гос. акт", n: "PDF" },
      { t: "Договор аренды", n: "есть" },
      { t: "Фото", n: "6" },
    ],
    docs: [
      { name: "Паспорт оборудования", req: "PDF · производитель", uploaded: true },
      { name: "Номер и дата акта о вводе в эксплуатацию", req: "№ 154 от 12.03.2019", uploaded: true },
      { name: "Распоряжение / наряд", req: "№ 007-р", uploaded: true },
      { name: "Схема подключения", req: "—", uploaded: false },
    ],
    lastEdit: () => ["Изменено поле паспорта", "—", "заполнено"],
  })
