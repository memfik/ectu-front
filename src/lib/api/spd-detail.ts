import type { Doc, Media, Person } from "@/lib/api/node-detail"
import { nodeRows } from "@/lib/api/node-data"
import { portList, type SpdRow } from "./spd"

/*
 * Паспорт оборудования СПД (макет 03, экраны sw-01b…sw-11, swp-09…12) — пример данных:
 * порты (`spd_equipment_ports`), портовая ёмкость, под-оборудование, МОЛ, SmartNET, перемещения.
 * TODO: API — паспорт оборудования и его вкладки.
 */

export type Port = {
  id: number
  /** Gi1/0/25 — короткое имя; полное — GigabitEthernet1/0/25 */
  name: string
  /** 0/25 — номер на передней панели */
  slot: string
  admin: "up" | "down"
  oper: "up" | "down"
  type: string
  speed: string
  desc: string
  sfp: boolean
  vlan: string
  module?: string
  moduleSn?: string
  /** Куда идёт: ВОЛС и порт на другом конце */
  link?: { title: string; sub: string }
  changed: string
}

export type CapacityRow = { type: string; mounted: number; used: number }
export type Child = { id: string; model: string; serial: string; slot: string; port: string; note: string }
export type Move = {
  id: number
  date: string
  order: string
  from: string
  fromBranch: string
  to: string
  toBranch: string
  personFrom: string
  personTo: string
  status: "done" | "archive" | "plan"
  note: string
}

export type SpdDetail = {
  ports: Port[]
  capacity: CapacityRow[]
  children: Child[]
  mol: Person & { dept: string; mobile: string; post: string; since: string }
  people: (Person & { dept: string; mobile: string; post: string })[]
  service: {
    contract: string
    start: string
    end: string
    days: number
    smartnet: boolean
    note: string
    remind: boolean
    act: string
    actDate: string
  }
  docs: Doc[]
  docGroups: { kind: string; paper: boolean }[]
  moves: Move[]
  log: { what: string; from?: string; to?: string; who: string; date: string }[]
  media: Media[]
  /** Соседи по стойке: юнит и название */
  rack: { unit: number; size: number; title: string; self?: boolean; on?: boolean }[]
}

const TYPES = [
  "100base-tx",
  "1000base-tx",
  "1000base-x-sfp",
  "10gbase-x-sfpp",
  "25gbase-x-sfp28",
  "40gbase-x-qsfpp",
  "100gbase-x-cfp",
  "1000BASE-TX / SFP (1GE)",
]

const DESC = [
  "FTTB · пр. Абулхаир Хана, 45, кв. 12 · ID-00231",
  "FTTB · подъезд 2 · ID-00232",
  "FTTB · офис 4 · ID-00240",
  "FTTH · ул. Маметовой 65 · ID-00248",
  "FTTB · БЦ «Нурлы» · ID-00251",
  "резерв",
]

/** МОЛ, ответственные и перемещения оборудования — общие для СПД, АТС, PDH, SDH, DWDM. */
export function staffOf(x: { branch: string; nodeCode: string; since: string }, dept: string) {
  return {
    mol: {
      initials: "ЕС",
      name: "Ержан К. Сапаров",
      role: "Ведущий инженер · Отдел эксплуатации СПД",
      color: "linear-gradient(135deg,#22c55e,#15803d)",
      synced: true,
      phone: "+7 727 *** 40 12",
      mobile: "+7 701 *** 55 31",
      email: "e.saparov@qmobile.kz",
      dept,
      inv: "INV-004471",
      post: "Ведущий инженер",
      since: "03.2019",
    },
    people: [
      {
        initials: "БД",
        name: "Борис Б. Дегтярь",
        role: "Инженер ЦТ",
        color: "linear-gradient(135deg,#0ea5e9,#0369a1)",
        synced: true,
        phone: "+7 727 *** 12 45",
        mobile: "+7 701 *** 12 45",
        email: "b.degtyar@qmobile.kz",
        dept: `ЦТ ${x.branch}`,
        inv: "INV-004102",
        post: "Инженер",
      },
      {
        initials: "НО",
        name: "Нурдаулет С. Осербай",
        role: "Ведущий инженер ГЭ",
        color: "linear-gradient(135deg,#a855f7,#6d28d9)",
        synced: true,
        phone: "+7 702 *** 88 10",
        mobile: "+7 702 *** 88 10",
        email: "n.oserbay@qmobile.kz",
        dept: "ГЭ ЦТ",
        inv: "INV-005120",
        post: "Ведущий инженер",
      },
    ],
    moves: [
      {
        id: 3,
        date: "06.10.2026",
        order: "№ 118-р",
        from: "alm002.01.YF",
        fromBranch: x.branch,
        to: x.nodeCode,
        toBranch: x.branch,
        personFrom: "Нурдаулет С. Осербай",
        personTo: "Борис Б. Дегтярь",
        status: "done",
        note: "Перенос в КСО после реконструкции",
      },
      {
        id: 2,
        date: "14.02.2023",
        order: "№ 031-р",
        from: `Склад ${x.branch}`,
        fromBranch: x.branch,
        to: "alm002.01.YF",
        toBranch: x.branch,
        personFrom: "Склад",
        personTo: "Нурдаулет С. Осербай",
        status: "done",
        note: "Ввод в эксплуатацию",
      },
      {
        id: 1,
        date: x.since,
        order: "№ 007-р",
        from: "ГО Астана",
        fromBranch: "ГО",
        to: `Склад ${x.branch}`,
        toBranch: x.branch,
        personFrom: "ГО",
        personTo: `Склад ${x.branch}`,
        status: "archive",
        note: "Поставка",
      },
    ],
  } satisfies Pick<SpdDetail, "mol" | "people" | "moves">
}

