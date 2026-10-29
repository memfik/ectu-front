import { BatteryCharging } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi } from "@/lib/api/helpers"
import { STD_KPI, num, pick } from "@/sections/spec-helpers"

/** ИБП (макет 33): описание раздела и источник в API. */
export const spec: Spec = {
  key: "ups",
  num: "33",
  title: "ИБП",
  crumb: "Оборудование / Электропитание",
  sub: "Форма учёта · ИБП",
  icon: BatteryCharging,
  hero: "/nodes/g-4.jpg",
  total: 584,
  unit: ["ИБП", "ИБП", "ИБП"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "АБ старше 3 лет", color: "var(--status-nolink)", value: "212", note: "", pct: 36 },
    { t: "С SNMP", color: "#22d3ee", value: "61%", note: "", pct: 61 },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "model", t: "Модель UPS", show: "bold", filter: "Модель" },
    { k: "nodeCode", t: "ID УС" },
    { k: "power", t: "Мощность" },
    { k: "battery", t: "Замена АБ" },
    { k: "cls", t: "Классификация", hidden: true, opts: ["Онлайн", "Линейно-интерактивный", "Резервный"], filter: "Классификация" },
    { k: "serial", t: "S/N", hidden: true },
  ],
  seed: [
    {
      num: 33,
      branch: "УФ",
      nodeCode: "url002.01.UF",
      model: "Delta 60kVa HPH-Series",
      power: "60",
      battery: "24.09.2024",
      cls: "Онлайн",
    },
    { num: 16, branch: "ВФ", model: "Delta RT-1K", power: "1/0,9", battery: "2023", cls: "Онлайн" },
    { num: 7, branch: "ЮФ", model: "UPS SVC, V650F-LCD", power: "3/2,7", battery: "—", cls: "Линейно-интерактивный" },
  ],
  gen: (i, r) => ({
    num: i + 1,
    model: pick(r, ["Delta Amplon RT-10k", "Delta RT-1K", "APC SRT 3000", "NetPro", "SVC V650F-LCD"]),
    power: pick(r, ["1/0,9", "3/2,7", "10kVA/9kW", "30kVA/30кВт", "60"]),
    battery: r() > 0.3 ? `${String(num(r, 1, 28)).padStart(2, "0")}.${String(num(r, 1, 12)).padStart(2, "0")}.${num(r, 2019, 2025)}` : "—",
    cls: pick(r, ["Онлайн", "Онлайн", "Линейно-интерактивный", "Резервный"]),
    serial: `UPS${num(r, 10000, 99999)}`,
  }),
  name: (x) => `ИБП · ${x.f.model}`,
  sub2: (x) => `${x.nodeCode} · ${x.f.power}`,
  api: genApi({
    base: "/api/ibp",
    trashKey: "ibp_equipments",
    fields: { model: "ups_model", power: "power_kva", battery: "battery_replacement_date", cls: "classification", serial: "serial_number" },
    filter: { cls: "classification", model: "ups_model" },
  }),
}

export const list = makeList(spec)
