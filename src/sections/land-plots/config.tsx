import { LandPlot } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi } from "@/lib/api/helpers"
import { STD_KPI, num, pick } from "@/sections/spec-helpers"

/** Земельные участки (макет 37): описание раздела и источник в API. */
export const spec: Spec = {
  key: "land-plots",
  num: "37",
  title: "Земельные участки",
  crumb: "Сеть",
  sub: "Форма учёта · Земельные участки",
  icon: LandPlot,
  hero: "/nodes/tower.jpg",
  total: 374,
  unit: ["участок", "участка", "участков"],
  search: "Поиск по наименованию, кадастровому номеру, ID УС…",
  kpis: [
    { t: "Собственность", color: "#a78bfa", value: "9", note: "" },
    { t: "Сервитут", color: "#22d3ee", value: "47", note: "" },
    { t: "Зарегистрировано", color: "var(--status-ok)", value: "91%", note: "", pct: 91 },
    ...STD_KPI("", "", "").slice(1),
  ],
  statuses: { reg: ["Зарегистрирован", "ok"], noreg: ["Не зарегистрирован", "warn"] },
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "name", t: "Наименование", show: "bold", required: true },
    { k: "nodeCode", t: "Узел связи" },
    { k: "area", t: "Площадь", show: "num" },
    { k: "own", t: "Вид собственности", opts: ["Собственность", "Аренда", "Сервитут"], filter: "Вид собственности" },
    { k: "vols", t: "ВОЛС", hidden: true },
    { k: "cadastre", t: "Кадастровый номер", hidden: true },
    { k: "kind", t: "Вид объекта", hidden: true, opts: ["Узел связи", "Офис", "АМС", "Коридор ВОЛС"], filter: "Вид объекта" },
    { k: "registered", t: "Зарегистрирован", hidden: true, opts: ["Да", "Нет"] },
    { k: "lease", t: "Сроки аренды", hidden: true },
  ],
  seed: [
    {
      num: 1,
      branch: "УФ",
      nodeCode: "url002.01.UF",
      name: "Административное здание г. Уральск,п. Желаево, промзона 7.",
      area: "1.80",
      own: "Собственность",
      vols: "ВОЛС №88",
      cadastre: "08-130---034-160, 08-130-034-160-7",
      kind: "Офис",
      registered: "Да",
      lease: "до 31.12.2035",
      status: "reg",
    },
    { num: 45, branch: "УФ", nodeCode: "url002.01.UF", name: "Объект «Модернизация действующего газопровода»", area: "0.09", own: "Аренда" },
    { num: 1, branch: "ЗФ", name: "Узел Связи Карабатан", area: "0.13", own: "—" },
    { num: 15, branch: "МФ", name: "Коридор для ВОЛС", area: "0.04", own: "—", kind: "Коридор ВОЛС" },
    { num: 1, branch: "АФ", name: "УС «Заречный»", area: "13337.00", own: "Собственность" },
    { num: 13, branch: "ШФ", name: "УС Керемет", area: "0.01", own: "Собственность" },
  ],
  gen: (i, r, n) => {
    const own = pick(r, ["Аренда", "Аренда", "Сервитут", "Собственность"])
    const reg = r() > 0.09
    return {
      num: i + 1,
      name: pick(r, [`УС «${n.object}»`, `Узел связи ${n.city}`, "Коридор для ВОЛС", `АМС ${n.code}`]),
      area: (r() * 0.3 + 0.01).toFixed(2),
      own,
      vols: r() > 0.5 ? `ВОЛС №${num(r, 1, 380)}` : "—",
      cadastre: `0${num(r, 1, 9)}-${num(r, 100, 399)}-0${num(r, 10, 99)}-${num(r, 100, 999)}`,
      kind: pick(r, ["Узел связи", "Узел связи", "АМС", "Коридор ВОЛС"]),
      registered: reg ? "Да" : "Нет",
      lease: own === "Собственность" ? "—" : `до 31.12.20${num(r, 27, 40)}`,
      status: reg ? "reg" : "noreg",
    }
  },
  name: (x) => String(x.f.name),
  sub2: (x) => `${x.nodeCode} · ${x.address}`,
  api: genApi({
    base: "/api/land-plots",
    idParam: "id",
    trashKey: "land_plot",
    fields: {
      name: "property_name",
      vols: "bols.name",
      cadastre: "cadastral_number",
      own: "ownership_type",
      kind: "object_type",
      area: "area",
      registered: (o) => (o.is_registered ? "Да" : "Нет"),
      lease: "lease_terms",
    },
    status: (o) => (o.is_registered ? "reg" : "noreg"),
    filter: { own: "ownership_type", kind: "object_type" },
  }),
}

export const list = makeList(spec)
