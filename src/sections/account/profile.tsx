"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowUpRight,
  Bookmark,
  Cable,
  Camera,
  ClipboardList,
  FileChartColumn,
  Globe,
  History,
  LogOut,
  Network,
  Pencil,
  Plus,
  RadioTower,
  Router,
  Settings,
  Upload,
  UserRound,
} from "lucide-react"
import { Avatar } from "@/components/layout/header-popovers"
import { btn } from "@/components/list/ui"
import { glass } from "@/components/passport/ui"
import { nodeRows } from "@/sections/nodes/data"
import { useUser } from "@/lib/api/session"
import { cn } from "@/lib/utils"
import { AccountHero, SideNav } from "./ui"

/*
 * Мой профиль (меню профиля в шапке): данные пользователя, избранное (#favorites), мои изменения (#history), мои узлы.
 * Данные пользователя — из сессии (`useUser`), остальное — примеры. TODO(API): избранное, история действий пользователя, узлы ответственного.
 */

const FAVORITES: [LucideIcon, string, string, string][] = [
  [RadioTower, "url002.01.UF", "УС «Уральск Центральный»", "/nodes/1"],
  [Network, "sw2.atr2", "X440-24t", "/switches/1"],
  [Router, "rt1.alm1", "ASR1001-X", "/routers/1"],
  [Cable, "ВОЛС №49", "→ УС «РТПЦ»", "/fiber-lines/49"],
  [RadioTower, "alm001.01.YF", "ул. Маметовой 67Б", "/nodes/2"],
  [Camera, "CAM-01", "Вход КСО", "/cameras"],
  [Globe, "IP-план АС", "10.40.0.0/16", "/ip-plan"],
  [FileChartColumn, "Сводный отчёт", "октябрь", "/summary-files"],
]

const HISTORY: { icon: LucideIcon; tone: string; t: string; s: string; at: string; diff?: [string, string]; href: string }[] = [
  { icon: Pencil, tone: "#4f8dff", t: "Изменён тип сети у url002.01.UF", s: "Узлы связи", at: "вчера, 17:42", diff: ["ГМС", "МС"], href: "/nodes/1" },
  { icon: Upload, tone: "#2bd463", t: "Импорт Excel: 128 строк в «Узлы связи · ЮФ»", s: "Импорт Excel · 3 ошибки", at: "07.10, 15:12", href: "/excel-import" },
  { icon: Plus, tone: "#2bd463", t: "Создана заявка № 2026-1184", s: "Реестр заявок", at: "06.10, 11:05", href: "/requests" },
  { icon: Pencil, tone: "#4f8dff", t: "Изменён МОЛ у sw2.atr2", s: "Коммутаторы", at: "05.10, 09:30", diff: ["Н. Осербай", "Е. Сапаров"], href: "/switches/1" },
  { icon: Cable, tone: "#a78bfa", t: "Привязана ВОЛС №52 к ast021.01.AS", s: "ВОЛС", at: "03.10, 16:48", href: "/fiber-lines/52" },
]

const NAV = [
  { id: "about", t: "Данные", icon: UserRound },
  { id: "favorites", t: "Избранное", icon: Bookmark },
  { id: "history", t: "Мои изменения", icon: History },
  { id: "nodes", t: "Мои узлы", icon: RadioTower },
]

function Head({ icon: Icon, title, count, children }: { icon: LucideIcon; title: string; count?: number; children?: React.ReactNode }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
        <Icon className="size-[18px]" />
      </span>
      <b className="text-[15px] font-semibold">
        {title} {count !== undefined && <span className="font-normal text-muted-foreground">{count}</span>}
      </b>
      {children && <span className="ml-auto">{children}</span>}
    </header>
  )
}

