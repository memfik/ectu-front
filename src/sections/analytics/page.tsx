"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, BarChart3, Building2, Download, ListChecks, ListTree, PieChart } from "lucide-react"
import { Select } from "@/components/list/form-controls"
import { btn } from "@/components/list/ui"
import { glass } from "@/components/passport/ui"
import { LISTS } from "@/sections"
import { BRANCHES } from "@/sections/nodes/data"
import { api, apiOn } from "@/lib/api/client"
import { cn } from "@/lib/utils"

/*
 * Аналитика по заполнению полей (макет 38, an-01/02): разделы с заполненностью, поля выбранного раздела, филиалы.
 * С API — GET /api/analytics/field-stats { type, filial_id } → { fields: [{ name, label, filled, total }] } (как AnalyticsHome.vue);
 * без API — считается по примерным данным раздела (колонки отчёта: пусто или «—» — не заполнено).
 * TODO(API): заполненность разделов в списке слева и по филиалам — отдельного эндпоинта нет, считаются по полям.
 */

/** Типы как в старом фронте (value → ключ раздела). */
const TYPES: [string, string, string][] = [
  ["nodes", "Узлы связи", "nodes"],
  ["sdh", "SDH", "sdh"],
  ["pdh", "PDH", "pdh"],
  ["dwdm", "DWDM", "dwdm"],
  ["spd_switches", "СПД Коммутаторы", "switches"],
  ["spd_routers", "СПД Маршрутизаторы", "routers"],
  ["rrl", "РРЛ", "rrl"],
  ["radio_bridge", "Радиомосты", "radio-bridges"],
  ["bhd_wimax", "БШД WiMAX", "bwa-wimax"],
  ["bhd_lte", "БШД LTE", "bwa-lte"],
  ["bhd_wll", "БШД WLL", "bwa-wll"],
  ["phone_stations", "АТС", "pbx"],
  ["bc", "БС Транк", "trunk-bs"],
  ["triple_s", "ЗССС SkyEdge II", "vsat"],
  ["oneweb", "OneWeb", "oneweb"],
  ["ibp", "ИБП", "ups"],
  ["gey", "ГЭУ", "gen"],
  ["ams", "АМС", "masts"],
  ["kls", "КЛС", "cable-lines"],
  ["vols", "ВОЛС", "fiber-lines"],
]

type FieldStat = { label: string; filled: number; total: number }
const pct = (f: { filled: number; total: number }) => (f.total ? Math.round((f.filled / f.total) * 100) : 0)
const avg = (fs: FieldStat[]) => (fs.length ? Math.round(fs.reduce((a, f) => a + pct(f), 0) / fs.length) : 0)
const tone = (p: number) => (p >= 90 ? "#2bd463" : p >= 70 ? "#4f8dff" : p >= 20 ? "#ffc24a" : "#ff5257")
const empty = (v: unknown) => v === undefined || v === null || String(v).trim() === "" || String(v).trim() === "—"

/** Заполненность полей по примерным данным раздела. */
function localStats(section: string, branch: string): FieldStat[] {
  const cfg = LISTS[section]
  if (!cfg) return []
  const rows = (cfg.rows() as { branch?: string }[]).filter((x) => !branch || x.branch === branch)
  return cfg.report.cols
    .filter((c) => c.k !== "num" && c.k !== "id")
    .map((c) => ({ label: c.t, total: rows.length, filled: rows.filter((x) => !empty(c.value(x as never))).length }))
}

function useFieldStats(type: string, section: string, branch: string) {
  const on = apiOn()
  const key = `${type}:${branch}`
  const [remote, set] = useState<{ key: string; fields: FieldStat[] }>({ key: "", fields: [] })
  useEffect(() => {
    if (!on) return
    const filial = BRANCHES.findIndex((b) => b.v === branch)
    api
      .get<{ fields?: FieldStat[] }>("/api/analytics/field-stats", { type, ...(branch ? { filial_id: filial + 1 } : {}) })
      .then((d) => set({ key, fields: d.fields ?? [] }))
      .catch(() => set({ key, fields: [] }))
  }, [on, key, type, branch])
  const local = useMemo(() => (on ? [] : localStats(section, branch)), [on, section, branch])
  return on ? (remote.key === key ? remote.fields : []) : local
}

async function download(title: string, fields: FieldStat[]) {
  const { default: write } = await import("write-excel-file/browser")
  const head = ["Поле", "Заполнено", "Пусто", "Всего", "%"]
  await write(
    [
      head.map((value) => ({ value, fontWeight: "bold" as const })),
      ...fields.map((f) => [f.label, f.filled, f.total - f.filled, f.total, pct(f)].map((value) => ({ value }))),
    ],
    { sheet: "Заполненность", columns: [{ width: 34 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 8 }] },
  ).toFile(`Аналитика · ${title}.xlsx`)
}

