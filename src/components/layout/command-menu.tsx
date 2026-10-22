"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Dialog } from "radix-ui"
import { ArrowDown, ArrowUp, CornerDownLeft, House, Search } from "lucide-react"
import { NAV_GROUPS, groupItems, type MenuItem } from "@/config/nav"
import { cn } from "@/lib/utils"
import { ItemBadges, Kbd, Thumb } from "./mega-menu"

type Hit = MenuItem & { group: string }

const HOME: Hit = { title: "Главная", hint: "Дашборд", href: "/", icon: House, group: "home" }

/** Все пункты меню без повторов: разделы по группам + быстрые действия. */
const ALL: Hit[] = [
  HOME,
  ...[
    ...new Map(
      NAV_GROUPS.flatMap((g) => groupItems(g).map((x): Hit => ({ ...x, group: g.key }))).map((x) => [x.href, x] as const),
    ).values(),
  ],
]

const match = (x: Hit, q: string) => {
  const hay = `${x.title} ${x.hint ?? ""}`.toLowerCase()
  return q.split(/\s+/).every((w) => hay.includes(w))
}

/**
 * Поиск ⌘K: фильтр по группам меню с числом совпадений, как в макете 01.
 * TODO: поиск по узлам, оборудованию, ВОЛС и клиентам (ID, адрес, hostname, IP, S/N, БИН) через API.
 */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [scope, setScope] = useState("all")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const q = query.trim().toLowerCase()
  const found = useMemo(() => ALL.filter((x) => !q || match(x, q)), [q])
  const shown = scope === "all" ? found : found.filter((x) => x.group === scope)
  const scopes = [
    { key: "all", title: "Всё", n: found.length },
    ...NAV_GROUPS.map((g) => ({ key: g.key, title: g.title, n: found.filter((x) => x.group === g.key).length })),
  ].filter((s) => s.key === "all" || s.n > 0)

  const go = (href: string, newTab = false) => {
    onOpenChange(false)
    if (newTab) window.open(href, "_blank")
    else router.push(href)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setQuery("")
          setScope("all")
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-[rgba(5,6,9,0.45)] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-[121] w-[min(760px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[var(--dd-line)] bg-[var(--dd-bg)] shadow-[0_40px_100px_rgba(0,0,0,0.7)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-2"
        >
          <Dialog.Title className="sr-only">Поиск по системе</Dialog.Title>
          <Command
            loop
            shouldFilter={false}
            className="text-[var(--mg-text)]"
            onKeyDown={(e) => {
              // ⌘↵ — открыть выбранное в новой вкладке
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                const el = e.currentTarget.querySelector<HTMLElement>("[cmdk-item][data-selected=true]")
                if (el?.dataset.href) {
                  e.preventDefault()
                  go(el.dataset.href, true)
                }
              }
            }}
          >
            <div className="flex items-center gap-3 border-b border-[var(--dd-line)] px-[22px] py-5">
              <Search className="size-5 text-muted-foreground" />
              <Command.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Разделы, действия, узлы…"
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              />
              <Kbd className="max-sm:hidden">Esc</Kbd>
            </div>
            <div className="flex gap-1.5 overflow-x-auto border-b border-[var(--dd-line)] px-[18px] py-3 [scrollbar-width:none]">
              {scopes.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setScope(s.key)}
                  className={cn(
                    "flex h-8 flex-none items-center gap-2 rounded-full border border-[var(--dd-line)] px-3.5 text-[13px] whitespace-nowrap",
                    scope === s.key && "border-[rgba(8,94,255,0.5)] bg-[rgba(8,94,255,0.16)]",
                  )}
                >
                  {s.title}
                  <span className="rounded-full bg-[var(--chip-bg)] px-1.5 text-[11px] text-muted-foreground tabular-nums">{s.n}</span>
                </button>
              ))}
            </div>
            <Command.List className="max-h-[min(440px,55vh)] overflow-auto p-2.5">
              <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">Ничего не найдено</Command.Empty>
              {[{ key: "home", title: "Главная" }, ...NAV_GROUPS].map((g) => {
                const items = shown.filter((x) => x.group === g.key)
                if (!items.length) return null
                return (
                  <Command.Group
                    key={g.key}
                    heading={g.key === "home" ? undefined : g.title}
                    className="[&_[cmdk-group-heading]]:mx-3 [&_[cmdk-group-heading]]:mt-2 [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:text-[11.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[1px] [&_[cmdk-group-heading]]:text-[var(--mg-dim)] [&_[cmdk-group-heading]]:uppercase"
                  >
                    {items.map((x) => (
                      <Command.Item
                        key={x.href}
                        value={x.href}
                        data-href={x.href}
                        onSelect={() => go(x.href)}
                        className="group/ci flex cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm data-[selected=true]:bg-[rgba(8,94,255,0.14)] data-[selected=true]:shadow-[inset_0_0_0_1px_rgba(8,94,255,0.4)]"
                      >
                        <Thumb icon={x.icon} className="size-[34px]" />
                        <span className="min-w-0">
                          <Highlight text={x.title} q={q} />
                          {x.hint && <span className="block text-xs text-muted-foreground">{x.hint}</span>}
                        </span>
                        <ItemBadges item={x} />
                        <Kbd
                          className={cn(
                            "hidden px-1.5 py-1 group-data-[selected=true]/ci:inline-flex",
                            !(x.count || x.roles) ? "ml-auto" : "ml-1.5",
                          )}
                        >
                          <CornerDownLeft className="size-3" />
                        </Kbd>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )
              })}
            </Command.List>
            <div className="flex items-center gap-4 border-t border-[var(--dd-line)] px-5 py-3 text-xs text-muted-foreground max-sm:hidden">
              <span className="flex items-center gap-1.5">
                <Kbd className="px-1.5">
                  <ArrowUp className="size-3" />
                </Kbd>
                <Kbd className="px-1.5">
                  <ArrowDown className="size-3" />
                </Kbd>
                навигация
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd className="px-1.5">
                  <CornerDownLeft className="size-3" />
                </Kbd>
                открыть
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd className="px-1.5">⌘ ↵</Kbd>в новой вкладке
              </span>
              <span className="ml-auto">Ищем по ID, адресу, hostname, IP, S/N, БИН</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Подсветка совпадения, как в макете (синим жирным). */
function Highlight({ text, q }: { text: string; q: string }) {
  const word = q.split(/\s+/).find((w) => w && text.toLowerCase().includes(w))
  if (!word) return <>{text}</>
  const i = text.toLowerCase().indexOf(word)
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-bold text-[var(--link)]">{text.slice(i, i + word.length)}</mark>
      {text.slice(i + word.length)}
    </>
  )
}
