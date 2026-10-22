"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Popover } from "radix-ui"
import {
  ArrowRight,
  Bell,
  Bookmark,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Download,
  History,
  House,
  Keyboard,
  Languages,
  LifeBuoy,
  LogOut,
  Megaphone,
  MessageSquare,
  Monitor,
  Moon,
  Rows3,
  Settings,
  Sun,
  UserCog,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react"
import { ALL_SECTIONS } from "@/config/nav"
import { useThemeTransition } from "@/hooks/use-theme-transition"
import { useUser } from "@/lib/api/session"
import { cn } from "@/lib/utils"
import { Select } from "@/components/list/form-controls"
import { GroupTitle } from "./mega-menu"

const panel =
  "z-[90] max-w-[calc(100vw-24px)] overflow-hidden rounded-[22px] border border-[var(--dd-line)] bg-[var(--dd-bg)] text-[var(--mg-text)] shadow-[var(--dd-shadow)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-1.5"

function HeaderPopover({
  trigger,
  className,
  onOpenChange,
  children,
}: {
  trigger: React.ReactNode
  className?: string
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Popover.Root onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={10} collisionPadding={12} className={cn(panel, className)}>
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** Сегмент-переключатель из макета (Тема, Язык, Плотность). */
function Segment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | undefined
  options: { key: T; title: string; icon?: LucideIcon }[]
  onChange: (v: T, e: React.MouseEvent) => void
}) {
  return (
    <div className="flex gap-1 rounded-[14px] border border-[var(--dd-line)] bg-[var(--chip-bg)] p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={(e) => onChange(o.key, e)}
          className={cn(
            "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[13px] whitespace-nowrap text-[var(--nav-text)] transition-colors",
            value === o.key &&
              "bg-[rgba(8,94,255,0.2)] text-foreground shadow-[inset_0_0_0_1px_rgba(8,94,255,0.5)] not-dark:bg-[#085eff] not-dark:text-white",
          )}
        >
          {o.icon && <o.icon className="size-[15px]" strokeWidth={1.75} />}
          {o.title}
        </button>
      ))}
    </div>
  )
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-6 w-10 flex-none rounded-full bg-[color-mix(in_srgb,var(--foreground)_14%,transparent)] transition-colors duration-200 after:absolute after:top-[3px] after:left-[3px] after:size-[18px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.3)] after:transition-transform after:duration-250 after:ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        on && "bg-[#085eff] after:translate-x-4",
      )}
    />
  )
}

/* ---------- Уведомления ---------- */

type Notice = {
  id: number
  day: "Сегодня" | "Вчера"
  kind: "mention" | "task" | "system"
  /** Иконка с цветом, либо инициалы автора (упоминания). */
  icon?: LucideIcon
  tone?: string
  author?: string
  /** Текст: части в ** ** — жирным. */
  text: string
  meta: string
  href: string
  actions?: { title: string; icon: LucideIcon; href: string }[]
}

/** TODO: уведомления из API. Тексты — примеры из макета. */
const NOTICES: Notice[] = [
  {
    id: 1,
    day: "Сегодня",
    kind: "mention",
    author: "АГ",
    text: "**Артем Галустьян** упомянул вас в комментарии к узлу **url002.01.UF**: «подготовь скан нового договора…»",
    meta: "10 мин назад · Комментарии",
    href: "/nodes",
    actions: [
      { title: "Ответить", icon: MessageSquare, href: "/nodes" },
      { title: "Открыть", icon: ArrowRight, href: "/nodes" },
    ],
  },
  {
    id: 2,
    day: "Сегодня",
    kind: "task",
    icon: ClipboardList,
    tone: "#6b9dff",
    text: "Новая заявка **№ 2026-1184** на подключение рядом с узлом **ast011.02.AS**",
    meta: "1 час назад · Реестр заявок",
    href: "/requests",
  },
  {
    id: 3,
    day: "Сегодня",
    kind: "system",
    icon: CircleAlert,
    tone: "#ff5257",
    text: "Импорт Excel завершён с ошибками: **3 из 128** строк не загружены",
    meta: "2 часа назад · Импорт",
    href: "/excel-import",
    actions: [{ title: "Скачать отчёт", icon: Download, href: "/excel-import" }],
  },
  {
    id: 4,
    day: "Вчера",
    kind: "system",
    icon: CircleCheck,
    tone: "#2bd463",
    text: "Резервное копирование: **1 284** устройства успешно, **16** с ошибкой",
    meta: "Вчера, 03:00 · Резервные копии",
    href: "/backups",
  },
  {
    id: 5,
    day: "Вчера",
    kind: "system",
    icon: UserCog,
    tone: "#ffc24a",
    text: "HR-синхронизация обновила ответственных у **42** узлов",
    meta: "Вчера, 06:30 · Система",
    href: "/nodes",
  },
]

