"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, ChevronDown, House, Menu, Search, Settings } from "lucide-react"
import { NAV_GROUPS, groupItems } from "@/config/nav"
import { GlassButton } from "@/components/ui/opaline/glass-button"
import { LiquidGlass } from "@/components/ui/opaline/liquid-glass"
import { CURRENT_USER } from "@/lib/current-user"
import { cn } from "@/lib/utils"
import { CommandMenu } from "./command-menu"
import { Avatar, NotificationsPopover, SettingsPopover, UserPopover, usePrefsOnHtml } from "./header-popovers"
import { Logo } from "./logo"
import { Kbd, MegaMenu } from "./mega-menu"
import { MobileNav } from "./mobile-nav"
import { inSection, PathAware } from "./path-aware"

const round = "size-[46px] text-foreground max-sm:size-10"

/**
 * Шапка (макет 01): навигация-пилюля с мега-меню, поиск ⌘K, уведомления, быстрые настройки, профиль.
 * < 1240 px — бургер с меню из макета «Телефон/01». Не липкая, как в макете: стекло не пересчитывается при прокрутке.
 */
export function Header() {
  const [menu, setMenu] = useState<{ key: string; rect: DOMRect } | null>(null)
  const [search, setSearch] = useState(false)
  const [mobile, setMobile] = useState(false)
  usePrefsOnHtml()

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    addEventListener("keydown", onKey)
    addEventListener("resize", close)
    return () => {
      removeEventListener("keydown", onKey)
      removeEventListener("resize", close)
    }
  }, [menu])

  const group = menu && NAV_GROUPS.find((g) => g.key === menu.key)
  const openSearch = () => {
    setMenu(null)
    setSearch(true)
  }

  return (
    <>
      <header className="relative z-[60] flex w-full items-center gap-[22px] px-(--page-gutter) pt-4 pb-5 max-sm:gap-2 max-sm:pt-2.5 max-sm:pb-3">
        <Logo />

        <LiquidGlass
          bezel={10}
          className="ml-[18px] hidden min-w-0 gap-1 overflow-x-auto rounded-full p-[5px] [scrollbar-width:none] min-[1240px]:flex"
        >
          <PathAware
            render={(path) => {
              // Раздел может стоять в двух группах — подсвечиваем первую
              const activeKey = NAV_GROUPS.find((g) => groupItems(g).some((x) => x.section && inSection(path, x.href)))?.key
              return (
                <>
                  <Link href="/" title="Главная" className={cn(navItem, "px-[13px]", inSection(path, "/") && navOn)}>
                    <House className="size-5" strokeWidth={1.75} />
                  </Link>
                  {NAV_GROUPS.map((g) => {
                    const active = g.key === activeKey
                    const open = menu?.key === g.key
                    return (
                      <button
                        key={g.key}
                        type="button"
                        aria-expanded={open}
                        onClick={(e) => setMenu(open ? null : { key: g.key, rect: e.currentTarget.getBoundingClientRect() })}
                        className={cn(navItem, active && navOn, open && !active && "bg-[var(--nav-hover)] text-foreground")}
                      >
                        {g.title}
                        <ChevronDown
                          className={cn(
                            "hidden size-[13px] opacity-55 transition-transform duration-200 min-[1440px]:block",
                            open && "rotate-180",
                          )}
                        />
                      </button>
                    )
                  })}
                </>
              )
            }}
          />
        </LiquidGlass>

        <div className="ml-auto flex flex-none items-center gap-2.5 max-sm:gap-2">
          <GlassButton
            onClick={openSearch}
            aria-label="Поиск по системе (⌘K)"
            className={cn(
              round,
              "min-[1620px]:w-[260px] min-[1620px]:justify-start min-[1620px]:gap-2.5 min-[1620px]:pr-2 min-[1620px]:pl-4",
            )}
          >
            <Search className="size-[21px]" strokeWidth={1.75} />
            <span className="hidden text-sm font-normal text-muted-foreground min-[1620px]:inline">Поиск по системе…</span>
            <Kbd className="ml-auto hidden min-[1620px]:inline">⌘ K</Kbd>
          </GlassButton>

          <NotificationsPopover
            trigger={(unread) => (
              <GlassButton aria-label="Уведомления" className={round}>
                <Bell className="size-[23px]" strokeWidth={1.75} />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#085eff] px-1 text-[10px] font-bold text-white shadow-[0_0_0_2px_var(--background)]">
                    {unread}
                  </span>
                )}
              </GlassButton>
            )}
          />

          <SettingsPopover
            trigger={
              <GlassButton aria-label="Быстрые настройки" className={cn(round, "max-sm:hidden")}>
                <Settings className="size-[23px]" strokeWidth={1.75} />
              </GlassButton>
            }
          />

          <UserPopover
            trigger={
              <GlassButton aria-label={`Профиль: ${CURRENT_USER.name}`} title={CURRENT_USER.name} className={cn(round, "p-1")}>
                <Avatar className="max-sm:size-8" />
              </GlassButton>
            }
          />

          <GlassButton aria-label="Меню" onClick={() => setMobile(true)} className={cn(round, "min-[1240px]:hidden")}>
            <Menu className="size-[22px]" strokeWidth={1.75} />
          </GlassButton>
        </div>
      </header>

      {group && menu && <MegaMenu group={group} anchor={menu.rect} onClose={() => setMenu(null)} onSearch={openSearch} />}
      <CommandMenu open={search} onOpenChange={setSearch} />
      <PathAware render={(path) => <MobileNav path={path} open={mobile} onOpenChange={setMobile} onSearch={() => setSearch(true)} />} />
    </>
  )
}

const navItem =
  "flex h-[42px] cursor-pointer items-center gap-[7px] rounded-full px-3 min-[1440px]:px-[15px] text-[14.5px] whitespace-nowrap text-[var(--nav-text)] transition-[background-color,color,transform] duration-150 select-none hover:bg-[var(--nav-hover)] active:scale-[0.96]"
const navOn = "bg-[var(--nav-on-bg)] font-semibold text-[var(--nav-on)] hover:bg-[var(--nav-on-bg)]"
