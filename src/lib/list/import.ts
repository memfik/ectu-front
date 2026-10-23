import { rowsStore } from "./store"
import type { Field, FieldValue, ListConfig, Row } from "./types"

/*
 * Импорт из Excel / CSV (экраны n-06, n-07): разбор файла в браузере, проверка строк по полям формы.
 * Заголовки столбцов = подписи полей формы (как в шаблоне). TODO: проверка и загрузка на сервере.
 */

export type ImportCheck<T> = {
  total: number
  create: T[]
  update: T[]
  errors: { line: number; text: string }[]
}

const norm = (s: unknown) => String(s ?? "").replace(/\*/g, "").trim().toLowerCase()

/** Таблица из файла: .xlsx — первый лист, .csv — разделитель «;» или «,». */
export async function readTable(file: File): Promise<string[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import("read-excel-file/browser")
    const data = await readSheet(file)
    return data.map((r) => r.map((c) => (c instanceof Date ? c.toLocaleDateString("ru-RU") : String(c ?? ""))))
  }
  const text = (await file.text()).replace(/^﻿/, "")
  const sep = (text.split("\n")[0].match(/;/g)?.length ?? 0) >= (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ","
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => splitCsv(l, sep))
}

function splitCsv(line: string, sep: string) {
  const out: string[] = []
  let cur = ""
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && line[i + 1] === '"' && q) {
      cur += '"'
      i++
    } else if (ch === '"') q = !q
    else if (ch === sep && !q) {
      out.push(cur)
      cur = ""
    } else cur += ch
  }
  out.push(cur)
  return out
}

/**
 * Сопоставление колонок (imp-02): колонка файла → ключ поля формы или null («Не загружать»).
 * Автоматически — по совпадению с подписью поля или по началу слов («Длина км» → «Длина, км»).
 */
export function autoMap<T extends Row>(cfg: ListConfig<T>, head: string[]): (string | null)[] {
  const words = (s: string) => norm(s).replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean)
  const used = new Set<string>()
  return head.map((h) => {
    const exact = cfg.form.fields.find((f) => !used.has(f.k) && norm(f.t) === norm(h))
    const fuzzy =
      exact ??
      cfg.form.fields.find((f) => {
        if (used.has(f.k)) return false
        const a = words(h)
        const b = words(f.t)
        return a.length > 0 && a.every((w) => b.some((x) => x.startsWith(w.replace(/\.$/, ""))))
      })
    if (fuzzy) used.add(fuzzy.k)
    return fuzzy?.k ?? null
  })
}

/** Проверка строк: обязательные поля, формат, дубликаты в файле; совпадение по названию — обновление. */
export function checkImport<T extends Row>(
  cfg: ListConfig<T>,
  table: string[][],
  fixed: Record<string, string>,
  map?: (string | null)[],
): ImportCheck<T> {
  const [head = [], ...lines] = table
  const fields = cfg.form.fields
  const col = new Map<Field<T>, number>()
  for (const f of fields) {
    const i = map ? map.indexOf(f.k) : head.findIndex((h) => norm(h) === norm(f.t))
    if (i >= 0) col.set(f, i)
  }
  const out: ImportCheck<T> = { total: lines.length, create: [], update: [], errors: [] }
  const seen = new Set<string>()
  let nextId = rowsStore.nextId(cfg)

  lines.forEach((cells, n) => {
    const line = n + 2
    const values: Record<string, FieldValue> = {}
    for (const f of fields) {
      const raw = fixed[f.k] ?? (col.has(f) ? String(cells[col.get(f)!] ?? "").trim() : "")
      // в файле — подписи вариантов («Собственный»), в записи — значения («own»)
      const v = f.opts ? (f.opts.find((o) => norm(o.label) === norm(raw) || norm(o.v) === norm(raw))?.v ?? raw) : raw
      values[f.k] = f.type === "tags" ? v.split(/[,;]\s*/).filter(Boolean) : v
    }
    const bad = fields.find((f) => f.required && !String(values[f.k] ?? "").length)
    if (bad) return out.errors.push({ line, text: `не указано «${bad.t}»` })
    const wrong = fields.find((f) => String(values[f.k] ?? "").length && f.check?.(values[f.k]))
    if (wrong) return out.errors.push({ line, text: `неверно «${wrong.t}»: «${values[wrong.k]}»` })
    const bad2 = fields.find((f) => f.type === "select" && values[f.k] && !f.opts?.some((o) => o.v === values[f.k]))
    if (bad2) return out.errors.push({ line, text: `нет варианта «${values[bad2.k]}» для «${bad2.t}»` })

    const existing = rowsStore.all(cfg).find((x) => {
      const probe = fields.reduce((r, f) => f.set(r, values[f.k]), cfg.form.blank(0))
      return cfg.name(x) === cfg.name(probe)
    })
    const row = fields.reduce((r, f) => f.set(r, values[f.k]), existing ?? cfg.form.blank(nextId))
    const name = cfg.name(row)
    if (seen.has(name)) return out.errors.push({ line, text: "дубликат ID" })
    seen.add(name)
    if (existing) out.update.push(row)
    else {
      out.create.push(row)
      nextId++
    }
  })
  return out
}

/** Шаблон для заполнения: заголовки — подписи полей формы. TODO: .xlsx-шаблон с сервера. */
export function downloadTemplate<T extends Row>(cfg: ListConfig<T>, skip: string[] = []) {
  const head = cfg.form.fields.filter((f) => !skip.includes(f.k)).map((f) => `"${f.t}${f.required ? " *" : ""}"`)
  download(`Шаблон_${cfg.title}_v6.csv`, head.join(";") + "\n")
}

export function downloadErrors(name: string, errors: { line: number; text: string }[]) {
  download(`Ошибки_${name}.csv`, ['"Строка";"Ошибка"', ...errors.map((e) => `${e.line};"${e.text.replace(/"/g, '""')}"`)].join("\n"))
}

function download(name: string, text: string) {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