const TABS = [
  { key: "all", title: "Все" },
  { key: "mention", title: "Упоминания" },
  { key: "task", title: "Задачи" },
  { key: "system", title: "Система" },
] as const

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 ? (
          <b key={i} className="font-semibold text-foreground">
            {part}
          </b>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function NotificationsPopover({ trigger }: { trigger: (unread: number) => React.ReactNode }) {
  const [unread, setUnread] = useState<number[]>([1, 2, 3])
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all")
  const list = NOTICES.filter((n) => tab === "all" || n.kind === tab)

  return (
    <HeaderPopover trigger={trigger(unread.length)} className="w-[460px]">
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <b className="mr-auto text-base">Уведомления</b>
        <button type="button" onClick={() => setUnread([])} className="text-[13px] text-[var(--link)]">
          Прочитать все
        </button>
        <Popover.Close asChild>
          <Link
            href="/settings#notifications"
            aria-label="Настройки уведомлений"
            className="grid size-8 place-items-center rounded-full border border-[var(--dd-line)] text-muted-foreground"
          >
            <Settings className="size-4" />
          </Link>
        </Popover.Close>
      </div>
      <div className="mx-4 mb-1 flex gap-1 rounded-full border border-[var(--dd-line)] bg-[var(--chip-bg)] p-[3px]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] text-[var(--nav-text)]",
              tab === t.key && "bg-[var(--nav-on-bg)] font-semibold text-[var(--nav-on)]",
            )}
          >
            {t.title}
            {t.key === "all" && unread.length > 0 && (
              <i className="grid h-4 min-w-4 place-items-center rounded-full bg-[#085eff] px-1 text-[10.5px] font-bold text-white not-italic">
                {unread.length}
              </i>
            )}
          </button>
        ))}
      </div>
      <div className="max-h-[min(560px,65vh)] overflow-auto">
        {(["Сегодня", "Вчера"] as const).map((day) => {
          const items = list.filter((n) => n.day === day)
          if (!items.length) return null
          return (
            <div key={day}>
              <GroupTitle className="mx-5 mt-3">{day}</GroupTitle>
              {items.map((n) => {
                const isNew = unread.includes(n.id)
                return (
                  <div
                    key={n.id}
                    className={cn("relative flex gap-3 px-5 py-3", isNew && "bg-[color-mix(in_srgb,#085eff_7%,transparent)]")}
                  >
                    {n.author ? (
                      <span className="grid size-10 flex-none place-items-center rounded-full bg-[linear-gradient(135deg,#085eff,#001a9f)] text-[13px] font-bold text-white">
                        {n.author}
                      </span>
                    ) : (
                      n.icon && (
                        <span
                          className="grid size-10 flex-none place-items-center rounded-xl"
                          style={{ color: n.tone, background: `color-mix(in srgb, ${n.tone} 14%, transparent)` }}
                        >
                          <n.icon className="size-[18px]" strokeWidth={1.75} />
                        </span>
                      )
                    )}
                    <div className="min-w-0 flex-1 pr-3">
                      <Popover.Close asChild>
                        <Link
                          href={n.href}
                          onClick={() => setUnread((u) => u.filter((x) => x !== n.id))}
                          className="block text-[13.5px] leading-[1.45] text-[var(--mg-text)]"
                        >
                          <Rich text={n.text} />
                        </Link>
                      </Popover.Close>
                      <span className="mt-1 block text-xs text-muted-foreground">{n.meta}</span>
                      {n.actions && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {n.actions.map((a) => (
                            <Popover.Close key={a.title} asChild>
                              <Link
                                href={a.href}
                                className="flex h-9 items-center gap-2 rounded-full border border-[var(--dd-line)] bg-[var(--chip-bg)] px-3.5 text-[13px] font-semibold"
                              >
                                <a.icon className="size-4" />
                                {a.title}
                              </Link>
                            </Popover.Close>
                          ))}
                        </div>
                      )}
                    </div>
                    {isNew && <i className="absolute top-[18px] right-5 size-[7px] rounded-full bg-[#085eff]" />}
                  </div>
                )
              })}
            </div>
          )
        })}
        {list.length === 0 && <p className="px-5 py-8 text-center text-[13px] text-muted-foreground">Уведомлений нет</p>}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--dd-line)] px-5 py-3 text-[13px]">
        <span className="text-muted-foreground">Показаны последние {NOTICES.length}</span>
        <Popover.Close asChild>
          <Link href="/notifications" className="font-semibold text-[var(--link)]">
            Все уведомления →
          </Link>
        </Popover.Close>
      </div>
    </HeaderPopover>
  )
}

