import { Spline } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf } from "@/lib/api/helpers"
import { STD_KPI, num, pick, used } from "@/sections/spec-helpers"

/** SDH (макет 23): описание раздела и источник в API. */
export const spec: Spec = {
  key: "sdh",
  num: "23",
  title: "SDH",
  crumb: "Оборудование / Проводные технологии",
  sub: "Форма учёта · SDH",
  icon: Spline,
  hero: "/equipment/switch-hero.jpg",
  total: 519,
  unit: ["устройство", "устройства", "устройств"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "VC-12 занято", color: "#a78bfa", value: "68%", note: "", pct: 68 },
    { t: "STM-16 колец", color: "#22d3ee", value: "9", note: "" },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "model", t: "Модель", show: "bold", filter: "Модель" },
    { k: "nodeCode", t: "ID УС" },
    { k: "stm", t: "STM-1 (З./М.)", show: "pair" },
    { k: "vc", t: "VC-12 (З./М.)", show: "pair" },
    { k: "vendor", t: "Производитель", hidden: true },
  ],
  gen: (i, r) => ({
    num: `${num(r, 1, 12)}.${num(r, 1, 4)}`,
    model: pick(r, ["CISCO ONS 15454", "CISCO ONS 15305", "SDH S325", "TN-4XE", "FCD-155E/8E1"]),
    stm: used(r, pick(r, [2, 4, 8])),
    vc: used(r, 63, 0.8),
    vendor: pick(r, ["CISCO", "Huawei", "RAD"]),
  }),
  name: (x) => `SDH · ${x.f.model}`,
  sub2: (x) => `${x.nodeCode} · VC-12 ${x.f.vc}`,
  api: genApi({
    base: "/api/sdh-equipments",
    trashKey: "sdh_equipments",
    fields: {
      model: "sdh_multiplexer_model",
      stm: pairOf("stm_used", "stm_total"),
      vc: pairOf("vc12_used", "vc12_total"),
      vendor: "vendor",
    },
  }),
}

export const list = makeList(spec)
