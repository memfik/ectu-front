import { Rows3 } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf } from "@/sections/api-helpers"
import { STD_KPI, pick, used } from "@/sections/spec-helpers"

/** DWDM (макет 24): описание раздела и источник в API. */
export const spec: Spec = {
  key: "dwdm",
  num: "24",
  title: "DWDM",
  crumb: "Оборудование / Проводные технологии",
  sub: "Форма учёта · DWDM",
  icon: Rows3,
  hero: "/equipment/switch-hero.jpg",
  total: 24,
  unit: ["устройство", "устройства", "устройств"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "Длин волн занято", color: "#a78bfa", value: "41%", note: "", pct: 41 },
    { t: "Магистралей", color: "#22d3ee", value: "11", note: "" },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "model", t: "Модель", show: "bold", filter: "Модель" },
    { k: "nodeCode", t: "ID УС" },
    { k: "lambda", t: "λ (З./М.)", show: "pair" },
    { k: "dir", t: "Направление", show: "muted" },
  ],
  gen: (i, r, n) => ({
    num: i + 1,
    model: pick(r, ["CISCO ONS 15454 (Shelf 3)", "Huawei OptiX OSN 1800 II", "EKINOPS", "Cisco ONS 15454 М6"]),
    lambda: used(r, 40, 0.5),
    dir: `${n.city} — ${pick(r, ["Астана", "Алматы", "Актобе", "Атырау"])}`,
  }),
  name: (x) => `DWDM · ${x.f.model}`,
  sub2: (x) => `${x.nodeCode} · ${x.f.dir}`,
  api: genApi({
    base: "/api/dwdm-equipments",
    trashKey: "dwdm_equipments",
    fields: { model: "model", lambda: pairOf("lambda_used", "lambda_total"), dir: "direction" },
  }),
}

export const list = makeList(spec)
