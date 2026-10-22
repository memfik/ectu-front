"use client"

import { useState } from "react"
import { Popover } from "radix-ui"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { GlassDatePicker } from "@/components/ui/opaline/glass-date-picker"
import { GlassInput } from "@/components/ui/opaline/glass-input"
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/ui/opaline/glass-select"
import { GlassTextarea } from "@/components/ui/opaline/glass-textarea"
import { LiquidGlass } from "@/components/ui/opaline/liquid-glass"
import type { Option, Tone } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { Pill } from "./ui"

/*
 * Поля форм и шторок — Opaline (жидкое стекло), как в kcrm: GlassInput, GlassSelect, GlassTextarea, GlassDatePicker.
 * Высота 44, радиус 12; ошибка — красное кольцо.
 */

/**
 * Стекло выпадающих списков (селект, календарь, комбобокс): плотнее стандартного frosted, чтобы текст под ним не мешал;
 * в светлой теме подсветка пункта синяя. z выше шторок и диалогов.
 */
export const DROPDOWN_GLASS =
  "z-[130] [--glass-tint-frosted:oklch(0.2_0.005_286/0.92)] not-dark:[--glass-tint-frosted:oklch(1_0_0/0.94)] not-dark:[--glass-highlight:rgba(8,94,255,0.1)]"

const glassField = "h-11 rounded-xl px-3.5 text-foreground has-[[aria-invalid=true]]:ring-2 has-[[aria-invalid=true]]:ring-[#ff5257]"

/** Однострочное поле; `icon` — слева (лупа в поиске). */
export function Input({
  icon,
  invalid,
  className,
  ...props
}: React.ComponentProps<"input"> & { icon?: React.ReactNode; invalid?: boolean }) {
  return (
    <GlassInput
      startIcon={icon}
      aria-invalid={invalid || undefined}
      className={cn(glassField, className)}
      inputClassName="text-sm"
      {...props}
    />
  )
}

export function Textarea({ invalid, className, ...props }: React.ComponentProps<"textarea"> & { invalid?: boolean; minRows?: number }) {
  return (
    <GlassTextarea
      minRows={3}
      aria-invalid={invalid || undefined}
      containerClassName={cn("rounded-xl has-[[aria-invalid=true]]:ring-2 has-[[aria-invalid=true]]:ring-[#ff5257]", className)}
      className="text-sm text-foreground"
      {...props}
    />
  )
}

/* Radix Select не принимает пустое значение — для «не выбрано» подменяем его меткой */
const NONE = "__none"
const enc = (v: string) => (v === "" ? NONE : v)
const dec = (v: string) => (v === NONE ? "" : v)

/**
 * Выбор одного значения. Короткий список — GlassSelect; длинный (узлы связи, > 12) — комбобокс с поиском.
 * `tone` — показывать значение плашкой статуса.
 */
export function Select({
  value,
  opts,
  placeholder,
  tone,
  invalid,
  className,
  onChange,
}: {
  value: string
  opts: Option[]
  placeholder?: string
  tone?: (v: string) => Tone | undefined
  invalid?: boolean
  className?: string
  onChange: (v: string) => void
}) {
  if (opts.length > 12)
    return <Combo value={value} opts={opts} placeholder={placeholder} invalid={invalid} className={className} onChange={onChange} />
  const label = (o: Option) => {
    const t = tone?.(o.v)
    return t ? <Pill tone={t}>{o.label}</Pill> : o.label
  }
  return (
    <GlassSelect value={opts.some((o) => o.v === value) ? enc(value) : undefined} onValueChange={(v) => onChange(dec(v))}>
      <GlassSelectTrigger
        aria-invalid={invalid || undefined}
        className={cn("h-11 min-w-0 rounded-xl text-sm text-foreground aria-invalid:ring-2 aria-invalid:ring-[#ff5257]", className)}
      >
        <GlassSelectValue placeholder={placeholder ?? "Выберите"} />
      </GlassSelectTrigger>
      <GlassSelectContent className={DROPDOWN_GLASS}>
        {opts.map((o) => (
          <GlassSelectItem key={o.v} value={enc(o.v)} className="text-sm">
            {label(o)}
          </GlassSelectItem>
        ))}
      </GlassSelectContent>
    </GlassSelect>
  )
}

