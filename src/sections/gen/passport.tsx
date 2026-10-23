"use client"

import { Calendar, Fuel, Gauge, Package, Zap } from "lucide-react"
import { Note } from "@/components/passport/radio"
import { Card, Kv, glass } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { capBar, equipmentKind } from "@/sections/lines/equipment"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { cn } from "@/lib/utils"
import { list, spec } from "./config"

/*
 * ГЭУ (макет 34): панель — лицевая панель генератора (вольтметр, ключ, розетки, аварийный стоп), схема — корпус ГЭУ
 * с АВР и уровнем топлива, вкладки «Двигатель и топливо», «Исполнение». TODO(API): уровень топлива и состояние АВР — нет в API.
 */

const FUEL = 64
const f = (x: GenRow, k: string, d = "—") => String(x.f[k] ?? d)
const power = (x: GenRow) => f(x, "power", "5,5")
const kvaN = (x: GenRow) => parseFloat(power(x).replace(",", ".")) || 5.5
const kva = (x: GenRow) => String(kvaN(x)).replace(".", ",")
const kw = (x: GenRow) =>
  power(x)
    .split("/")[1]
    ?.replace(/[^\d,.]/g, "") || String(Math.round(kvaN(x) * 8) / 10).replace(".", ",")
const tank = (x: GenRow) => Number(f(x, "tank", "25")) || 25
const diesel = (x: GenRow) => f(x, "fuel").startsWith("диз")
const year = (x: GenRow) => f(x, "since").slice(-4)

