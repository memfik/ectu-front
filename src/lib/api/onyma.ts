"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import { blankEquip, num, pick, seedEquip, type Equip } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"

/*
 * 13 Клиенты Onyma — данные раздела (только просмотр, без импорта). Без API — примеры в памяти вкладки (первые 5 абонентов из макета).
 * API техучёта: /api/onyma-clients (список — сам base, id-параметр `id`, только чтение).
 */

export type OnymaClient = Equip<{
  company: string
  /** Лицевой счёт «7 001 245 118» */
  account: string
  contract: string
  /** SOHO / SME / Enterprise / Gov */
  segment: string
  /** Статический IP или «—» */
  ip: string
  speed: string
}>

export const ONYMA_STATUS: Record<string, [string, Tone]> = {
  active: ["Активно", "ok"],
  closed: ["Закрыто", "muted"],
}
export const onymaStatus = (x: OnymaClient) => ONYMA_STATUS[x.status] ?? ["—", "muted" as Tone]

export const SEGMENTS = ["SOHO", "SME", "Enterprise", "Gov"]
/** Бизнес-сегмент полностью. */
export const SEGMENT_NAME: Record<string, string> = { SOHO: "Микробизнес", SME: "Малый бизнес", Enterprise: "Крупный бизнес", Gov: "Госсектор" }

export const onymaName = (x: OnymaClient) => String(x.f.company)
export const onymaSub = (x: OnymaClient) => `Л/с ${x.f.account} · договор № ${x.f.contract}`

const SEED = [
  { company: "ТОО «Авиакомпания Орлан-2000»", account: "7 001 245 118", contract: "ЮФ-2023/4412", branch: "АС", segment: "SME", ip: "217.196.x.x", speed: "100 Мбит/с", status: "active" },
  { company: "ТОО «Бота-2017»", account: "7 001 245 302", contract: "АС-2024/118", branch: "АС", segment: "SME", ip: "185.12.40.44", speed: "50 Мбит/с", status: "active" },
  { company: "АО «КазТрансКом»", account: "7 001 100 004", contract: "ГО-2019/12", branch: "АС", segment: "Enterprise", ip: "185.12.33.1", speed: "1 Гбит/с", status: "active" },
  { company: "ИП «Сапарова А.»", account: "7 001 246 990", contract: "АС-2025/77", branch: "АС", segment: "SOHO", ip: "—", speed: "100 Мбит/с", status: "active" },
  { company: "ТОО «Нуран Групп»", account: "7 001 201 556", contract: "ЮФ-2022/310", branch: "ЮФ", segment: "SME", ip: "185.14.2.90", speed: "20 Мбит/с", status: "closed" },
]

export const onyma = createSource<OnymaClient>({
  key: "onyma",
  title: "Клиенты Onyma",
  name: onymaName,
  seed: () =>
    seedEquip({
      key: "onyma",
      total: 5698,
      statuses: Object.keys(ONYMA_STATUS),
      seed: SEED,
      gen: (i, r, n) => ({
        company: `${pick(r, ["ТОО", "ИП", "АО", "ГУ"])} «${pick(r, ["Нур", "Алтын", "Береке", "Самал", "Каспий", "Тулпар"])} ${pick(r, ["Групп", "Сервис", "Строй", "Трейд"])}»`,
        account: `7 001 ${num(r, 100, 299)} ${num(r, 100, 999)}`,
        contract: `${n.branch}-${num(r, 2019, 2026)}/${num(r, 1, 4999)}`,
        segment: pick(r, ["SOHO", "SME", "SME", "Enterprise", "Gov"]),
        ip: r() > 0.62 ? `185.12.${num(r, 30, 60)}.${num(r, 1, 254)}` : "—",
        speed: pick(r, ["20 Мбит/с", "50 Мбит/с", "100 Мбит/с", "200 Мбит/с", "1 Гбит/с"]),
        status: r() > 0.07 ? "active" : "closed",
      }),
    }),
  remote: genApi<OnymaClient["f"]>({
    base: "/api/onyma-clients",
    list: "",
    idParam: "id",
    readOnly: true,
    sortDir: "sort_dir",
    fields: {
      company: "customer_name",
      account: "account_number",
      contract: "contract_number",
      segment: "segment",
      ip: "static_ip",
      speed: "speed",
    },
    status: (o) => (/закр|clos/i.test(s(o, "status", "")) ? "closed" : "active"),
    filter: { segment: "segment", status: "status" },
  }),
})

export const useOnymaClients = onyma.useAll
export const useOnymaClient = onyma.useRecord

export const blankOnymaClient = (): OnymaClient => blankEquip("active", { company: "", account: "", contract: "", segment: "", ip: "", speed: "" })

/** Колонки отчёта и аналитики заполненности. */
export const onymaColumns: ReportCol<OnymaClient>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "company", t: "Наименование", value: (x) => x.f.company },
  { k: "account", t: "Лицевой счёт", value: (x) => x.f.account },
  { k: "contract", t: "Договор", value: (x) => x.f.contract },
  { k: "segment", t: "Сегмент", value: (x) => x.f.segment },
  { k: "ip", t: "Статический IP", value: (x) => x.f.ip },
  { k: "speed", t: "Скорость", value: (x) => x.f.speed },
  { k: "st", t: "Статус", value: (x) => onymaStatus(x)[0] },
]

/* ---------- паспорт ---------- */

/** Сервисы абонента. TODO(API): из Onyma, в /api/onyma-clients их нет. */
export const onymaServices = (x: OnymaClient) => [
  {
    t: `Интернет ${x.f.speed ?? ""}`,
    sub: `Статический IP ${x.f.ip ?? "—"} · PPPoE alm_orlan`,
    vrf: "global",
    desc: `Статический IP ${x.f.ip ?? "—"}`,
    speed: String(x.f.speed ?? "—"),
  },
  { t: "ID-канал L2 до филиала", sub: "ID-00231 · 50 Мбит/с", vrf: "CLIENTS", desc: "ID-00231 до филиала", speed: "50 Мбит/с" },
  { t: "IP-телефония", sub: "5 номеров", vrf: "VOICE", desc: "5 номеров", speed: "—" },
]

/** Концы (узел — абонент), документы ввода и история — примеры по номеру записи. */
export const onymaDetail = (x: OnymaClient): LineDetail =>
  lineDetail(x, {
    section: "onyma",
    point: (i) => `Точка ${i + 1}`,
    count: () => ({ total: 0, a: 0, b: 0 }),
    ends: (r, a) => [
      { code: r.nodeCode, title: a ? a.object : r.nodeCode, nodeId: a?.id },
      { code: "—", title: onymaName(r as OnymaClient) },
    ],
    inputDocs: (r) => [
      { t: "Договор", n: `№ ${r.f.contract ?? "—"}` },
      { t: "Электронный адрес", n: "info@orlan2000.kz" },
      { t: "Источник", n: "Onyma · только чтение" },
    ],
    docs: [],
    lastEdit: (_, r) => ["Изменена скорость", "50 Мбит/с", String(r.f.speed ?? "100 Мбит/с")],
  })
