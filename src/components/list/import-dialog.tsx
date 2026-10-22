"use client"

import { useRef, useState } from "react"
import { Dialog } from "radix-ui"
import { ArrowRight, Check, CircleAlert, CircleCheck, Download, FileUp, ListChecks, Upload, X } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { LISTS } from "@/config/lists"
import { checkImport, downloadErrors, downloadTemplate, readTable, type ImportCheck } from "@/lib/list/import"
import { fmt, plural } from "@/lib/list/query"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { Select } from "./form-controls"
import { btn, circ } from "./ui"

const MAX_MB = 20

/**
 * Импорт Excel (экраны n-06 «Файл» и n-07 «Проверка»): тип и филиал → файл → проверка строк → загрузка.
 * Филиал из окна подставляется во все строки (поле `branch` формы).
 */
export function ImportDialog<T extends Row>({
  cfg,
  onClose,
  onType,
}: {
  cfg: ListConfig<T>
  onClose: () => void
  /** Смена раздела (страница «Импорт Excel»); в списке раздела тип фиксирован */
  onType?: (key: string) => void
}) {
  const branchField = cfg.form.fields.find((f) => f.k === "branch")
  const [branch, setBranch] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<number | null>(null)
  const [check, setCheck] = useState<ImportCheck<T> | null>(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const table = useRef<string[][]>([])

  const ready = (!branchField || branch) && rows !== null
  const pick = async (f: File | undefined) => {
    if (!f) return
    if (!/\.(xlsx|csv)$/i.test(f.name)) return toast("Нужен файл .xlsx или .csv")
    if (f.size > MAX_MB * 1024 * 1024) return toast(`Файл больше ${MAX_MB} МБ`)
    setFile(f)
    setRows(null)
    setBusy(true)
    try {
      table.current = await readTable(f)
      setRows(Math.max(0, table.current.length - 1))
    } catch {
      setFile(null)
      toast("Не удалось прочитать файл")
    } finally {
      setBusy(false)
    }
  }
  const load = () => {
    if (!check) return
    for (const x of [...check.update, ...check.create]) rowsStore.save(cfg, x)
    const n = check.create.length + check.update.length
    toast(`Загружено ${fmt(n)} ${plural(n, ["строка", "строки", "строк"])}`)
    onClose()
  }

  const step = check ? 3 : 2
  const steps = ["Тип и филиал", "Файл", "Проверка"]

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[rgba(5,6,9,0.55)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[101] w-[640px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-6 text-[var(--mg-text)] shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
        >
          <header className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              {check ? <ListChecks className="size-[18px]" /> : <FileUp className="size-[18px]" />}
            </span>
            <Dialog.Title className="flex-1 text-xl font-semibold">
              {check ? "Импорт Excel · проверка" : `Импорт Excel · ${cfg.title}`}
            </Dialog.Title>
            <Dialog.Close className={circ} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>

          <ol className="mt-5 mb-4 grid grid-cols-3 text-[13.5px]">
            {steps.map((t, i) => {
              const n = i + 1
              const done = n < step || (n === 1 && (!branchField || !!branch))
              return (
                <li key={t} className={cn("flex items-center gap-2.5", n === step ? "text-foreground" : "text-muted-foreground")}>
                  <span
                    className={cn(
                      "grid size-[26px] place-items-center rounded-full text-xs font-semibold",
                      done
                        ? "bg-[rgba(43,212,99,0.16)] text-[var(--status-ok)]"
                        : n === step
                          ? "bg-[#085eff] text-white"
                          : "bg-[var(--chip-bg)]",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : n}
                  </span>
                  {t}
                </li>
              )
            })}
          </ol>

          {!check ? (
            <>
              <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
                <div>
                  <span className="mb-2 block text-[13.5px] font-medium">
                    Тип импорта <span className="text-[#ff5257]">*</span>
                  </span>
                  <Select
                    value={cfg.key}
                    opts={Object.values(LISTS).map((l) => ({ v: l.key, label: l.title }))}
                    onChange={(k) => (onType ? onType(k) : toast("Тип импорта меняется на странице «Импорт Excel»"))}
                  />
                </div>
                {branchField && (
                  <div>
                    <span className="mb-2 block text-[13.5px] font-medium">
                      {branchField.t} <span className="text-[#ff5257]">*</span>
                    </span>
                    <Select value={branch} opts={branchField.opts ?? []} placeholder={branchField.placeholder} onChange={setBranch} />
                  </div>
                )}
              </div>

              <div className="mt-3.5 flex items-center gap-3 rounded-[18px] border border-[var(--dd-line)] bg-[var(--chip-bg)] p-3.5">
                <Xls />
                <div className="min-w-0 flex-1">
                  <b className="block text-[13.5px] font-semibold">Шаблон для скачивания</b>
                  <span className="block truncate text-xs text-muted-foreground">
                    Шаблон_{cfg.title}_v6 · заполните и загрузите обратно
                  </span>
                </div>
                <button type="button" className={btn({ sm: true })} onClick={() => downloadTemplate(cfg, branchField ? ["branch"] : [])}>
                  <Download />
                  Скачать
                </button>
              </div>

              <button
                type="button"
                onClick={() => input.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDrag(true)
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDrag(false)
                  pick(e.dataTransfer.files[0])
                }}
                className={cn(
                  "mt-3.5 flex w-full flex-col items-center rounded-[20px] border-2 border-dashed border-[rgba(8,94,255,0.45)] bg-[rgba(8,94,255,0.05)] px-6 py-8 text-center transition-colors",
                  drag && "border-[#085eff] bg-[rgba(8,94,255,0.12)]",
                )}
              >
                <span className="grid size-[68px] place-items-center rounded-full border border-[rgba(8,94,255,0.35)] bg-[rgba(8,94,255,0.12)] text-[var(--link)]">
                  <FileUp className="size-7" strokeWidth={1.6} />
                </span>
                <b className="mt-4 text-base font-semibold">Перетащите файл Excel сюда</b>
                <span className="mt-1.5 text-[13px] text-muted-foreground">
                  или <span className="font-semibold text-[var(--link)]">выберите на компьютере</span> · .xlsx или .csv, до {MAX_MB} МБ
                </span>
              </button>
              <input ref={input} type="file" accept=".xlsx,.csv" hidden onChange={(e) => pick(e.target.files?.[0])} />

              {file && (
                <div className="mt-3.5 flex items-center gap-3 rounded-[18px] border border-[var(--dd-line)] bg-[var(--chip-bg)] p-3.5">
                  <Xls />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[13.5px] font-semibold">Выбранный файл: {file.name}</b>
                    <span className="block text-xs text-muted-foreground">
                      {rows === null ? "Читаем…" : `${fmt(rows)} ${plural(rows, ["строка", "строки", "строк"])}`} ·{" "}
                      {Math.max(1, Math.round(file.size / 1024))} КБ
                    </span>
                    <span className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                      <i
                        className={cn(
                          "block h-full rounded-full bg-[#085eff] transition-[width] duration-500",
                          busy ? "w-3/5 animate-pulse" : "w-full",
                        )}
                      />
                    </span>
                  </div>
                  <button type="button" className={circ} aria-label="Убрать файл" onClick={() => (setFile(null), setRows(null))}>
                    <X />
                  </button>
                </div>
              )}

              <footer className="mt-6 flex justify-end gap-2.5">
                <Dialog.Close className={btn()}>Отмена</Dialog.Close>
                <button
                  type="button"
                  disabled={!ready}
                  className={btn({ primary: true })}
                  onClick={() => setCheck(checkImport(cfg, table.current, branch ? { branch } : {}))}
                >
                  <ArrowRight />
                  Далее: проверка
                </button>
              </footer>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  ["Всего строк", fmt(check.total), ""],
                  ["Будет создано", fmt(check.create.length), "text-[var(--status-ok)]"],
                  ["С ошибками", fmt(check.errors.length), check.errors.length ? "text-[var(--status-alarm)]" : ""],
                ].map(([t, v, c]) => (
                  <div key={t} className="rounded-2xl border border-[var(--dd-line)] bg-[var(--chip-bg)] px-4 py-3">
                    <span className="block text-xs text-muted-foreground">{t}</span>
                    <b className={cn("mt-1 block text-lg font-semibold tabular-nums", c)}>{v}</b>
                  </div>
                ))}
              </div>
              {check.update.length > 0 && (
                <Note
                  ok
                  title={`${fmt(check.update.length)} ${plural(check.update.length, ["строка обновит", "строки обновят", "строк обновят"])} существующие записи`}
                >
                  Совпадение по идентификатору
                </Note>
              )}
              {check.errors.length > 0 && (
                <Note
                  title={`${fmt(check.errors.length)} ${plural(check.errors.length, ["строка не будет загружена", "строки не будут загружены", "строк не будут загружены"])}`}
                >
                  {check.errors
                    .slice(0, 6)
                    .map((e) => `Стр. ${e.line} — ${e.text}`)
                    .join(" · ")}
                  {check.errors.length > 6 && ` · ещё ${check.errors.length - 6}`}
                </Note>
              )}
              <footer className="mt-6 flex flex-wrap justify-end gap-2.5">
                {check.errors.length > 0 && (
                  <button type="button" className={btn()} onClick={() => downloadErrors(cfg.title, check.errors)}>
                    <Download />
                    Скачать отчёт об ошибках
                  </button>
                )}
                <button
                  type="button"
                  disabled={!check.create.length && !check.update.length}
                  className={btn({ primary: true })}
                  onClick={load}
                >
                  <Upload />
                  Загрузить {fmt(check.create.length + check.update.length)}{" "}
                  {plural(check.create.length + check.update.length, ["строку", "строки", "строк"])}
                </button>
              </footer>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Xls() {
  return (
    <span className="grid h-10 w-10 flex-none place-items-start rounded-md bg-[rgba(43,212,99,0.14)] px-1 pt-0.5 text-[15px] font-medium text-[var(--status-ok)]">
      XLS
    </span>
  )
}

function Note({ ok, title, children }: { ok?: boolean; title: string; children: React.ReactNode }) {
  const Icon = ok ? CircleCheck : CircleAlert
  return (
    <div
      className={cn(
        "mt-3.5 flex gap-3 rounded-2xl border px-4 py-3.5 text-[13px]",
        ok ? "border-[rgba(43,212,99,0.3)] bg-[rgba(43,212,99,0.08)]" : "border-[rgba(255,59,59,0.35)] bg-[rgba(255,59,59,0.07)]",
      )}
    >
      <Icon className="mt-px size-[18px] flex-none" />
      <div>
        <b className="block font-semibold">{title}</b>
        <span className="text-muted-foreground">{children}</span>
      </div>
    </div>
  )
}
