import { GitBranch } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf } from "@/lib/api/helpers"
import { STD_KPI, num, pick, used } from "@/sections/spec-helpers"

/** PDH (макет 22): описание раздела и источник в API. */
export const spec: Spec = {
  key: "pdh",
  num: "22",
  title: "PDH",
  crumb: "Оборудование / Проводные технологии",
  sub: "Форма учёта · PDH",
  icon: GitBranch,
  hero: "/equipment/switch-hero.jpg",
  total: 118,
  unit: ["устройство", "устройства", "устройств"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "E1 монтировано", color: "#a78bfa", value: "612", note: "" },
    { t: "E1 задействовано", color: "#22d3ee", value: "71%", note: "", pct: 71 },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "model", t: "Модель", show: "bold", filter: "Модель" },
    { k: "nodeCode", t: "ID УС" },
    { k: "e1", t: "E1 (З./М.)", show: "pair" },
    { k: "client", t: "Клиент", show: "muted" },
    { k: "vendor", t: "Вендор", hidden: true },
    { k: "serial", t: "S/N", hidden: true },
  ],
  seed: [
    { num: 1, branch: "МФ", model: "OP-108", e1: "1 / 4", client: "852007701", vendor: "RAD" },
    { num: 3, branch: "МФ", model: "OP-108", e1: "3 / 4", client: "933002594", vendor: "RAD" },
    { num: 7, branch: "АС", model: "FOM-4R-FE-T40", e1: "1 / 4", client: "АС-II00000470", vendor: "Fiberhome" },
    { num: 16, branch: "ЮФ", model: "FMUX01A+", e1: "1 / 4", client: "—", vendor: "Raisecom" },
  ],
  gen: (i, r) => ({
    num: i + 1,
    model: pick(r, ["OP-108", "RAD Optimux-108", "FMUX01A+", "FOM-4R-FE-T40"]),
    e1: used(r, pick(r, [4, 8, 16])),
    client: String(num(r, 100000000, 999999999)),
    vendor: pick(r, ["RAD", "Raisecom", "Fiberhome"]),
    serial: `PD${num(r, 10000, 99999)}`,
  }),
  name: (x) => `PDH · ${x.f.model}`,
  sub2: (x) => `${x.nodeCode} · E1 ${x.f.e1}`,
  api: genApi({
    base: "/api/pdh-equipments",
    trashKey: "pdh_equipments",
    node: "node1",
    fields: { model: "model", e1: pairOf("e1_used", "e1_total"), client: "client", vendor: "vendor", serial: "serial_number" },
  }),
}

export const list = makeList(spec)
