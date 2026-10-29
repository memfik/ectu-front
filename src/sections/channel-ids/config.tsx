import { Link } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, s } from "@/lib/api/helpers"
import { num, pick } from "@/sections/spec-helpers"

/** ID-каналы (макет 14): описание раздела и источник в API. */
export const spec: Spec = {
  key: "channel-ids",
  num: "14",
  title: "ID-каналы",
  crumb: "Клиенты",
  sub: "Реестр каналов: от точки 1 до точки 2, со всеми устройствами по пути",
  icon: Link,
  hero: "/equipment/switch-hero.jpg",
  total: 8513,
  unit: ["канал", "канала", "каналов"],
  search: "ID-канала, клиент, IP, VLAN, лицевой счёт…",
  kpis: [
    { t: "Активных", color: "var(--status-ok)", value: "2 291", note: "95%", pct: 95 },
    { t: "Авария", color: "#ff5257", value: "8", note: "", pct: 1 },
    { t: "Суммарно", color: "#a78bfa", value: "184", note: "Гбит/с" },
    { t: "Без клиента Onyma", color: "var(--status-nolink)", value: "64", note: "3%", pct: 3 },
    { t: "На карте", color: "#22d3ee", value: "2 380", note: "98%", pct: 98 },
  ],
  statuses: { active: ["Активен", "ok"], alarm: ["Авария", "bad"], reserve: ["Резерв", "info"] },
  cols: [
    { k: "cid", t: "ID-канала", show: "bold" },
    { k: "branch", t: "Филиал" },
    { k: "client", t: "Клиент" },
    { k: "type", t: "Тип канала", opts: ["L2VPN", "L3VPN", "Internet"], filter: "Тип канала" },
    { k: "speed", t: "Скорость" },
    { k: "iface", t: "Router / Interface", show: "muted" },
    { k: "vlan", t: "VLAN" },
    { k: "traffic", t: "Тип трафика", hidden: true, opts: ["Data", "Voice", "Video"], filter: "Тип трафика" },
    { k: "st", t: "Статус", show: "status" },
  ],
  seed: [
    {
      cid: "ID-00231",
      branch: "АС",
      client: "ТОО «Орлан-2000»",
      type: "L2VPN",
      speed: "100 Мбит/с",
      iface: "rt1.ast1 · Gi0/0/1.110",
      vlan: "110 / 2031",
      status: "active",
    },
    {
      cid: "ID-00232",
      branch: "АС",
      client: "ТОО «Бота-2017»",
      type: "L2VPN",
      speed: "50 Мбит/с",
      iface: "rt1.ast1 · Gi0/0/1.111",
      vlan: "111 / 2031",
      status: "active",
    },
    {
      cid: "ID-00240",
      branch: "АС",
      client: "АО «КазТрансКом»",
      type: "L3VPN",
      speed: "1 Гбит/с",
      iface: "rt1.ast1 · Te0/0/1.40",
      vlan: "40 / —",
      status: "active",
    },
    {
      cid: "ID-00248",
      branch: "АС",
      client: "ИП «Сапарова А.»",
      type: "Internet",
      speed: "100 Мбит/с",
      iface: "sw1.ast009 · Gi1/0/12",
      vlan: "120 / —",
      status: "alarm",
    },
    {
      cid: "ID-00412",
      branch: "АС",
      client: "—",
      type: "L2VPN",
      speed: "100 Мбит/с",
      iface: "rt1.ast1 · Gi0/0/2.200",
      vlan: "200 / 2040",
      status: "reserve",
    },
  ],
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
  name: (x) => String(x.f.cid),
  sub2: (x) => `${x.nodeCode} → ${x.f.client} · ${x.f.speed}`,
  api: genApi({
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
}

export const list = makeList(spec)
