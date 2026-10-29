import { Users } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, s } from "@/lib/api/helpers"
import { num, pick } from "@/sections/spec-helpers"

/** Потенциальные клиенты (макет 12): описание раздела и источник в API. */
export const spec: Spec = {
  key: "prospects",
  num: "12",
  title: "Потенциальные клиенты",
  crumb: "Клиенты",
  sub: "Компании рядом с узлами связи — кого можно подключить",
  icon: Users,
  hero: "/nodes/clients.jpg",
  total: 43080,
  unit: ["компания", "компании", "компаний"],
  search: "БИН, наименование, узел связи…",
  kpis: [
    { t: "До 30 м", color: "#a78bfa", value: "3 120", note: "7%", pct: 7 },
    { t: "Обработано", color: "#ffc24a", value: "3 506", note: "8%", pct: 8 },
    { t: "Заявки KCRM", color: "#22d3ee", value: "1 120", note: "" },
    { t: "Стали клиентами", color: "var(--status-ok)", value: "662", note: "1,5%", pct: 2 },
    { t: "Потенц. доход", color: "#085eff", value: "7,8 млрд", note: "₸/год", pct: 60 },
  ],
  statuses: { none: ["Не обработан", "muted"], processed: ["Обработан", "warn"], client: ["Клиент", "ok"] },
  noMap: false,
  cols: [
    { k: "bin", t: "БИН", show: "muted" },
    { k: "company", t: "Наименование", show: "bold", required: true },
    { k: "branch", t: "Филиал" },
    { k: "kind", t: "Тип клиента", opts: ["B2B", "B2C", "B2G"], filter: "Тип клиента" },
    { k: "size", t: "Размер" },
    { k: "nodeCode", t: "Узел связи" },
    { k: "dist", t: "Дистанция, м", show: "num" },
    { k: "st", t: "Статус", show: "status" },
  ],
  gen: (i, r) => {
    const st = r() > 0.92 ? (r() > 0.8 ? "client" : "processed") : "none"
    return {
      bin: String(100000000000 + Math.floor(r() * 899999999999)),
      company: `${pick(r, ["ТОО", "ТОО", "ИП", "АО"])} «${pick(r, ["Нур", "Алтын", "Береке", "Самал", "Каспий", "Жайык", "Тулпар", "Сункар"])} ${pick(r, ["Групп", "Сервис", "Строй", "Трейд", "Логистик", "Агро"])}»`,
      kind: r() > 0.15 ? "B2B" : "B2C",
      size: pick(r, ["Микро (1)", "Малые (≤ 5)", "Малые (6–10)", "Малые (11–20)", "Средние (51–100)"]),
      dist: num(r, 10, 250),
      status: st,
    }
  },
  seed: [
    {
      bin: "000440005502",
      company: "ТОО «Авиакомпания Орлан-2000»",
      branch: "АС",
      kind: "B2B",
      size: "Малые (41–50)",
      nodeCode: "url002.01.UF",
      dist: 115,
      status: "processed",
    },
    {
      bin: "070540014109",
      company: "ТОО «Асыл-Ана компаниясы»",
      branch: "АС",
      kind: "B2B",
      size: "Малые (≤ 5)",
      nodeCode: "url002.01.UF",
      dist: 229,
      status: "processed",
    },
    {
      bin: "100440017386",
      company: "ТОО «СП Универсал Сервис»",
      branch: "АС",
      kind: "B2B",
      size: "Малые (≤ 5)",
      dist: 115,
      status: "none",
    },
    { bin: "170640008446", company: "ТОО «Бота-2017»", branch: "АС", kind: "B2B", size: "Малые (6–10)", dist: 71, status: "client" },
    {
      bin: "190840025982",
      company: "ТОО «A&Meirim»",
      branch: "ЮФ",
      kind: "B2B",
      size: "Малые (≤ 5)",
      nodeCode: "alm001.01.YF",
      dist: 246,
      status: "none",
    },
    {
      bin: "210140011204",
      company: "ИП «Сапарова А.»",
      branch: "АС",
      kind: "B2C",
      size: "Микро (1)",
      nodeCode: "url002.01.UF",
      dist: 64,
      status: "client",
    },
  ],
  name: (x) => String(x.f.company),
  sub2: (x) => `БИН ${x.f.bin} · ${x.f.dist} м до ${x.nodeCode}`,
  api: genApi({
    base: "/api/potential-clients",
    idParam: "id",
    trashKey: "potential_clients",
    fields: { bin: "bin", company: "name", kind: "client_type", size: "size_category", dist: "distance_to_node" },
    status: (o) => {
      const v = s(o, "status", "").toLowerCase()
      return /клиент|client/.test(v) ? "client" : /обработ|processed/.test(v) && !/не /.test(v) ? "processed" : "none"
    },
    filter: { kind: "client_type", status: "status" },
  }),
}

export const list = makeList(spec)
