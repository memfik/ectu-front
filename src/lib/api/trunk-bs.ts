"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"

/*
 * 30 БС Транк — данные раздела. Без API — примеры в памяти вкладки (первые 3 — из макета).
 * API техучёта: /api/bc (/filter, /pasport, /create, /update), удаление — /api/trash/soft-delete/bc.
 */

export type TrunkBs = Equip<{
  /** Тип/модель БС («Motorola MTR 2000, Транкинг - конвенциональная») */
  model: string
  /** Число абонентских терминалов (в примерах — число или «—») */
  terminals: Val
  /** Состояние текстом («в работе», «демонтирована», «Демонтированно, акт …») */
  state: string
  place: string
}>

export const TRUNK_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  reserve: ["Резерв", "info"],
  off: ["Демонтирована", "bad"],
}
export const trunkStatus = (x: TrunkBs) => TRUNK_STATUS[x.status] ?? ["—", "muted" as Tone]

export const trunkName = (x: TrunkBs) => `БС Транк · ${String(x.f.model).split(",")[0]}`
export const trunkSub = (x: TrunkBs) => `${x.nodeCode} · ${x.f.terminals} терминалов`

const SEED: Record<string, Val>[] = [
  { num: 1, branch: "УФ", nodeCode: "url002.01.UF", model: "Motorola MTR 2000, Транкинг - конвенциональная", terminals: 18, state: "демонтирована", status: "off" },
  { num: 2, branch: "УФ", nodeCode: "url002.01.UF", model: "Motorola MTR 2000, Транкинг - конвенциональная", terminals: 10, state: "демонтирована", status: "off" },
  { num: 1, branch: "АФ", model: "Vertax 7000", terminals: "—", state: "Демонтированно, акт 437 от 22 сентября 2016г", status: "off" },
]

export const trunkStations = createSource<TrunkBs>({
  key: "trunk-bs",
  title: "БС Транк",
  name: trunkName,
  seed: () =>
    seedEquip({
      key: "trunk-bs",
      total: 14,
      statuses: Object.keys(TRUNK_STATUS),
      seed: SEED,
      gen: (i, r) => ({
        num: i + 1,
        model: pick(r, ["Motorola MTR 2000", "Vertax 7000", "Hytera DS-6210"]),
        terminals: num(r, 4, 90) as Val,
        state: r() > 0.5 ? "в работе" : "резерв",
        place: "контейнер",
        status: r() > 0.5 ? "work" : "reserve",
      }),
    }),
  remote: genApi<TrunkBs["f"]>({
    base: "/api/bc",
    trashKey: "bc",
    fields: { model: "type_model", terminals: "terminal_count", state: "status", place: "installation_place" },
    status: (o) => (/демонт/i.test(s(o, "status", "")) ? "off" : /резерв/i.test(s(o, "status", "")) ? "reserve" : "work"),
    filter: { state: "status" },
  }),
})

export const useTrunkStations = trunkStations.useAll
export const useTrunkStation = trunkStations.useRecord

export const blankTrunkBs = (): TrunkBs => blankEquip("work", { model: "", terminals: "", state: "", place: "" })

/** Колонки отчёта и аналитики заполненности — все поля станции. */
export const trunkColumns: ReportCol<TrunkBs>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "model", t: "Тип/модель БС", value: (x) => x.f.model },
  { k: "terminals", t: "Терминалов", value: (x) => x.f.terminals },
  { k: "state", t: "Состояние", value: (x) => x.f.state },
  { k: "place", t: "Место установки", value: (x) => x.f.place },
]

/** Импорт Excel: поля — как в форме. */
export const trunkImport: ImportSpec<TrunkBs> = {
  key: "trunk-bs",
  title: "БС Транк",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "model", t: "Тип/модель БС" },
    { k: "terminals", t: "Терминалов" },
    { k: "state", t: "Состояние" },
    { k: "place", t: "Место установки" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(TRUNK_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankTrunkBs(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, model: str("model"), terminals: str("terminals"), state: str("state"), place: str("place") },
      },
      Number(v.nodeId),
    )
  },
  name: trunkName,
  all: trunkStations.all,
  nextId: trunkStations.nextId,
  save: trunkStations.save,
}

/* ---------- паспорт ---------- */

/** Число терминалов (нет — 0). */
export const trunkTerminals = (x: TrunkBs) => Number(x.f.terminals) || 0

/**
 * Документы, фото и история станции (общий шаблон оборудования). TODO(API): документы и история — пока примеры по номеру записи.
 */
export const trunkDetail = (x: TrunkBs): LineDetail =>
  lineDetail(x, {
    section: "trunk-bs",
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
      const n = trunkTerminals(r as TrunkBs)
      return ["Изменено «Количество абонентских терминалов»", String(Math.max(0, n - 2)), String(n)]
    },
  })
