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
import { nodeRows } from "@/sections/nodes/data"
import { useUser } from "@/lib/api/session"
import { cn } from "@/lib/utils"
import { ToneBlock } from "./ui"

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

export function ProfilePage() {
  const u = useUser()
  const mine = nodeRows()
    .filter((n) => n.branch === "АС")
    .slice(0, 6)
  const stats: [LucideIcon, string, string, string][] = [
    [RadioTower, "Узлов", String(mine.length), "#4f8dff"],
    [ClipboardList, "Заявок", "3", "#ffc24a"],
    [History, "Изменений", "47", "#a78bfa"],
    [Bookmark, "Избранное", String(FAVORITES.length), "#2bd463"],
  ]
  return (
    <div className="px-(--page-gutter) pb-16">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-[18px] pt-8">
        <section className="relative overflow-hidden rounded-[28px] border border-border bg-[var(--glass-card)] px-6 pt-10 pb-6 text-center backdrop-blur-[18px]">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(520px_240px_at_50%_0%,rgba(8,94,255,0.32),transparent_70%)]" />
          <Avatar className="mx-auto size-[96px] text-[34px] shadow-[0_0_0_6px_rgba(8,94,255,0.22),0_20px_50px_rgba(8,94,255,0.35)]" />
          <h1 className="mt-4 text-[34px] leading-tight font-semibold tracking-[-0.6px] max-sm:text-[26px]">{u.name}</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {u.login} · {u.email}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {u.roles.map((r, i) => (
              <span key={r} className={cn("rounded-full px-3 py-1 text-xs", i === 0 ? "bg-[rgba(8,94,255,0.16)] text-[var(--link)]" : "bg-[var(--chip-bg)]")}>
                {r}
              </span>
            ))}
            <span className="rounded-full bg-[var(--chip-bg)] px-3 py-1 text-xs font-semibold">{u.branch}</span>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Link href="/settings" className={btn()}>
              <Settings />
              Настройки
            </Link>
            <Link href="/login?logout=1" className={btn({ danger: true })}>
              <LogOut />
              Выйти
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3 max-sm:grid-cols-2">
            {stats.map(([I, t, v, c]) => (
              <span key={t} className="flex items-center gap-3 rounded-2xl border border-border bg-[var(--chip-bg)] px-4 py-3 text-left">
                <span className="grid size-10 place-items-center rounded-xl" style={{ color: c, background: `color-mix(in srgb, ${c} 16%, transparent)` }}>
                  <I className="size-5" />
                </span>
                <span>
                  <b className="block text-[24px] leading-none font-medium tabular-nums">{v}</b>
                  <span className="text-[12px] text-muted-foreground">{t}</span>
                </span>
              </span>
            ))}
          </div>
        </section>

        <ToneBlock id="about" icon={UserRound} tone="#22d3ee" title="Данные" sub="Из учётной записи и HR-системы">
          <dl className="grid grid-cols-2 gap-x-10 text-[13.5px] max-sm:grid-cols-1">
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
            ).map(([t, v], i) => (
              <div key={t} className={cn("flex justify-between gap-4 border-border py-3.5", i > 1 && "border-t", i === 1 && "max-sm:border-t")}>
                <dt className="text-muted-foreground">{t}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </ToneBlock>

        <ToneBlock
          id="favorites"
          icon={Bookmark}
          tone="#2bd463"
          title={
            <>
              Избранное <span className="font-normal text-muted-foreground">{FAVORITES.length}</span>
            </>
          }
          sub="Быстрый доступ к узлам, оборудованию и отчётам"
          bodyClassName="py-4"
        >
          <div className="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
            {FAVORITES.map(([I, t, sub, href]) => (
              <Link key={t} href={href} className="group flex items-center gap-3 rounded-2xl border border-border bg-[var(--chip-bg)] p-3 transition-colors hover:border-[#085eff]">
                <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
                  <I className="size-4" />
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-[13px] font-semibold">{t}</b>
                  <span className="block truncate text-[11.5px] text-muted-foreground">{sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </ToneBlock>

        <ToneBlock
          id="history"
          icon={History}
          tone="#a78bfa"
          title={
            <>
              Мои изменения <span className="font-normal text-muted-foreground">{HISTORY.length}</span>
            </>
          }
          sub="Последние правки, импорты и привязки"
        >
          {HISTORY.map((h) => (
            <Link key={h.t} href={h.href} className="flex items-start gap-3.5 border-t border-border py-3.5 first:border-0 hover:opacity-90">
              <span className="grid size-9 flex-none place-items-center rounded-xl" style={{ color: h.tone, background: `color-mix(in srgb, ${h.tone} 14%, transparent)` }}>
                <h.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[14px] font-medium">{h.t}</b>
                <span className="text-[12.5px] text-muted-foreground">{h.s}</span>
                {h.diff && (
                  <span className="mt-1.5 flex items-center gap-2 text-[12px]">
                    <span className="rounded-md bg-[rgba(255,82,87,0.12)] px-2 py-0.5 text-[#ff5257] line-through">{h.diff[0]}</span>→
                    <span className="rounded-md bg-[rgba(43,212,99,0.12)] px-2 py-0.5 text-[var(--status-ok)]">{h.diff[1]}</span>
                  </span>
                )}
              </span>
              <span className="flex-none rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-[11.5px] text-muted-foreground">{h.at}</span>
            </Link>
          ))}
        </ToneBlock>

        <ToneBlock
          id="nodes"
          icon={RadioTower}
          tone="#4f8dff"
          title={
            <>
              Мои узлы <span className="font-normal text-muted-foreground">{mine.length}</span>
            </>
          }
          sub="Вы ответственный за эксплуатацию"
          action={
            <Link href="/nodes" className={btn({ sm: true })}>
              <ClipboardList />
              Все узлы
            </Link>
          }
          bodyClassName="py-4"
        >
          <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
            {mine.map((n, i) => (
              <Link key={n.id} href={`/nodes/${n.id}`} className="group flex items-center gap-3 rounded-2xl border border-border bg-[var(--chip-bg)] px-3.5 py-3 transition-colors hover:border-[#085eff]">
                <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
                  <RadioTower className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[13.5px] font-semibold">{n.code}</b>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {n.object} · {n.city}
                  </span>
                </span>
                <span className="flex-none rounded-full bg-[var(--background)] px-2.5 py-1 text-[11px] text-muted-foreground">
                  {n.network} · №{(i % 2) + 1}
                </span>
                <ArrowUpRight className="size-4 flex-none text-muted-foreground transition-colors group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        </ToneBlock>
      </div>
    </div>
  )
}
