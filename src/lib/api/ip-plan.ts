"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import { blankEquip, num, pick, seedEquip, type Equip } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"

/*
 * 15 Единый IP-план — данные раздела. Без API — примеры в памяти вкладки (первые 6 адресов из макета).
 * API техучёта: /api/ip-address-plan (/list, /pasport?id=, /create, /update), удаление — /api/trash/soft-delete/ip_address_plans.
 * Дерево подсетей и использование сети — пока примеры (TODO(API): /api/ip-address-plan/tree, нет в старом API).
 */

export type IpAddress = Equip<{
  ip: string
  /** «/30» */
  prefix: string
  client: string
  /** Локация — адрес без города */
  place: string
  speed: string
  /** Номер заявки KCRM */
  kcrm: string
  /** Менеджер / инженер */
  eng: string
}>

export const IP_STATUS: Record<string, [string, Tone]> = {
  active: ["Активен", "ok"],
  test: ["Тест до 15.10", "warn"],
  free: ["Свободен", "muted"],
  mismatch: ["Не совпадает с Onyma", "bad"],
}
export const ipStatus = (x: IpAddress) => IP_STATUS[x.status] ?? ["—", "muted" as Tone]

/** Цвет квадратика у адреса в таблице. */
export const IP_DOT: Record<string, string> = { active: "#085eff", test: "#ffc53d", free: "#5b606b", mismatch: "#ff3b3b" }

export const PREFIXES = ["/30", "/29", "/28", "/24"]

export const ipName = (x: IpAddress) => `${x.f.ip}${x.f.prefix}`
export const ipSub = (x: IpAddress) => `${x.f.client} · ${x.f.place}`

const SEED = [
  { ip: "185.12.40.1", prefix: "/30", client: "ТОО «Авиакомпания Орлан-2000»", place: "Кенесары 52", speed: "100 Мбит/с", kcrm: "88412", eng: "Д. Темирханова", branch: "АС", status: "active" },
  { ip: "185.12.40.5", prefix: "/30", client: "ТОО «Бота-2017»", place: "Кенесары 60", speed: "50 Мбит/с", kcrm: "88120", eng: "Д. Темирханова", branch: "АС", status: "active" },
  { ip: "185.12.40.9", prefix: "/30", client: "ИП «Сапарова А.»", place: "Кенесары 44", speed: "100 Мбит/с", kcrm: "88501", eng: "А. Нурланов", branch: "АС", status: "test" },
  { ip: "185.12.40.13", prefix: "/30", client: "—", place: "—", speed: "—", kcrm: "—", eng: "—", branch: "АС", status: "free" },
  { ip: "185.12.40.16", prefix: "/29", client: "АО «КазТрансКом»", place: "Кенесары 70", speed: "1 Гбит/с", kcrm: "87001", eng: "Е. Сапаров", branch: "АС", status: "active" },
  { ip: "185.12.40.24", prefix: "/30", client: "ГУ «Аким. р-на»", place: "Республики 12", speed: "200 Мбит/с", kcrm: "86020", eng: "Е. Сапаров", branch: "АС", status: "mismatch" },
]

export const ipPlan = createSource<IpAddress>({
  key: "ip-plan",
  title: "Единый IP-план",
  name: ipName,
  seed: () =>
    seedEquip<IpAddress["f"]>({
      key: "ip-plan",
      total: 14703,
      statuses: Object.keys(IP_STATUS),
      seed: SEED,
      gen: (i, r, n) => {
        const free = r() < 0.3
        // статус — в полях записи (seedEquip берёт его оттуда), как в прежнем описании раздела
        const f = {
          ip: `185.${pick(r, [12, 14])}.${32 + Math.floor(i / 64)}.${(i % 64) * 4 + 1}`,
          prefix: pick(r, ["/30", "/30", "/29", "/28"]),
          client: free ? "—" : `${pick(r, ["ТОО", "ИП", "АО"])} «${pick(r, ["Нур", "Самал", "Каспий"])} ${pick(r, ["Групп", "Сервис"])}»`,
          place: free ? "—" : n.address.replace(/^г\. [^,]+, /, ""),
          speed: free ? "—" : pick(r, ["50 Мбит/с", "100 Мбит/с", "1 Гбит/с"]),
          kcrm: free ? "—" : String(num(r, 80000, 89999)),
          eng: free ? "—" : pick(r, ["Д. Темирханова", "А. Нурланов", "Б. Дегтярь"]),
          status: free ? "free" : r() > 0.03 ? "active" : "test",
        }
        return f
      },
    }),
  remote: genApi<IpAddress["f"]>({
    base: "/api/ip-address-plan",
    list: "/list",
    idParam: "id",
    trashKey: "ip_address_plans",
    fields: {
      ip: "ip_address",
      prefix: "prefix",
      client: "client_name",
      place: "location",
      speed: "speed",
      kcrm: "kcrm_request",
      eng: "manager_name",
    },
    status: (o) => (/тест|test/i.test(s(o, "status", "")) ? "test" : /своб|free/i.test(s(o, "status", "")) ? "free" : "active"),
  }),
})