export function AnalyticsPage() {
  const [type, setType] = useState("nodes")
  const [branch, setBranch] = useState("")
  const [, title, section] = TYPES.find((t) => t[0] === type)!
  const fields = useFieldStats(type, section, branch)
  // Список слева и филиалы — по примерным данным; с API у каждого раздела свой запрос, поэтому только у выбранного
  const sections = useMemo(() => TYPES.map(([v, t, s]) => [v, t, avg(localStats(s, branch))] as const), [branch])
  const byBranch = useMemo(() => BRANCHES.map((b) => [b.v, avg(localStats(section, b.v))] as const), [section])
  const worst = [...fields].sort((a, b) => pct(a) - pct(b))[0]

  return (
    <div className="px-(--page-gutter) pb-10">
      <section className="flex flex-wrap items-end gap-5 pt-8 pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Аналитика и отчёты</p>
          <h1 className="mt-1.5 text-[52px] leading-[1.05] font-semibold tracking-[-1.4px] max-sm:text-[32px]">Аналитика по заполнению полей</h1>
          <p className="mt-2 text-[15px] text-[var(--nav-text)]">Насколько полно заполнены данные по каждому разделу и филиалу</p>
        </div>
        <div className="ml-auto flex gap-2.5">
          <Select
            value={branch}
            opts={[{ v: "", label: "Все филиалы" }, ...BRANCHES.map((b) => ({ v: b.v, label: b.full }))]}
            onChange={setBranch}
            className="h-11 w-[220px] rounded-full"
          />
          <button type="button" className={btn({ primary: true })} onClick={() => download(title, fields)}>
            <Download />
            Скачать
          </button>
        </div>
      </section>

      <div className="grid grid-cols-[440px_1fr] items-start gap-[18px] max-[1279px]:grid-cols-1">
        <section className={cn(glass, "p-4")}>
          <Head icon={ListTree} title="Выберите тип данных для анализа" />
          <div className="flex flex-col gap-0.5">
            {sections.map(([v, t, p]) => (
              <button
                key={v}
                type="button"
                onClick={() => setType(v)}
                className={cn(
                  "grid grid-cols-[1fr_60px_40px] items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-[var(--nav-hover)]",
                  v === type && "border-[#085eff]/60 bg-[rgba(8,94,255,0.14)]",
                )}
              >
                {t}
                <span className="h-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                  <i className="block h-full rounded-full" style={{ width: `${p}%`, background: tone(p) }} />
                </span>
                <span className="text-right text-[12px] text-muted-foreground tabular-nums">{p}%</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid min-w-0 gap-[18px]">
          <div className="grid grid-cols-3 gap-[18px] max-sm:grid-cols-1">
            <Tile icon={PieChart} title={title} v={`${avg(fields)}%`} em="средняя заполненность" />
            <Tile icon={ListChecks} title="Активные поля в системе" v={String(fields.length)} em="полей" />
            <Tile icon={AlertCircle} title="Хуже всего" v={worst?.label ?? "—"} em={worst ? `${pct(worst)}%` : ""} />
          </div>
          <div className="grid grid-cols-[1.4fr_1fr] items-start gap-[18px] max-[1500px]:grid-cols-1">
            <section className={cn(glass, "p-4")}>
              <Head icon={BarChart3} title={`Поля · ${title}`} />
              {fields.length === 0 && <p className="text-sm text-muted-foreground">Загрузка…</p>}
              {fields.map((f) => (
                <div key={f.label} className="grid grid-cols-[200px_1fr_48px] items-center gap-4 py-1.5 text-[12.5px] max-sm:grid-cols-[120px_1fr_40px]">
                  <span className="truncate">{f.label}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                    <i className="block h-full rounded-full" style={{ width: `${pct(f)}%`, background: tone(pct(f)) }} />
                  </span>
                  <b className="text-right font-semibold tabular-nums">{pct(f)}%</b>
                </div>
              ))}
            </section>
            <section className={cn(glass, "p-4")}>
              <Head icon={Building2} title="По филиалам" />
              <div className="flex h-[200px] items-end gap-2 border-b border-border pb-1">
                {byBranch.map(([b, p]) => (
                  <span key={b} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <b className="text-[11px] font-semibold tabular-nums">{p}%</b>
                    <i
                      className={cn("w-full rounded-t-md bg-[linear-gradient(180deg,#3d8bff,#085eff)]", branch && b !== branch && "opacity-35")}
                      style={{ height: `${p * 0.8}%` }}
                    />
                  </span>
                ))}
              </div>
              <div className="mt-1 flex gap-2">
                {byBranch.map(([b]) => (
                  <span key={b} className="flex-1 text-center text-[11px] text-muted-foreground">
                    {b}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Head({ icon: Icon, title }: { icon: typeof PieChart; title: string }) {
  return (
    <header className="mb-3 flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
        <Icon className="size-4" />
      </span>
      <b className="text-[15px] font-semibold">{title}</b>
    </header>
  )
}

function Tile({ icon, title, v, em }: { icon: typeof PieChart; title: string; v: string; em: string }) {
  return (
    <section className={cn(glass, "p-4")}>
      <Head icon={icon} title={title} />
      <b className="text-[32px] leading-none font-medium">
        {v} <em className="text-[12px] font-normal text-muted-foreground not-italic">{em}</em>
      </b>
    </section>
  )
}
