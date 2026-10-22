import { Wifi } from "lucide-react"
import type { Spec } from "@/sections/make"
import { num, pick, STD_KPI, used, WIRELESS } from "@/sections/spec-helpers"

/** Общий шаблон БШД (макеты 27–29): WiMAX, Telrad LTE, WLL отличаются моделями и вендорами. */
export const bwa = (key: string, no: string, title: string, total: number, models: string[], vendor: string[]): Spec => ({
  key,
  num: no,
  title,
  crumb: WIRELESS,
  sub: `Форма учёта · ${title}`,
  icon: Wifi,
  hero: "/nodes/tower.jpg",
  total,
  unit: ["базовая станция", "базовые станции", "базовых станций"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "Абонентов", color: "#a78bfa", value: "4 120", note: "" },
    { t: "Лицензий занято", color: "#22d3ee", value: "68%", note: "", pct: 68 },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "model", t: "Базовая станция", show: "bold", filter: "Модель" },
    { k: "nodeCode", t: "ID УС (БС)" },
    { k: "place", t: "Адрес установки", show: "muted" },
    { k: "subs", t: "Абоненты / лицензии", show: "pair" },
    { k: "sectors", t: "Сектора", show: "num" },
    { k: "freq", t: "Частота, МГц" },
    { k: "vendor", t: "Вендор", hidden: true, opts: vendor, filter: "Вендор" },
    { k: "network", t: "Тип сети", hidden: true, opts: ["ГМС", "ГРС", "ГАС", "МС"], filter: "Тип сети" },
    { k: "serial", t: "Серийный номер", hidden: true },
  ],
  gen: (i, r, n) => ({
    num: `${num(r, 1, 6)}.${num(r, 1, 5)}`,
    model: pick(r, models),
    place: r() > 0.4 ? n.address : "—",
    subs: used(r, pick(r, [32, 64, 128, 256]), 0.7),
    sectors: num(r, 1, 6),
    freq: String(pick(r, [3403, 3415, 3509, 3610, 3680, 3750, 5330, 5020])),
    vendor: pick(r, vendor),
    network: n.network,
    serial: `${num(r, 100000, 999999)}C8B${num(r, 100, 999)}`,
  }),
  name: (x) => `БС ${x.f.model}`,
  sub2: (x) => `${x.nodeCode} · ${x.f.subs} абонентов`,
  bar: (x) => {
    const m = String(x.f.subs).match(/(\d+) \/ (\d+)/)
    return m ? ["Абоненты", +m[1], +m[2]] : null
  },
})
