"use client"

import { useMemo, useState } from "react"
import { Dialog } from "radix-ui"
import { Check, Info, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { plural } from "@/lib/list/query"
import { rowsStore } from "@/lib/list/store"
import type { Field, FieldValue, ListConfig, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { DateInput, Input, Select, TagInput, Textarea } from "./form-controls"
import { btn, circ } from "./ui"

type Values = Record<string, FieldValue>

const empty = (v: FieldValue | undefined) => (Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim())
const same = (a: FieldValue | undefined, b: FieldValue | undefined) => JSON.stringify(a ?? "") === JSON.stringify(b ?? "")

/** Черновик новой записи — в localStorage («Черновик сохраняется автоматически»). */
const draftKey = (key: string) => `ectu:draft:${key}`
function readDraft(key: string): Values | null {
  try {
    const v = localStorage.getItem(draftKey(key))
    return v ? (JSON.parse(v) as Values) : null
  } catch {
    return null
  }
}
function writeDraft(key: string, v: Values | null) {
  try {
    if (v) localStorage.setItem(draftKey(key), JSON.stringify(v))
    else localStorage.removeItem(draftKey(key))
  } catch {}
}

/**
 * Шторка создания / редактирования записи (экраны n-04, n-05). `id === null` — новая запись.
 * Поля — из cfg.form.fields; сохранение — в rowsStore (TODO: API).
 */
export function FormDrawer<T extends Row>({
  cfg,
  id,
  onClose,
  onDelete,
}: {
  cfg: ListConfig<T>
  id: number | null
  onClose: () => void
  onDelete?: (row: T) => void
}) {
  const f = cfg.form
  const row = id === null ? null : rowsStore.find(cfg, id)
  const base = useMemo(() => row ?? f.blank(0), [row, f])
  const initial = useMemo(() => Object.fromEntries(f.fields.map((x) => [x.k, x.get(base)])) as Values, [f, base])
  const [values, setValues] = useState<Values>(() => (id === null ? { ...initial, ...readDraft(cfg.key) } : initial))
  const [tried, setTried] = useState(false)

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    for (const x of f.fields) {
      const v = values[x.k]
      if (x.required && empty(v)) e[x.k] = "Обязательное поле"
      else if (!empty(v) && x.check?.(v)) e[x.k] = x.check(v)!
    }
    return e
  }, [f, values])
  const changed = f.fields.filter((x) => !same(values[x.k], initial[x.k])).length

  const set = (k: string, v: FieldValue) => {
    const next = { ...values, [k]: v }
    setValues(next)
    if (id === null) writeDraft(cfg.key, next)
  }
  const submit = () => {
    setTried(true)
    if (Object.keys(errors).length) return toast(`Заполните поля: ${Object.keys(errors).length}`)
    let next = f.fields.reduce((x, fl) => fl.set(x, values[fl.k]), id === null ? f.blank(rowsStore.nextId(cfg)) : base)
    next = f.touch?.(next) ?? next
    rowsStore.save(cfg, next)
    if (id === null) writeDraft(cfg.key, null)
    toast(id === null ? `Создано: ${cfg.name(next)}` : `Сохранено: ${cfg.name(next)}`)
    onClose()
  }

  // Поля группами по блокам: «Основное», «Эксплуатация»…
  const sections = f.fields.reduce<{ title: string; fields: Field<T>[] }[]>((acc, x) => {
    const last = acc[acc.length - 1]
    if (last?.title === x.section) last.fields.push(x)
    else acc.push({ title: x.section, fields: [x] })
    return acc
  }, [])
  const Icon = id === null ? Plus : Pencil

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[rgba(5,6,9,0.55)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-2.5 right-2.5 bottom-2.5 z-[101] flex w-[min(600px,calc(100vw-20px))] flex-col overflow-hidden rounded-[28px] border border-border bg-background text-[var(--mg-text)] shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:slide-in-from-right-8 max-sm:inset-0 max-sm:w-screen max-sm:rounded-none"
        >
          <header className="flex items-start gap-3 border-b border-[var(--dd-line)] px-7 py-5">
            <span className="mt-0.5 grid size-10 flex-none place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-xl font-semibold">{row ? `Редактирование · ${cfg.name(row)}` : f.create.title}</Dialog.Title>
              <p className="text-[13px] text-muted-foreground">
                {row
                  ? `${changed ? `Изменено ${changed} ${plural(changed, ["поле", "поля", "полей"])}` : "Без изменений"}${f.updated?.(row) ? ` · последнее изменение ${f.updated(row)}` : ""}`
                  : f.create.sub}
              </p>
            </div>
            <Dialog.Close className={circ} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>

          <form
            id="record-form"
            className="flex-1 overflow-auto px-7 pt-4 pb-6"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            {sections.map((s) => (
              <fieldset key={s.title} className="mb-2 not-first:mt-6">
                <legend className="mt-3 mb-3 flex w-full items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">
                  {s.title}
                  <i className="h-px flex-1 bg-[var(--dd-line)]" />
                </legend>
                <div className="grid grid-cols-6 gap-x-3.5 gap-y-4 max-sm:grid-cols-1">
                  {s.fields.map((x) => {
                    const err = tried ? errors[x.k] : undefined
                    return (
                      <div
                        key={x.k}
                        className={cn("min-w-0 max-sm:col-span-full", x.third ? "col-span-2" : x.half ? "col-span-3" : "col-span-full")}
                      >
                        <span className="mb-2 flex items-baseline gap-1 text-[13.5px] font-medium">
                          {x.t}
                          {x.required && <span className="text-[#ff5257]">*</span>}
                          {x.hint && <span className="ml-auto text-[11.5px] font-normal text-muted-foreground">{x.hint}</span>}
                        </span>
                        <Control field={x} value={values[x.k]} invalid={!!err} onChange={(v) => set(x.k, v)} />
                        {err && <span className="mt-1.5 block text-xs text-[#ff5257]">{err}</span>}
                      </div>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </form>

          <footer className="flex items-center gap-2.5 border-t border-[var(--dd-line)] px-7 py-4">
            {row ? (
              onDelete && (
                <button type="button" className={btn({ danger: true })} onClick={() => onDelete(row)}>
                  <Trash2 />
                  Удалить
                </button>
              )
            ) : (
              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Info className="size-4" />
                Черновик сохраняется автоматически
              </span>
            )}
            <span className="flex-1" />
            <Dialog.Close className={btn()}>Отмена</Dialog.Close>
            <button type="submit" form="record-form" className={btn({ primary: true })}>
              <Check />
              {row ? "Сохранить изменения" : f.create.submit}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Control<T>({
  field: x,
  value,
  invalid,
  onChange,
}: {
  field: Field<T>
  value: FieldValue | undefined
  invalid: boolean
  onChange: (v: FieldValue) => void
}) {
  if (x.type === "select")
    return (
      <Select
        value={String(value ?? "")}
        opts={x.opts ?? []}
        placeholder={x.placeholder}
        tone={x.tone}
        invalid={invalid}
        onChange={onChange}
      />
    )
  if (x.type === "date") return <DateInput value={String(value ?? "")} onChange={onChange} placeholder={x.placeholder} />
  if (x.type === "tags") return <TagInput value={(value as string[]) ?? []} opts={x.opts ?? []} free onChange={onChange} />
  if (x.type === "textarea")
    return (
      <Textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={x.placeholder}
        aria-label={x.t}
        aria-invalid={invalid || undefined}
      />
    )
  return (
    <Input
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={x.placeholder}
      aria-label={x.t}
      inputMode={x.type === "number" ? "decimal" : undefined}
      aria-invalid={invalid || undefined}
    />
  )
}
