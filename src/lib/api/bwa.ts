"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pair, pick, seedEquip, used, withNode, type Equip } from "./equipment"
import { genApi, pairOf } from "./helpers"
import { createSource } from "./source"

/*
 * БШД (макеты 27–29: WiMAX, Telrad LTE, WLL) — общее для трёх разделов: запись, статусы, генератор примеров,
 * источник API (/api/bhd-*-equipments), колонки отчёта, импорт, демо-детали паспорта. Разделы — lib/api/bwa-<x>.ts.
 * TODO(API): азимуты, ширина полосы, РЧС, абонентские станции — нет в /api/bhd-*.
 */

export type Bwa = Equip<{
  /** Модель базовой станции */
  model: string
  /** Адрес установки */
  place: string
  /** Абоненты / лицензии «45 / 64» */
  subs: string
  /** Сектора (в примерах — число) */
  sectors: string | number
  /** Частота, МГц */
  freq: string
  vendor: string
  network: string
  serial: string
}>

export const BWA_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const bwaStatus = (x: Bwa) => BWA_STATUS[x.status] ?? ["—", "muted" as Tone]

export const NETWORKS = ["ГМС", "ГРС", "ГАС", "МС"]

export const bwaName = (x: Bwa) => `БС ${x.f.model}`
export const bwaSub = (x: Bwa) => `${x.nodeCode} · ${x.f.subs} абонентов`

/** «8 / 24» или «—» — иначе ошибка формата. */
export const checkPair = (v: string) => (pair(v) || v === "—" ? undefined : "Формат: 8 / 24")

/** Источник раздела БШД: примеры — те же, что строил движок (`sections/bwa.tsx`), API — /api/bhd-<x>-equipments. */
export function bwaSource(o: { key: string; title: string; total: number; models: string[]; vendors: string[]; base: string; trashKey: string }) {
  return createSource<Bwa>({
    key: o.key,
    title: o.title,
    name: bwaName,
    seed: () =>
      seedEquip({
        key: o.key,
        total: o.total,
        statuses: Object.keys(BWA_STATUS),
        gen: (i, r, n) => ({
          num: `${num(r, 1, 6)}.${num(r, 1, 5)}`,
          model: pick(r, o.models),
          place: r() > 0.4 ? n.address : "—",
          subs: used(r, pick(r, [32, 64, 128, 256]), 0.7),
          sectors: num(r, 1, 6),
          freq: String(pick(r, [3403, 3415, 3509, 3610, 3680, 3750, 5330, 5020])),
          vendor: pick(r, o.vendors),
          network: n.network,
          serial: `${num(r, 100000, 999999)}C8B${num(r, 100, 999)}`,
        }),
      }),
    remote: genApi<Bwa["f"]>({
      base: o.base,
      trashKey: o.trashKey,
      fields: {
        model: "model",
        vendor: "vendor",
        sectors: "sector_number",
        serial: "serial_number",
        subs: pairOf("subscribers", "licenses"),
        freq: "frequency",
        place: "installation_address",
        network: "network_type",
      },
      filter: { vendor: "vendor", network: "network_type", model: "model" },
    }),
  })
}

export type BwaSource = ReturnType<typeof bwaSource>

export const blankBwa = (): Bwa =>
  blankEquip("work", { model: "", place: "", subs: "", sectors: "", freq: "", vendor: "", network: "", serial: "" })

const v = (x: string | number | undefined) => x ?? "—"

/** Колонки отчёта и аналитики заполненности — все поля БС. */
export const bwaColumns: ReportCol<Bwa>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "model", t: "Базовая станция", value: (x) => v(x.f.model) },
  { k: "place", t: "Адрес установки", value: (x) => v(x.f.place) },
  { k: "subs", t: "Абоненты / лицензии", value: (x) => v(x.f.subs) },
  { k: "sectors", t: "Сектора", value: (x) => v(x.f.sectors) },
  { k: "freq", t: "Частота, МГц", value: (x) => v(x.f.freq) },
  { k: "vendor", t: "Вендор", value: (x) => v(x.f.vendor) },
  { k: "network", t: "Тип сети", value: (x) => v(x.f.network) },
  { k: "serial", t: "Серийный номер", value: (x) => v(x.f.serial) },
]

