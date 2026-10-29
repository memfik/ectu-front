import { Satellite } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, s } from "@/lib/api/helpers"
import { SAT, STD_KPI, num, pick } from "@/sections/spec-helpers"

/** OneWeb LEO (макет 32): описание раздела и источник в API. */
export const spec: Spec = {
  key: "oneweb",
  num: "32",
  title: "OneWeb LEO",
  crumb: SAT,
  sub: "Форма учёта · OneWeb LEO",
  icon: Satellite,
  hero: "/nodes/g-2.jpg",
  total: 442,
  unit: ["станция", "станции", "станций"],
  search: "Станция, клиент, область, IP…",
  kpis: [
    { t: "Школы и ФАП", color: "#a78bfa", value: "812", note: "" },
    { t: "На тесте", color: "var(--status-nolink)", value: "38", note: "", pct: 9 },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  statuses: { work: ["В работе", "ok"], test: ["Тест", "warn"], off: ["Отключена", "bad"] },
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "station", t: "Станция", show: "bold" },
    { k: "terminal", t: "Терминал", filter: "Тип терминала" },
    { k: "client", t: "Клиент", show: "muted" },
    { k: "category", t: "Категория", opts: ["COTM", "Fixed"], filter: "Категория" },
    { k: "oblast", t: "Область", hidden: true, filter: "Область" },
    { k: "ip", t: "IP address", hidden: true },
  ],
  seed: [
    { num: 31, branch: "УФ", station: "SNP-Chapurino", terminal: "Hughes HL1120W", client: "с. Чапурино", category: "COTM" },
    { num: 1, branch: "КФ", station: "SNP-Zhanakurylys", terminal: "Hughes HL1120W", client: "с. Жанакурылыс", category: "COTM" },
    { num: 6, branch: "ШФ", station: "SNP-Darbaza", terminal: "Hughes HL1120W", client: "с. Дарбаза", category: "COTM" },
    { num: 34, branch: "ВФ", station: "SNP-Bogatyrevo-Vko", terminal: "Hughes HL1100W", client: "с. Богатырево", category: "Fixed" },
  ],
  gen: (i, r) => {
    const v = pick(r, ["Tassay", "Gornoe", "Akkol", "Shieli", "Karabulak", "Zhanatas"])
    return {
      num: i + 1,
      station: `SNP-${v}`,
      terminal: pick(r, ["Hughes HL1120W", "Hughes HL1100W"]),
      client: `с. ${v}`,
      category: r() > 0.4 ? "COTM" : "Fixed",
      oblast: pick(r, ["Кызылординская", "Акмолинская", "Туркестанская", "ВКО"]),
      ip: `10.${num(r, 60, 70)}.${num(r, 1, 250)}.${num(r, 1, 250)}`,
      status: r() > 0.09 ? "work" : "test",
    }
  },
  name: (x) => String(x.f.station),
  sub2: (x) => `${x.f.client} · ${x.f.terminal}`,
  api: genApi({
    base: "/api/oneweb",
    trashKey: "one_web",
    fields: {
      station: "station_name",
      terminal: "terminal_type",
      client: "client",
      category: "category",
      oblast: "oblast",
      ip: "ip_address",
    },
    status: (o) =>
      /тест|test/i.test(s(o, "station_status", "")) ? "test" : /откл|off|inactive/i.test(s(o, "station_status", "")) ? "off" : "work",
    filter: { oblast: "oblast", category: "category" },
  }),
}

export const list = makeList(spec)