/* ---------- Быстрые настройки ---------- */

/**
 * Настройки хранятся в localStorage (`ectu:*`). Плотность таблиц — класс `density-*` на <html>.
 * TODO: язык интерфейса (i18n), стартовая страница и уведомления — сохранять в профиле через API.
 */
const NOTIFY = [
  { key: "n-mention", title: "Упоминания и комментарии", def: true },
  { key: "n-request", title: "Новые заявки", def: true },
  { key: "n-errors", title: "Ошибки импорта и бэкапа", def: true },
  { key: "n-email", title: "Дублировать на почту", def: false },
] as const

const DENSITY = [
  { key: "compact", title: "Компактная" },
  { key: "normal", title: "Обычная" },
  { key: "comfortable", title: "Просторная" },
] as const

function readPref(key: string, def: string) {
  try {
    return localStorage.getItem(`ectu:${key}`) ?? def
  } catch {
    return def
  }
}
function writePref(key: string, value: string) {
  try {
    localStorage.setItem(`ectu:${key}`, value)
  } catch {}
}

const applyDensity = (v: string) => {
  const html = document.documentElement
  for (const d of DENSITY) html.classList.toggle(`density-${d.key}`, d.key === v)
}

/** Применяет сохранённую плотность таблиц при загрузке. */
export function usePrefsOnHtml() {
  useEffect(() => applyDensity(readPref("density", "normal")), [])
}

