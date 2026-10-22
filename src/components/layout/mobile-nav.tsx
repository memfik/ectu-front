"use client"

import { useState } from "react"
import Link from "next/link"
import { Dialog } from "radix-ui"
import { ChevronDown, ChevronRight, House, LogOut, Moon, Search, X } from "lucide-react"
import { NAV_GROUPS, groupOf } from "@/config/nav"
import { useThemeTransition } from "@/hooks/use-theme-transition"
import { CURRENT_USER } from "@/lib/current-user"
import { cn } from "@/lib/utils"
import { Avatar } from "./header-popovers"
import { FeatureCard, ItemBadges, Thumb } from "./mega-menu"
import { inSection } from "./path-aware"

/**
 * Меню телефона и планшета (< 1240 px, макет «Телефон/01»): группы-карточки, нажатие раскрывает
 * карточку группы и её разделы. Открыта группа текущей страницы.
 */
export function MobileNav({
  path,
  open,
  onOpenChange,
  onSearch,
}: {
  path: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: () => void
}) {
  const current = path ? groupOf(path.split("/")[1] ?? "")?.key : undefined
  const [expanded, setExpanded] = useState<string | null>(null)
  const { toggleTheme } = useThemeTransition()
  const close = () => onOpenChange(false)
  const shown = expanded ?? current ?? null

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setExpanded(null)
      }}
    >
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[150] flex flex-col bg-background data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-2"
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--dd-line)] px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3">
            <Dialog.Title className="flex-1 text-lg font-bold">Меню</Dialog.Title>
            <Dialog.Close className="grid size-[42px] place-items-center rounded-full border border-[var(--dd-line)]" aria-label="Закрыть">
              <X className="size-[17px]" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-auto px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
            <div className="mx-auto flex max-w-[640px] flex-col gap-2.5">
              <Link
                href="/profile"
                onClick={close}
                className="flex items-center gap-3 rounded-[18px] border border-[var(--dd-line)] bg-[var(--feat-bg)] p-3"
              >
                <Avatar className="size-11" />
                <div className="min-w-0">
                  <b className="block text-[15px]">{CURRENT_USER.name}</b>
                  <span className="text-[12.5px] text-muted-foreground">
                    {CURRENT_USER.login} · {CURRENT_USER.branch}
                  </span>
                </div>
                <ChevronRight className="ml-auto size-[18px] text-muted-foreground" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  close()
                  onSearch()
                }}
                className="flex h-[46px] items-center gap-2.5 rounded-[14px] border border-[var(--dd-line)] px-4 text-sm text-muted-foreground"
              >
                <Search className="size-[17px]" />
                Поиск по системе…
              </button>

              <Link
                href="/"
                onClick={close}
                className={cn(
                  "flex items-center gap-3 rounded-[18px] border border-[var(--dd-line)] bg-[var(--feat-bg)] px-4 py-3.5 text-[15px] font-semibold",
                  path === "/" && "text-[#085eff] dark:text-[#6b9dff]",
                )}
              >
                <Thumb icon={House} className="size-8" />
                Главная
                <ChevronRight className="ml-auto size-[18px] text-muted-foreground" />
              </Link>

              {NAV_GROUPS.map((g) => {
                const isOpen = shown === g.key
                return (
                  <div key={g.key} className="overflow-hidden rounded-[18px] border border-[var(--dd-line)] bg-[var(--feat-bg)]">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpanded(isOpen ? "" : g.key)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3.5 text-[15px] font-semibold",
                        isOpen && "text-[#085eff] dark:text-[#6b9dff]",
                      )}
                    >
                      <Thumb icon={g.icon} className="size-8" />
                      {g.title}
                      {isOpen ? (
                        <ChevronDown className="ml-auto size-[18px]" />
                      ) : (
                        <ChevronRight className="ml-auto size-[18px] text-muted-foreground" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="pb-1">
                        <FeatureCard feature={g.feature} onClick={close} className="mx-3 mb-2 bg-[var(--dd-bg)]" />
                        {g.columns.flat().map((b) => (
                          <div key={b.title}>
                            <div className="border-y border-[var(--dd-line)] px-4 py-2 text-[11px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">
                              {b.title}
                            </div>
                            {b.items.map((x) => {
                              const on = inSection(path, x.href)
                              return (
                                <Link
                                  key={x.href}
                                  href={x.href}
                                  onClick={close}
                                  className={cn(
                                    "flex items-center gap-3 border-b border-[var(--dd-line)] px-4 py-2.5 text-[14.5px] last:border-b-0",
                                    on && "bg-[rgba(8,94,255,0.12)] font-semibold text-[#085eff] dark:text-[#6b9dff]",
                                  )}
                                >
                                  <Thumb icon={x.icon} className="size-8" />
                                  <span className="min-w-0">
                                    {x.title}
                                    {x.hint && <span className="block text-xs font-normal text-muted-foreground">{x.hint}</span>}
                                  </span>
                                  <ItemBadges item={x} />
                                </Link>
                              )
                            })}
                          </div>
                        ))}
                        {g.recent && (
                          <>
                            <div className="border-y border-[var(--dd-line)] px-4 py-2 text-[11px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">
                              Недавние
                            </div>
                            {g.recent.map((x) => (
                              <Link
                                key={x.title}
                                href={x.href}
                                onClick={close}
                                className="flex items-center gap-3 border-b border-[var(--dd-line)] px-4 py-2.5 text-[14.5px] last:border-b-0"
                              >
                                <Thumb icon={x.icon} className="size-8" />
                                <span>
                                  {x.title}
                                  <span className="block text-xs text-muted-foreground">{x.hint}</span>
                                </span>
                              </Link>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="flex flex-col gap-0.5 pt-2">
                <button type="button" onClick={(e) => toggleTheme(e)} className="flex items-center gap-3 rounded-xl px-2 py-3 text-[15px]">
                  <Thumb icon={Moon} />
                  Сменить тему
                </button>
                <Link href="/login" onClick={close} className="flex items-center gap-3 rounded-xl px-2 py-3 text-[15px] text-[#ff5257]">
                  <Thumb icon={LogOut} className="border-[rgba(255,82,87,0.2)] bg-[rgba(255,82,87,0.1)] text-[#ff5257]" />
                  Выйти
                </Link>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
