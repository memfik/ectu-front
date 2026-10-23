"use client"

import { useSyncExternalStore } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AtSign,
  Bell,
  CircleAlert,
  ClipboardList,
  House,
  KeyRound,
  Languages,
  LayoutDashboard,
  Laptop,
  Mail,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Share2,
  Shield,
  Smartphone,
  Sun,
} from "lucide-react"
import { applyDensity, DENSITY, NOTIFY, readPref, Segment, Switch, writePref } from "@/components/layout/header-popovers"
import { Select } from "@/components/list/form-controls"
import { btn } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { ALL_SECTIONS } from "@/config/nav"
import { useThemeTransition } from "@/hooks/use-theme-transition"
import { useUser } from "@/lib/api/session"
import { cn } from "@/lib/utils"
import { ToneBlock } from "./ui"

/*
 * Настройки (ссылка «Все настройки →» из быстрых настроек): то же, что в шапке, плюс каналы уведомлений, безопасность, сброс раскладок.
 * Хранятся в localStorage (`ectu:*`), как быстрые настройки. TODO(API): настройки профиля, смена пароля, активные сеансы.
 */

const EVENT = "ectu:prefs"
const subscribe = (on: () => void) => {
  addEventListener(EVENT, on)
  addEventListener("storage", on)
  return () => {
    removeEventListener(EVENT, on)
    removeEventListener("storage", on)
  }
}
function usePref(key: string, def: string): [string, (v: string) => void] {
  const v = useSyncExternalStore(subscribe, () => readPref(key, def), () => def)
  return [
    v,
    (x) => {
      writePref(key, x)
      dispatchEvent(new Event(EVENT))
    },
  ]
}

const NAV: { id: string; t: string; icon: LucideIcon; tone: string }[] = [
  { id: "appearance", t: "Внешний вид", icon: Palette, tone: "#a78bfa" },
  { id: "start", t: "Стартовая страница", icon: House, tone: "#22d3ee" },
  { id: "notifications", t: "Уведомления", icon: Bell, tone: "#ffc24a" },
  { id: "security", t: "Безопасность", icon: Shield, tone: "#2bd463" },
  { id: "layouts", t: "Раскладки", icon: LayoutDashboard, tone: "#4f8dff" },
]

function Block({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  const n = NAV.find((x) => x.id === id)!
  return (
    <ToneBlock id={id} icon={n.icon} tone={n.tone} title={title} sub={sub}>
      {children}
    </ToneBlock>
  )
}

function Row({ t, sub, children }: { t: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_minmax(0,400px)] items-center gap-6 border-t border-border py-4 first:border-0 max-sm:grid-cols-1 max-sm:gap-3">
      <span>
        <b className="block text-[14px] font-medium">{t}</b>
        {sub && <span className="text-[12.5px] text-muted-foreground">{sub}</span>}
      </span>
      <div className="flex justify-end max-sm:justify-start [&>*]:w-full">{children}</div>
    </div>
  )
}

