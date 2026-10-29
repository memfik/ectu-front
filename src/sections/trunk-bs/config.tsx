import { RadioTower } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, s } from "@/lib/api/helpers"
import { STD_KPI, WIRELESS, num, pick } from "@/sections/spec-helpers"

/** БС Транк (макет 30): описание раздела и источник в API. */
export const spec: Spec = {
  key: "trunk-bs",
  num: "30",
  title: "БС Транк",
  crumb: WIRELESS,
  sub: "Форма учёта · БС Транк",
  icon: RadioTower,
  hero: "/nodes/tower.jpg",
  total: 14,
  unit: ["станция", "станции", "станций"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "Терминалов", color: "#a78bfa", value: "612", note: "" },
    { t: "Резерв", color: "#22d3ee", value: "2", note: "" },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  statuses: { work: ["В работе", "ok"], reserve: ["Резерв", "info"], off: ["Демонтирована", "bad"] },
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "model", t: "Тип/модель БС", show: "bold" },
    { k: "nodeCode", t: "ID УС" },
    { k: "terminals", t: "Терминалов", show: "num" },
    { k: "state", t: "Состояние", show: "muted", filter: "Состояние" },
    { k: "place", t: "Место установки", hidden: true },
  ],
  seed: [
    {
      num: 1,
      branch: "УФ",
      nodeCode: "url002.01.UF",
      model: "Motorola MTR 2000, Транкинг - конвенциональная",
      terminals: 18,
      state: "демонтирована",
      status: "off",
    },
    {
      num: 2,
      branch: "УФ",
      nodeCode: "url002.01.UF",
      model: "Motorola MTR 2000, Транкинг - конвенциональная",
      terminals: 10,
      state: "демонтирована",
      status: "off",
    },
    { num: 1, branch: "АФ", model: "Vertax 7000", terminals: "—", state: "Демонтированно, акт 437 от 22 сентября 2016г", status: "off" },
  ],
  gen: (i, r) => ({
    num: i + 1,
    model: pick(r, ["Motorola MTR 2000", "Vertax 7000", "Hytera DS-6210"]),
    terminals: num(r, 4, 90),
    state: r() > 0.5 ? "в работе" : "резерв",
    place: "контейнер",
    status: r() > 0.5 ? "work" : "reserve",
  }),
  name: (x) => `БС Транк · ${String(x.f.model).split(",")[0]}`,
  sub2: (x) => `${x.nodeCode} · ${x.f.terminals} терминалов`,
  api: genApi({
    base: "/api/bc",
    trashKey: "bc",
    fields: { model: "type_model", terminals: "terminal_count", state: "status", place: "installation_place" },
    status: (o) => (/демонт/i.test(s(o, "status", "")) ? "off" : /резерв/i.test(s(o, "status", "")) ? "reserve" : "work"),
    filter: { state: "status" },
  }),
}

export const list = makeList(spec)
