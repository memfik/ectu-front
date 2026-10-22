import { Spline } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi } from "@/sections/api-helpers"
import { LINES, km, num, obj, pick } from "@/sections/spec-helpers"

/** Кабельная канализация (макет 09): описание раздела и источник в API. */
export const spec: Spec = {
  key: "cable-ducts",
  num: "09",
  title: "Кабельная канализация",
  crumb: LINES,
  sub: "Форма учёта кабельной канализации",
  icon: Spline,
  hero: "/nodes/g-3.jpg",
  total: 116,
  unit: ["участок", "участка", "участков"],
  search: "Наименование участка…",
  kpis: [
    { t: "Колодцев", color: "#a78bfa", value: "3 410", note: "" },
    { t: "Канал·км", color: "#22d3ee", value: "1 860", note: "" },
    { t: "Сдано в аренду", color: "var(--status-nolink)", value: "26", note: "участков", pct: 22 },
    { t: "Без документов", color: "#ff5257", value: "58", note: "19%", pct: 19 },
    { t: "На карте", color: "var(--status-ok)", value: "300", note: "96%", pct: 96 },
  ],
  statuses: { work: ["В эксплуатации", "ok"], off: ["Выведен", "bad"] },
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "name", t: "Наименование участка", show: "bold" },
    { k: "wells", t: "Колодцев", show: "num" },
    { k: "len", t: "Длина, м", show: "num" },
    { k: "channels", t: "Каналов", show: "num" },
    { k: "puncture", t: "Прокол", opts: ["Да", "Нет"] },
    { k: "desc", t: "Описание", hidden: true },
  ],
  seed: [
    { num: 7, branch: "УФ", name: "ПЧ-11 - УС Аксай - АТС-3 (промзона Аксай)", wells: 8, len: "519,70", channels: 1, puncture: "Да" },
    { num: 5, branch: "УФ", name: "колодец № 1 ул. М.Маметовой - ТД «Нафта»", wells: 4, len: "108,00", channels: 1, puncture: "Да" },
    {
      num: 66,
      branch: "АС",
      name: "Шоссе Коргальжин от колодца 01-01 до колодца 01-09",
      wells: 8,
      len: "547,93",
      channels: 4,
      puncture: "Нет",
    },
    { num: 1, branch: "МФ", name: "УС Тениз - гост. Holiday Inn", wells: 12, len: "781", channels: 1, puncture: "Да" },
  ],
  gen: (i, r, n) => ({
    num: i + 1,
    name: `${obj(n)} - ${pick(r, ["АТС-3", "ТД", "колодец № 1", "БЦ"])}`,
    wells: num(r, 2, 14),
    len: km(r, 80, 900),
    channels: num(r, 1, 6),
    puncture: r() > 0.5 ? "Да" : "Нет",
    desc: "Одноканальная кабельная канализация",
  }),
  name: (x) => `КК №${x.num}`,
  sub2: (x) => `${x.f.name} · ${x.f.len} м`,
  api: genApi({
    base: "/api/kk",
    trashKey: "kk",
    fields: {
      name: "section_name",
      wells: "well_count",
      len: "length",
      channels: "channel_count",
      puncture: "puncture",
      desc: "description",
    },
  }),
}

export const list = makeList(spec)