/** Мини-превью темы: шапка, карточки, строка таблицы. */
function ThemeCard({ k, t, icon: Icon, on, onPick }: { k: "light" | "dark" | "system"; t: string; icon: LucideIcon; on: boolean; onPick: (e: React.MouseEvent) => void }) {
  const pane = (dark: boolean) => (
    <span className={cn("flex h-full flex-1 flex-col gap-1.5 p-2.5", dark ? "bg-[#0a0b0e]" : "bg-[#f2f2f7]")}>
      <i className={cn("h-2 w-2/3 rounded-full", dark ? "bg-white/15" : "bg-black/10")} />
      <span className="flex gap-1.5">
        <i className={cn("h-6 flex-1 rounded-md", dark ? "bg-white/[0.07]" : "bg-white shadow-sm")} />
        <i className={cn("h-6 flex-1 rounded-md", dark ? "bg-white/[0.07]" : "bg-white shadow-sm")} />
      </span>
      <i className="h-1.5 w-1/2 rounded-full bg-[#085eff]" />
      <i className={cn("h-1.5 w-3/4 rounded-full", dark ? "bg-white/10" : "bg-black/[0.08]")} />
    </span>
  )
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "group flex flex-col gap-2.5 rounded-2xl border p-2.5 text-left transition-colors",
        on ? "border-[#085eff] bg-[rgba(8,94,255,0.1)]" : "border-border hover:border-[color-mix(in_srgb,var(--foreground)_25%,transparent)]",
      )}
    >
      <span className="flex h-[84px] overflow-hidden rounded-xl border border-border">
        {k === "system" ? (
          <>
            {pane(false)}
            {pane(true)}
          </>
        ) : (
          pane(k === "dark")
        )}
      </span>
      <span className="flex items-center gap-2 px-1 text-[13px] font-medium">
        <Icon className="size-4" />
        {t}
        <i className={cn("ml-auto size-4 rounded-full border-2", on ? "border-[#085eff] bg-[radial-gradient(circle,#085eff_40%,transparent_45%)]" : "border-border")} />
      </span>
    </button>
  )
}

const NOTIFY_ICONS: Record<string, LucideIcon> = { "n-mention": AtSign, "n-request": ClipboardList, "n-errors": CircleAlert, "n-email": Mail }

function NotifyTile({ k, t, def }: { k: string; t: string; def: boolean }) {
  const [v, set] = usePref(k, def ? "1" : "0")
  const on = v === "1"
  const Icon = NOTIFY_ICONS[k] ?? Bell
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors",
        on ? "border-[#085eff]/40 bg-[rgba(8,94,255,0.07)]" : "border-border",
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-xl", on ? "bg-[rgba(8,94,255,0.16)] text-[var(--link)]" : "bg-[var(--chip-bg)] text-muted-foreground")}>
        <Icon className="size-[18px]" />
      </span>
      <span className="flex-1 text-[13.5px] font-medium">{t}</span>
      <Switch on={on} onChange={(x) => set(x ? "1" : "0")} />
    </label>
  )
}