export function ProfilePage() {
  const u = useUser()
  const mine = nodeRows()
    .filter((n) => n.branch === "АС")
    .slice(0, 6)
  return (
    <div className="px-(--page-gutter) pb-10">
      <AccountHero crumb="Профиль" title="Мой профиль">
        <Link href="/settings" className={btn()}>
          <Settings />
          Настройки
        </Link>
        <Link href="/login?logout=1" className={btn({ danger: true })}>
          <LogOut />
          Выйти
        </Link>
      </AccountHero>
      <div className="grid grid-cols-[240px_1fr] items-start gap-[18px] max-[1279px]:grid-cols-1">
        <SideNav items={NAV} />
        <div className="flex min-w-0 flex-col gap-[18px]">
          <section id="about" className={cn(glass, "scroll-mt-6 overflow-hidden")}>
            <div className="flex flex-wrap items-center gap-5 bg-[radial-gradient(500px_200px_at_10%_0%,rgba(8,94,255,0.28),transparent_70%)] p-6">
              <Avatar className="size-[84px] text-[30px] shadow-[0_0_0_4px_rgba(8,94,255,0.25)]" />
              <div className="min-w-0">
                <b className="block text-[24px] font-semibold">{u.name}</b>
                <span className="text-[13.5px] text-muted-foreground">
                  {u.login} · {u.email}
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {u.roles.map((r, i) => (
                    <span key={r} className={cn("rounded-full px-2.5 py-1 text-xs", i === 0 ? "bg-[rgba(8,94,255,0.16)] text-[var(--link)]" : "bg-[var(--chip-bg)]")}>
                      {r}
                    </span>
                  ))}
                  <span className="rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-xs font-semibold">{u.branch}</span>
                </div>
              </div>
              <div className="ml-auto grid grid-cols-4 gap-2.5 max-sm:ml-0 max-sm:grid-cols-2">
                {(
                  [
                    ["Узлов", String(mine.length)],
                    ["Заявок", "3"],
                    ["Изменений", "47"],
                    ["Избранное", String(FAVORITES.length)],
                  ] as const
                ).map(([t, v]) => (
                  <span key={t} className="min-w-[96px] rounded-2xl border border-border bg-[var(--chip-bg)] px-4 py-2.5">
                    <b className="block text-[22px] font-medium tabular-nums">{v}</b>
                    <span className="text-[11.5px] text-muted-foreground">{t}</span>
                  </span>
                ))}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 px-6 pb-5 text-[13.5px] max-sm:grid-cols-1">
              {(
                [
                  ["ФИО", u.name],
                  ["Логин", u.login],
                  ["Почта", u.email],
                  ["Филиал", u.branch],
                  ["Должность", "Ведущий инженер"],
                  ["Отдел", "Отдел эксплуатации СПД"],
                  ["Телефон", "+7 701 *** 55 31"],
                  ["Роли", u.roles.join(", ")],
                ] as const
              ).map(([t, v]) => (
                <div key={t} className="flex justify-between gap-4 border-b border-border py-3">
                  <dt className="text-muted-foreground">{t}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="favorites" className={cn(glass, "scroll-mt-6 p-5")}>
            <Head icon={Bookmark} title="Избранное" count={FAVORITES.length} />
            <div className="grid grid-cols-4 gap-2.5 max-[1500px]:grid-cols-2 max-sm:grid-cols-1">
              {FAVORITES.map(([I, t, s, href]) => (
                <Link key={t} href={href} className="flex items-center gap-3 rounded-2xl border border-border bg-[var(--chip-bg)] p-3 hover:border-[#085eff]">
                  <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
                    <I className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <b className="block truncate text-[13px] font-semibold">{t}</b>
                    <span className="block truncate text-[11.5px] text-muted-foreground">{s}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section id="history" className={cn(glass, "scroll-mt-6 p-5")}>
            <Head icon={History} title="Мои изменения" count={HISTORY.length} />
            <div className="flex flex-col">
              {HISTORY.map((h) => (
                <Link key={h.t} href={h.href} className="flex items-start gap-3 border-b border-border py-3 last:border-0 hover:opacity-90">
                  <span className="grid size-8 flex-none place-items-center rounded-lg" style={{ color: h.tone, background: `color-mix(in srgb, ${h.tone} 14%, transparent)` }}>
                    <h.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[13.5px] font-semibold">{h.t}</b>
                    <span className="text-[12px] text-muted-foreground">{h.s}</span>
                    {h.diff && (
                      <span className="mt-1.5 flex items-center gap-2 text-[12px]">
                        <span className="rounded-md bg-[rgba(255,82,87,0.12)] px-2 py-0.5 text-[#ff5257] line-through">{h.diff[0]}</span>→
                        <span className="rounded-md bg-[rgba(43,212,99,0.12)] px-2 py-0.5 text-[var(--status-ok)]">{h.diff[1]}</span>
                      </span>
                    )}
                  </span>
                  <span className="flex-none text-[12px] text-muted-foreground">{h.at}</span>
                </Link>
              ))}
            </div>
          </section>

          <section id="nodes" className={cn(glass, "scroll-mt-6 p-5")}>
            <Head icon={RadioTower} title="Мои узлы" count={mine.length}>
              <Link href="/nodes" className={btn({ sm: true })}>
                <ClipboardList />
                Все узлы
              </Link>
            </Head>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-[13px]">
                <thead>
                  <tr className="text-left text-[12px] text-muted-foreground">
                    {["ID узла", "Объект", "Город", "Тип сети", "Роль", ""].map((h) => (
                      <th key={h} className="px-3 py-1 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mine.map((n, i) => (
                    <tr key={n.id} className="[&>td]:bg-[var(--chip-bg)] [&>td]:px-3 [&>td]:py-2.5">
                      <td className="rounded-l-xl font-semibold">{n.code}</td>
                      <td className="max-w-[260px] truncate">{n.object}</td>
                      <td>{n.city}</td>
                      <td>{n.network}</td>
                      <td className="text-muted-foreground">{i % 2 ? "ответственный №2" : "ответственный №1"}</td>
                      <td className="rounded-r-xl text-right">
                        <Link href={`/nodes/${n.id}`} aria-label="Паспорт" className="inline-grid size-8 place-items-center rounded-full border border-border">
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
