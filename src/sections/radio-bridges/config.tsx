import { AudioWaveform } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, s } from "@/sections/api-helpers"
import { STD_KPI, WIRELESS, km, pick } from "@/sections/spec-helpers"

/** Радиомосты (макет 26): описание раздела и источник в API. */
export const spec: Spec = {
  key: "radio-bridges",
  num: "26",
  title: "Радиомосты",
  crumb: WIRELESS,
  sub: "Форма учёта · Радиомосты",
  icon: AudioWaveform,
  hero: "/nodes/tower.jpg",
  total: 825,
  unit: ["радиомост", "радиомоста", "радиомостов"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "На клиентов", color: "#a78bfa", value: "142", note: "" },
    { t: "Разрешений РЧС истекает", color: "var(--status-nolink)", value: "6", note: "", pct: 1 },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "route", t: "Трасса", show: "bold" },
    { k: "model", t: "Модель", filter: "Модель" },
    { k: "bw", t: "Пропускная" },
    { k: "network", t: "Тип сети", opts: ["ГМС", "ГРС", "ГАС", "МС"], filter: "Тип сети" },
    { k: "vendor", t: "Вендор", hidden: true, filter: "Вендор" },
    { k: "len", t: "Протяжённость, км", hidden: true },
  ],
  seed: [
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
    {
      num: 20,
      branch: "МФ",
      route: "akt007.03.MF → 43.659589, 51.160279",
      model: "PowerBeam 5AC-500",
      bw: "до 300 Мбит/с",
      network: "ГАС",
      vendor: "Ubiquiti",
    },
    {
      num: 15,
      branch: "ЮФ",
      route: "alm415.03.YF → пр. Суюнбая 19",
      model: "PowerBeam 5AC-500",
      bw: "80 Мбит/с",
      network: "ГАС",
      vendor: "Ubiquiti",
    },
  ],
  gen: (i, r, n) => ({
    num: i + 1,
    route: `${n.code} → ${n.address.replace(/^г\. [^,]+, /, "")}`,
    model: pick(r, ["NanoStation M5", "PowerBeam 5AC-500", "LiteBeam 5AC", "Rocket M5"]),
    bw: pick(r, ["20 Мбит/с", "50 Мбит/с", "80 Мбит/с", "до 300 Мбит/с"]),
    network: pick(r, ["ГАС", "ГАС", "ГРС", "ГМС"]),
    vendor: pick(r, ["Ubiquiti", "Ubiquiti", "Mikrotik", "Cambium"]),
    len: km(r, 0.2, 6),
  }),
  name: (x) => `Радиомост ${x.nodeCode}`,
  sub2: (x) => `${x.f.route} · ${x.f.model}`,
  api: genApi({
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
}

export const list = makeList(spec)
