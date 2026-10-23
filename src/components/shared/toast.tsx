"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { CircleAlert, CircleCheck, Info, X } from "lucide-react"

/* Тост внизу по центру, как в макетах: текст + «Отменить». Один на приложение — новый заменяет старый. */

type Toast = { id: number; text: string; undo?: () => void }
let current: Toast | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(text: string, undo?: () => void) {
  current = { id: Date.now(), text, undo }
  emit()
}

export function Toaster() {
  const t = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => null
  )
  const [shown, setShown] = useState<number | null>(null)

  useEffect(() => {
    if (!t) return
    const raf = requestAnimationFrame(() => setShown(t.id))
    const timer = setTimeout(() => setShown(null), 4200)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [t])

  const on = !!t && shown === t.id
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-7 left-1/2 z-[130] flex items-center gap-3.5 rounded-2xl bg-[var(--dd-bg)] py-3 pr-3.5 pl-[18px] text-[13.5px] shadow-[var(--glass-rim),var(--dd-shadow)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] max-sm:bottom-[calc(20px+env(safe-area-inset-bottom,0px))] ${
        on ? "-translate-x-1/2 opacity-100" : "pointer-events-none -translate-x-1/2 translate-y-5 opacity-0"
      }`}
    >
      <span>{t?.text}</span>
      {t?.undo && (
        <button
          type="button"
          className="font-semibold text-[var(--link)]"
          onClick={() => {
            t.undo?.()
            setShown(null)
          }}
        >
          Отменить
        </button>
      )}
    </div>
  )
}

/* Уведомления справа внизу (макет 39, st-toasts): успех / ошибка / сведения, заголовок и подпись, стопкой. */

type Kind = "ok" | "error" | "info"
type Note = { id: number; kind: Kind; title: string; sub?: string }
let notes: Note[] = []
const noteListeners = new Set<() => void>()
const emitNotes = () => noteListeners.forEach((l) => l())
const dropNote = (id: number) => {
  notes = notes.filter((n) => n.id !== id)
  emitNotes()
}

export function notify(kind: Kind, title: string, sub?: string) {
  const id = Date.now() + Math.random()
  notes = [...notes.slice(-2), { id, kind, title, sub }]
  emitNotes()
  setTimeout(() => dropNote(id), 6000)
}

const KIND: Record<Kind, [typeof CircleCheck, string]> = {
  ok: [CircleCheck, "text-[var(--status-ok)]"],
  error: [CircleAlert, "text-[#ff5257]"],
  info: [Info, "text-[#4f8dff]"],
}

export function Notifications() {
  const list = useSyncExternalStore(
    (l) => {
      noteListeners.add(l)
      return () => noteListeners.delete(l)
    },
    () => notes,
    () => notes
  )
  return (
    <div className="fixed right-7 bottom-7 z-[131] flex flex-col-reverse items-end gap-2.5 max-sm:right-3 max-sm:left-3">
      {list.map((n) => {
        const [Icon, c] = KIND[n.kind]
        return (
          <div
            key={n.id}
            role={n.kind === "error" ? "alert" : "status"}
            className="flex w-[340px] max-w-full animate-in items-center gap-3 rounded-2xl border border-border bg-[var(--dd-bg)] py-3 pr-3 pl-4 shadow-[var(--dd-shadow)] fade-in slide-in-from-bottom-2"
          >
            <Icon className={`size-[18px] flex-none ${c}`} />
            <span className="min-w-0 flex-1">
              <b className="block text-[13.5px] font-semibold">{n.title}</b>
              {n.sub && <span className="block truncate text-[12px] text-muted-foreground">{n.sub}</span>}
            </span>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={() => dropNote(n.id)}
              className="grid size-8 flex-none place-items-center rounded-full bg-[var(--chip-bg)] text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
