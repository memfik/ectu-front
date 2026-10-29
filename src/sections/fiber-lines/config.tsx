import { Cable } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf, s } from "@/lib/api/helpers"
import { LINES, km, obj, pick, used } from "@/sections/spec-helpers"

/** ВОЛС (макет 07): описание раздела и источник в API. */
export const spec: Spec = {
  key: "fiber-lines",
  num: "07",
  title: "ВОЛС",
  crumb: LINES,
  sub: "Форма учёта волоконно-оптических линий связи",
  icon: Cable,
  hero: "/nodes/g-3.jpg",
  total: 1693,
  unit: ["трасса", "трассы", "трасс"],
  search: "Наименование, начало, конец, УС…",
  kpis: [
    { t: "Протяжённость", color: "#a78bfa", value: "41 820 км", note: "" },
    { t: "Ёмкость волокон", color: "#22d3ee", value: "98%", note: "", pct: 98 },
    { t: "Арендованные", color: "var(--status-nolink)", value: "52", note: "трассы", pct: 3 },
    { t: "Без документов", color: "#ff5257", value: "61", note: "16%", pct: 16 },
    { t: "На карте", color: "var(--status-ok)", value: "371", note: "98%", pct: 98 },
  ],
  statuses: { work: ["В эксплуатации", "ok"], plan: ["Проектируется", "info"], off: ["Выведена", "bad"] },
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "name", t: "Наименование трассы", show: "bold" },
    { k: "route", t: "Начало → конец", show: "muted" },
    { k: "len", t: "Длина, км", show: "num" },
    { k: "fibers", t: "Волокна", show: "pair" },
    { k: "cable", t: "Тип прокладки / кабель", filter: "Марка кабеля" },
    { k: "owner", t: "Собственник ВОК", hidden: true, opts: ["АО «QMobile»", "Аренда", "Совместная"], filter: "Собственник ВОК" },
    { k: "network", t: "Тип сети", hidden: true, opts: ["ГМС", "ГРС", "ГАС", "МС"], filter: "Тип сети" },
    { k: "total", t: "Суммарная длина кабеля, км", hidden: true },
  ],
  seed: [
    {
      num: 253,
      branch: "ЗФ",
      name: "Новый БЦ ул.Ерниязова",
      route: "муфта → УС «Центральный»",
      len: "0,200",
      fibers: "1 / 8",
      cable: "ОКСЛ А 8",
    },
    {
      num: 69,
      branch: "МФ",
      name: "Прокладка кабеля связи в г.Актау Caspian Engineering",
      route: "Caspian Engineering → муфта ТК (465)",
      len: "0,382",
      fibers: "— / 12",
      cable: "СКО-ДПО-0-О12А",
    },
    {
      num: 14,
      branch: "ВФ",
      name: "Департамент по делам обороны Павлодарской обл.",
      route: "Муфта №3 (ул.Камзина) → ул. Нурмагамбетова",
      len: "0,2",
      fibers: "2 / 8",
      cable: "ОК/Т-М4П-А8-8,0",
    },
    {
      num: 110,
      branch: "ШФ",
      name: "ТОО «KURSI Маркетинг» ИЗ Ордабасы",
      route: "Муфта от Дирекции → ТОО «KURSI Маркетинг»",
      len: "0,2",
      fibers: "1 / 2",
      cable: "ОК-2",
    },
    {
      num: 26,
      branch: "АС",
      name: "УС «Габдулина 02(10)» — ТД БЦ Астана Тауэр",
      route: "УС «Габдулина 02» → ТД БЦ Астана Тауэр",
      len: "1,28",
      fibers: "6 / 8",
      cable: "ДПС-08",
    },
  ],
  gen: (i, r, n) => {
    const t = pick(r, [8, 16, 24, 32, 48, 64])
    return {
      num: i + 1,
      name: `${obj(n)} — ${pick(r, ["УС «РТПЦ»", "муфта ТК", "БЦ", "КСО АТС-14", "ТД"])}`,
      route: `${n.code} → ${pick(r, ["муфта ТК", "УС «РТПЦ»", "ODF-1", "КСО"])}`,
      len: km(r, 0.1, 9),
      fibers: used(r, t),
      cable: pick(r, ["ОКЛ-0,22-24", "ОКСЛ А 8", "ДПС-08", "ОК-8", "ОКЛ-0,22-32"]),
      owner: r() > 0.03 ? "АО «QMobile»" : "Аренда",
      network: n.network,
      total: km(r, 0.1, 12),
    }
  },
  name: (x) => `ВОЛС №${x.num}`,
  sub2: (x) => `${x.f.route} · ${x.f.len} км`,
  bar: (x) => {
    const m = String(x.f.fibers).match(/(\d+) \/ (\d+)/)
    return m ? ["Волокна", +m[1], +m[2]] : null
  },
  api: genApi({
    base: "/api/bols",
    idParam: "vols_id",
    trashKey: "bols",
    fields: {
      name: "route_name",
      route: (o) => `${s(o, "start_point")} → ${s(o, "end_point")}`,
      len: "route_length",
      total: "total_cable_length",
      cable: "cable_type",
      network: "network_type",
      // TODO(API): занятость волокон — нет в /filter (есть /api/bols/children)
      fibers: pairOf("used_fibers", "fiber_count"),
      owner: "cable_owner",
    },
    filter: { network: "network_type", owner: "cable_owner", cable: "cable_type" },
  }),
}

export const list = makeList(spec)
