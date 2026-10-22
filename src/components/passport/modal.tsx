"use client"

import { Dialog } from "radix-ui"
import { X, type LucideIcon } from "lucide-react"
import { circ } from "@/components/list/ui"
import { cn } from "@/lib/utils"

/** Окно паспорта по центру или шторка справа (окна узла np-01…04, участок ВОЛС). */
export function Modal({
  title,
  icon: Icon,
  width,
  side,
  sub,
  onClose,
  children,
}: {
  title: string
  icon: LucideIcon
  width: number
  /** Шторка справа (np-04) вместо окна по центру */
  side?: boolean
  sub?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[rgba(5,6,9,0.55)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          style={{ width }}
          className={cn(
            "fixed z-[101] max-w-[calc(100vw-24px)] border border-[var(--dd-line)] bg-[var(--dd-bg)] text-[var(--mg-text)] shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in",
            side
              ? "top-2.5 right-2.5 bottom-2.5 flex flex-col overflow-hidden rounded-[28px] bg-background data-[state=open]:slide-in-from-right-8"
              : "top-1/2 left-1/2 max-h-[calc(100vh-24px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[28px] data-[state=open]:zoom-in-95",
          )}
        >
          <header className={cn("flex items-center gap-3", side ? "border-b border-[var(--dd-line)] px-7 py-5" : "px-6 pt-6")}>
            <span className="grid size-10 place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
              {sub && <p className="text-[13px] text-muted-foreground">{sub}</p>}
            </div>
            <Dialog.Close className={circ} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Label({ t, req, aside }: { t: string; req?: boolean; aside?: string }) {
  return (
    <span className="mb-2 flex items-baseline gap-1 text-[13.5px] font-medium">
      {t}
      {req && <span className="text-[#ff5257]">*</span>}
      {aside && <span className="ml-auto text-[11.5px] font-normal text-muted-foreground">{aside}</span>}
    </span>
  )
}
