"use client"

import { ArrowLeftRight, Box, CircleCheck, FileText, History, MapPin, Package, Route, Wallet } from "lucide-react"
import { Card, Kv, glass } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { equipmentKind } from "@/sections/lines/equipment"
import { Table } from "@/sections/nodes/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import type { LineKind } from "@/sections/lines/detail"
import { cn } from "@/lib/utils"
import { list, spec } from "./config"

/*
 * ЗИП (макет 35): 3D — стеллаж склада (картинка из макета, TODO three.js), «Путь» — склад ФО → МОЛ → узел → установлено вместо,
 * вкладки «Местонахождение», «Документ получения», «Установлено вместо», «Движение».
 * TODO(API): движение ЗИП — /api/replacements/movement-history (сейчас пример), снятый модуль — нет в API.
 */

const f = (x: GenRow, k: string, d = "—") => String(x.f[k] ?? d)
const installed = (x: GenRow) => x.status === "installed"
const STATUS: Record<string, string> = { stock: "На складе", issued: "Выдано", installed: "Установлено" }
const money = (v: string) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n).toLocaleString("ru-RU") : "—"
}
const SHORT: Record<string, [string, string]> = {
  "Оптические модули": ["Оптика", "модули"],
  "Блоки питания": ["Питание", "блоки"],
  "Спутниковое оборудование": ["Спутник", "оборудование"],
  "Радиооборудование": ["Радио", "оборудование"],
}
const cat = (x: GenRow) => SHORT[f(x, "category")] ?? [f(x, "category"), ""]
const mol = (x: GenRow) => (f(x, "mol") === "—" ? "Ержан К. Сапаров" : f(x, "mol"))
const replaced = (x: GenRow) => f(x, "replaceDoc").match(/\d{2}\.\d{2}\.\d{4}/)?.[0] ?? "—"

/** Схема «Путь» (zip-04-schema): склад ФО → МОЛ → узел → установлено вместо. */
function Path({ x }: { x: GenRow }) {
  const on = installed(x)
  const steps = [
    { t: "Склад ФО", s: f(x, "warehouse"), c: "#8c919b", done: true },
    { t: "МОЛ", s: mol(x).replace(/^(\S+) \S+ (\S+)$/, (_, a: string, b: string) => `${a[0]}. ${b}`), c: "#ffc24a", done: x.status !== "stock" },
    { t: "Узел", s: x.nodeCode, c: "#4f8dff", done: on },
    { t: "Установлено вместо", s: on ? "SFP S/N AGC1435U4PJ" : "—", c: "#3ddc84", done: on },
  ]
  return (
    <div className="absolute inset-x-0 top-[150px] px-[4%] max-[1279px]:top-0">
      <div className="relative grid grid-cols-4">
        <i className="absolute top-[22px] right-[12.5%] left-[12.5%] border-t-2 border-dashed border-[#4f8dff]/70" />
        {steps.map((s, i) => (
          <div key={s.t} className="relative flex flex-col items-center text-center">
            <span
              className={cn("grid size-11 place-items-center rounded-full border-2 bg-background text-sm font-semibold", !s.done && "opacity-40")}
              style={{ borderColor: s.c }}
            >
              {i + 1}
            </span>
            <b className="mt-3 text-[13px] font-semibold">{s.t}</b>
            <span className="text-[11px] text-muted-foreground">{s.s}</span>
          </div>
        ))}
      </div>
      <div className={cn(glass, "mx-auto mt-10 w-fit rounded-xl px-8 py-2.5 text-center text-[11px]")}>
        <span className="block text-muted-foreground">
          {f(x, "name")} · инв. № {f(x, "inv")} · {money(f(x, "cost"))} тг без НДС
        </span>
        <span className={on ? "text-[var(--status-ok)]" : "text-muted-foreground"}>
          ● {on ? `Установлено ${replaced(x)} · документ замены ${f(x, "replaceDoc").split(" от")[0]}` : STATUS[x.status]}
        </span>
      </div>
    </div>
  )
}

function moves(x: GenRow) {
  const m = mol(x).replace(/^(\S+) \S+ (\S+)$/, (_, a: string, b: string) => `${a[0]}. ${b}`)
  const rows = [["04.02.2026", "Поступление", f(x, "sender", "ГО Астана"), `Склад ${x.branch}`, m, `накладная № 2211`]]
  if (x.status !== "stock") rows.push(["10.09.2026", "Выдача", `Склад ${x.branch}`, "Б. Дегтярь", m, "под замену"])
  if (installed(x)) rows.push([replaced(x), "Установка", "Б. Дегтярь", f(x, "eqId"), "Б. Дегтярь", `документ ${f(x, "replaceDoc").split(" от")[0]}`])
  return rows
}

