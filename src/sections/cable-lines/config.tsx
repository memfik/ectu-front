import { Cable } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, s } from "@/lib/api/helpers"
import { LINES, km, num, obj, pick } from "@/sections/spec-helpers"

/** КЛС (макет 08): описание раздела и источник в API. */
export const spec: Spec = {
  key: "cable-lines",
  num: "08",
  title: "КЛС",
  crumb: LINES,
  sub: "Форма учёта кабельных (медных) линий связи",
  icon: Cable,
  hero: "/nodes/g-3.jpg",
  total: 119,
  unit: ["трасса", "трассы", "трасс"],
  search: "Наименование, начало, конец…",
  kpis: [
    { t: "Протяжённость", color: "#a78bfa", value: "612 км", note: "" },
    { t: "Пары заняты", color: "#22d3ee", value: "81%", note: "", pct: 81 },
    { t: "Арендованные", color: "var(--status-nolink)", value: "18", note: "трасс", pct: 15 },
    { t: "Без документов", color: "#ff5257", value: "44", note: "21%", pct: 21 },
    { t: "На карте", color: "var(--status-ok)", value: "190", note: "89%", pct: 89 },
  ],
  statuses: { work: ["В эксплуатации", "ok"], off: ["Выведена", "bad"] },
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "name", t: "Наименование трассы", show: "bold" },
    { k: "route", t: "Начало → конец", show: "muted" },
    { k: "len", t: "Длина, км", show: "num" },
    { k: "pairs", t: "Пары", show: "num" },
    { k: "owner", t: "Принадлежность", filter: "Принадлежность кабеля" },
  ],
  seed: [
    {
      num: 8,
      branch: "ЗФ",
      name: "Местные сети ТПП 50х2 на участке УС «Центральный»",
      route: "УС Центральный → АФ АО «Нефтяная…»",
      len: "1,36",
      pairs: 50,
      owner: "ЗФ АО «Jusan Mobile»",
    },
    {
      num: 6,
      branch: "ЗФ",
      name: "Местные сети ТПП 30*2 на участке «Абая2»",
      route: "пр. Абая,2 → пр. Абая,2а",
      len: "0,435",
      pairs: 30,
      owner: "JM",
    },
    {
      num: 10,
      branch: "АС",
      name: "РШ-3-01 - РШ-3-03",
      route: "РШ-3-01 → РШ-3-03",
      len: "0,847",
      pairs: 100,
      owner: "АО «Jusan Mobile»",
    },
    {
      num: 1,
      branch: "УФ",
      name: "Распределительная сеть ШР-01 офис УФ",
      route: "АО «Jusan Mobile» → ШР-01",
      len: "0,45",
      pairs: 50,
      owner: "АО JM",
    },
  ],
  gen: (i, r, n) => ({
    num: i + 1,
    name: `Местные сети ТПП ${pick(r, [10, 20, 30, 50, 100])}х2 · ${obj(n)}`,
    route: `${n.code} → РШ-${num(r, 1, 30)}`,
    len: km(r, 0.2, 4),
    pairs: pick(r, [10, 20, 30, 50, 100]),
    owner: pick(r, ["АО «QMobile»", "JM", "Аренда"]),
  }),
  name: (x) => `КЛС №${x.num}`,
  sub2: (x) => `${x.f.route} · ${x.f.len} км`,
  api: genApi({
    base: "/api/kls",
    trashKey: "kls",
    fields: {
      name: "track_name",
      route: (o) => `${s(o, "start_point")} → ${s(o, "end_point")}`,
      len: "track_length",
      pairs: "total_copper_pairs",
      owner: "cable_owner",
    },
  }),
}

export const list = makeList(spec)
