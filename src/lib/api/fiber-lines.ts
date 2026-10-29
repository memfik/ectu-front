"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, km, nodeOptions, obj, pair, pick, seedEquip, used, withNode, type Equip } from "./equipment"
import { genApi, pairOf, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, usTitle, type LineDetail } from "@/sections/lines/detail"

/*
 * 07 ВОЛС — данные раздела. Без API — примеры в памяти вкладки (первые 5 трасс из макета).
 * API техучёта: /api/bols (/filter, /pasport?vols_id=, /create, /update), удаление — /api/trash/soft-delete/bols.
 */

export type FiberLine = Equip<{
  name: string
  /** «Начало → конец» */
  route: string
  /** Длина трассы, км («0,200») */
  len: string
  /** Волокна «занято / всего» */
  fibers: string
  cable: string
  owner: string
  network: string
  /** Суммарная длина кабеля, км */
  total: string
}>

export const FIBER_STATUS: Record<string, [string, Tone]> = {
  work: ["В эксплуатации", "ok"],
  plan: ["Проектируется", "info"],
  off: ["Выведена", "bad"],
}
export const fiberStatus = (x: FiberLine) => FIBER_STATUS[x.status] ?? ["—", "muted" as Tone]

export const OWNERS = ["АО «QMobile»", "Аренда", "Совместная"]
export const NETWORKS = ["ГМС", "ГРС", "ГАС", "МС"]

export const fiberLineName = (x: FiberLine) => `ВОЛС №${x.num}`
export const fiberLineSub = (x: FiberLine) => `${x.f.route} · ${x.f.len} км`

const SEED = [
  { num: 253, branch: "ЗФ", name: "Новый БЦ ул.Ерниязова", route: "муфта → УС «Центральный»", len: "0,200", fibers: "1 / 8", cable: "ОКСЛ А 8" },
  {
    num: 69,
    branch: "МФ",
    name: "Прокладка кабеля связи в г.Актау Caspian Engineering",
    route: "Caspian Engineering → муфта ТК (465)",
    len: "0,382",
    fibers: "— / 12",
    cable: "СКО-ДПО-0-О12А",
  },
  {
    num: 14,
    branch: "ВФ",
    name: "Департамент по делам обороны Павлодарской обл.",
    route: "Муфта №3 (ул.Камзина) → ул. Нурмагамбетова",
    len: "0,2",
    fibers: "2 / 8",
    cable: "ОК/Т-М4П-А8-8,0",
  },
  { num: 110, branch: "ШФ", name: "ТОО «KURSI Маркетинг» ИЗ Ордабасы", route: "Муфта от Дирекции → ТОО «KURSI Маркетинг»", len: "0,2", fibers: "1 / 2", cable: "ОК-2" },
  { num: 26, branch: "АС", name: "УС «Габдулина 02(10)» — ТД БЦ Астана Тауэр", route: "УС «Габдулина 02» → ТД БЦ Астана Тауэр", len: "1,28", fibers: "6 / 8", cable: "ДПС-08" },
]

export const fiberLines = createSource<FiberLine>({
  key: "fiber-lines",
  title: "ВОЛС",
  name: fiberLineName,
  seed: () =>
    seedEquip({
      key: "fiber-lines",
      total: 1693,
      statuses: Object.keys(FIBER_STATUS),
      seed: SEED,
      gen: (i, r, n) => {
        const t = pick(r, [8, 16, 24, 32, 48, 64])
        return {
          num: String(i + 1),
          name: `${obj(n)} — ${pick(r, ["УС «РТПЦ»", "муфта ТК", "БЦ", "КСО АТС-14", "ТД"])}`,
          route: `${n.code} → ${pick(r, ["муфта ТК", "УС «РТПЦ»", "ODF-1", "КСО"])}`,
          len: km(r, 0.1, 9),
          fibers: used(r, t),
          cable: pick(r, ["ОКЛ-0,22-24", "ОКСЛ А 8", "ДПС-08", "ОК-8", "ОКЛ-0,22-32"]),
          owner: r() > 0.03 ? "АО «QMobile»" : "Аренда",
          network: n.network,
          total: km(r, 0.1, 12),
        }
      },
    }),
  remote: genApi<FiberLine["f"]>({
    base: "/api/bols",
    idParam: "vols_id",
    trashKey: "bols",
    fields: {
      name: "route_name",
      route: (o) => `${s(o, "start_point")} → ${s(o, "end_point")}`,
      len: "route_length",
      total: "total_cable_length",
      cable: "cable_type",
      network: "network_type",
      // TODO(API): занятость волокон — нет в /filter (есть /api/bols/children)
      fibers: pairOf("used_fibers", "fiber_count"),
      owner: "cable_owner",
    },
    filter: { network: "network_type", owner: "cable_owner", cable: "cable_type" },
  }),
})

