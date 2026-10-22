"use client"

import { useMemo, useState } from "react"
import { Dialog } from "radix-ui"
import { Calendar, Download, FileSpreadsheet, FileText, FileType, X } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { applyQuery, fmt, plural, type Query } from "@/lib/list/query"
import type { ListConfig, ReportCol, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { Select } from "./form-controls"
import { btn, checkBox, circ } from "./ui"

type Format = "xlsx" | "pdf" | "csv"

const PERIODS = [
  { v: "all", label: "Всё время" },
  { v: "month", label: "Текущий месяц" },
  { v: "quarter", label: "Последние 3 месяца" },
  { v: "year", label: "Текущий год" },
]

/** «ДД.ММ.ГГГГ» → Date. */
const parse = (s: string) => {
  const [d, m, y] = s.split(".").map(Number)
  return new Date(y, m - 1, d)
}
function inPeriod(date: string | undefined, p: string) {
  if (p === "all" || !date) return true
  const d = parse(date)
  const now = new Date()
  if (p === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  if (p === "year") return d.getFullYear() === now.getFullYear()
  const from = new Date(now)
  from.setMonth(from.getMonth() - 3)
  return d >= from
}

/**
 * Отчёт по разделу (экран n-08): филиал, период, колонки, формат, учёт текущих фильтров.
 * Файл собирается в браузере. TODO: большие выгрузки — на сервере.
 */
export function ReportDialog<T extends Row>({ cfg, rows, q, onClose }: { cfg: ListConfig<T>; rows: T[]; q: Query; onClose: () => void }) {
  const branchFilter = cfg.filters.find((f) => f.k === "branch")
  const [branch, setBranch] = useState("all")
  const [period, setPeriod] = useState("all")
  const [cols, setCols] = useState(() => new Set(cfg.report.cols.filter((c) => !c.off).map((c) => c.k)))
  const [format, setFormat] = useState<Format>("xlsx")
  const [useFilters, setUseFilters] = useState(true)

  const active = describe(cfg, q)
  const list = useMemo(() => {
    const base = useFilters ? applyQuery(cfg, rows, q) : rows
    return base.filter(
      (x) => (branch === "all" || branchFilter?.get(x) === branch) && inPeriod(cfg.report.date?.(x), period)
    )
  }, [cfg, rows, q, useFilters, branch, branchFilter, period])
  const chosen = cfg.report.cols.filter((c) => cols.has(c.k))

  const download = async () => {
    if (!chosen.length) return toast("Отметьте хотя бы одну колонку")
    const name = `Отчёт_${cfg.title}_${new Date().toLocaleDateString("ru-RU")}`
    if (format === "xlsx") await toXlsx(name, chosen, list)
    if (format === "csv") toCsv(name, chosen, list)
    if (format === "pdf") toPdf(cfg.title, chosen, list)
    toast(`Отчёт: ${fmt(list.length)} ${plural(list.length, ["запись", "записи", "записей"])}`)
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[rgba(5,6,9,0.55)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[101] max-h-[calc(100vh-24px)] w-[680px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[28px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-6 text-[var(--mg-text)] shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
        >
          <header className="mb-5 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              <FileText className="size-[18px]" />
            </span>
            <Dialog.Title className="flex-1 text-xl font-semibold">Отчёт · {cfg.title}</Dialog.Title>
            <Dialog.Close className={circ} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>

          <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            {branchFilter && (
              <div>
                <span className="mb-2 block text-[13.5px] font-medium">{branchFilter.t}</span>
                <Select value={branch} opts={[{ v: "all", label: branchFilter.all ?? "Все" }, ...branchFilter.opts]} onChange={setBranch} />
              </div>
            )}
            <div>
              <span className="mb-2 block text-[13.5px] font-medium">Период</span>
              <div className="relative [&>button]:pl-10">
                <Calendar className="pointer-events-none absolute top-1/2 left-3.5 z-[1] size-4 -translate-y-1/2 text-muted-foreground" />
                <Select value={period} opts={PERIODS} onChange={setPeriod} />
              </div>
            </div>
          </div>

          <div className="mt-4 mb-2 flex items-baseline justify-between text-[13.5px] font-medium">
            Колонки в отчёте
            <span className="text-xs font-normal text-muted-foreground">
              выбрано {chosen.length} из {cfg.report.cols.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            {cfg.report.cols.map((c) => {
              const on = cols.has(c.k)
              return (
                <button
                  key={c.k}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => {
                    const s = new Set(cols)
                    if (on) s.delete(c.k)
                    else s.add(c.k)
                    setCols(s)
                  }}
                  className="flex h-10 items-center gap-3 rounded-xl border border-[var(--dd-line)] bg-[var(--chip-bg)] px-3.5 text-left text-[13.5px]"
                >
                  <span className={checkBox(on)} />
                  {c.t}
                </button>
              )
            })}
          </div>

          <div className="mt-4 mb-2 text-[13.5px] font-medium">Формат</div>
          <div className="grid grid-cols-3 gap-2.5">
            {(
              [
                ["xlsx", "Excel (.xlsx)", FileSpreadsheet],
                ["pdf", "PDF", FileType],
                ["csv", "CSV", FileText],
              ] as const
            ).map(([k, t, I]) => (
              <button
                key={k}
                type="button"
                aria-pressed={format === k}
                onClick={() => setFormat(k)}
                className={cn(
                  "flex h-12 items-center gap-2.5 rounded-[14px] border border-[var(--dd-line)] bg-[var(--chip-bg)] px-4 text-sm",
                  format === k && "border-[#085eff] bg-[rgba(8,94,255,0.12)] shadow-[0_0_0_1px_#085eff]"
                )}
              >
                <I className="size-[18px]" />
                {t}
              </button>
            ))}
          </div>

          {active && (
            <button
              type="button"
              role="checkbox"
              aria-checked={useFilters}
              onClick={() => setUseFilters(!useFilters)}
              className="mt-4 flex items-center gap-3 text-left text-[13.5px]"
            >
              <span className={checkBox(useFilters)} />
              Учитывать текущие фильтры ({active})
            </button>
          )}

          <footer className="mt-6 flex items-center justify-end gap-2.5">
            <span className="mr-auto text-[13px] text-muted-foreground">{fmt(list.length)} {plural(list.length, ["запись", "записи", "записей"])}</span>
            <Dialog.Close className={btn()}>Отмена</Dialog.Close>
            <button type="button" className={btn({ primary: true })} onClick={download}>
              <Download />
              Скачать отчёт
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** «АС, ЮФ · ГМС, ГРС» — текущие фильтры и поиск одной строкой. */
function describe<T extends Row>(cfg: ListConfig<T>, q: Query) {
  const parts = cfg.filters
    .filter((f) => q.f[f.k]?.length)
    .map((f) => (f.ui === "flag" ? f.t : q.f[f.k].map((v) => f.short?.(v) ?? f.opts.find((o) => o.v === v)?.label ?? v).join(", ")))
  if (q.q.trim()) parts.push(`поиск «${q.q.trim()}»`)
  return parts.join(" · ")
}

async function toXlsx<T>(name: string, cols: ReportCol<T>[], rows: T[]) {
  const { default: write } = await import("write-excel-file/browser")
  await write([cols.map((c) => ({ value: c.t, fontWeight: "bold" as const })), ...rows.map((x) => cols.map((c) => ({ value: c.value(x) })))], {
    sheet: "Отчёт",
    columns: cols.map((c) => ({ width: Math.min(40, Math.max(12, c.t.length + 4)) })),
  }).toFile(`${name}.xlsx`)
}

function toCsv<T>(name: string, cols: ReportCol<T>[], rows: T[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const text = [cols.map((c) => esc(c.t)).join(";"), ...rows.map((x) => cols.map((c) => esc(c.value(x))).join(";"))].join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }))
  a.download = `${name}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** PDF — печать таблицы в новом окне («Сохранить как PDF» в диалоге печати). TODO: PDF с сервера. */
function toPdf<T>(title: string, cols: ReportCol<T>[], rows: T[]) {
  const w = window.open("", "_blank")
  if (!w) return toast("Разрешите всплывающие окна для печати")
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]!)
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Отчёт · ${esc(title)}</title>
<style>body{font:11px Inter,system-ui,sans-serif;margin:24px}h1{font-size:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccd;padding:4px 6px;text-align:left}th{background:#eef3ff}</style>
<h1>Отчёт · ${esc(title)} · ${new Date().toLocaleDateString("ru-RU")} · ${rows.length} записей</h1>
<table><tr>${cols.map((c) => `<th>${esc(c.t)}</th>`).join("")}</tr>${rows
    .map((x) => `<tr>${cols.map((c) => `<td>${esc(c.value(x))}</td>`).join("")}</tr>`)
    .join("")}</table>`)
  w.document.close()
  w.focus()
  w.print()
}
