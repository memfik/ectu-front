"use client"

import { useState } from "react"
import { Popover } from "radix-ui"
import { Check, ChevronDown, X } from "lucide-react"
import type { Option, Tone } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { Pill } from "./ui"

/** Поле ввода шторок (фильтры, форма): высота 46, радиус 14, синяя рамка в фокусе. */
export const field =
  "flex min-h-[46px] w-full items-center gap-2 rounded-[14px] border border-[var(--dd-line)] bg-[var(--chip-bg)] px-3.5 text-left text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-[#085eff] focus:shadow-[0_0_0_3px_rgba(8,94,255,0.2)] data-[state=open]:border-[#085eff] data-[state=open]:shadow-[0_0_0_3px_rgba(8,94,255,0.2)] aria-invalid:border-[#ff5257]"

const menu =
  "z-[110] max-h-[320px] w-[var(--radix-popover-trigger-width)] overflow-auto rounded-[14px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-1.5 text-[var(--mg-text)] shadow-[var(--dd-shadow)] outline-none"

/** Выбор одного значения; `tone` — показывать значение плашкой статуса. */
export function Select({
  value,
  opts,
  placeholder,
  tone,
  invalid,
  onChange,
}: {
  value: string
  opts: Option[]
  placeholder?: string
  tone?: (v: string) => Tone | undefined
  invalid?: boolean
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const cur = opts.find((o) => o.v === value)
  const t = cur && tone?.(cur.v)
  // Длинный список (узлы связи) — с поиском, показываем первые 50 совпадений
  const searchable = opts.length > 12
  const shown = searchable ? opts.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 50) : opts
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={field} aria-invalid={invalid || undefined}>
        <span className={cn("flex-1 truncate", !cur && "text-muted-foreground")}>
          {cur ? t ? <Pill tone={t}>{cur.label}</Pill> : cur.label : (placeholder ?? "Выберите")}
        </span>
        <ChevronDown className="size-4 opacity-60" />
      </Popover.Trigger>
      <Popover.Content sideOffset={8} align="start" className={menu}>
        {searchable && (
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск…"
            className="mb-1.5 h-10 w-full rounded-[10px] border border-[var(--dd-line)] bg-[var(--chip-bg)] px-3 text-sm outline-none focus:border-[#085eff]"
          />
        )}
        {searchable && !shown.length && <p className="px-2.5 py-3 text-sm text-muted-foreground">Ничего не найдено</p>}
        {shown.map((o) => {
          const tt = tone?.(o.v)
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => {
                onChange(o.v)
                setOpen(false)
              }}
              className={cn("flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left text-sm hover:bg-[var(--mg-on)]", o.v === value && "bg-[rgba(8,94,255,0.14)]")}
            >
              <span className="flex-1">{tt ? <Pill tone={tt}>{o.label}</Pill> : o.label}</span>
              {o.v === value && <Check className="size-4 text-[var(--link)]" />}
            </button>
          )
        })}
      </Popover.Content>
    </Popover.Root>
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
        <div className={cn(field, "flex-wrap py-[7px] focus-within:border-[#085eff] focus-within:shadow-[0_0_0_3px_rgba(8,94,255,0.2)]")} onClick={() => setOpen(true)}>
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
            className="h-[30px] min-w-[100px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </Popover.Anchor>
      <Popover.Content sideOffset={8} align="start" onOpenAutoFocus={(e) => e.preventDefault()} className={cn(menu, "min-w-[300px]")}>
        {rest.map((o) => (
          <button key={o.v} type="button" onClick={() => add(o.v)} className="flex w-full rounded-[10px] px-2.5 py-2.5 text-left text-sm hover:bg-[var(--mg-on)]">
            {o.label}
          </button>
        ))}
      </Popover.Content>
    </Popover.Root>
  )
}
