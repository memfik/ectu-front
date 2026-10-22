import { RadioTower } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi } from "@/sections/api-helpers"
import { LINES, pick } from "@/sections/spec-helpers"

/** АМС (макет 11): описание раздела и источник в API. */
export const spec: Spec = {
  key: "masts",
  num: "11",
  title: "АМС",
  crumb: LINES,
  sub: "Форма учёта антенно-мачтовых сооружений",
  icon: RadioTower,
  hero: "/nodes/tower.jpg",
  total: 38,
  unit: ["АМС", "АМС", "АМС"],
  search: "ID УС, адрес, модель…",
  kpis: [
    { t: "Мачты / башни", color: "#a78bfa", value: "27 / 5", note: "" },
    { t: "Средняя высота", color: "#22d3ee", value: "46 м", note: "" },
    { t: "Без экспертизы", color: "#ff5257", value: "96", note: "24%", pct: 24 },
    { t: "Чужие площадки", color: "var(--status-nolink)", value: "131", note: "33%", pct: 33 },
    { t: "На карте", color: "var(--status-ok)", value: "402", note: "100%", pct: 100 },
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "nodeCode", t: "ID УС (БС)", show: "bold" },
    { k: "town", t: "Населённый пункт" },
    { k: "type", t: "Тип", opts: ["Мачта", "Башня", "Труба", "Кровельная стойка"], filter: "Тип АМС" },
    { k: "height", t: "Высота, м", show: "num" },
    { k: "owner", t: "Собственник площадки", show: "muted", filter: "Собственник площадки" },
    { k: "place", t: "Адрес установки", hidden: true },
  ],
  gen: (i, r, n) => ({
    num: i + 1,
    town: `г. ${n.city}`,
    type: r() > 0.16 ? "Мачта" : "Башня",
    height: pick(r, [20, 25, 30, 35, 40, 50, 60, 72]),
    owner: r() > 0.33 ? "АО «QMobile»" : pick(r, ["КТО", "ТОО «Казахтелеком»", "Частная"]),
    place: `${n.address.replace(/^г\. [^,]+, /, "")}, кровля`,
  }),
  name: (x) => `АМС ${x.nodeCode}`,
  sub2: (x) => `${x.f.type} · ${x.f.height} м · ${x.f.town}`,
  api: genApi({
    base: "/api/ams",
    trashKey: "ams",
    fields: { town: "node.ys_jm_locality", type: "ams_type", height: "height", owner: "platform_owner", place: "installation_address" },
    filter: { type: "ams_type", owner: "platform_owner" },
  }),
}

export const list = makeList(spec)
