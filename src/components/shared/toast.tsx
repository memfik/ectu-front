"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

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
