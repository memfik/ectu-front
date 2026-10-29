"use client"

import { useState } from "react"
import { Dialog } from "radix-ui"
import { CircleAlert, Trash2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Textarea } from "@/components/list/form-controls"
import { btn } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { fmt, plural } from "@/lib/list/query"
import { cn } from "@/lib/utils"

/**
 * Удаление с обязательной причиной (экран n-09): записи уходят в Корзину, восстановить можно 30 дней.
 * Тост «Отменить» возвращает записи сразу (если `onConfirm` вернул отмену).
 */
export function DeleteDialog({
  icon: Icon,
  noun,
  items,
  warning,
  reasons,
  onConfirm,
  onClose,
  onDone,
}: {
  icon: LucideIcon
  /** «Удалить 2 узла связи?» — формы слова для 1, 2–4, 5+ */
  noun: [string, string, string]
  /** Удаляемые записи: название и первая строка подзаголовка */
  items: { id: number; name: string; sub?: string }[]
  /** Что станет со связанными записями */
  warning: string
  /** Быстрые причины */
  reasons: string[]
  /** Удалить с причиной; может вернуть отмену */
  onConfirm: (reason: string) => Promise<(() => void) | void | undefined>
  onClose: () => void
  onDone?: () => void
}) {
  const [chip, setChip] = useState("")
  const [text, setText] = useState("")
  const reason = [chip, text.trim()].filter(Boolean).join(": ")
  const n = items.length

  const [busy, setBusy] = useState(false)
  const remove = async () => {
    setBusy(true)
    let undo: (() => void) | void | undefined
    try {
      undo = await onConfirm(reason)
    } catch (e) {
      setBusy(false)
      return toast(`Не удалено: ${e instanceof Error ? e.message : "ошибка API"}`)
    }
    toast(`Удалено ${fmt(n)} ${plural(n, noun)} · в Корзине`, undo || undefined)
    onDone?.()
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-[rgba(5,6,9,0.55)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[111] w-[520px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-6 text-[var(--mg-text)] shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
          <span className="mx-auto grid size-16 place-items-center rounded-[18px] bg-[rgba(255,59,59,0.14)] text-[#ff5257]">
            <Trash2 className="size-7" strokeWidth={1.6} />
          </span>
          <Dialog.Title className="mt-4 text-center text-xl font-semibold">
            Удалить {n > 1 ? `${fmt(n)} ${plural(n, noun)}` : noun[0]}?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-center text-[13.5px] text-muted-foreground">
            {n > 1 ? "Записи будут помечены как удалённые" : "Запись будет помечена как удалённая"} и перемещены в Корзину. Восстановить
            можно в течение 30 дней.
          </Dialog.Description>

          <ul className="mt-4 max-h-[132px] overflow-auto rounded-2xl border border-[var(--dd-line)] bg-[var(--chip-bg)] px-4 py-3 text-[13.5px]">
            {items.map((x) => (
              <li key={x.id} className="flex items-center gap-2.5 py-0.5">
                <Icon className="size-4 flex-none text-[var(--link)]" />
                <b className="truncate font-semibold">
                  {x.name}
                  {x.sub && ` · ${x.sub}`}
                </b>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex gap-3 rounded-2xl border border-[rgba(255,59,59,0.35)] bg-[rgba(255,59,59,0.07)] px-4 py-3 text-[13.5px]">
            <CircleAlert className="mt-px size-[18px] flex-none" />
            {warning}
          </div>

          <div className="mt-4 mb-2 flex items-baseline justify-between text-[13.5px] font-medium">
            <span>
              Причина удаления <span className="text-[#ff5257]">*</span>
            </span>
            <span className="text-[11.5px] font-normal text-muted-foreground">обязательно · попадёт в историю и Корзину</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={chip === r}
                onClick={() => setChip(chip === r ? "" : r)}
                className={cn(
                  "h-8 rounded-full border border-[var(--dd-line)] bg-[var(--chip-bg)] px-3 text-[13px]",
                  chip === r && "border-[rgba(255,82,87,0.6)] bg-[rgba(255,59,59,0.14)] text-[#ff8a8e]",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Причина удаления"
            placeholder="Подробности: номер акта, дата, кто согласовал…"
          />
          <p className="mt-2 text-[12.5px] text-muted-foreground">Кнопка «Удалить» станет активной после заполнения причины</p>

          <footer className="mt-5 flex justify-end gap-2.5">
            <Dialog.Close className={btn()}>Отмена</Dialog.Close>
            <button
              type="button"
              disabled={!reason || busy}
              onClick={remove}
              className={cn(
                btn(),
                "border-[#ff3b3b] bg-[#ff3b3b] text-white shadow-[0_8px_24px_rgba(255,59,59,0.3)] hover:bg-[#ff3b3b] hover:brightness-110",
              )}
            >
              <Trash2 />
              Удалить{n > 1 ? ` ${fmt(n)}` : ""}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
