import type { ReportCol } from "@/components/blocks/report-dialog"
import type { Tone } from "@/components/list/ui"
import type { ImportField } from "@/lib/list/import-file"
import { BRANCHES, nodeRows } from "@/sections/nodes/data"
import type { PortState } from "@/sections/nodes/detail"
import { BRANCH_FULL, nodeOptions } from "./equipment"
import { filialId } from "./session"
import { ASTANA, branchOf, coords, n, s } from "./helpers"
import type { RemoteSource } from "./remote"

/*
 * 03–04 Оборудование СПД (коммутаторы и маршрутизаторы) — общие данные обоих разделов: тип записи, примеры по таблице
 * `spd_equipments` (порты — `spd_equipment_ports`), статусы, источник API, колонки отчёта, поля импорта.
 * Источники и хуки — lib/api/switches.ts и lib/api/routers.ts; демо-детали паспорта — lib/api/spd-detail.ts.
 * Первые 10 коммутаторов — из макета 03, остальные сгенерированы.
 */

export type SpdKind = "switch" | "router"

export type SpdRow = {
  id: number
  num: number
  kind: "switch" | "router"
  host: string
  vendor: string
  model: string
  serial: string
  os: string
  ip: string
  branch: string
  nodeId: number
  nodeCode: string
  city: string
  address: string
  network: "ГМС" | "ГРС" | "ГАС" | "МС"
  status: "work" | "repair" | "off"
  portsUsed: number
  portsTotal: number
  /** Дней до конца сервисного контракта SmartNET; null — контракта нет */
  smartnet: number | null
  contract: string
  mol: string | null
  backup: boolean
  /** Дата ввода в эксплуатацию */
  since: string
  /** BGP-сессии: поднято / всего (маршрутизаторы) */
  bgp: [number, number]
  /** Координаты узла связи */
  ll: [number, number]
  /* Комплектация, ввод и сервис — пока только из формы (TODO(API): комплектация — отдельная таблица) */
  slot?: string
  board?: string
  boardSn?: string
  port?: string
  module?: string
  moduleSn?: string
  /** Номер и дата Акта о вводе в эксплуатацию */
  act?: string
  /** Дата завершения контракта SmartNET, ДД.ММ.ГГГГ */
  contractEnd?: string
  note?: string
}

const MODELS: Record<SpdRow["kind"], [vendor: string, model: string, ports: number, os: string][]> = {
  switch: [
    ["Extreme", "X440-24t", 28, "ExtremeXOS 22.6.1.4"],
    ["D-Link", "DGS-1100-10/ME", 28, "DGS 1.10.010"],
    ["Extreme", "X430-24t", 28, "ExtremeXOS 22.4.1"],
    ["Cisco", "SF220-24-K9", 28, "1.1.4.1"],
    ["Extreme", "X460-24x", 52, "ExtremeXOS 22.6.1.4"],
    ["D-Link", "DGS-1100-05", 28, "DGS 1.00.010"],
    ["Cisco", "WS-C2960-24TC-S", 26, "IOS 15.0(2)SE11"],
    ["Extreme", "X440G2-24x-10G4", 28, "ExtremeXOS 30.7"],
    ["Eltex", "SLM224GT", 28, "4.0.12"],
    ["D-Link", "DGS-1100-10/ME", 52, "DGS 1.10.010"],
  ],
  router: [
    ["Cisco", "ASR 1006", 9, "IOS-XE 16.9"],
    ["Cisco", "ASR 9001", 12, "IOS-XE 16.12"],
    ["Cisco", "Cisco 881-K9", 4, "IOS-XE 17.3"],
    ["Cisco", "Cisco 7206VXR", 9, "IOS-XE 16.9"],
    ["Cisco", "Cisco 1941", 4, "IOS-XE 17.3"],
    ["Cisco", "ISR4431", 8, "IOS-XE 17.6"],
  ],
}

