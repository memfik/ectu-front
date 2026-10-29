"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, km, nodeOptions, pick, seedEquip, withNode, type Equip } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"

/*
 * 26 Радиомосты — данные раздела. Без API — примеры в памяти вкладки (первые 4 — из макета).
 * API техучёта: /api/radio-equipments, удаление — /api/trash/soft-delete/radio_equipments.
 */

export type RadioBridge = Equip<{
  /** «УС → точка клиента» */
  route: string
  model: string
  /** Пропускная способность: «20 Мбит/с» */
  bw: string
  network: string
  vendor: string
  /** Протяжённость, км («1,20») */
  len: string
}>

export const RADIO_BRIDGE_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const radioBridgeStatus = (x: RadioBridge) => RADIO_BRIDGE_STATUS[x.status] ?? ["—", "muted" as Tone]

export const NETWORKS = ["ГМС", "ГРС", "ГАС", "МС"]

export const radioBridgeName = (x: RadioBridge) => `Радиомост ${x.nodeCode}`
export const radioBridgeSub = (x: RadioBridge) => `${x.f.route} · ${x.f.model}`

const SEED: Record<string, string | number>[] = [
  {
    num: 135,
    branch: "УФ",
    nodeCode: "url002.01.UF",
    route: "url002.01.UF → Уральскагроснаб, Складские ус…",
    model: "NanoStation M5",
    bw: "20 Мбит/с",
    network: "ГАС",
    vendor: "Ubiquiti",
  },
  {
    num: 136,
    branch: "УФ",
    nodeCode: "url002.01.UF",
    route: "url002.01.UF → улица Промзона Желаево, 37/2",
    model: "NanoStation M5",
    bw: "20 Мбит/с",
    network: "ГАС",
    vendor: "Ubiquiti",
  },
  { num: 20, branch: "МФ", route: "akt007.03.MF → 43.659589, 51.160279", model: "PowerBeam 5AC-500", bw: "до 300 Мбит/с", network: "ГАС", vendor: "Ubiquiti" },
  { num: 15, branch: "ЮФ", route: "alm415.03.YF → пр. Суюнбая 19", model: "PowerBeam 5AC-500", bw: "80 Мбит/с", network: "ГАС", vendor: "Ubiquiti" },
]

export const radioBridges = createSource<RadioBridge>({
  key: "radio-bridges",
  title: "Радиомосты",
  name: radioBridgeName,
  seed: () =>
    seedEquip({
      key: "radio-bridges",
      total: 825,
      statuses: Object.keys(RADIO_BRIDGE_STATUS),
      seed: SEED,
      gen: (i, r, n) => ({
        num: i + 1,
        route: `${n.code} → ${n.address.replace(/^г\. [^,]+, /, "")}`,
        model: pick(r, ["NanoStation M5", "PowerBeam 5AC-500", "LiteBeam 5AC", "Rocket M5"]),
        bw: pick(r, ["20 Мбит/с", "50 Мбит/с", "80 Мбит/с", "до 300 Мбит/с"]),
        network: pick(r, ["ГАС", "ГАС", "ГРС", "ГМС"]),
        vendor: pick(r, ["Ubiquiti", "Ubiquiti", "Mikrotik", "Cambium"]),
        len: km(r, 0.2, 6),
      }),
    }),
  remote: genApi<RadioBridge["f"]>({
    base: "/api/radio-equipments",
    trashKey: "radio_equipments",
    fields: {
      route: (o) => `${s(o, "install_point_1")} → ${s(o, "install_point_2")}`,
      model: "model",
      bw: "throughput_mbps",
      network: "network_type",
      vendor: "vendor",
      len: "route_length_km",
    },
    filter: { network: "network_type", vendor: "vendor", model: "model" },
  }),
})

export const useRadioBridges = radioBridges.useAll
export const useRadioBridge = radioBridges.useRecord

export const blankRadioBridge = (): RadioBridge => blankEquip("work", { route: "", model: "", bw: "", network: "", vendor: "", len: "" })

const v = (x: RadioBridge, k: keyof RadioBridge["f"]) => x.f[k] ?? "—"

/** Колонки отчёта и аналитики заполненности — все поля радиомоста. */
export const radioBridgeColumns: ReportCol<RadioBridge>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "route", t: "Трасса", value: (x) => v(x, "route") },
  { k: "model", t: "Модель", value: (x) => v(x, "model") },
  { k: "bw", t: "Пропускная", value: (x) => v(x, "bw") },
  { k: "network", t: "Тип сети", value: (x) => v(x, "network") },
  { k: "vendor", t: "Вендор", value: (x) => v(x, "vendor") },
  { k: "len", t: "Протяжённость, км", value: (x) => v(x, "len") },
]

/** Импорт Excel: поля — как в форме. */
export const radioBridgesImport: ImportSpec<RadioBridge> = {
  key: "radio-bridges",
  title: "Радиомосты",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "route", t: "Трасса" },
    { k: "model", t: "Модель" },
    { k: "bw", t: "Пропускная" },
    { k: "network", t: "Тип сети", opts: NETWORKS.map((v) => ({ v, label: v })) },
    { k: "vendor", t: "Вендор" },
    { k: "len", t: "Протяжённость, км" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(RADIO_BRIDGE_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankRadioBridge(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, route: str("route"), model: str("model"), bw: str("bw"), network: str("network"), vendor: str("vendor"), len: str("len") },
      },
      Number(v.nodeId),
    )
  },
  name: radioBridgeName,
  all: radioBridges.all,
  nextId: radioBridges.nextId,
  save: radioBridges.save,
}

/* ---------- паспорт ---------- */

/** Протяжённость, км («1,2» — когда нет в записи). */
export const radioBridgeLen = (x: RadioBridge) => String(x.f.len ?? "1,2")
/** Пропускная способность, Мбит/с. */
export const radioBridgeMbps = (x: RadioBridge) => parseInt(String(x.f.bw ?? "20")) || 20

/** TODO(API): частоты, сигнал, РЧС, клиент, услуги — нет в /api/radio-bridges, пока цифры макета. */
export const RADIO_BRIDGE_TX: [number, number] = [5180, 5745]
export const RADIO_BRIDGE_RCS = "№ 21-РЧС/118 от 03.02.2024"
export const RADIO_BRIDGE_CLIENT = "БЦ «Нурлы»"

/**
 * Документы, история и фон-карта паспорта. TODO(API): документы и история — пока примеры по номеру записи.
 */
export const radioBridgeDetail = (x: RadioBridge): LineDetail =>
  lineDetail(x, {
    section: "radio-bridges",
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
    lastEdit: (_, r) => ["Изменена пропускная способность", "10 Мбит/с", String((r as RadioBridge).f.bw ?? "20 Мбит/с")],
  })
