"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip } from "./equipment"
import { genApi } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 31 ЗССС SkyEdge II GEO (VSAT) — данные раздела. Без API — примеры в памяти вкладки.
 * API техучёта: /api/triple_s (/filter, /pasport, /create, /update), удаление — /api/trash/soft-delete/tripleS.
 */

export type Vsat = Equip<{
  /** «Область, населённый пункт» */
  name: string
  client: string
  /** Тип модема: «SkyEdge II Access», «SkyEdge II Fixed» */
  type: string
  /** Диаметр антенны, м («1,8») */
  antenna: string
  /** ID Vsat */
  topology: string
}>

export const VSAT_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const vsatStatus = (x: Vsat) => VSAT_STATUS[x.status] ?? ["—", "muted" as Tone]

export const VSAT_TYPES = ["SkyEdge II Access", "SkyEdge II Fixed"]

export const vsatName = (x: Vsat) => `VSAT · ${x.f.name}`
export const vsatSub = (x: Vsat) => `${x.f.client} · ${x.f.type} · ${x.f.antenna} м`

export const vsats = createSource<Vsat>({
  key: "vsat",
  title: "ЗССС SkyEdge II GEO",
  name: vsatName,
  seed: () =>
    seedEquip({
      key: "vsat",
      total: 112,
      statuses: Object.keys(VSAT_STATUS),
      gen: (i, r, n) => ({
        num: num(r, 1, 20),
        name: `${pick(r, ["Карагандинская", "Мангистауская", "Атырауская", "Актюбинская", "Туркестанская"])} область, ${pick(r, ["НС-", "Сагиз", "Темир", "м/р "])}${num(r, 1, 40)}`,
        client: pick(r, ["ТОО «Мангистаумунайгаз»", "АО «Эмбамунайгаз»", "ТОО «КазМунайГаз»"]),
        type: r() > 0.2 ? "SkyEdge II Access" : "SkyEdge II Fixed",
        antenna: pick(r, ["1,8", "2,4"]),
        topology: String(pick(r, [2022, 2024, 2061, 3102, 3220, 3223])),
        // Узел примера — как в прежнем описании раздела (в паспорте не используется)
        _n: n.id,
      }),
    }),
  remote: genApi<Vsat["f"]>({
    base: "/api/triple_s",
    trashKey: "tripleS",
    fields: { name: "name", client: "client", type: "terminal_type", antenna: "antenna_size", topology: "topology" },
    filter: { client: "client" },
  }),
})

export const useVsats = vsats.useAll
export const useVsat = vsats.useRecord

export const blankVsat = (): Vsat => blankEquip("work", { name: "", client: "", type: "", antenna: "", topology: "" })

/** Колонки отчёта и аналитики заполненности — все поля станции. */
export const vsatColumns: ReportCol<Vsat>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "name", t: "Наименование", value: (x) => x.f.name },
  { k: "client", t: "Клиент", value: (x) => x.f.client },
  { k: "type", t: "Тип", value: (x) => x.f.type },
  { k: "antenna", t: "Антенна, м", value: (x) => x.f.antenna },
  { k: "topology", t: "Topology", value: (x) => x.f.topology },
]

/** Импорт Excel: поля — как в форме. */
export const vsatImport: ImportSpec<Vsat> = {
  key: "vsat",
  title: "ЗССС SkyEdge II GEO",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "name", t: "Наименование" },
    { k: "client", t: "Клиент" },
    { k: "type", t: "Тип", opts: VSAT_TYPES.map((v) => ({ v, label: v })) },
    { k: "antenna", t: "Антенна, м" },
    { k: "topology", t: "Topology" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(VSAT_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankVsat(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, name: str("name"), client: str("client"), type: str("type"), antenna: str("antenna"), topology: str("topology") },
      },
      Number(v.nodeId),
    )
  },
  name: vsatName,
  all: vsats.all,
  nextId: vsats.nextId,
  save: vsats.save,
}

/* ---------- паспорт ---------- */

/**
 * Документы, фото и история станции (общий шаблон оборудования). TODO(API): документы и история — пока примеры по номеру записи.
 */
export const vsatDetail = (x: Vsat): LineDetail =>
  lineDetail(x, {
    section: "vsat",
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
    lastEdit: () => ["Изменено «MIR, Outbound»", "2 048", "4 096"],
  })
