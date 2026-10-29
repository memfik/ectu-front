"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pick, seedEquip, withNode, type Equip } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"

/*
 * 14 ID-каналы — данные раздела. Без API — примеры в памяти вкладки (первые 5 каналов из макета).
 * API техучёта: /api/channels (id-параметр `id`), удаление — /api/trash/soft-delete/channels.
 */

export type Channel = Equip<{
  /** «ID-00231» */
  cid: string
  client: string
  /** L2VPN / L3VPN / Internet */
  type: string
  speed: string
  /** «rt1.ast1 · Gi0/0/1.110» — маршрутизатор и интерфейс */
  iface: string
  /** «inner / outer» */
  vlan: string
  /** Data / Voice / Video */
  traffic: string
}>

export const CHANNEL_STATUS: Record<string, [string, Tone]> = {
  active: ["Активен", "ok"],
  alarm: ["Авария", "bad"],
  reserve: ["Резерв", "info"],
}
export const channelStatus = (x: Channel) => CHANNEL_STATUS[x.status] ?? ["—", "muted" as Tone]

export const CHANNEL_TYPES = ["L2VPN", "L3VPN", "Internet"]
export const TRAFFIC = ["Data", "Voice", "Video"]

export const channelName = (x: Channel) => String(x.f.cid)
export const channelSub = (x: Channel) => `${x.nodeCode} → ${x.f.client} · ${x.f.speed}`

const SEED = [
  { cid: "ID-00231", branch: "АС", client: "ТОО «Орлан-2000»", type: "L2VPN", speed: "100 Мбит/с", iface: "rt1.ast1 · Gi0/0/1.110", vlan: "110 / 2031", status: "active" },
  { cid: "ID-00232", branch: "АС", client: "ТОО «Бота-2017»", type: "L2VPN", speed: "50 Мбит/с", iface: "rt1.ast1 · Gi0/0/1.111", vlan: "111 / 2031", status: "active" },
  { cid: "ID-00240", branch: "АС", client: "АО «КазТрансКом»", type: "L3VPN", speed: "1 Гбит/с", iface: "rt1.ast1 · Te0/0/1.40", vlan: "40 / —", status: "active" },
  { cid: "ID-00248", branch: "АС", client: "ИП «Сапарова А.»", type: "Internet", speed: "100 Мбит/с", iface: "sw1.ast009 · Gi1/0/12", vlan: "120 / —", status: "alarm" },
  { cid: "ID-00412", branch: "АС", client: "—", type: "L2VPN", speed: "100 Мбит/с", iface: "rt1.ast1 · Gi0/0/2.200", vlan: "200 / 2040", status: "reserve" },
]

export const channels = createSource<Channel>({
  key: "channel-ids",
  title: "ID-каналы",
  name: channelName,
  seed: () =>
    seedEquip({
      key: "channel-ids",
      total: 8513,
      statuses: Object.keys(CHANNEL_STATUS),
      seed: SEED,
      gen: (i, r, n) => {
        const v = num(r, 10, 900)
        return {
          cid: `ID-${String(i + 500).padStart(5, "0")}`,
          client: `${pick(r, ["ТОО", "ИП", "АО"])} «${pick(r, ["Нур", "Самал", "Каспий", "Тулпар"])} ${pick(r, ["Групп", "Сервис"])}»`,
          type: pick(r, ["L2VPN", "L2VPN", "L3VPN", "Internet"]),
          speed: pick(r, ["50 Мбит/с", "100 Мбит/с", "200 Мбит/с", "1 Гбит/с"]),
          iface: `rt1.${n.code.slice(0, 3)}1 · Gi0/0/${num(r, 0, 3)}.${v}`,
          vlan: `${v} / ${r() > 0.5 ? num(r, 2000, 2100) : "—"}`,
          traffic: pick(r, ["Data", "Data", "Voice", "Video"]),
          status: r() > 0.04 ? "active" : r() > 0.5 ? "alarm" : "reserve",
        }
      },
    }),
  remote: genApi<Channel["f"]>({
    base: "/api/channels",
    idParam: "id",
    trashKey: "channels",
    fields: {
      cid: "channel_id",
      client: "client_provider_name",
      type: "channel_type.name",
      speed: "bandwidth",
      iface: "router",
      vlan: "vlan",
      traffic: "traffic_type.name",
    },
    status: (o) => (/авар|alarm/i.test(s(o, "status", "")) ? "alarm" : /резерв|reserve/i.test(s(o, "status", "")) ? "reserve" : "active"),
    filter: { type: "channel_type_id", traffic: "traffic_type_id" },
  }),
})