/** Панель (dgu-04-panel): лицевая панель ГЭУ с выносками. */
function Panel({ x }: { x: GenRow }) {
  return (
    <div className="absolute inset-x-0 top-[40px] px-[2%] max-[1279px]:top-0">
      <div className="relative h-[90px]">
        <Note t="Вольтметр · ключ запуска" v={f(x, "automation") === "I" ? "ручной пуск" : "ручной пуск/автоматический"} at={14} />
        <Note t="Аварийный стоп" v="" at={74} />
      </div>
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>{f(x, "model")}</span>
        <span>
          {f(x, "fuel")} · бак {tank(x)} л
        </span>
      </p>
      <div className="relative mt-2 flex h-[120px] items-center gap-5 rounded-xl border border-[#3a8a55] bg-[linear-gradient(180deg,#2f7d4c,#1f5a36)] px-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <i className="absolute top-1/2 -left-3 h-10 w-3 -translate-y-1/2 rounded-l bg-[#3a3f4b]" />
        <i className="absolute top-1/2 -right-3 h-10 w-3 -translate-y-1/2 rounded-r bg-[#3a3f4b]" />
        <span className="w-[120px] min-w-0 shrink text-white">
          <b className="block text-sm font-semibold">ГЭУ</b>
          <span className="block truncate text-[11px] text-white/60">{f(x, "model")}</span>
          <span className="mt-2 flex gap-2 text-[7px] text-white/60">
            {[
              ["RUN", "#3ddc84"],
              ["OIL", "#ffc24a"],
              ["FUEL", "#3a3f4b"],
            ].map(([t, c]) => (
              <span key={t} className="flex flex-col items-center gap-0.5">
                <i className="size-2 rounded-full" style={{ background: c }} />
                {t}
              </span>
            ))}
          </span>
        </span>
        <span className="relative h-12 w-14 flex-none overflow-hidden rounded-md border-2 border-[#9aa0a6] bg-[#f3efe2]">
          <i className="absolute bottom-1 left-1/2 h-9 w-0.5 origin-bottom rotate-[25deg] bg-[#d33]" />
          <span className="absolute top-0.5 left-1 text-[7px] text-[#555]">V</span>
        </span>
        <span className="grid size-9 flex-none place-items-center rounded-full border-2 border-[#9aa0a6] bg-[#2a2d35]">
          <i className="h-4 w-1 rotate-45 rounded bg-[#c9ccd2]" />
        </span>
        <span className="flex flex-col items-center gap-1 text-[9px] text-white/60">
          <span className="flex gap-2">
            {[0, 1].map((i) => (
              <span key={i} className="grid size-11 place-items-center rounded-full border-2 border-[#555] bg-[#111]">
                <span className="flex gap-2">
                  <i className="size-1.5 rounded-full bg-[#444]" />
                  <i className="size-1.5 rounded-full bg-[#444]" />
                </span>
              </span>
            ))}
          </span>
          ~230 В
        </span>
        <span className="flex flex-col items-center gap-1 text-[8px] text-white/60">
          <span className="flex gap-1.5">
            <i className="size-3 rounded-full bg-[#d33]" />
            <i className="size-3 rounded-full bg-[#111]" />
          </span>
          12 В DC
        </span>
        <span className="grid h-[72px] min-w-0 flex-1 grid-cols-[repeat(28,minmax(0,1fr))] gap-1 rounded-md bg-black/25 p-1.5">
          {Array.from({ length: 28 }, (_, i) => (
            <i key={i} className="rounded-sm bg-black/40" />
          ))}
        </span>
        <span className="grid size-12 flex-none place-items-center rounded-full border-[3px] border-[#ffc24a] bg-[radial-gradient(circle_at_35%_35%,#ff6b6b,#c41c1c)] shadow-[0_0_12px_rgba(255,82,87,0.5)]" />
      </div>
      <div className="relative mt-4 h-[80px]">
        <div className={cn(glass, "absolute top-0 left-[36%] rounded-2xl px-4 py-2.5")}>
          <span className="block text-[11px] text-muted-foreground">Розетки ~230 В</span>
          <b className="block text-sm font-semibold">
            {kva(x)} кВА · {f(x, "phases", "1")} ф.
          </b>
        </div>
      </div>
    </div>
  )
}

/** Схема (dgu-04-schema): корпус ГЭУ с выхлопом, кабель на АВР узла и уровень топлива. */
function Housing({ x }: { x: GenRow }) {
  const r = 46
  const len = Math.PI * r
  return (
    <div className="absolute inset-x-0 top-[40px] flex justify-center px-[2%] max-[1279px]:top-0">
      <div className="relative w-[min(640px,100%)]">
        <i className="absolute top-0 left-[70%] h-12 w-3 rounded-t bg-[#3a3f4b]" />
        <div className="mt-12 rounded-t-[22px] border border-[#3a8a55] bg-[linear-gradient(180deg,#2f7d4c,#1d5232)] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
          <b className="text-sm font-semibold">{f(x, "model")}</b>
          <div className="mt-5 flex items-center gap-6">
            <span className="grid h-[110px] flex-1 grid-cols-[repeat(10,minmax(0,1fr))] gap-3">
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} className="rounded-full bg-black/35" />
              ))}
            </span>
            <span className="flex h-[110px] w-14 flex-none flex-col items-center justify-between rounded-lg bg-black/70 py-2 text-[8px] text-white/60">
              {f(x, "automation") === "I" ? "MAN" : "AUTO"}
              <i className="size-3 rounded-full bg-[#3ddc84] shadow-[0_0_8px_#3ddc84]" />
              {Math.round(kvaN(x) * 70)} h
            </span>
            <span className="grid h-[110px] flex-1 grid-cols-[repeat(10,minmax(0,1fr))] gap-3">
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} className="rounded-full bg-black/35" />
              ))}
            </span>
          </div>
          <p className="mt-4 text-[10px] text-white/60">
            {kva(x)} кВА · {f(x, "phases", "1")} {f(x, "phases", "1") === "1" ? "фаза" : "фазы"} · {f(x, "engine").split(" ")[0]}
          </p>
        </div>
        <div className="h-4 rounded-b-md bg-[#2a2d35]" />
        <div className="mx-6 flex justify-between">
          <i className="h-2 w-10 rounded-b bg-[#2a2d35]" />
          <i className="h-2 w-10 rounded-b bg-[#2a2d35]" />
        </div>
        <svg className="absolute top-[150px] left-full h-16 w-16 max-[1279px]:hidden" viewBox="0 0 64 64" fill="none">
          <path d="M0 56 C 30 56, 30 10, 64 10" stroke="#ffc24a" strokeWidth="2.5" />
        </svg>
        <div className={cn(glass, "absolute top-[110px] left-[calc(100%+60px)] w-[130px] rounded-2xl px-4 py-3 text-center max-[1279px]:hidden")}>
          <span className="block text-[10px] text-muted-foreground">АВР → узел</span>
          <b className="block text-base font-semibold">Резерв</b>
          <span className="text-[10px] text-[var(--status-ok)]">● сеть в норме</span>
        </div>
        <div className="absolute top-[200px] left-[calc(100%+20px)] w-[120px] text-center max-[1279px]:hidden">
          <svg viewBox="0 0 108 60" className="w-full">
            <path d="M8 56 A46 46 0 0 1 100 56" stroke="var(--chip-bg)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path
              d="M8 56 A46 46 0 0 1 100 56"
              stroke="#ffc24a"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(len * FUEL) / 100} ${len}`}
            />
          </svg>
          <b className="-mt-6 block text-lg font-semibold">{FUEL}%</b>
          <span className="text-[10px] text-muted-foreground">топливо · {tank(x)} л</span>
        </div>
      </div>
    </div>
  )
}

const GEN = equipmentKind({
  section: "gen",
  spec,
  list,
  pill: (x) => (diesel(x) ? "Дизель" : "Бензин"),
  panel: (c) => <Panel x={c.x} />,
  schema: (c) => <Housing x={c.x} />,
  capTitle: "",
  cap: () => [],
  extra: (c) => [
    {
      k: "engine",
      t: "Двигатель и топливо",
      icon: Fuel,
      node: (
        <Card icon={Fuel} title="Двигатель и топливо" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Тип двигателя", v: f(c.x, "engine") },
              { t: "Генератор", v: f(c.x, "generator") },
              { t: "Тип топлива", v: f(c.x, "fuel") },
              { t: "Емкость бака, литров", v: tank(c.x) },
              { t: "Кол-во фаз", v: f(c.x, "phases") },
            ]}
          />
        </Card>
      ),
    },
    {
      k: "exec",
      t: "Исполнение",
      icon: Package,
      node: (
        <Card icon={Package} title="Исполнение и автоматизация" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Исполнение", v: f(c.x, "execution") },
              { t: "Степень подвижности", v: f(c.x, "mobility") },
              { t: "Степень автоматизации (I-IV)", v: f(c.x, "automation") },
              { t: "Мощность номинальная", v: `${kva(c.x)} кВА / ${kw(c.x)} кВт` },
            ]}
          />
        </Card>
      ),
    },
  ],
  stats: (c) => [
    { icon: Zap, t: "Мощность", v: kva(c.x), em: "кВА" },
    { icon: Fuel, t: "Бак", v: tank(c.x), em: "л" },
    { icon: Calendar, t: "С", v: year(c.x), em: "года" },
  ],
  summary: (c) => [
    {
      icon: Zap,
      title: "Мощность",
      tab: "exec",
      v: (
        <>
          {kva(c.x)} кВА <em>{kw(c.x)} кВт</em>
        </>
      ),
    },
    {
      icon: Fuel,
      title: "Топливо",
      tab: "engine",
      v: (
        <>
          {FUEL}% <em>из {tank(c.x)} л</em>
        </>
      ),
      bar: capBar(FUEL, 100),
    },
    { icon: Gauge, title: "Автоматизация", tab: "exec", v: f(c.x, "automation") },
    { icon: Calendar, title: "В работе с", tab: "moves", v: year(c.x) },
  ],
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Идентификатор УС (БС)", v: x.nodeCode },
    { t: "Населенный пункт", v: `г. ${x.city}` },
    { t: "Адрес узла связи", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
    { t: "Модель оборудования", v: f(x, "model") },
    { t: "S/N", v: f(x, "serial") },
    { t: "Мощность номинальная, кВА/кВт", v: power(x) },
    { t: "Кол-во фаз", v: f(x, "phases") },
    { t: "Тип двигателя", v: f(x, "engine") },
    { t: "Генератор", v: f(x, "generator") },
    { t: "Тип топлива", v: f(x, "fuel") },
  ],
  lastEdit: (x) => ["Изменена «Степень автоматизации»", "I", f(x, "automation")],
})

/** Паспорт ГЭУ (макет 34). */
export function GenPassport({ id }: { id: number }) {
  return <LinePassport k={GEN} id={id} />
}
