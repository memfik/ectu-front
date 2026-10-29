"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Download, FileSpreadsheet, FileText, PieChart, Printer } from "lucide-react"
import { btn } from "@/components/list/ui"
import { glass } from "@/components/passport/ui"
import { findSection } from "@/config/nav"
import { LISTS } from "@/sections"
import { sectionOf } from "@/lib/api/sections"
import { cn } from "@/lib/utils"
import { BRANCH_ROWS, LS_TOTAL, TOTAL, summaryOf, type Summary } from "./data"

/*
 * Сводные файлы (макет 36): `?section=` — сводный файл раздела (тепловая таблица «филиал × показатель»),
 * без параметра — общий сводный отчёт. Excel собирается в браузере. TODO(API): цифры и выгрузка с сервера.
 */

const fmt = (n: number) => n.toLocaleString("ru-RU")

async function toXlsx(name: string, head: string[], rows: (string | number)[][]) {
  const { default: write } = await import("write-excel-file/browser")
  await write([head.map((value) => ({ value, fontWeight: "bold" as const })), ...rows.map((r) => r.map((value) => ({ value })))], {
    sheet: "Сводный файл",
    columns: head.map((h) => ({ width: Math.max(12, h.length + 4) })),
  }).toFile(`${name}.xlsx`)
}

/** Сводный файл раздела без своей формы в макете: записи примера по филиалам. */
function fallback(section: string): Summary | undefined {
  const cfg = sectionOf(section) ?? LISTS[section]
  if (!cfg) return
  const rows = ("all" in cfg ? cfg.all() : cfg.rows()) as { branch?: string; status?: string }[]
  const by = (b: string) => rows.filter((x) => x.branch === b)
  return {
    key: section,
    crumb: cfg.crumb,
    sub: `Форма учёта · ${cfg.title}`,
    kpis: [
      [`Всего`, fmt(rows.length), "#085eff"],
      ["Филиалов", String(new Set(rows.map((x) => x.branch)).size), "#a78bfa"],
      ["Без документов", "22%", "#22d3ee"],
      ["На карте", "96%", "#2bd463"],
    ],
    table: `${cfg.title} в разрезе филиалов`,
    cols: ["Записей"],
    rows: BRANCH_ROWS.map((b) => [by(b).length]),
  }
}

function Hero({ crumb, title, sub, children }: { crumb: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-wrap items-end gap-5 pt-8 pb-6">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{crumb}</p>
        <h1 className="mt-1.5 text-[52px] leading-[1.05] font-semibold tracking-[-1.4px] max-sm:text-[32px]">{title}</h1>
        <p className="mt-2 text-[15px] text-[var(--nav-text)]">{sub}</p>
      </div>
      <div className="ml-auto flex gap-2.5">{children}</div>
    </section>
  )
}

