"use client"

import { useSyncExternalStore } from "react"
import type { LucideIcon } from "lucide-react"
import { Bell, House, KeyRound, Languages, LayoutDashboard, Laptop, Monitor, Moon, Palette, RotateCcw, Rows3, Shield, Smartphone, Sun } from "lucide-react"
import { applyDensity, DENSITY, NOTIFY, readPref, Segment, Switch, writePref } from "@/components/layout/header-popovers"
import { Select } from "@/components/list/form-controls"
import { btn } from "@/components/list/ui"
import { glass } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { ALL_SECTIONS } from "@/config/nav"
import { useThemeTransition } from "@/hooks/use-theme-transition"
import { cn } from "@/lib/utils"
import { AccountHero, SideNav } from "./ui"

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

const NAV = [
  { id: "appearance", t: "Внешний вид", icon: Palette },
  { id: "start", t: "Стартовая страница", icon: House },
  { id: "notifications", t: "Уведомления", icon: Bell },
  { id: "security", t: "Безопасность", icon: Shield },
  { id: "layouts", t: "Раскладки", icon: LayoutDashboard },
]

function Block({ id, icon: Icon, title, sub, children }: { id: string; icon: LucideIcon; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn(glass, "scroll-mt-6 p-5")}>
      <header className="mb-4 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
          <Icon className="size-[18px]" />
        </span>
        <span>
          <b className="block text-[15px] font-semibold">{title}</b>
          {sub && <span className="text-[12.5px] text-muted-foreground">{sub}</span>}
        </span>
      </header>
      {children}
    </section>
  )
}

function Row({ t, sub, children }: { t: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-border py-3.5 first:border-0 first:pt-0">
      <span className="min-w-[220px] flex-1">
        <b className="block text-[13.5px] font-medium">{t}</b>
        {sub && <span className="text-[12px] text-muted-foreground">{sub}</span>}
      </span>
      <div className="w-[min(420px,100%)]">{children}</div>
    </div>
  )
}

function NotifySwitch({ k, def }: { k: string; def: boolean }) {
  const [v, set] = usePref(k, def ? "1" : "0")
  return <Switch on={v === "1"} onChange={(x) => set(x ? "1" : "0")} />
}

export function SettingsPage() {
  const { theme, switchTheme } = useThemeTransition()
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
    <div className="px-(--page-gutter) pb-10">
      <AccountHero crumb="Профиль" title="Настройки" sub="Применяются сразу · хранятся в этом браузере" />
      <div className="grid grid-cols-[240px_1fr] items-start gap-[18px] max-[1279px]:grid-cols-1">
        <SideNav items={NAV} />
        <div className="flex max-w-[980px] flex-col gap-[18px]">
          <Block id="appearance" icon={Palette} title="Внешний вид">
            <Row t="Тема" sub="Тёмная — основная">
              <Segment
                value={mounted ? (theme as "light" | "dark" | "system" | undefined) : undefined}
                options={[
                  { key: "light", title: "Светлая", icon: Sun },
                  { key: "dark", title: "Тёмная", icon: Moon },
                  { key: "system", title: "Системная", icon: Monitor },
                ]}
                onChange={(v, e) => switchTheme(v, e)}
              />
            </Row>
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
            <Row t="Плотность таблиц" sub="Высота строк в списках">
              <Segment
                value={density}
                options={DENSITY.map((d) => ({ ...d, icon: d.key === "normal" ? Rows3 : undefined }))}
                onChange={(v) => {
                  setDensity(v)
                  applyDensity(v)
                }}
              />
            </Row>
          </Block>

          <Block id="start" icon={House} title="Стартовая страница" sub="Что открывается после входа">
            <Row t="Раздел">
              <Select value={start} opts={[{ v: "", label: "Главная" }, ...ALL_SECTIONS.map((x) => ({ v: x.slug, label: x.title }))]} onChange={setStart} />
            </Row>
          </Block>

          <Block id="notifications" icon={Bell} title="Уведомления">
            {NOTIFY.map((n) => (
              <Row key={n.key} t={n.title}>
                <div className="flex justify-end">
                  <NotifySwitch k={n.key} def={n.def} />
                </div>
              </Row>
            ))}
            <Row t="Сводка на почту" sub="Письмо со всеми событиями за период">
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

          <Block id="security" icon={Shield} title="Безопасность" sub="Вход через учётную запись QMobile">
            <Row t="Пароль" sub="Меняется в корпоративной учётной записи">
              <button type="button" className={btn()} onClick={() => toast("Смена пароля — через службу поддержки ИТ")}>
                <KeyRound />
                Сменить пароль
              </button>
            </Row>
            <Row t="Активные сеансы">
              <div className="flex flex-col gap-2 text-[13px]">
                {(
                  [
                    [Laptop, "Chrome · macOS", "Астана · сейчас", true],
                    [Smartphone, "Safari · iPhone", "Астана · вчера, 21:14", false],
                  ] as const
                ).map(([I, t, s, cur]) => (
                  <span key={t} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                    <I className="size-4 text-muted-foreground" />
                    <span className="flex-1">
                      <b className="block font-medium">{t}</b>
                      <span className="text-[12px] text-muted-foreground">{s}</span>
                    </span>
                    {cur ? (
                      <span className="text-[12px] text-[var(--status-ok)]">этот</span>
                    ) : (
                      <button type="button" className="text-[12px] text-[#ff5257]" onClick={() => toast("Сеанс завершён")}>
                        Завершить
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </Row>
          </Block>

          <Block id="layouts" icon={LayoutDashboard} title="Раскладки" sub="Ваши настройки экранов">
            <Row t="Главная" sub="Скрытые и добавленные виджеты">
              <button type="button" className={btn()} onClick={() => reset("ectu.home-layout", "Главная")}>
                <RotateCcw />
                Сбросить
              </button>
            </Row>
            <Row t="Карта ядра сети" sub="Положение узлов на схеме">
              <button type="button" className={btn()} onClick={() => reset("ectu.core-map-positions", "Карта ядра")}>
                <RotateCcw />
                Сбросить к схеме
              </button>
            </Row>
          </Block>
        </div>
      </div>
    </div>
  )
}
