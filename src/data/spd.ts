import { BRANCHES, nodeRows } from "./nodes"
import type { PortState } from "./node-detail"

/*
 * Оборудование СПД (коммутаторы, маршрутизаторы) — пример данных по таблице `spd_equipments`
 * (порты — `spd_equipment_ports`). Первые 10 строк — из макета 03, остальные сгенерированы.
 * TODO: API — GET /api/spd (фильтр по типу switch / router).
 */

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
  /** Координаты узла связи */
  ll: [number, number]
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
    ["Cisco", "CISCO3845", 8, "IOS 15.1(4)M"],
    ["Cisco", "ASR1001-X", 12, "IOS XE 17.3"],
    ["Juniper", "MX204", 8, "Junos 21.4R3"],
    ["MikroTik", "CCR1036-8G-2S+", 10, "RouterOS 7.12"],
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
    const used = Math.max(1, Math.round(ports * (0.5 + r() * 0.42)))
    const city = n.city
    rows.push({
      id: i + 1,
      num: i + 1,
      kind,
      host: `${kind === "switch" ? "sw" : "bb"}${Math.floor(r() * 9) + (kind === "switch" ? 0 : 1)}.${n.code.slice(0, 3)}${1 + Math.floor(r() * 60)}`,
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