const SEED_SW: Partial<SpdRow>[] = [
  {
    host: "sw2.atr2",
    model: "X440-24t",
    nodeCode: "atr002.02.ZF",
    branch: "ЮФ",
    city: "г. Алматы",
    address: "пр. Абулхаир Хана, 45",
    network: "ГМС",
    ip: "10.13.93.x",
    portsUsed: 20,
    portsTotal: 28,
  },
  {
    host: "sw1.pvl53",
    model: "DGS-1100-10/ME",
    nodeCode: "pvl001.01.VF",
    branch: "ВФ",
    city: "г. Павлодар",
    address: "ул. Ак. Бектурова, 2",
    network: "ГАС",
    ip: "192.168.78.152",
    portsUsed: 14,
    portsTotal: 28,
  },
  {
    host: "sw1.akb1",
    model: "X430-24t",
    nodeCode: "akb001.01.AF",
    branch: "АФ",
    city: "г. Актобе",
    address: "ж/м Коктем, 516Б",
    network: "ГРС",
    ip: "192.168.20.2",
    portsUsed: 22,
    portsTotal: 28,
  },
  {
    host: "sw2.aks1",
    model: "SF220-24-K9",
    nodeCode: "aks001.01.UF",
    branch: "УФ",
    city: "г. Аксай",
    address: "Промзона, 158Н",
    network: "ГРС",
    ip: "10.12.13.2",
    portsUsed: 9,
    portsTotal: 28,
  },
  {
    host: "sw15.akt1",
    model: "X460-24x",
    nodeCode: "akt001.01.MF",
    branch: "МФ",
    city: "г. Актау",
    address: "43.649392, 51.177749",
    network: "МС",
    ip: "10.13.7.2",
    portsUsed: 40,
    portsTotal: 52,
  },
  {
    host: "sw1.aks1",
    model: "DGS-1100-05",
    nodeCode: "aks001.01.UF",
    branch: "УФ",
    city: "г. Аксай",
    address: "Промзона, 158Н",
    network: "ГМС",
    ip: "10.12.13.13",
    portsUsed: 12,
    portsTotal: 28,
  },
  {
    host: "sw0.kbd0",
    model: "WS-C2960-24TC-S",
    nodeCode: "kbd001.01.AF",
    branch: "АФ",
    city: "Кобда",
    address: "KAZ10, Кобда",
    network: "ГМС",
    ip: "192.168.105.16",
    portsUsed: 5,
    portsTotal: 26,
  },
  {
    host: "sw6.ast1",
    model: "X440G2-24x-10G4",
    nodeCode: "ast001.01.AS",
    branch: "АС",
    city: "Астана",
    address: "Коргалжынское ш., 4/2",
    network: "ГРС",
    ip: "10.13.93.x",
    portsUsed: 26,
    portsTotal: 28,
  },
  {
    host: "sw3.alm1",
    model: "SLM224GT",
    nodeCode: "atr002.02.ZF",
    branch: "ЮФ",
    city: "г. Алматы",
    address: "пр. Абулхаир Хана, 45",
    network: "ГРС",
    ip: "217.196.19.x3",
    portsUsed: 17,
    portsTotal: 28,
  },
  {
    host: "sw2.shm7",
    model: "DGS-1100-10/ME",
    nodeCode: "shm007.03.SF",
    branch: "ШФ",
    city: "г. Шымкент",
    address: "42.312034, 69.525305",
    network: "ГРС",
    ip: "192.168.17.14",
    portsUsed: 31,
    portsTotal: 52,
  },
]

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const cache: Partial<Record<SpdRow["kind"], SpdRow[]>> = {}