export const useFiberLines = fiberLines.useAll
export const useFiberLine = fiberLines.useRecord

export const blankFiberLine = (): FiberLine =>
  blankEquip("work", { name: "", route: "", len: "", fibers: "", cable: "", owner: "", network: "", total: "" })

/** «8 / 24» или «—» — иначе ошибка формата. */
export const checkPair = (v: string) => (pair(v) || v === "—" ? undefined : "Формат: 8 / 24")

/** Колонки отчёта (n-08) и аналитики заполненности — все поля трассы. */
export const fiberLineColumns: ReportCol<FiberLine>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "name", t: "Наименование трассы", value: (x) => x.f.name },
  { k: "route", t: "Начало → конец", value: (x) => x.f.route },
  { k: "len", t: "Длина, км", value: (x) => x.f.len },
  { k: "fibers", t: "Волокна", value: (x) => x.f.fibers },
  { k: "cable", t: "Тип прокладки / кабель", value: (x) => x.f.cable },
  { k: "owner", t: "Собственник ВОК", value: (x) => x.f.owner },
  { k: "network", t: "Тип сети", value: (x) => x.f.network },
  { k: "total", t: "Суммарная длина кабеля, км", value: (x) => x.f.total },
]

/** Импорт Excel: поля — как в форме. */
export const fiberLinesImport: ImportSpec<FiberLine> = {
  key: "fiber-lines",
  title: "ВОЛС",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "name", t: "Наименование трассы" },
    { k: "route", t: "Начало → конец" },
    { k: "len", t: "Длина, км" },
    { k: "fibers", t: "Волокна", check: checkPair },
    { k: "cable", t: "Тип прокладки / кабель" },
    { k: "owner", t: "Собственник ВОК", opts: OWNERS.map((v) => ({ v, label: v })) },
    { k: "network", t: "Тип сети", opts: NETWORKS.map((v) => ({ v, label: v })) },
    { k: "total", t: "Суммарная длина кабеля, км" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(FIBER_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankFiberLine(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, name: str("name"), route: str("route"), len: str("len"), fibers: str("fibers"), cable: str("cable"), owner: str("owner"), network: str("network"), total: str("total") },
      },
      Number(v.nodeId),
    )
  },
  name: fiberLineName,
  all: fiberLines.all,
  nextId: fiberLines.nextId,
  save: fiberLines.save,
}

/* ---------- паспорт ---------- */

/** Волокна из записи: всего, занято (a), резерв (b). */
export function fiberCount(x: FiberLine) {
  const m = String(x.f.fibers).match(/(\d+|—) \/ (\d+)/)
  const total = m ? +m[2] : 8
  const a = m && m[1] !== "—" ? Math.min(+m[1], total) : 0
  return { total, a, b: a < total ? 1 : 0 }
}

/**
 * Участки, волокна, документы, история трассы. TODO(API): /api/bols/children (участки и волокна), документы и история —
 * пока примеры по номеру записи.
 */
export const fiberLineDetail = (x: FiberLine): LineDetail =>
  lineDetail(x, {
    section: "fiber-lines",
    point: (i) => `Муфта М-${i + 1}`,
    count: (r) => fiberCount(r as FiberLine),
    ends: (r, a, b) => [
      { code: a?.code ?? r.nodeCode, title: a ? usTitle(a) : "муфта", nodeId: a?.id },
      { code: b?.code ?? "—", title: b ? usTitle(b) : "УС «РТПЦ»", nodeId: b?.id },
    ],
    inputDocs: [
      { t: "Ввод в эксплуатацию", n: "№ 77 от 03.12.2025" },
      { t: "Акт приёмной комиссии", n: "№ 77-п от 01.12.2025" },
      { t: "ТУ", n: "№ 1203 от 10.10.2025" },
    ],
    docs: [
      { name: "№, дата документа о вводе в эксплуатацию", req: "№ 77 от 03.12.2025", uploaded: true },
      { name: "№, дата акта приёмной комиссии", req: "№ 77-п от 01.12.2025", uploaded: true },
      { name: "Реквизиты технических условий (ТУ)", req: "№ 1203 от 10.10.2025", uploaded: true },
      { name: "Основание аренды КК (договор)", req: "—", uploaded: false },
      { name: "Исполнительная схема", req: "PDF", uploaded: true },
    ],
    lastEdit: (c) => ["Изменено «Кол-во волокон занятых»", String(Math.max(0, c.a - 1)), String(c.a)],
  })
