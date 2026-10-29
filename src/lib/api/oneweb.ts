"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/lib/api/lines"

/*
 * 32 OneWeb LEO — данные раздела. Без API — примеры в памяти вкладки (первые 4 — из макета).
 * API техучёта: /api/oneweb (/filter, /pasport, /create, /update), удаление — /api/trash/soft-delete/one_web.
 */

export type OneWeb = Equip<{
  station: string
  /** Тип терминала: «Hughes HL1120W», «Hughes HL1100W» */
  terminal: string
  /** Клиент — населённый пункт («с. Чапурино») */
  client: string
  /** Категория: «COTM», «Fixed» */
  category: string
  oblast: string
  ip: string
}>

export const ONEWEB_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  test: ["Тест", "warn"],
  off: ["Отключена", "bad"],
}
export const onewebStatus = (x: OneWeb) => ONEWEB_STATUS[x.status] ?? ["—", "muted" as Tone]

export const ONEWEB_CATEGORIES = ["COTM", "Fixed"]

export const onewebName = (x: OneWeb) => String(x.f.station)
export const onewebSub = (x: OneWeb) => `${x.f.client} · ${x.f.terminal}`

const SEED: Record<string, Val>[] = [
  { num: 31, branch: "УФ", station: "SNP-Chapurino", terminal: "Hughes HL1120W", client: "с. Чапурино", category: "COTM" },
  { num: 1, branch: "КФ", station: "SNP-Zhanakurylys", terminal: "Hughes HL1120W", client: "с. Жанакурылыс", category: "COTM" },
  { num: 6, branch: "ШФ", station: "SNP-Darbaza", terminal: "Hughes HL1120W", client: "с. Дарбаза", category: "COTM" },
  { num: 34, branch: "ВФ", station: "SNP-Bogatyrevo-Vko", terminal: "Hughes HL1100W", client: "с. Богатырево", category: "Fixed" },
]

export const onewebs = createSource<OneWeb>({
  key: "oneweb",
  title: "OneWeb LEO",
  name: onewebName,
  seed: () =>
    seedEquip({
      key: "oneweb",
      total: 442,
      statuses: Object.keys(ONEWEB_STATUS),
      seed: SEED,
      gen: (i, r) => {
        const v = pick(r, ["Tassay", "Gornoe", "Akkol", "Shieli", "Karabulak", "Zhanatas"])
        return {
          num: i + 1,
          station: `SNP-${v}`,
          terminal: pick(r, ["Hughes HL1120W", "Hughes HL1100W"]),
          client: `с. ${v}`,
          category: r() > 0.4 ? "COTM" : "Fixed",
          oblast: pick(r, ["Кызылординская", "Акмолинская", "Туркестанская", "ВКО"]),
          ip: `10.${num(r, 60, 70)}.${num(r, 1, 250)}.${num(r, 1, 250)}`,
          status: r() > 0.09 ? "work" : "test",
        }
      },
    }),
  remote: genApi<OneWeb["f"]>({
    base: "/api/oneweb",
    trashKey: "one_web",
    fields: {
      station: "station_name",
      terminal: "terminal_type",
      client: "client",
      category: "category",
      oblast: "oblast",
      ip: "ip_address",
    },
    status: (o) => (/тест|test/i.test(s(o, "station_status", "")) ? "test" : /откл|off|inactive/i.test(s(o, "station_status", "")) ? "off" : "work"),
    filter: { oblast: "oblast", category: "category" },
  }),
})

export const useOneWebs = onewebs.useAll
export const useOneWeb = onewebs.useRecord

export const blankOneWeb = (): OneWeb => blankEquip("work", { station: "", terminal: "", client: "", category: "", oblast: "", ip: "" })

/** Колонки отчёта и аналитики заполненности — все поля станции. */
export const onewebColumns: ReportCol<OneWeb>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "station", t: "Станция", value: (x) => x.f.station },
  { k: "terminal", t: "Терминал", value: (x) => x.f.terminal },
  { k: "client", t: "Клиент", value: (x) => x.f.client },
  { k: "category", t: "Категория", value: (x) => x.f.category },
  { k: "oblast", t: "Область", value: (x) => x.f.oblast },
  { k: "ip", t: "IP address", value: (x) => x.f.ip },
]

/** Импорт Excel: поля — как в форме. */
export const onewebImport: ImportSpec<OneWeb> = {
  key: "oneweb",
  title: "OneWeb LEO",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "station", t: "Станция" },
    { k: "terminal", t: "Терминал" },
    { k: "client", t: "Клиент" },
    { k: "category", t: "Категория", opts: ONEWEB_CATEGORIES.map((v) => ({ v, label: v })) },
    { k: "oblast", t: "Область" },
    { k: "ip", t: "IP address" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(ONEWEB_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankOneWeb(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: {
          ...x.f,
          station: str("station"),
          terminal: str("terminal"),
          client: str("client"),
          category: str("category"),
          oblast: str("oblast"),
          ip: str("ip"),
        },
      },
      Number(v.nodeId),
    )
  },
  name: onewebName,
  all: onewebs.all,
  nextId: onewebs.nextId,
  save: onewebs.save,
}

/* ---------- паспорт ---------- */

/**
 * Документы, фото и история станции (общий шаблон оборудования). TODO(API): документы и история — пока примеры по номеру записи.
 */
export const onewebDetail = (x: OneWeb): LineDetail =>
  lineDetail(x, {
    section: "oneweb",
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
    lastEdit: () => ["Изменён статус станции", "Тест", "В работе"],
  })
