import { Fuel } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi } from "@/sections/api-helpers"
import { STD_KPI, num, pick } from "@/sections/spec-helpers"

/** ГЭУ (макет 34): описание раздела и источник в API. */
export const spec: Spec = {
  key: "gen",
  num: "34",
  title: "ГЭУ",
  crumb: "Оборудование / Электропитание",
  sub: "Форма учёта · ГЭУ",
  icon: Fuel,
  hero: "/nodes/g-4.jpg",
  total: 139,
  unit: ["ГЭУ", "ГЭУ", "ГЭУ"],
  search: "Поиск по ID УС, адресу, модели, S/N…",
  kpis: [
    { t: "Дизельных", color: "var(--status-nolink)", value: "188", note: "" },
    { t: "Передвижных", color: "#22d3ee", value: "24", note: "" },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "model", t: "Модель", show: "bold", filter: "Модель" },
    { k: "nodeCode", t: "ID УС" },
    { k: "power", t: "Мощность" },
    { k: "fuel", t: "Топливо", opts: ["бензин", "дизель", "газ"], filter: "Тип топлива" },
    { k: "serial", t: "S/N", hidden: true },
    { k: "phases", t: "Кол-во фаз", hidden: true, opts: ["1", "3"] },
    { k: "engine", t: "Тип двигателя", hidden: true },
    { k: "generator", t: "Генератор", hidden: true, opts: ["синхронный", "асинхронный"] },
    { k: "tank", t: "Емкость бака, литров", hidden: true },
    { k: "execution", t: "Исполнение", hidden: true, opts: ["открытое", "в кожухе", "в контейнере"], filter: "Исполнение" },
    { k: "mobility", t: "Степень подвижности", hidden: true, opts: ["стационарный", "передвижной"] },
    { k: "automation", t: "Степень автоматизации (I-IV)", hidden: true, opts: ["I", "II", "III", "IV"] },
    { k: "since", t: "Дата ввода в эксплуатацию", hidden: true },
  ],
  seed: [
    {
      num: 7,
      branch: "УФ",
      nodeCode: "url002.01.UF",
      model: "ТЕМП БЭ 6500",
      power: "5,5",
      fuel: "бензин",
      serial: "QF1104220251",
      phases: "1",
      engine: "4-х тактный, одноцилиндровый",
      generator: "синхронный",
      tank: "25",
      execution: "открытое",
      mobility: "передвижной",
      automation: "I",
      since: "2011",
    },
    { num: 8, branch: "УФ", nodeCode: "url002.01.UF", model: "Etalon/ SPG 6500", power: "5,5", fuel: "бензин" },
    { num: 2, branch: "АС", model: "FG Wilson P150-1", power: "150kVA/120kW", fuel: "дизель", tank: "300", phases: "3" },
    { num: 2, branch: "АФ", model: "Е20ДМА", power: "20кВА", fuel: "дизель", phases: "3" },
    { num: 1, branch: "ВФ", model: "Honda Elemax SH5000DX", power: "5/3,8", fuel: "бензин" },
    { num: 1, branch: "ШФ", model: "Honda Elemax SH 7000 dx", power: "5,6 кВA", fuel: "бензин" },
  ],
  gen: (i, r) => {
    const diesel = r() > 0.45
    return {
      num: i + 1,
      model: diesel
        ? pick(r, ["FG Wilson P18-6", "FG Wilson P150-1", "Е20ДМА", "SDMO J22", "Gesan DPAS 22"])
        : pick(r, ["ТЕМП БЭ 6500", "Honda Elemax SH5000DX", "Etalon/ SPG 6500", "Huter DY6500L"]),
      power: diesel ? pick(r, ["18кВА/14кВт", "22кВА/17,6кВт", "20кВА", "150kVA/120kW"]) : pick(r, ["5,5", "5/3,8", "5,6 кВA"]),
      fuel: diesel ? "дизель" : "бензин",
      serial: `QF${num(r, 1000000000, 9999999999)}`,
      phases: diesel ? "3" : "1",
      engine: diesel ? pick(r, ["Perkins 404D-22G", "Perkins 1106A-70TG1", "Mitsubishi S4S"]) : "4-х тактный, одноцилиндровый",
      generator: "синхронный",
      tank: diesel ? pick(r, ["60", "120", "300"]) : pick(r, ["15", "25"]),
      execution: diesel ? pick(r, ["в кожухе", "в контейнере"]) : "открытое",
      mobility: diesel ? pick(r, ["стационарный", "стационарный", "передвижной"]) : "передвижной",
      automation: diesel ? pick(r, ["II", "II", "III"]) : "I",
      since: String(num(r, 2008, 2024)),
    }
  },
  name: (x) => `ГЭУ · ${x.f.model}`,
  sub2: (x) => `${x.nodeCode} · ${x.f.power}`,
  api: genApi({
    base: "/api/gey",
    trashKey: "gey",
    fields: {
      model: "equipment_model",
      serial: "serial_number",
      power: "power_kva",
      fuel: "fuel_type",
      phases: "phases_count",
      engine: "engine_type",
      generator: "generator_type",
      tank: "fuel_tank_capacity",
      execution: "execution",
      mobility: "mobility",
      automation: "automation_level",
      since: "commissioning_date",
    },
    filter: { model: "equipment_model", fuel: "fuel_type" },
  }),
}

export const list = makeList(spec)