/** Коммутаторы — 1 324, маршрутизаторы — 78 (KPI макетов 03 и 04). */
export function spdRows(kind: SpdRow["kind"]): SpdRow[] {
  if (cache[kind]) return cache[kind]
  const r = rng(kind === "switch" ? 31 : 47)
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)]
  const nodes = nodeRows()
  const total = kind === "switch" ? 1324 : 78
  const rows: SpdRow[] = []
  for (let i = 0; i < total; i++) {
    const seed = kind === "switch" ? SEED_SW[i] : undefined
    const n = seed ? (nodes.find((x) => x.code === seed.nodeCode) ?? pick(nodes)) : pick(nodes)
    const [vendor, model, ports, os] = seed
      ? (MODELS.switch.find((m) => m[1] === seed.model && m[2] === seed.portsTotal) ?? MODELS.switch[0])
      : pick(MODELS[kind])
    // загрузка 50–92% (в среднем ~71%, > 90% — примерно у 5%), как в KPI макета
    const used = Math.max(1, Math.min(ports, Math.round(ports * (0.5 + r() * 0.42))))
    const city = n.city
    rows.push({
      id: i + 1,
      num: i + 1,
      kind,
      host: `${kind === "switch" ? "sw" : pick(["rt", "gw", "bb"])}${Math.floor(r() * 9) + (kind === "switch" ? 0 : 1)}.${n.code.slice(0, 3)}${1 + Math.floor(r() * 60)}`,
      vendor,
      model,
      serial: `${pick(["FOC", "1329N-", "SG", "QB"])}${Math.floor(1e4 + r() * 9e4)}${pick(["Y20E", "", "K", "ME"])}`,
      os,
      ip: `${pick(["10.13", "10.12", "192.168"])}.${Math.floor(r() * 250)}.${Math.floor(r() * 250)}`,
      branch: n.branch,
      nodeId: n.id,
      nodeCode: n.code,
      ll: n.ll,
      city: `г. ${city}`,
      address: n.address.replace(/^(г\.|с\.) [^,]+, /, ""),
      network: n.network,
      status: r() > 0.96 ? "repair" : r() > 0.985 ? "off" : "work",
      portsUsed: used,
      portsTotal: ports,
      smartnet: vendor === "Cisco" || vendor === "Extreme" ? (r() < 0.047 ? Math.floor(r() * 90) : 90 + Math.floor(r() * 900)) : null,
      contract: `№ ${204500000 + Math.floor(r() * 99999)}`,
      mol: r() > 0.69 ? pick(["Борис Б. Дегтярь", "Айгерим Т. Кенжебаева", "Ербол М. Садыков"]) : null,
      backup: r() > 0.02,
      bgp: ((t: number) => [r() > 0.96 ? t - 1 : t, t] as [number, number])(1 + Math.floor(r() * 4)),
      since: `${String(1 + Math.floor(r() * 28)).padStart(2, "0")}.${String(1 + Math.floor(r() * 12)).padStart(2, "0")}.${2016 + Math.floor(r() * 9)}`,
      ...seed,
    } as SpdRow)
  }
  cache[kind] = rows
  return rows
}

/** Порты устройства по порядку: down — каждый ~13-й, SFP — последние 4 (X1…X4). */
export function portList(x: SpdRow): { n: string; state: PortState }[] {
  const copper = x.portsTotal - 4
  const list = Array.from({ length: copper }, (_, i): { n: string; state: PortState } => ({
    n: String(i + 1),
    state: i < x.portsUsed - 2 ? ((i * 7 + x.id) % 13 === 6 ? "down" : "up") : "free",
  }))
  return [...list, ...["X1", "X2", "X3", "X4"].map((n, i): { n: string; state: PortState } => ({ n, state: i < 2 ? "sfp" : "free" }))]
}


export const branchFull = (v: string) => BRANCHES.find((b) => b.v === v)?.full ?? v

/* ---------- статусы, справочники ---------- */

export const SPD_STATUS: Record<SpdRow["status"], [string, Tone]> = { work: ["В работе", "ok"], repair: ["Ремонт", "warn"], off: ["Выведен", "bad"] }
export const spdStatus = (x: SpdRow): [string, Tone] => SPD_STATUS[x.status] ?? ["—", "muted"]

export const SPD_NETWORKS = ["ГМС", "ГРС", "ГАС", "МС"] as const

/** Процент «занято / всего» и цвет полосы загрузки портов. */
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
export const loadColor = (p: number) => (p > 90 ? "#ff5257" : p > 75 ? "#ffc24a" : "#085eff")

/** Флаги «Ещё фильтров» и KPI. */
export const isHot = (x: SpdRow) => pct(x.portsUsed, x.portsTotal) > 90
export const smartnetExpiring = (x: SpdRow) => x.smartnet !== null && x.smartnet <= 90

