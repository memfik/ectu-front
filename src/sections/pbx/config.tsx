import { Phone } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf } from "@/sections/api-helpers"
import { STD_KPI, obj, pick } from "@/sections/spec-helpers"

/** АТС (макет 20): описание раздела и источник в API. */
export const spec: Spec = {
  key: "pbx",
  num: "20",
  title: "АТС",
  crumb: "Оборудование / Автоматическая электросвязь",
  sub: "Форма учёта · АТС",
  icon: Phone,
  hero: "/equipment/switch-hero.jpg",
  total: 222,
  unit: ["станция", "станции", "станций"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "Портов монтировано", color: "#a78bfa", value: "212 000", note: "" },
    { t: "Задействовано", color: "#22d3ee", value: "81%", note: "", pct: 81 },
    { t: "ОТА", color: "#085eff", value: "164 300", note: "" },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "object", t: "Объект связи", show: "bold" },
    { k: "model", t: "Модель станции", filter: "Модель" },
    { k: "capacity", t: "Ёмкость", show: "pair" },
    { k: "ota", t: "ОТА", show: "num" },
    { k: "network", t: "Тип сети", hidden: true, opts: ["ГМС", "ГРС", "ГАС", "МС"], filter: "Тип сети" },
  ],
  seed: [
    {
      num: 2,
      branch: "УФ",
      object: "УС «Уральск Центральный»",
      nodeCode: "url002.01.UF",
      model: "Iskratel SI3000 CS (MEA)",
      capacity: "843 / 2175",
      ota: 736,
    },
    { num: 5, branch: "ЗФ", object: "УС Атырау", model: "SSW Si3000 Iskratel", capacity: "7460 / 12200", ota: 7375 },
    { num: 1, branch: "МФ", object: "УС Актау", model: "SI 2000 МСА (АМТС/ОПТС)", capacity: "20 / 559", ota: 20 },
    { num: 7, branch: "АФ", object: "БЦ «Қазына»", model: "Iskratel SI2000 MSAN", capacity: "2 / 128", ota: 5 },
    { num: 2, branch: "ЮФ", object: "БЦ «Sirius»", model: "Panasonic KX-TDA600", capacity: "85 / 256", ota: 11 },
    { num: 1, branch: "ВФ", object: "УС Павлодар", model: "Iskratel Si-2000 ICS(MLC)", capacity: "263 / 449", ota: 217 },
  ],
  gen: (i, r, n) => {
    const t = pick(r, [128, 256, 449, 1024, 2175])
    const u = Math.round(t * (0.3 + r() * 0.6))
    return {
      num: i + 1,
      object: obj(n),
      model: pick(r, ["Iskratel SI3000", "Iskratel SI2000 MSAN", "Panasonic KX-TDA600", "Huawei UA5000"]),
      capacity: `${u} / ${t}`,
      ota: Math.round(u * 0.9),
      network: n.network,
    }
  },
  name: (x) => `АТС ${x.nodeCode}`,
  sub2: (x) => `${x.f.model} · ${x.f.object}`,
  bar: (x) => {
    const m = String(x.f.capacity).match(/(\d+) \/ (\d+)/)
    return m ? ["Ёмкость", +m[1], +m[2]] : null
  },
  api: genApi({
    base: "/api/phone_station",
    trashKey: "phone_stations",
    fields: {
      object: "object_name",
      model: "station_model",
      capacity: pairOf("used_capacity", "mounted_capacity"),
      ota: "ota_count",
      network: "network_type",
    },
    filter: { network: "network_type", model: "station_model" },
  }),
}

export const list = makeList(spec)
