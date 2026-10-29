"use client"

import { useMemo, useState } from "react"
import { Dialog } from "radix-ui"
import { Check, Info, Pencil, Plus, Trash2, X } from "lucide-react"
import { DateInput, Input, Select, TagInput, Textarea } from "@/components/list/form-controls"
import { btn, circ, type Tone } from "@/components/list/ui"
import { plural } from "@/lib/list/query"
import { cn } from "@/lib/utils"
import type { Opt } from "./toolbar"

/*
 * Шторка создания / редактирования записи (экраны n-04, n-05). Форма раздела сама перечисляет поля:
 * <FormPanel> <FormGroup title="Размещение"> <SelectField/> <TextField/> … </FormGroup> </FormPanel>
 */

export function FormPanel({
  isNew,
  title,
  sub,
  submit,
  busy,
  onClose,
  onSubmit,
  onDelete,
  children,
}: {
  isNew: boolean
  title: string
  /** Подзаголовок: «Поля со * обязательны» / «Изменено 2 поля» */
  sub: string
  /** Подпись кнопки сохранения новой записи */
  submit?: string
  /** Идёт сохранение (или сохранять нельзя — раздел в API только для чтения) */
  busy?: boolean
  onClose: () => void
  onSubmit: () => void
  /** «Удалить» внизу у существующей записи */
  onDelete?: () => void
  children: React.ReactNode
}) {
  const Icon = isNew ? Plus : Pencil
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
              <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
              <p className="text-[13px] text-muted-foreground">{sub}</p>
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
              onSubmit()
            }}
          >
            {children}
          </form>

          <footer className="flex items-center gap-2.5 border-t border-[var(--dd-line)] px-7 py-4">
            {isNew ? (
              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Info className="size-4" />
                Черновик сохраняется автоматически
              </span>
            ) : (
              onDelete && (
                <button type="button" className={btn({ danger: true })} onClick={onDelete}>
                  <Trash2 />
                  Удалить
                </button>
              )
            )}
            <span className="flex-1" />
            <Dialog.Close className={btn()}>Отмена</Dialog.Close>
            <button type="submit" form="record-form" disabled={busy} className={btn({ primary: true })}>
              <Check />
              {isNew ? (submit ?? "Создать") : "Сохранить изменения"}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Блок формы: «Размещение», «Сведения»… — подзаголовок с линией и сетка полей. */
export function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-2 not-first:mt-6">
      <legend className="mt-3 mb-3 flex w-full items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">
        {title}
        <i className="h-px flex-1 bg-[var(--dd-line)]" />
      </legend>
      <div className="grid grid-cols-6 gap-x-3.5 gap-y-4 max-sm:grid-cols-1">{children}</div>
    </fieldset>
  )
}

type Wrap = {
  label: string
  required?: boolean
  /** Половина ширины — два поля в строке */
  half?: boolean
  /** Треть ширины — три поля в строке */
  third?: boolean
  /** Подсказка справа от подписи («формат: город+№.№.филиал») */
  hint?: string
  /** Ошибка под полем (показывать после первой попытки сохранить) */
  error?: string
}

function Field({ label, required, half, third, hint, error, children }: Wrap & { children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0 max-sm:col-span-full", third ? "col-span-2" : half ? "col-span-3" : "col-span-full")}>
      <span className="mb-2 flex items-baseline gap-1 text-[13.5px] font-medium">
        {label}
        {required && <span className="text-[#ff5257]">*</span>}
        {hint && <span className="ml-auto text-[11.5px] font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-[#ff5257]">{error}</span>}
    </div>
  )
}

export function TextField({
  value,
  onChange,
  placeholder,
  numeric,
  readOnly,
  ...w
}: Wrap & { value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean; readOnly?: boolean }) {
  return (
    <Field {...w}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={w.label}
        inputMode={numeric ? "decimal" : undefined}
        readOnly={readOnly}
        aria-invalid={!!w.error || undefined}
        className={cn(readOnly && "opacity-60")}
      />
    </Field>
  )
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  tone,
  ...w
}: Wrap & { value: string; onChange: (v: string) => void; options: Opt[]; placeholder?: string; tone?: (v: string) => Tone | undefined }) {
  return (
    <Field {...w}>
      <Select value={value} opts={options} placeholder={placeholder} tone={tone} invalid={!!w.error} onChange={onChange} />
    </Field>
  )
}

/** Дата «ДД.ММ.ГГГГ». */
export function DateField({ value, onChange, placeholder, ...w }: Wrap & { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Field {...w}>
      <DateInput value={value} onChange={onChange} placeholder={placeholder} />
    </Field>
  )
}

/** Плашки значений с подсказками; можно добавить своё по Enter. */
export function TagsField({ value, onChange, options, ...w }: Wrap & { value: string[]; onChange: (v: string[]) => void; options: Opt[] }) {
  return (
    <Field {...w}>
      <TagInput value={value} opts={options} free onChange={onChange} />
    </Field>
  )
}

export function TextareaField({ value, onChange, placeholder, ...w }: Wrap & { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Field {...w}>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={w.label} aria-invalid={!!w.error || undefined} />
    </Field>
  )
}

/* ---------- состояние формы ---------- */

type Values = Record<string, string | string[]>

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? "") === JSON.stringify(b ?? "")

/** Черновик новой записи — в localStorage («Черновик сохраняется автоматически»). */
const draftKey = (key: string) => `ectu:draft:${key}`
function readDraft(key: string) {
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
 * Значения полей формы (строки или списки): у новой записи — черновик раздела `key`,
 * `changed` — сколько полей изменено, `tried` — была попытка сохранить (показывать ошибки).
 */
export function useFormValues<V extends Values>(key: string, isNew: boolean, initial: V) {
  const [v, setV] = useState<V>(() => (isNew ? { ...initial, ...(readDraft(key) as Partial<V>) } : initial))
  const [tried, setTried] = useState(false)
  const changed = useMemo(() => Object.keys(initial).filter((k) => !same(v[k], initial[k])).length, [v, initial])
  return {
    v,
    tried,
    setTried,
    changed,
    /** Обработчик поля: set("name")(value) */
    set:
      <K extends keyof V>(k: K) =>
      (value: V[K]) => {
        const next = { ...v, [k]: value }
        setV(next)
        if (isNew) writeDraft(key, next)
      },
    /** После сохранения новой записи — черновик больше не нужен */
    clearDraft: () => writeDraft(key, null),
  }
}

/** Подзаголовок формы: у новой — подсказка, у существующей — сколько полей изменено. */
export const changedNote = (isNew: boolean, changed: number) =>
  isNew ? "Поля со * обязательны" : changed ? `Изменено ${changed} ${plural(changed, ["поле", "поля", "полей"])}` : "Без изменений"

/** Ошибка обязательного поля. */
export const required = (v: string | string[] | undefined) => (Array.isArray(v) ? !v.length : !String(v ?? "").trim()) ? "Обязательное поле" : undefined