export function SettingsPage() {
  const { theme, switchTheme } = useThemeTransition()
  const user = useUser()
  // Тема известна только в браузере — до монтирования не подсвечиваем вариант (иначе расхождение гидратации)
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const [lang, setLang] = usePref("lang", "ru")
  const [density, setDensity] = usePref("density", "normal")
  const [start, setStart] = usePref("start", "nodes")
  const [digest, setDigest] = usePref("digest", "day")
  const reset = (key: string, t: string) => {
    try {
      localStorage.removeItem(key)
    } catch {}
    dispatchEvent(new Event(key))
    toast(`${t}: сброшено`)
  }
  return (
    <div className="px-(--page-gutter) pb-16">
      <div className="mx-auto w-full max-w-[1080px]">
        <section className="pt-8 pb-6 text-center">
          <p className="text-sm text-muted-foreground">Профиль · {user.name}</p>
          <h1 className="mt-1.5 text-[52px] leading-[1.05] font-semibold tracking-[-1.4px] max-sm:text-[32px]">Настройки</h1>
          <p className="mt-2 text-[15px] text-[var(--nav-text)]">Применяются сразу и сохраняются в этом браузере</p>
        </section>


        <div className="flex flex-col gap-[18px]">
          <Block id="appearance" title="Внешний вид" sub="Тема, язык и плотность списков">
            <div className="grid grid-cols-3 gap-3 py-4 max-sm:grid-cols-1">
              {(
                [
                  ["light", "Светлая", Sun],
                  ["dark", "Тёмная", Moon],
                  ["system", "Как в системе", Monitor],
                ] as const
              ).map(([k, t, I]) => (
                <ThemeCard key={k} k={k} t={t} icon={I} on={mounted && theme === k} onPick={(e) => switchTheme(k, e)} />
              ))}
            </div>
            <Row t="Язык интерфейса" sub="Казахский и английский — в разработке">
              <Segment
                value={lang}
                options={[
                  { key: "ru", title: "Русский", icon: Languages },
                  { key: "kk", title: "Қазақша" },
                  { key: "en", title: "English" },
                ]}
                onChange={(v) => setLang(v)}
              />
            </Row>
            <Row t="Плотность таблиц" sub="Высота строк в списках разделов">
              <Segment
                value={density}
                options={[...DENSITY]}
                onChange={(v) => {
                  setDensity(v)
                  applyDensity(v)
                }}
              />
            </Row>
          </Block>

          <Block id="start" title="Стартовая страница" sub="Что открывается после входа">
            <Row t="Раздел" sub="Главная — сводка по сети и ваши задачи">
              <Select value={start} opts={[{ v: "", label: "Главная" }, ...ALL_SECTIONS.map((x) => ({ v: x.slug, label: x.title }))]} onChange={setStart} />
            </Row>
          </Block>

          <Block id="notifications" title="Уведомления" sub="Что приходит в колокольчик и на почту">
            <div className="grid grid-cols-2 gap-3 py-4 max-sm:grid-cols-1">
              {NOTIFY.map((n) => (
                <NotifyTile key={n.key} k={n.key} t={n.title} def={n.def} />
              ))}
            </div>
            <Row t="Сводка на почту" sub={`Письмо со всеми событиями на ${user.email}`}>
              <Segment
                value={digest}
                options={[
                  { key: "off", title: "Не присылать" },
                  { key: "day", title: "Раз в день" },
                  { key: "week", title: "Раз в неделю" },
                ]}
                onChange={(v) => setDigest(v)}
              />
            </Row>
          </Block>

          <Block id="security" title="Безопасность" sub="Вход через учётную запись QMobile">
            <Row t="Пароль" sub="Меняется в корпоративной учётной записи">
              <button type="button" className={cn(btn(), "justify-center")} onClick={() => toast("Смена пароля — через службу поддержки ИТ")}>
                <KeyRound />
                Сменить пароль
              </button>
            </Row>
            <Row t="Активные сеансы" sub="Где вы сейчас вошли в ЕСТУ">
              <div className="flex flex-col gap-2 text-[13px]">
                {(
                  [
                    [Laptop, "Chrome · macOS", "Астана · сейчас", true],
                    [Smartphone, "Safari · iPhone", "Астана · вчера, 21:14", false],
                  ] as const
                ).map(([I, t, s, cur]) => (
                  <span key={t} className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-[var(--chip-bg)]">
                      <I className="size-4 text-muted-foreground" />
                    </span>
                    <span className="flex-1">
                      <b className="block font-medium">{t}</b>
                      <span className="text-[12px] text-muted-foreground">{s}</span>
                    </span>
                    {cur ? (
                      <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2.5 py-1 text-[11px] text-[var(--status-ok)]">этот</span>
                    ) : (
                      <button type="button" className="text-[12px] font-medium text-[#ff5257]" onClick={() => toast("Сеанс завершён")}>
                        Завершить
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </Row>
          </Block>

          <Block id="layouts" title="Раскладки" sub="Ваши настройки экранов">
            <Row t="Главная" sub="Скрытые и добавленные виджеты">
              <button type="button" className={cn(btn(), "justify-center")} onClick={() => reset("ectu.home-layout", "Главная")}>
                <RotateCcw />
                Сбросить
              </button>
            </Row>
            <Row t="Карта ядра сети" sub="Положение узлов на схеме">
              <button type="button" className={cn(btn(), "justify-center")} onClick={() => reset("ectu.core-map-positions", "Карта ядра")}>
                <Share2 />
                Сбросить к схеме
              </button>
            </Row>
          </Block>
        </div>
      </div>
    </div>
  )
}