export const useIpAddresses = ipPlan.useAll
export const useIpAddress = ipPlan.useRecord

export const blankIpAddress = (): IpAddress => blankEquip("active", { ip: "", prefix: "", client: "", place: "", speed: "", kcrm: "", eng: "" })

/** Колонки отчёта (ip-05) и аналитики заполненности — все поля адреса. */
export const ipPlanColumns: ReportCol<IpAddress>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "ip", t: "IP-адрес", value: (x) => x.f.ip },
  { k: "prefix", t: "Префикс", value: (x) => x.f.prefix },
  { k: "client", t: "Клиент", value: (x) => x.f.client },
  { k: "place", t: "Локация", value: (x) => x.f.place },
  { k: "speed", t: "Скорость", value: (x) => x.f.speed },
  { k: "kcrm", t: "Заявка KCRM", value: (x) => x.f.kcrm },
  { k: "eng", t: "Менеджер/Инженер", value: (x) => x.f.eng },
  { k: "st", t: "Статус", value: (x) => ipStatus(x)[0] },
]

/* ---------- дерево подсетей (TODO(API): /api/ip-address-plan/tree) ---------- */

export type Net = { cidr: string; t: string; pct: number; depth: number; open?: boolean }

export const SUBNETS: Net[] = [
  { cidr: "185.12.0.0/16", t: "Публичные · ГО", pct: 64, depth: 0, open: true },
  { cidr: "185.12.32.0/20", t: "АС · клиенты", pct: 72, depth: 1, open: true },
  { cidr: "185.12.40.0/24", t: "АС · Кенесары", pct: 81, depth: 2 },
  { cidr: "185.12.41.0/24", t: "АС · Республики", pct: 54, depth: 2 },
  { cidr: "185.14.0.0/20", t: "ЮФ · клиенты", pct: 58, depth: 1 },
  { cidr: "10.0.0.0/8", t: "Внутренние", pct: 34, depth: 0, open: true },
  { cidr: "10.40.0.0/16", t: "АС · управление", pct: 47, depth: 1 },
  { cidr: "10.110.0.0/16", t: "VRF CLIENTS", pct: 22, depth: 1 },
  { cidr: "2a03:6f00::/32", t: "IPv6", pct: 3, depth: 0 },
]

/** Входит ли IPv4-адрес в подсеть (IPv6 — нет). */
export function inSubnet(ip: string, cidr: string) {
  const [net, bits] = cidr.split("/")
  const toNum = (a: string) => a.split(".").reduce((v, o) => v * 256 + (Number(o) || 0), 0)
  if (cidr.includes(":") || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return false
  const size = 2 ** (32 - Number(bits))
  return Math.floor(toNum(ip) / size) === Math.floor(toNum(net) / size)
}

/** Адреса последней /24 выбранной сети: занято (по доле из дерева), тест, резерв, свободно. */
export function netUsage(net: Net) {
  const n = 256
  const busy = Math.round((n * net.pct) / 100 / 1.18)
  const test = Math.round(n * 0.03)
  const reserve = Math.round(n * 0.05)
  return { n, busy, test, reserve, free: Math.max(0, n - busy - test - reserve) }
}

/** Адресов в блоке. */
export const BLOCK: Record<string, number> = { "/30": 4, "/29": 8, "/28": 16 }
/** Сколько свободных блоков /30, /29, /28 помещается в свободные адреса. */
export const freeBlocks = (net: Net, blk: string) => Math.floor(netUsage(net).free / (BLOCK[blk] ?? 4))