const BASE = equipmentKind({
  section: "spare-parts",
  spec,
  list,
  title: (x) => f(x, "name"),
  pill: (x) => cat(x)[0],
  panel: () => null,
  schema: (c) => <Path x={c.x} />,
  schemaLabel: ["Путь", Route],
  capTitle: "",
  cap: () => [],
  extra: (c) => [
    {
      k: "place",
      t: "Местонахождение",
      icon: MapPin,
      node: (
        <Card icon={MapPin} title="Местонахождение и МОЛ" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Адрес склада ФО", v: f(c.x, "warehouse") },
              { t: "МОЛ, ФИО", v: mol(c.x) },
              { t: "Email МОЛ", v: f(c.x, "molEmail", "e.saparov@qmobile.kz") },
              { t: "Должность МОЛ", v: f(c.x, "molPost", "Ведущий инженер") },
              { t: "Отдел МОЛ", v: f(c.x, "molDept", "Отдел эксплуатации СПД") },
              { t: "Телефон МОЛ", v: f(c.x, "molPhone", "+7 701 *** 55 31") },
            ]}
          />
        </Card>
      ),
    },
    {
      k: "receipt",
      t: "Документ получения",
      icon: FileText,
      node: (
        <Card icon={FileText} title="Документ получения" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Реквизиты получения", v: f(c.x, "received", "Накладная № 2211 от 04.02.2026") },
              { t: "От кого", v: f(c.x, "sender", "ГО Астана") },
              { t: "Стоимость за ед., тг. без НДС", v: money(f(c.x, "cost")) },
            ]}
          />
        </Card>
      ),
    },
    {
      k: "instead",
      t: "Установлено вместо",
      icon: ArrowLeftRight,
      node: (
        <Card icon={ArrowLeftRight} title="Установлено вместо · документ замены" className="max-w-[1200px]">
          {installed(c.x) ? (
            <Kv
              rows={[
                { t: "Реквизиты документа замены", v: f(c.x, "replaceDoc") },
                { t: "Кому", v: f(c.x, "receiver", "Б. Дегтярь") },
                { t: "Адрес узла связи (места установки)", v: f(c.x, "siteAddress", c.x.address) },
                { t: "Тип оборудования", v: f(c.x, "eqType") },
                { t: "ID оборудования", v: f(c.x, "eqId") },
                { t: "Узел", v: c.x.nodeCode },
                { t: "Снятый модуль", v: "GLC-LH-SMD S/N AGC1435U4PJ" },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">ЗИП ещё не установлен — {STATUS[c.x.status].toLowerCase()}.</p>
          )}
        </Card>
      ),
    },
    {
      k: "flow",
      t: "Движение",
      icon: History,
      n: moves(c.x).length,
      node: (
        <Card icon={History} title={`Движение ЗИП · ${moves(c.x).length}`}>
          <Table
            head={["Дата", "Тип операции", "Откуда", "Куда", "Пользователь", "Примечание"]}
            rows={moves(c.x).map((r, i) => ({ key: i, cells: [r[0], <b key="t">{r[1]}</b>, r[2], r[3], r[4], r[5]] }))}
          />
        </Card>
      ),
    },
  ],
  stats: (c) => [
    { icon: Wallet, t: "Стоимость", v: money(f(c.x, "cost")), em: "тг" },
    { icon: CircleCheck, t: "Статус", v: STATUS[c.x.status] },
    { icon: History, t: "Замена", v: replaced(c.x) },
  ],
  summary: (c) => [
    {
      icon: Package,
      title: "Категория",
      tab: "place",
      v: (
        <>
          {cat(c.x)[0]} <em>{cat(c.x)[1]}</em>
        </>
      ),
    },
    { icon: CircleCheck, title: "Статус", tab: "flow", v: STATUS[c.x.status] },
    {
      icon: MapPin,
      title: "Где",
      tab: "instead",
      v: installed(c.x) ? (
        <>
          {c.x.nodeCode} <em>{f(c.x, "eqId").replace(" · порт", " ·")}</em>
        </>
      ) : (
        f(c.x, "warehouse")
      ),
    },
    {
      icon: Box,
      title: "Стоимость",
      tab: "receipt",
      v: (
        <>
          {money(f(c.x, "cost"))} <em>тг без НДС</em>
        </>
      ),
    },
  ],
  rows: (x) => [
    { t: "Категория", v: f(x, "category") },
    { t: "Наименование оборудования", v: f(x, "name") },
    { t: "Инвентарный номер", v: f(x, "inv") },
    { t: "Серийный номер (S/N)", v: f(x, "serial") },
    { t: "Стоимость за ед., тг. без НДС", v: f(x, "cost") },
    { t: "Принадлежность ЗИП", v: f(x, "owner") },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Адрес склада ФО", v: f(x, "warehouse") },
    { t: "МОЛ, ФИО", v: mol(x) },
    { t: "Email МОЛ", v: f(x, "molEmail", "e.saparov@qmobile.kz") },
    { t: "Должность МОЛ", v: f(x, "molPost", "Ведущий инженер") },
    { t: "Отдел МОЛ", v: f(x, "molDept", "Отдел эксплуатации СПД") },
  ],
  lastEdit: (x) => ["Изменён «Статус»", "Выдано", STATUS[x.status]],
})

const ZIP: LineKind = { ...BASE, scene: "/equipment/zip-3d.png", stageLabels: [["3D", Box], ["Путь", Route]] }

/** Паспорт ЗИП (макет 35). */
export function SparePassport({ id }: { id: number }) {
  return <LinePassport k={ZIP} id={id} />
}