/** Длинный список с поиском: стеклянная кнопка, в списке — первые 50 совпадений. */
function Combo({
  value,
  opts,
  placeholder,
  invalid,
  className,
  onChange,
}: {
  value: string
  opts: Option[]
  placeholder?: string
  invalid?: boolean
  className?: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const cur = opts.find((o) => o.v === value)
  const shown = opts.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 50)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <LiquidGlass
        asChild
        className={cn(
          "flex h-11 w-full min-w-0 cursor-pointer items-center gap-2 rounded-xl pr-3 pl-4 text-sm text-foreground",
          invalid && "ring-2 ring-[#ff5257]",
          className,
        )}
      >
        <Popover.Trigger aria-invalid={invalid || undefined}>
          <span className={cn("flex-1 truncate text-left", !cur && "opacity-55")}>{cur?.label ?? placeholder ?? "Выберите"}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Popover.Trigger>
      </LiquidGlass>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className={cn(DROPDOWN_GLASS, "w-[var(--radix-popover-trigger-width)] min-w-[280px] outline-none")}
        >
          <LiquidGlass className="flex max-h-[360px] flex-col rounded-2xl p-1.5" variant="frosted">
            <Input
              autoFocus
              icon={<Search />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск…"
              className="mb-1.5 h-10"
            />
            <div className="min-h-0 flex-1 overflow-auto">
              {!shown.length && <p className="px-3 py-3 text-sm text-muted-foreground">Ничего не найдено</p>}
              {shown.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => {
                    onChange(o.v)
                    setOpen(false)
                    setQ("")
                  }}
                  className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm hover:bg-[var(--glass-highlight)]"
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.v === value && <Check className="size-4 text-[var(--link)]" />}
                </button>
              ))}
            </div>
          </LiquidGlass>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const toDate = (s: string) => {
  const [d, m, y] = s.split(".").map(Number)
  return y ? new Date(y, m - 1, d) : undefined
}
const toRu = (d: Date) => d.toLocaleDateString("ru-RU")

/** Дата «ДД.ММ.ГГГГ» — GlassDatePicker на русском, неделя с понедельника. */
export function DateInput({
  value,
  onChange,
  placeholder = "Выберите дату",
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <GlassDatePicker
      // пикер помнит последнюю дату сам — при сбросе снаружи пересоздаём
      key={value ? "set" : "empty"}
      value={toDate(value)}
      onValueChange={(d) => onChange(toRu(d))}
      placeholder={placeholder}
      locale="ru-RU"
      format={{ day: "numeric", month: "long", year: "numeric" }}
      className={cn("h-11 w-full rounded-xl text-sm text-foreground", className)}
      calendarProps={{ weekStartsOn: 1, className: DROPDOWN_GLASS }}
    />
  )
}

/** Плашки выбранных значений + «Добавить…» с подсказками; `free` — можно добавить своё значение по Enter. */
export function TagInput({
  value,
  opts,
  short,
  free,
  onChange,
}: {
  value: string[]
  opts: Option[]
  short?: (v: string) => string
  free?: boolean
  onChange: (v: string[]) => void
}) {
  const [text, setText] = useState("")
  const [open, setOpen] = useState(false)
  const rest = opts.filter((o) => !value.includes(o.v) && o.label.toLowerCase().includes(text.trim().toLowerCase()))
  const add = (v: string) => {
    if (v && !value.includes(v)) onChange([...value, v])
    setText("")
  }
  return (
    <Popover.Root open={open && rest.length > 0} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <LiquidGlass
          className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-xl px-2.5 py-[7px] text-sm text-foreground has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/35"
          onClick={() => setOpen(true)}
        >
          {value.map((v) => (
            <span
              key={v}
              className="flex h-[30px] items-center gap-1.5 rounded-full border border-[rgba(8,94,255,0.4)] bg-[rgba(8,94,255,0.16)] pr-1.5 pl-3 text-[13px]"
            >
              {short?.(v) ?? v}
              <button type="button" aria-label={`Убрать ${v}`} onClick={() => onChange(value.filter((x) => x !== v))}>
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (rest[0]) add(rest[0].v)
                else if (free) add(text.trim())
              }
              if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1))
            }}
            placeholder="Добавить…"
            className="h-[30px] min-w-[100px] flex-1 bg-transparent px-1 outline-none placeholder:text-current placeholder:opacity-50"
          />
        </LiquidGlass>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(DROPDOWN_GLASS, "w-[var(--radix-popover-trigger-width)] min-w-[300px] outline-none")}
        >
          <LiquidGlass className="max-h-[280px] overflow-auto rounded-2xl p-1.5" variant="frosted">
            {rest.map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => add(o.v)}
                className="flex w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-[var(--glass-highlight)]"
              >
                {o.label}
              </button>
            ))}
          </LiquidGlass>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
