"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, km, nodeOptions, num, obj, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"

/*
 * 08 КЛС — данные раздела. Без API — примеры в памяти вкладки (первые 4 трассы из макета).
 * API техучёта: /api/kls, удаление — /api/trash/soft-delete/kls.
 */

export type CableLine = Equip<{
  name: string
  /** «Начало → конец» */
  route: string
  /** Длина трассы, км («1,36») */
  len: string
  /** Медных пар всего */
  pairs: Val
  /** Принадлежность кабеля */
  owner: string
}>

export const CABLE_LINE_STATUS: Record<string, [string, Tone]> = {
  work: ["В эксплуатации", "ok"],
  off: ["Выведена", "bad"],
}
export const cableLineStatus = (x: CableLine) => CABLE_LINE_STATUS[x.status] ?? ["—", "muted" as Tone]

export const cableLineName = (x: CableLine) => `КЛС №${x.num}`
export const cableLineSub = (x: CableLine) => `${x.f.route} · ${x.f.len} км`

const SEED = [
  {
    num: 8,
    branch: "ЗФ",
    name: "Местные сети ТПП 50х2 на участке УС «Центральный»",
    route: "УС Центральный → АФ АО «Нефтяная…»",
    len: "1,36",
    pairs: 50,
    owner: "ЗФ АО «Jusan Mobile»",
  },
  { num: 6, branch: "ЗФ", name: "Местные сети ТПП 30*2 на участке «Абая2»", route: "пр. Абая,2 → пр. Абая,2а", len: "0,435", pairs: 30, owner: "JM" },
  { num: 10, branch: "АС", name: "РШ-3-01 - РШ-3-03", route: "РШ-3-01 → РШ-3-03", len: "0,847", pairs: 100, owner: "АО «Jusan Mobile»" },
  { num: 1, branch: "УФ", name: "Распределительная сеть ШР-01 офис УФ", route: "АО «Jusan Mobile» → ШР-01", len: "0,45", pairs: 50, owner: "АО JM" },
]

export const cableLines = createSource<CableLine>({
  key: "cable-lines",
  title: "КЛС",
  name: cableLineName,
  seed: () =>
    seedEquip({
      key: "cable-lines",
      total: 119,
      statuses: Object.keys(CABLE_LINE_STATUS),
      seed: SEED,
      gen: (i, r, n) => ({
        num: String(i + 1),
        name: `Местные сети ТПП ${pick(r, [10, 20, 30, 50, 100])}х2 · ${obj(n)}`,
        route: `${n.code} → РШ-${num(r, 1, 30)}`,
        len: km(r, 0.2, 4),
        pairs: pick(r, [10, 20, 30, 50, 100]) as Val,
        owner: pick(r, ["АО «QMobile»", "JM", "Аренда"]),
      }),
    }),
  remote: genApi<CableLine["f"]>({
    base: "/api/kls",
    trashKey: "kls",
    fields: {
      name: "track_name",
      route: (o) => `${s(o, "start_point")} → ${s(o, "end_point")}`,
      len: "track_length",
      pairs: "total_copper_pairs",
      owner: "cable_owner",
    },
  }),
})

export const useCableLines = cableLines.useAll
export const useCableLine = cableLines.useRecord

export const blankCableLine = (): CableLine => blankEquip("work", { name: "", route: "", len: "", pairs: "", owner: "" })

/** Колонки отчёта и аналитики заполненности — все поля трассы. */
export const cableLineColumns: ReportCol<CableLine>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "name", t: "Наименование трассы", value: (x) => x.f.name },
  { k: "route", t: "Начало → конец", value: (x) => x.f.route },
  { k: "len", t: "Длина, км", value: (x) => x.f.len },
  { k: "pairs", t: "Пары", value: (x) => x.f.pairs },
  { k: "owner", t: "Принадлежность", value: (x) => x.f.owner },
]

/** Импорт Excel: поля — как в форме. */
export const cableLinesImport: ImportSpec<CableLine> = {
  key: "cable-lines",
  title: "КЛС",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "name", t: "Наименование трассы" },
    { k: "route", t: "Начало → конец" },
    { k: "len", t: "Длина, км" },
    { k: "pairs", t: "Пары" },
    { k: "owner", t: "Принадлежность" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(CABLE_LINE_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankCableLine(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, name: str("name"), route: str("route"), len: str("len"), pairs: str("pairs"), owner: str("owner") },
      },
      Number(v.nodeId),
    )
  },
  name: cableLineName,
  all: cableLines.all,
  nextId: cableLines.nextId,
  save: cableLines.save,
}

/* ---------- паспорт ---------- */

/** Медные пары из записи: всего, JM (a), аренда (b). */
export function cableLineCount(x: CableLine) {
  const total = Number(x.f.pairs) || 10
  const a = Math.round(total * 0.68)
  return { total, a, b: Math.round(total * 0.12) }
}

/**
 * Участки, пары, документы, история трассы. TODO(API): /api/kls/children (участки и пары), документы и история —
 * пока примеры по номеру записи.
 */
export const cableLineDetail = (x: CableLine): LineDetail =>
  lineDetail(x, {
    section: "cable-lines",
    point: (i) => `Бокс М-${i + 1}`,
    count: (r) => cableLineCount(r as CableLine),
    ends: (r, a) => {
      const [from = r.nodeCode, to = "РШ-14"] = String(r.f.route ?? "").split(" → ")
      return [
        { code: a?.code ?? r.nodeCode, title: from, nodeId: a?.id },
        { code: "—", title: to },
      ]
    },
    inputDocs: [
      { t: "Ввод в эксплуатацию", n: "№ 12 от 2011" },
      { t: "Акт приёмочной комиссии", n: "№ 12-п" },
      { t: "Схема кабеля", n: "PDF" },
    ],
    docs: [
      { name: "№, дата документа о вводе в эксплуатацию", req: "№ 12 от 14.06.2011", uploaded: true },
      { name: "№, дата акта приёмной комиссии", req: "№ 12-п от 10.06.2011", uploaded: true },
      { name: "Схема распределения пар", req: "PDF", uploaded: false },
    ],
    lastEdit: (c) => ["Изменено «Арендуемых медных пар»", String(Math.max(0, c.b - 2)), String(c.b)],
  })
