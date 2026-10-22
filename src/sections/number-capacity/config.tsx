import { Hash } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf, s } from "@/sections/api-helpers"
import { num, pick } from "@/sections/spec-helpers"

/** Номерная ёмкость (макет 21): описание раздела и источник в API. */
export const spec: Spec = {
  key: "number-capacity",
  num: "21",
  title: "Номерная ёмкость",
  crumb: "Оборудование / Автоматическая электросвязь",
  sub: "Форма учёта · Номерная ёмкость",
  icon: Hash,
  hero: "/equipment/switch-hero.jpg",
  total: 112,
  unit: ["код", "кода", "кодов"],
  search: "Код, город, ТУ…",
  noMap: true,
  kpis: [
    { t: "Ресурс номеров", color: "#a78bfa", value: "1,2 млн", note: "" },
    { t: "Монтировано", color: "#22d3ee", value: "71%", note: "", pct: 71 },
    { t: "Задействовано", color: "#085eff", value: "58%", note: "", pct: 58 },
    { t: "Без ТУ", color: "#ff5257", value: "9", note: "", pct: 8 },
    { t: "Резерв", color: "var(--status-nolink)", value: "142 000", note: "" },
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "code", t: "Код и диапазон", show: "bold" },
    { k: "town", t: "Город / область" },
    { k: "mounted", t: "Монтировано / ресурс", show: "pair" },
    { k: "used", t: "Задействовано", show: "num" },
    { k: "kind", t: "Назначение", opts: ["ОПТС", "АМТС", "резерв"], filter: "Назначение" },
    { k: "tu", t: "Реквизиты ТУ и Приказа Регулятора", hidden: true },
  ],
  gen: (i, r, n) => {
    const code = pick(r, ["7172", "7273", "7112", "7292", "7252", "7212"])
    const res = pick(r, [10000, 20000, 50000])
    const m = Math.round(res * (0.4 + r() * 0.5))
    return {
      num: `${num(r, 1, 6)}.${num(r, 1, 120)}`,
      code: `${code} · ${num(r, 20, 59)}0000–${num(r, 60, 99)}9999`,
      town: n.city,
      mounted: `${m} / ${res}`,
      used: Math.round(m * (0.6 + r() * 0.3)),
      kind: pick(r, ["ОПТС", "ОПТС", "АМТС", "резерв"]),
      tu: `ТУ № 18-04/${num(r, 1000, 2999)}, Приказ № ${num(r, 100, 499)}`,
    }
  },
  name: (x) => `Код ${String(x.f.code).split(" ·")[0]}`,
  sub2: (x) => `${x.f.code} · ${x.f.town}`,
  api: genApi({
    base: "/api/phone_number_capacities",
    idParam: "phone_id",
    trashKey: "phone_capacities",
    fields: {
      code: (o) => `${s(o, "allocated_code")} · ${s(o, "allocated_start")}–${s(o, "allocated_end")}`,
      town: "city_or_region",
      mounted: pairOf("mounted_resource", "allocated_resource"),
      used: "used_resource",
      tu: "regulator_order_number_date_issuer",
    },
  }),
}

export const list = makeList(spec)