function SettingsRow({
  icon: Icon,
  title,
  aside,
  children,
}: {
  icon: LucideIcon
  title: string
  aside?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[var(--dd-line)] px-5 py-3.5">
      <div className="mb-2.5 flex items-center gap-2 text-[13.5px] font-semibold">
        <Icon className="size-4" strokeWidth={1.75} />
        {title}
        {aside && <span className="ml-auto text-xs font-normal text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </div>
  )
}

export function SettingsPopover({ trigger }: { trigger: React.ReactNode }) {
  const { theme, switchTheme } = useThemeTransition()
  const [prefs, setPrefs] = useState<Record<string, string>>({})
  const set = (key: string, value: string) => {
    setPrefs((p) => ({ ...p, [key]: value }))
    writePref(key, value)
  }
  const load = () => {
    const p: Record<string, string> = {
      lang: readPref("lang", "ru"),
      density: readPref("density", "normal"),
      start: readPref("start", "nodes"),
    }
    for (const n of NOTIFY) p[n.key] = readPref(n.key, n.def ? "1" : "0")
    setPrefs(p)
  }

  return (
    <HeaderPopover trigger={trigger} className="w-[420px]" onOpenChange={(o) => o && load()}>
      <div className="flex items-center justify-between border-b border-[var(--dd-line)] px-5 py-3.5">
        <b className="text-base">Быстрые настройки</b>
        <Popover.Close className="grid size-9 place-items-center rounded-full border border-[var(--dd-line)]" aria-label="Закрыть">
          <X className="size-4" />
        </Popover.Close>
      </div>
      <div className="max-h-[min(640px,70vh)] overflow-auto">
        <SettingsRow icon={Sun} title="Тема">
          <Segment
            value={theme as "light" | "dark" | "system" | undefined}
            options={[
              { key: "light", title: "Светлая", icon: Sun },
              { key: "dark", title: "Тёмная", icon: Moon },
              { key: "system", title: "Системная", icon: Monitor },
            ]}
            onChange={(v, e) => switchTheme(v, e)}
          />
        </SettingsRow>
        <SettingsRow icon={Languages} title="Язык интерфейса">
          <Segment
            value={prefs.lang}
            options={[
              { key: "ru", title: "Русский" },
              { key: "kk", title: "Қазақша" },
              { key: "en", title: "English" },
            ]}
            onChange={(v) => set("lang", v)}
          />
        </SettingsRow>
        <SettingsRow icon={Rows3} title="Плотность таблиц">
          <Segment
            value={prefs.density}
            options={[...DENSITY]}
            onChange={(v) => {
              set("density", v)
              applyDensity(v)
            }}
          />
        </SettingsRow>
        <SettingsRow icon={House} title="Стартовая страница" aside="после входа">
          <Select
            value={prefs.start ?? "nodes"}
            opts={[{ v: "", label: "Главная" }, ...ALL_SECTIONS.map((x) => ({ v: x.slug, label: x.title }))]}
            onChange={(v) => set("start", v)}
          />
        </SettingsRow>
        <SettingsRow icon={Bell} title="Уведомления">
          {NOTIFY.map((n) => (
            <label key={n.key} className="flex cursor-pointer items-center justify-between py-[7px] text-[13.5px]">
              {n.title}
              <Switch on={(prefs[n.key] ?? (n.def ? "1" : "0")) === "1"} onChange={(v) => set(n.key, v ? "1" : "0")} />
            </label>
          ))}
        </SettingsRow>
      </div>
      <div className="flex items-center justify-between px-5 py-3 text-[13px]">
        <span className="text-muted-foreground">Применяется сразу</span>
        <Popover.Close asChild>
          <Link href="/settings" className="font-semibold text-[var(--link)]">
            Все настройки →
          </Link>
        </Popover.Close>
      </div>
    </HeaderPopover>
  )
}

/* ---------- Профиль ---------- */

export function Avatar({ className }: { className?: string }) {
  const user = useUser()
  return (
    <span
      className={cn(
        "grid size-[38px] flex-none place-items-center rounded-full bg-[linear-gradient(135deg,#085eff,#001a9f)] text-sm font-bold text-white",
        className,
      )}
    >
      {user.initial}
    </span>
  )
}

function ProfileRow({
  href,
  icon: Icon,
  title,
  count,
  kbd,
  isNew,
  danger,
}: {
  href: string
  icon: LucideIcon
  title: string
  count?: number
  kbd?: string
  isNew?: boolean
  danger?: boolean
}) {
  return (
    <Popover.Close asChild>
      <Link
        href={href}
        className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-[var(--mg-on)]", danger && "text-[#ff5257]")}
      >
        <Icon className={cn("size-[18px]", !danger && "text-muted-foreground")} strokeWidth={1.75} />
        {title}
        {count !== undefined && (
          <span className="ml-auto rounded-full bg-[rgba(8,94,255,0.16)] px-1.5 text-[11px] text-[var(--link)] tabular-nums">{count}</span>
        )}
        {kbd && (
          <span className="ml-auto grid size-5 place-items-center rounded-md border border-[var(--kbd-line)] text-[11px] text-muted-foreground">
            {kbd}
          </span>
        )}
        {isNew && <span className="ml-auto rounded-full bg-[rgba(8,94,255,0.16)] px-2 text-[11px] text-[var(--link)]">new</span>}
      </Link>
    </Popover.Close>
  )
}

/** TODO: счётчики избранного и заявок из API; выход — завершение сеанса. */
export function UserPopover({ trigger }: { trigger: React.ReactNode }) {
  const u = useUser()
  return (
    <HeaderPopover trigger={trigger} className="w-[340px]">
      <div className="flex flex-col items-center gap-1.5 bg-[radial-gradient(300px_140px_at_50%_0%,rgba(8,94,255,0.3),transparent_70%)] px-5 pt-[22px] pb-4 text-center">
        <Avatar className="mb-1.5 size-[72px] text-[26px] shadow-[0_0_0_4px_rgba(8,94,255,0.25)]" />
        <b className="text-[17px]">{u.name}</b>
        <span className="text-[13px] text-muted-foreground">
          {u.login} · {u.email}
        </span>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {u.roles.map((r, i) => (
            <span
              key={r}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs",
                i === 0 ? "bg-[rgba(8,94,255,0.16)] text-[var(--link)]" : "bg-[var(--chip-bg)]",
              )}
            >
              {r}
            </span>
          ))}
          <span className="rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-xs font-semibold">{u.branch}</span>
        </div>
      </div>
      <div className="p-2">
        <ProfileRow href="/profile" icon={UserRound} title="Мой профиль" />
        <ProfileRow href="/profile#favorites" icon={Bookmark} title="Избранные узлы" count={8} />
        <ProfileRow href="/requests?mine=1" icon={ClipboardList} title="Мои заявки" count={3} />
        <ProfileRow href="/profile#history" icon={History} title="Мои изменения" />
        <div className="mx-2 my-1.5 h-px bg-[var(--dd-line)]" />
        <ProfileRow href="/help#hotkeys" icon={Keyboard} title="Горячие клавиши" kbd="?" />
        <ProfileRow href="/help" icon={LifeBuoy} title="Помощь и инструкции" />
        <ProfileRow href="/help#whats-new" icon={Megaphone} title="Что нового в v6.1" isNew />
        <div className="mx-2 my-1.5 h-px bg-[var(--dd-line)]" />
        <ProfileRow href="/login?logout=1" icon={LogOut} title="Выйти" danger />
      </div>
    </HeaderPopover>
  )
}
