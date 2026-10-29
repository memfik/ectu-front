"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, km, nodeOptions, num, pick, seedEquip, withNode, type Equip } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"

/*
 * 25 РРЛ — данные раздела. Без API — примеры в памяти вкладки (первые 2 пролёта — из макета).
 * API техучёта: /api/rrl-equipments, удаление — /api/trash/soft-delete/rrl_equipments.
 */

export type RrlSpan = Equip<{
  /** «УС А — УС Б» */
  route: string
  model: string
  /** Пропускная способность: «100 Мбит/с» */
  bw: string
  /** Длина пролёта, км («3,95») */
  len: string
  vendor: string
  /** Частота: «18 ГГц» */
  freq: string
}>

export const RRL_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const rrlStatus = (x: RrlSpan) => RRL_STATUS[x.status] ?? ["—", "muted" as Tone]

export const rrlName = (x: RrlSpan) => `РРЛ ${x.f.route}`
export const rrlSub = (x: RrlSpan) => `${x.f.model} · ${x.f.len} км`

const SEED: Record<string, string | number>[] = [
  {
    num: 5,
    branch: "УФ",
    route: "url002.01.UF — url014.03.UF",
    nodeCode: "url002.01.UF",
    model: "ZXMW SR10 S340 18G",
    bw: "100 Мбит/с",
    len: "3,95",
    vendor: "ZTE",
    freq: "18 ГГц",
  },
  {
    num: 12,
    branch: "ЮФ",
    route: "alm016.03.YF — alm003.03.YF",
    model: "Harmony Radio, 23 GHz, 300 Mbps, 1+0, 1xGE",
    bw: "300 Мбит/с",
    len: "7,55",
    vendor: "Nokia",
    freq: "23 ГГц",
  },
]

export const rrlSpans = createSource<RrlSpan>({
  key: "rrl",
  title: "РРЛ",
  name: rrlName,
  seed: () =>
    seedEquip({
      key: "rrl",
      total: 113,
      statuses: Object.keys(RRL_STATUS),
      seed: SEED,
      gen: (i, r, n) => ({
        num: i + 1,
        route: `${n.code} — ${n.code.slice(0, 3)}${String(num(r, 1, 60)).padStart(3, "0")}.0${num(r, 1, 3)}.${n.code.split(".")[2] ?? "AS"}`,
        model: pick(r, ["ZXMW SR10 S340 18G", "OmniBAS-2W, 18 GHz", "Harmony Radio 23 GHz", "Pasolink NEO/c 15GHz"]),
        bw: pick(r, ["100 Мбит/с", "150 Мбит/с", "200 Мбит/с", "300 Мбит/с"]),
        len: km(r, 1, 12),
        vendor: pick(r, ["ZTE", "Intracom", "Nokia", "NEC"]),
        freq: pick(r, ["15 ГГц", "18 ГГц", "23 ГГц"]),
      }),
    }),
  remote: genApi<RrlSpan["f"]>({
    base: "/api/rrl-equipments",
    trashKey: "rrl_equipments",
    fields: {
      route: (o) => `${s(o, "install_point_1")} — ${s(o, "install_point_2")}`,
      model: "model",
      bw: "throughput_mbps",
      len: "route_length_km",
      vendor: "vendor",
      freq: "frequency",
    },
    filter: { vendor: "vendor", model: "model" },
  }),
})

export const useRrlSpans = rrlSpans.useAll
export const useRrlSpan = rrlSpans.useRecord

export const blankRrlSpan = (): RrlSpan => blankEquip("work", { route: "", model: "", bw: "", len: "", vendor: "", freq: "" })

const v = (x: RrlSpan, k: keyof RrlSpan["f"]) => x.f[k] ?? "—"

/** Колонки отчёта и аналитики заполненности — все поля пролёта. */
export const rrlColumns: ReportCol<RrlSpan>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "route", t: "Трасса", value: (x) => v(x, "route") },
  { k: "model", t: "Модель", value: (x) => v(x, "model") },
  { k: "bw", t: "Пропускная", value: (x) => v(x, "bw") },
  { k: "len", t: "Длина, км", value: (x) => v(x, "len") },
  { k: "vendor", t: "Вендор", value: (x) => v(x, "vendor") },
  { k: "freq", t: "Частота", value: (x) => v(x, "freq") },
]

/** Импорт Excel: поля — как в форме. */
export const rrlImport: ImportSpec<RrlSpan> = {
  key: "rrl",
  title: "РРЛ",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "route", t: "Трасса" },
    { k: "model", t: "Модель" },
    { k: "bw", t: "Пропускная" },
    { k: "len", t: "Длина, км" },
    { k: "vendor", t: "Вендор" },
    { k: "freq", t: "Частота" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(RRL_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankRrlSpan(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, route: str("route"), model: str("model"), bw: str("bw"), len: str("len"), vendor: str("vendor"), freq: str("freq") },
      },
      Number(v.nodeId),
    )
  },
  name: rrlName,
  all: rrlSpans.all,
  nextId: rrlSpans.nextId,
  save: rrlSpans.save,
}

/* ---------- паспорт ---------- */

/** Ёмкость: тип, монтировано (m), задействовано (z). */
export type CapRow = { t: string; m: number; z: number }

/** Концы трассы: «УС А», «УС Б». */
export const rrlEnds = (x: RrlSpan) => String(x.f.route ?? "").split(" — ")
/** Пропускная способность, Мбит/с. */
export const rrlMbps = (x: RrlSpan) => parseInt(String(x.f.bw ?? "100")) || 100

/** TODO(API): Tx1/Tx2, RSL/SNR, РЧС, Е1, услуги — нет в /api/rrl, пока цифры макета. */
export const RRL_TX = { tx1: 18340, tx2: 19350 }
export const RRL_RCS = "№ 2/43-926/60786 от 19.01.2022"
export const RRL_CAP: CapRow[] = [
  { t: "Потоки Е1", m: 16, z: 8 },
  { t: "Порты Ethernet", m: 4, z: 2 },
]

/**
 * Документы, история и фон-карта паспорта. TODO(API): документы и история — пока примеры по номеру записи.
 */
export const rrlDetail = (x: RrlSpan): LineDetail =>
  lineDetail(x, {
    section: "rrl",
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
    lastEdit: (_, r) => ["Изменена пропускная способность", "50 Мбит/с", String((r as RrlSpan).f.bw ?? "100 Мбит/с")],
  })