export function spdDetail(x: SpdRow): SpdDetail {
  const node = nodeRows().find((n) => n.id === x.nodeId)
  const list = portList(x)
  const copper = list.length - 4
  const ports: Port[] = list.map((p, i) => {
    const n = i < copper ? i + 1 : copper + 1 + (i - copper)
    const sfp = i >= copper
    const up = p.state === "up" || p.state === "sfp"
    return {
      id: n,
      name: `Gi1/0/${n}`,
      slot: `0/${n}`,
      admin: p.state === "free" && n % 5 === 4 ? "down" : "up",
      oper: up ? "up" : "down",
      type: sfp ? "1000BASE-LX" : "1000BASE-T",
      speed: up ? (n === 3 ? "100 Mbps" : "1 Gbps") : "—",
      desc:
        sfp && up
          ? n === copper + 1
            ? `uplink → sw0.${x.nodeCode.slice(0, 3)}1 · ВОЛС ${x.branch}-12`
            : `к gw0.${x.nodeCode.slice(0, 3)}1`
          : p.state === "down"
            ? DESC[3 + (n % 3)]
            : up
              ? DESC[n % 5].replace(/ID-\d+/, `ID-${String(230 + n).padStart(5, "0")}`)
              : "—",
      sfp,
      vlan: sfp ? "10, 20, 110–120" : String(100 + (n % 20)),
      module: sfp && up ? "1000BaseLX SFP" : undefined,
      moduleSn: sfp && up ? (n === copper + 1 ? "AGC1435U4PJ" : "AGC1502K7QW") : undefined,
      link:
        sfp && n === copper + 1 && up
          ? { title: `ВОЛС ${x.branch}-12`, sub: `→ sw0.${x.nodeCode.slice(0, 3)}1 · порт 0/49 · волокна 3–4` }
          : undefined,
      changed: p.state === "down" ? `0${1 + (n % 5)}.10.2026, 2${n % 4}:14` : "12.09.2026, 14:02",
    }
  })
  const tx = ports.filter((p) => !p.sfp)
  const sfp = ports.filter((p) => p.sfp)
  return {
    ports,
    capacity: TYPES.map((t) =>
      t === "1000base-tx"
        ? { type: t, mounted: tx.length, used: tx.filter((p) => p.oper === "up").length }
        : t === "1000base-x-sfp"
          ? { type: t, mounted: sfp.length, used: sfp.filter((p) => p.oper === "up").length }
          : { type: t, mounted: 0, used: 0 },
    ),
    children: [
      { id: "1", model: "GLC-LH-SMD", serial: "AGC1435U4PJ", slot: "—", port: `0/${copper + 1}`, note: "SFP 1000BaseLX, uplink" },
      { id: "2", model: "GLC-LH-SMD", serial: "AGC1502K7QW", slot: "—", port: `0/${copper + 2}`, note: "SFP к gw0" },
      { id: "3", model: "C3K-PWR-750WAC", serial: "LIT1211A0FK", slot: "PS1", port: "—", note: "Блок питания" },
      { id: "3.1", model: "FAN-MOD-4HS", serial: "DCH1138B2W1", slot: "—", port: "—", note: "Вентиляторный модуль" },
    ],
    ...staffOf(x, `Отдел эксплуатации СПД ${x.branch}`),
    service: {
      contract: x.contract.replace("№ ", ""),
      start: "01.01.2024",
      end: "31.12.2026",
      days: x.smartnet ?? 0,
      smartnet: x.smartnet !== null,
      note: "8x5xNBD, продление через ГО",
      remind: true,
      act: "№ 154",
      actDate: x.since,
    },
    docGroups: [
      { kind: "Техническая", paper: true },
      { kind: "Приёмо-сдаточная", paper: true },
      { kind: "Конфигурации", paper: false },
    ],
    docs: [
      { id: 1, name: `Паспорт производителя ${x.model}.pdf`, kind: "Техническая", size: "2.4 МБ", date: "14.01.2026", ext: "pdf" },
      { id: 2, name: "Схема коммутации.dwg", kind: "Техническая", size: "1.1 МБ", date: "03.10.2025", ext: "dwg" },
      { id: 3, name: `Акт ввода № 154 от ${x.since}.pdf`, kind: "Приёмо-сдаточная", size: "640 КБ", date: x.since, ext: "pdf" },
      { id: 4, name: `${x.host}.cfg`, kind: "Конфигурации", size: "14 КБ", date: "05.10.2026", ext: "docx" },
      { id: 5, name: `${x.host}_2026-09.cfg`, kind: "Конфигурации", size: "14 КБ", date: "05.09.2026", ext: "docx" },
    ],
    log: [
      { what: "Порт 12: up → down", who: "Мониторинг", date: "05.10.2026, 22:14" },
      { what: `Загружен конфиг ${x.host}.cfg`, who: "Резервное копирование", date: "05.10.2026" },
      { what: `Заменён SFP-модуль на 0/${copper + 1}`, who: "Борис Б. Дегтярь", date: "12.09.2026" },
      { what: "Изменён IP-адрес управления", from: "192.168.49.20", to: x.ip, who: "Артем С. Галустьян", date: "05.10.2026" },
      { what: "Загружен файл «Паспорт производителя»", who: "Борис Б. Дегтярь · Техническая", date: "14.01.2026" },
    ],
    media: [
      {
        src: "/equipment/switch.jpg",
        title: `${x.host} — передняя панель`,
        date: "14.01.2026, 10:12",
        info: "4032×3024 · 3.1 МБ",
        author: "Борис Б. Дегтярь",
        geo: node ? `${node.ll[0].toFixed(4)}, ${node.ll[1].toFixed(4)}` : "—",
        tags: ["СПД", x.model],
        text: "Передняя панель после замены SFP-модуля.",
      },
      {
        src: "/equipment/switch-hero.jpg",
        title: "Стойка СПД",
        date: "14.01.2026, 10:15",
        info: "4032×3024 · 2.8 МБ",
        author: "Борис Б. Дегтярь",
        geo: "—",
        tags: ["Стойка"],
        text: "Общий вид стойки.",
      },
      {
        src: "/nodes/g-4.jpg",
        video: "0:42",
        title: "Обход стойки СПД.mp4",
        date: "14.01.2026, 10:12",
        info: "1080p",
        author: "Борис Б. Дегтярь",
        geo: "—",
        tags: ["Оборудование", "СПД", "Стойка"],
        text: "Видеообход стойки после замены SFP-модуля.",
      },
    ],
    rack: [
      { unit: 34, size: 1, title: "ODF-1 · оптический кросс 48" },
      { unit: 31, size: 1, title: "Патч-панель 24 × RJ45" },
      { unit: 30, size: 1, title: `${x.host} · ${x.model}`, self: true, on: true },
      { unit: 29, size: 1, title: `sw3.${x.nodeCode.slice(0, 3)}2 · X440-24t`, on: true },
      { unit: 28, size: 1, title: "Органайзер" },
      { unit: 25, size: 2, title: `gw0.${x.nodeCode.slice(0, 3)}1 · ASR1006`, on: true },
      { unit: 17, size: 4, title: "АТС Iskratel SI 2000" },
      { unit: 11, size: 3, title: "ИБП APC SRT 3000" },
      { unit: 6, size: 3, title: "АКБ 48V" },
    ],
  }
}
