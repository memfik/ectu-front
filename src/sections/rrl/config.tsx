import { Radio } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, s } from "@/sections/api-helpers"
import { STD_KPI, km, num, pick } from "@/sections/spec-helpers"

/** РРЛ (макет 25): описание раздела и источник в API. */
export const spec: Spec = {
  key: "rrl",
  num: "25",
  title: "РРЛ",
  crumb: "Оборудование / Беспроводные технологии",
  sub: "Форма учёта · РРЛ",
  icon: Radio,
  hero: "/nodes/tower.jpg",
  total: 113,
  unit: ["пролёт", "пролёта", "пролётов"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "Общая длина", color: "#a78bfa", value: "4 820 км", note: "" },
    { t: "Разрешений РЧС истекает", color: "var(--status-nolink)", value: "12", note: "", pct: 11 },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "route", t: "Трасса", show: "bold" },
    { k: "model", t: "Модель", show: "muted", filter: "Модель" },
    { k: "bw", t: "Пропускная" },
    { k: "len", t: "Длина, км", show: "num" },
    { k: "vendor", t: "Вендор", hidden: true, filter: "Вендор" },
    { k: "freq", t: "Частота", hidden: true },
  ],
  seed: [
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
  ],
  gen: (i, r, n) => ({
    num: i + 1,
    route: `${n.code} — ${n.code.slice(0, 3)}${String(num(r, 1, 60)).padStart(3, "0")}.0${num(r, 1, 3)}.${n.code.split(".")[2] ?? "AS"}`,
    model: pick(r, ["ZXMW SR10 S340 18G", "OmniBAS-2W, 18 GHz", "Harmony Radio 23 GHz", "Pasolink NEO/c 15GHz"]),
    bw: pick(r, ["100 Мбит/с", "150 Мбит/с", "200 Мбит/с", "300 Мбит/с"]),
    len: km(r, 1, 12),
    vendor: pick(r, ["ZTE", "Intracom", "Nokia", "NEC"]),
    freq: pick(r, ["15 ГГц", "18 ГГц", "23 ГГц"]),
  }),
  name: (x) => `РРЛ ${x.f.route}`,
  sub2: (x) => `${x.f.model} · ${x.f.len} км`,
  api: genApi({
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
}

export const list = makeList(spec)