export const spdName = (x: SpdRow) => x.host
/** Подзаголовок карточки и QR: «X440-24t · atr002.02.ZF · г. Алматы» */
export const spdSub = (x: SpdRow) => `${x.model} · ${x.nodeCode} · ${x.city}`
/** Ссылка QR-наклейки. TODO: адрес короткой ссылки — от бэкенда. */
export const spdQrUrl = (x: SpdRow) => `https://estu.qmobile.kz/q/${x.host}`

/** Удаление: что станет со связанными записями и быстрые причины. */
export const SPD_REMOVE = {
  warning: "Порты, под-оборудование и привязки ID-каналов останутся в истории, но устройство пропадёт из узла связи.",
  reasons: ["Демонтаж", "Замена на новое", "Передано на склад ЗИП", "Дубликат записи", "Ошибка ввода"],
}

/** Привязать к узлу связи: код УС, город и адрес — от узла (координаты остаются). */
export function spdWithNode(x: SpdRow, nodeId: number): SpdRow {
  const nd = nodeRows().find((o) => o.id === nodeId)
  return nd ? { ...x, nodeId: nd.id, nodeCode: nd.code, city: `г. ${nd.city}`, address: nd.address.replace(/^(г\.|с\.) [^,]+, /, "") } : x
}

/** Пустая запись для формы создания. */
export const blankSpd = (kind: SpdKind): SpdRow => ({
  id: 0,
  num: 0,
  kind,
  host: "",
  vendor: "",
  model: "",
  serial: "",
  os: "",
  ip: "",
  branch: "",
  nodeId: 0,
  nodeCode: "",
  city: "",
  address: "",
  ll: [51.1282, 71.4304],
  network: "" as SpdRow["network"],
  status: "work",
  portsUsed: 0,
  portsTotal: kind === "switch" ? 28 : 8,
  smartnet: null,
  contract: "",
  mol: null,
  backup: false,
  bgp: [0, 0],
  since: new Date().toLocaleDateString("ru-RU"),
})

/* ---------- проверки полей формы и импорта ---------- */

export const checkIp = (v: string) =>
  /^(\d{1,3}\.){3}(\d{1,3}|x)(\/\d{1,2})?$/.test(String(v).trim()) ? undefined : "Неверный формат: нужна маска, например 192.168.1.10/24"
export const checkDate = (v: string) => (/^\d{2}\.\d{2}\.\d{4}$/.test(String(v)) ? undefined : "Формат дд.мм.гггг")

/* ---------- API техучёта ---------- */

/** /api/spd-equipments (/filter, /pasport?equipment_id=, /create, /update), удаление — /api/trash/soft-delete/spd_equipments. */
export const spdRemote = (kind: SpdKind): RemoteSource<SpdRow> => ({
  base: "/api/spd-equipments",
  idParam: "equipment_id",
  trashKey: "spd_equipments",
  // TODO(API): как старый фронт отделяет коммутаторы от маршрутизаторов в /filter — предполагаем equipment_type
  fixed: { equipment_type: kind },
  sort: { branch: "filial_id", host: "domain_name", nodeCode: "node_id", city: "city", network: "network_type", ip: "management_ip" },
  filter: { branch: "filial", network: "network_type", model: "model", vendor: "vendor" },
  map: (o) => {
    const ll = coords(o)
    const total = n(o, "total_ports") || n(o, "ports_count") || (kind === "switch" ? 28 : 8)
    return {
      id: n(o, "id"),
      num: n(o, "number"),
      kind,
      host: s(o, "domain_name"),
      vendor: s(o, "vendor", ""),
      model: s(o, "model", s(o, "equipment_model")),
      serial: s(o, "serial_number"),
      os: s(o, "os_type", s(o, "software_version")),
      ip: s(o, "management_ip"),
      branch: branchOf(o),
      nodeId: n(o, "node_id") || n(o, "node.id"),
      nodeCode: s(o, "node.nodes_name_id"),
      city: s(o, "city"),
      address: s(o, "node_address"),
      network: s(o, "network_type", "") as SpdRow["network"],
      status: "work",
      // TODO(API): занятость портов — /api/spd-equipments/{id}/port-capacity, в списке нет
      portsUsed: n(o, "used_ports"),
      portsTotal: total,
      smartnet: null,
      contract: s(o, "contract_number", ""),
      mol: s(o, "mol.name", "") || null,
      backup: false,
      bgp: [0, 0],
      since: s(o, "created_at", "").slice(0, 10).split("-").reverse().join("."),
      ll: ll ?? ASTANA,
    }
  },
  payload: (x) => ({
    filial_id: filialId(x.branch),
    node_id: x.nodeId,
    number: x.num,
    network_type: x.network,
    equipment_type: x.kind,
    domain_name: x.host,
    management_ip: x.ip,
    model: x.model,
    os_type: x.os,
    serial_number: x.serial,
  }),
})