export const useChannels = channels.useAll
export const useChannel = channels.useRecord

export const blankChannel = (): Channel => blankEquip("active", { cid: "", client: "", type: "", speed: "", iface: "", vlan: "", traffic: "" })

/** Колонки отчёта и аналитики заполненности. */
export const channelColumns: ReportCol<Channel>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "cid", t: "ID-канала", value: (x) => x.f.cid },
  { k: "client", t: "Клиент", value: (x) => x.f.client },
  { k: "type", t: "Тип канала", value: (x) => x.f.type },
  { k: "speed", t: "Скорость", value: (x) => x.f.speed },
  { k: "iface", t: "Router / Interface", value: (x) => x.f.iface },
  { k: "vlan", t: "VLAN", value: (x) => x.f.vlan },
  { k: "traffic", t: "Тип трафика", value: (x) => x.f.traffic ?? "—" },
  { k: "st", t: "Статус", value: (x) => channelStatus(x)[0] },
]

/** Импорт Excel: поля — как в форме. */
export const channelsImport: ImportSpec<Channel> = {
  key: "channel-ids",
  title: "ID-каналы",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "cid", t: "ID-канала" },
    { k: "client", t: "Клиент" },
    { k: "type", t: "Тип канала", opts: CHANNEL_TYPES.map((v) => ({ v, label: v })) },
    { k: "speed", t: "Скорость" },
    { k: "iface", t: "Router / Interface" },
    { k: "vlan", t: "VLAN" },
    { k: "traffic", t: "Тип трафика", opts: TRAFFIC.map((v) => ({ v, label: v })) },
    { k: "status", t: "Статус", required: true, opts: Object.entries(CHANNEL_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankChannel(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, cid: str("cid"), client: str("client"), type: str("type"), speed: str("speed"), iface: str("iface"), vlan: str("vlan"), traffic: str("traffic") },
      },
      Number(v.nodeId),
    )
  },
  name: channelName,
  all: channels.all,
  nextId: channels.nextId,
  save: channels.save,
}

/* ---------- паспорт ---------- */

/** Маршрутизатор и интерфейс из «rt1.ast1 · Gi0/0/1.110». */
export const channelIface = (x: Channel) => {
  const [router = "—", port = "—"] = String(x.f.iface ?? "").split(" · ")
  return { router, port }
}
/** VLAN [inner, outer]. */
export const channelVlan = (x: Channel) => String(x.f.vlan ?? "— / —").split(" / ")
/** Скорость [число, единица]. */
export const channelSpeed = (x: Channel) => String(x.f.speed ?? "—").split(" ")
/** IP-адрес интерфейса (пример по inner VLAN). TODO(API): IP, VRF, outer VLAN — нет в /api/channels. */
export const channelIp = (x: Channel) => `10.${channelVlan(x)[0]}.0.14/30`
/** Название клиента без формы собственности. */
export const channelCompany = (x: Channel) => String(x.f.client ?? "—").replace(/^(ТОО|ИП|АО) «(.*)»$/, "$2")
/** Протяжённость канала, км (пример). */
export const CHANNEL_KM = "1,8"

/** Концы (узел — клиент), документы ввода и история канала — примеры по номеру записи. */
export const channelDetail = (x: Channel): LineDetail =>
  lineDetail(x, {
    section: "channel-ids",
    point: (i) => `Точка ${i + 1}`,
    count: () => ({ total: 0, a: 0, b: 0 }),
    ends: (r, a) => [
      { code: r.nodeCode, title: a ? (/^УС/.test(a.object) ? a.object : `УС «${a.object}»`) : r.nodeCode, nodeId: a?.id },
      { code: "—", title: String(r.f.client ?? "Клиент") },
    ],
    inputDocs: [
      { t: "Основание", n: "Заявка KCRM № 88412" },
      { t: "Дата подключения", n: "12.10.2026" },
      { t: "Соединительная линия", n: "СО-4412" },
    ],
    docs: [],
    lastEdit: (_, r) => ["Изменена пропускная способность", "50 Мбит/с", String(r.f.speed ?? "100 Мбит/с")],
  })