/** sum-nodes, sum-vols, …: KPI и тепловая таблица по филиалам. */
function SectionSummary({ s, section }: { s: Summary; section: string }) {
  const [branch, setBranch] = useState("")
  const max = Math.max(...s.rows.flat())
  const total = (r: number[]) => r.reduce((a, b) => a + b, 0)
  const shown = BRANCH_ROWS.map((b, i) => ({ b, r: s.rows[i] })).filter((x) => !branch || x.b === branch)
  const sums = s.cols.map((_, j) => shown.reduce((a, x) => a + x.r[j], 0))
  const onMap = (i: number) => 92 + ((i * 7) % 8)
  const head = ["Филиал", ...s.cols, ...(s.cols.length > 1 ? ["ВСЕГО"] : []), "% на карте"]
  const title = findSection(section)?.title
  const download = () =>
    toXlsx(`Сводный файл · ${title ?? s.key}`, head, [
      ...shown.map((x, i) => [x.b, ...x.r, ...(s.cols.length > 1 ? [total(x.r)] : []), `${onMap(i)}%`]),
      ["ИТОГО", ...sums, ...(s.cols.length > 1 ? [total(sums)] : []), "97%"],
    ])
  return (
    <>
      <Hero crumb={`${s.crumb} / Сводный файл`} title="Сводный файл" sub={s.sub}>
        <button type="button" className={btn()} onClick={() => print()}>
          <Printer />
          Печать
        </button>
        <button type="button" className={btn({ primary: true })} onClick={download}>
          <Download />
          Скачать Excel
        </button>
      </Hero>
      <div className="grid grid-cols-4 gap-3.5 max-[1279px]:grid-cols-2">
        {s.kpis.map(([t, v, c]) => (
          <div key={t} className={cn(glass, "px-5 py-[18px]")}>
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <i className="size-[7px] rounded-full" style={{ background: c }} />
              {t}
            </span>
            <b className="mt-2 block text-[30px] font-medium tabular-nums">{v}</b>
            <i className="mt-3 block h-1 rounded-full" style={{ background: c }} />
          </div>
        ))}
      </div>
      <section className={cn(glass, "mt-[18px] p-4")}>
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <span className="grid size-8 place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
            <FileSpreadsheet className="size-4" />
          </span>
          <b className="text-[15px] font-semibold">{s.table}</b>
          <span className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
            меньше
            <i className="h-1 w-[70px] rounded-full bg-[linear-gradient(90deg,rgba(8,94,255,0.15),#085eff)]" />
            больше
          </span>
        </header>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {["", ...BRANCH_ROWS].map((b) => (
            <button
              key={b || "all"}
              type="button"
              onClick={() => setBranch(b)}
              className={cn(
                "h-8 rounded-full border border-border px-3.5 text-[12.5px] transition-colors",
                branch === b ? "border-[#085eff] bg-[rgba(8,94,255,0.18)] text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {b || "Все филиалы"}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[13px] tabular-nums">
            <thead>
              <tr className="bg-[var(--chip-bg)] text-[12.5px] text-muted-foreground">
                {head.map((h, i) => (
                  <th key={h} className={cn("px-3 py-2.5 font-medium", i ? "text-center" : "text-left")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((x, i) => (
                <tr key={x.b} className="border-b border-border">
                  <td className="px-3 py-1 font-semibold">{x.b}</td>
                  {x.r.map((v, j) => (
                    <td key={j} className="px-1.5 py-1">
                      <span
                        className="block rounded-md py-1 text-center text-white"
                        style={{ background: `rgba(8,94,255,${0.18 + (v / max) * 0.72})` }}
                      >
                        {fmt(v)}
                      </span>
                    </td>
                  ))}
                  {s.cols.length > 1 && <td className="px-3 py-1 text-center font-semibold">{fmt(total(x.r))}</td>}
                  <td className="px-3 py-1">
                    <span className="mx-auto block h-1 w-[50px] overflow-hidden rounded-full bg-[var(--chip-bg)]">
                      <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${onMap(i)}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-[rgba(8,94,255,0.08)] font-semibold">
                <td className="px-3 py-2.5">ИТОГО</td>
                {sums.map((v, j) => (
                  <td key={j} className="px-3 py-2.5 text-center">
                    {fmt(v)}
                  </td>
                ))}
                {s.cols.length > 1 && <td className="px-3 py-2.5 text-center">{fmt(total(sums))}</td>}
                <td className="px-3 py-2.5 text-center">97%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <Link href="/summary-files" className={cn(glass, "mt-[18px] flex items-center gap-3 px-5 py-4 hover:border-[#085eff]")}>
        <PieChart className="size-5 text-[var(--link)]" />
        <span>
          <b className="block text-sm font-semibold">Общий сводный отчёт</b>
          <span className="text-xs text-muted-foreground">Все разделы на одной странице</span>
        </span>
        <ArrowRight className="ml-auto size-4" />
      </Link>
    </>
  )
}

/** sum-total: все разделы в одной таблице и сводный отчёт по ЛС и сооружениям. */
function TotalReport() {
  const [format, setFormat] = useState<"xlsx" | "pdf">("xlsx")
  const maxLs = Math.max(...LS_TOTAL.map((x) => x[1]))
  const download = () =>
    format === "pdf"
      ? print()
      : toXlsx(
          "Общий сводный отчёт",
          ["Раздел", "Количество", "На карте"],
          TOTAL.map((x) => [x.t, x.n, x.map]),
        )
  return (
    <>
      <Hero crumb="Аналитика" title="Общий сводный отчёт" sub="Все разделы ЕСТУ в одной таблице · на 07.10.2026">
        <button type="button" className={btn()} onClick={() => print()}>
          <Printer />
          Печать
        </button>
        <button type="button" className={btn({ primary: true })} onClick={download}>
          <Download />
          Скачать всё ({format === "xlsx" ? `Excel, ${TOTAL.length + 5} листов` : "PDF"})
        </button>
      </Hero>
      <div className="grid grid-cols-[1fr_460px] items-start gap-[18px] max-[1279px]:grid-cols-1">
        <section className={cn(glass, "overflow-x-auto p-3")}>
          <table className="w-full min-w-[640px] border-collapse text-[13px] tabular-nums">
            <thead>
              <tr className="bg-[var(--chip-bg)] text-[12.5px] text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-medium">Раздел</th>
                <th className="px-3 py-2.5 font-medium">Количество</th>
                <th className="px-3 py-2.5 font-medium">На карте</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {TOTAL.map((x) => (
                <tr key={x.t} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-semibold">{x.t}</td>
                  <td className="px-3 py-2 text-center">{x.n}</td>
                  <td className="px-3 py-2 text-center">{x.map}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/summary-files?section=${x.section}`} className={btn({ sm: true })}>
                      <ArrowRight />
                      Сводный файл
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className={cn(glass, "p-5")}>
          <header className="mb-4 flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
              <PieChart className="size-4" />
            </span>
            <b className="text-[15px] font-semibold">Сводный отчёт по ЛС и сооружениям</b>
          </header>
          {LS_TOTAL.map(([t, v]) => (
            <div key={t} className="mb-2 grid grid-cols-[80px_1fr_80px] items-center gap-3 text-[13px]">
              <span className="text-muted-foreground">{t}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${Math.max(2, (v / maxLs) * 100)}%` }} />
              </span>
              <b className="text-right font-semibold tabular-nums">{fmt(v)} км</b>
            </div>
          ))}
          <p className="mt-4 mb-2 text-[11px] tracking-wide text-muted-foreground uppercase">Формат</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["xlsx", "Excel", FileSpreadsheet],
                ["pdf", "PDF", FileText],
              ] as const
            ).map(([v, t, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFormat(v)}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-xl border px-3 text-[13px]",
                  format === v ? "border-[#085eff] bg-[rgba(8,94,255,0.12)]" : "border-border text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {t}
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

export function SummaryFilesPage() {
  const section = useSearchParams().get("section") ?? ""
  const s = section ? (summaryOf(section) ?? fallback(section)) : undefined
  return <div className="px-(--page-gutter) pb-10">{s ? <SectionSummary key={section} s={s} section={section} /> : <TotalReport />}</div>
}