/** Импорт Excel: поля — как в форме. */
export function bwaImport(src: BwaSource, o: { key: string; title: string; vendors: string[] }): ImportSpec<Bwa> {
  return {
    key: o.key,
    title: o.title,
    fields: [
      { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
      { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
      { k: "model", t: "Базовая станция" },
      { k: "place", t: "Адрес установки" },
      { k: "subs", t: "Абоненты / лицензии", check: checkPair },
      { k: "sectors", t: "Сектора" },
      { k: "freq", t: "Частота, МГц" },
      { k: "vendor", t: "Вендор", opts: o.vendors.map((x) => ({ v: x, label: x })) },
      { k: "network", t: "Тип сети", opts: NETWORKS.map((x) => ({ v: x, label: x })) },
      { k: "serial", t: "Серийный номер" },
      { k: "status", t: "Статус", required: true, opts: Object.entries(BWA_STATUS).map(([k, [label]]) => ({ v: k, label })) },
    ],
    build: (val, base, id = 0) => {
      const x = base ?? { ...blankBwa(), num: String(id) }
      const str = (k: string) => String(val[k] ?? "")
      return withNode(
        {
          ...x,
          branch: str("branch"),
          status: str("status") || x.status,
          f: {
            ...x.f,
            model: str("model"),
            place: str("place"),
            subs: str("subs"),
            sectors: str("sectors"),
            freq: str("freq"),
            vendor: str("vendor"),
            network: str("network"),
            serial: str("serial"),
          },
        },
        Number(val.nodeId),
      )
    },
    name: bwaName,
    all: src.all,
    nextId: src.nextId,
    save: src.save,
  }
}

/* ---------- паспорт ---------- */

/** Чем разделы БШД отличаются в паспорте: дальность покрытия, ширина полосы и полное имя вендора. */
export type BwaParams = { km: number; band: number; vendor: string }

/** Абоненты (z) и лицензии (m) из «45 / 64». */
export const bwaSubs = (x: Bwa) => {
  const [a, b] = String(x.f.subs ?? "0 / 64")
    .split(" / ")
    .map(Number)
  return { z: a || 0, m: b || 64 }
}
export const bwaSectors = (x: Bwa) => Math.min(6, Math.max(1, Number(x.f.sectors) || 3))
/** Ширина сектора, ° */
export const bwaWidth = (x: Bwa) => Math.round(360 / bwaSectors(x))
export const bwaAzimuth = (x: Bwa) =>
  Array.from({ length: bwaSectors(x) }, (_, i) => (i * bwaWidth(x) + (bwaSectors(x) === 4 ? 30 : 0)) % 360).join(" / ")

export const RCS = "№ 14-РЧС/0912"
/** Абонентские станции — пример (TODO(API): нет в /api/bhd-*). */
export const STATIONS = [
  { type: "БС", rcs: RCS, place: "ул. Сыганак, 18", client: "—" },
  { type: "АК", rcs: "—", place: "ул. Сыганак, 40, кв. 12", client: "Ахметов Б." },
  { type: "АК", rcs: "—", place: "ТОО «Тарлан», офис", client: "ТОО «Тарлан»" },
  { type: "АК", rcs: "—", place: "ИП «Сапарова А.»", client: "ИП «Сапарова А.»" },
]

/** Инвентарный номер — пример по id записи. */
export const bwaInv = (x: Bwa) => `05-${String(x.id).padStart(10, "0")}`

/** Точка между участками (для карты паспорта): у оборудования — «Плата N». */
export const bwaPoint = (i: number) => `Плата ${i + 1}`

const DOCS = [
  { name: "Паспорт оборудования", req: "PDF · производитель", uploaded: true },
  { name: "Номер и дата акта о вводе в эксплуатацию", req: "№ 154 от 12.03.2019", uploaded: true },
  { name: "Распоряжение / наряд", req: "№ 007-р", uploaded: true },
  { name: "Схема подключения", req: "—", uploaded: false },
]

/** Документы, фото, история и точка на карте для паспорта. TODO(API): документы и история — пока примеры. */
export const bwaDetail = (section: string, x: Bwa): LineDetail =>
  lineDetail(x, {
    section,
    point: bwaPoint,
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
    lastEdit: (_, r) => {
      const z = bwaSubs(r as Bwa).z
      return ["Изменено «Абонентов»", String(Math.max(0, z - 6)), String(z)]
    },
  })