/* ---------- отчёт и импорт ---------- */

/** Колонки отчёта (n-08) и аналитики заполненности — одинаковые у коммутаторов и маршрутизаторов. */
export const spdColumns: ReportCol<SpdRow>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "num", t: "Нумерация", value: (x) => x.num },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "city", t: "Населённый пункт", value: (x) => x.city },
  { k: "address", t: "Адрес узла связи", value: (x) => x.address },
  { k: "network", t: "Тип сети", value: (x) => x.network },
  { k: "host", t: "Hostname", value: (x) => x.host },
  { k: "ip", t: "IP-адрес", value: (x) => x.ip },
  { k: "model", t: "Модель", value: (x) => `${x.vendor} ${x.model}` },
  { k: "serial", t: "S/N", value: (x) => x.serial },
  { k: "ports", t: "Порты (занято / всего)", value: (x) => `${x.portsUsed}/${x.portsTotal}` },
  { k: "os", t: "ОС / прошивка", value: (x) => x.os, off: true },
  { k: "smartnet", t: "SmartNET, дней", value: (x) => x.smartnet ?? "—", off: true },
  { k: "mol", t: "МОЛ", value: (x) => x.mol ?? "—", off: true },
]

/** Дата записи для «Периода» отчёта. */
export const spdDate = (x: SpdRow) => x.since

/** Поля импорта Excel — как в форме (подписи = заголовки столбцов). */
export const spdImportFields = (): ImportField[] => [
  { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
  { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
  { k: "num", t: "Нумерация", required: true },
  { k: "network", t: "Тип сети", required: true, opts: SPD_NETWORKS.map((v) => ({ v, label: v })) },
  {
    k: "kind",
    t: "Тип оборудования",
    required: true,
    opts: [
      { v: "switch", label: "switch" },
      { v: "router", label: "router" },
    ],
  },
  { k: "host", t: "Hostname", required: true },
  { k: "ip", t: "IP-адрес управления (X.X.X.X/Y)", required: true, check: checkIp },
  { k: "model", t: "Модель оборудования", required: true },
  { k: "os", t: "Тип ОС / версия прошивки" },
  { k: "serial", t: "Серийный номер S/N" },
  { k: "slot", t: "№ слота" },
  { k: "board", t: "Модель платы" },
  { k: "boardSn", t: "S/N платы" },
  { k: "port", t: "№ порта" },
  { k: "module", t: "Тип модуля" },
  { k: "moduleSn", t: "S/N модуля" },
  { k: "act", t: "Номер и дата Акта о вводе в эксплуатацию" },
  { k: "contract", t: "Contract Number (SmartNET)" },
  { k: "contractEnd", t: "Дата завершения", check: checkDate },
  { k: "note", t: "Примечание" },
]

/** Значения формы / строки импорта → запись (поверх `base`). */
export function spdFromValues(base: SpdRow, v: Record<string, string | string[] | undefined>): SpdRow {
  const str = (k: string) => String(v[k] ?? "")
  const next: SpdRow = {
    ...base,
    branch: str("branch"),
    num: Number(str("num")) || 0,
    network: str("network") as SpdRow["network"],
    kind: (str("kind") || base.kind) as SpdKind,
    host: str("host"),
    ip: str("ip"),
    model: str("model"),
    os: str("os"),
    serial: str("serial"),
    slot: str("slot"),
    board: str("board"),
    boardSn: str("boardSn"),
    port: str("port"),
    module: str("module"),
    moduleSn: str("moduleSn"),
    act: str("act"),
    contract: str("contract"),
    contractEnd: str("contractEnd"),
    note: str("note"),
  }
  return spdWithNode(next, Number(str("nodeId")))
}
