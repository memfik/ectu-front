"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCheck, Search, Settings } from "lucide-react"
import { NOTICES, Rich, type Notice } from "@/components/layout/header-popovers"
import { Input } from "@/components/list/form-controls"
import { btn } from "@/components/list/ui"
import { glass } from "@/components/passport/ui"
import { cn } from "@/lib/utils"
import { AccountHero } from "./ui"

/*
 * Все уведомления (ссылка «Все уведомления →» из шапки): те же записи, что во всплывающем окне, с фильтром и поиском.
 * TODO(API): список уведомлений с пагинацией, прочитано / не прочитано на сервере.
 */

const TABS: { k: "all" | Notice["kind"] | "unread"; t: string }[] = [
  { k: "all", t: "Все" },
  { k: "unread", t: "Непрочитанные" },
  { k: "mention", t: "Упоминания" },
  { k: "task", t: "Задачи" },
  { k: "system", t: "Система" },
]

export function NotificationsPage() {
  const [unread, setUnread] = useState<number[]>([1, 2, 3])
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("all")
  const [q, setQ] = useState("")
  const list = NOTICES.filter(
    (n) =>
      (tab === "all" || (tab === "unread" ? unread.includes(n.id) : n.kind === tab)) &&
      `${n.text} ${n.meta}`.toLowerCase().includes(q.trim().toLowerCase()),
  )
  return (
    <div className="mx-auto max-w-[1100px] px-(--page-gutter) pb-10">
      <AccountHero crumb="Профиль" title="Уведомления" sub={`${unread.length} непрочитанных · хранятся 30 дней`}>
        <button type="button" className={btn()} onClick={() => setUnread([])} disabled={!unread.length}>
          <CheckCheck />
          Прочитать все
        </button>
        <Link href="/settings#notifications" className={btn()}>
          <Settings />
          Настройки
        </Link>
      </AccountHero>
      <div className="flex flex-wrap items-center gap-2.5">
        {TABS.map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            className={cn(
              "h-10 rounded-full border border-border px-4 text-[13px]",
              tab === t.k ? "border-[#085eff] bg-[rgba(8,94,255,0.18)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.t}
            {t.k === "unread" && unread.length > 0 && <em className="ml-1.5 rounded-full bg-[#085eff] px-1.5 text-[11px] text-white not-italic">{unread.length}</em>}
          </button>
        ))}
        <Input icon={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по уведомлениям…" className="ml-auto h-10 w-[280px] rounded-full max-sm:w-full" />
      </div>
      <section className={cn(glass, "mt-[18px] overflow-hidden")}>
        {(["Сегодня", "Вчера"] as const).map((day) => {
          const items = list.filter((n) => n.day === day)
          if (!items.length) return null
          return (
            <div key={day}>
              <p className="border-b border-border px-5 py-2.5 text-[11.5px] font-semibold tracking-[1px] text-muted-foreground uppercase">{day}</p>
              {items.map((n) => {
                const isNew = unread.includes(n.id)
                return (
                  <div key={n.id} className={cn("relative flex gap-4 border-b border-border px-5 py-4 last:border-0", isNew && "bg-[color-mix(in_srgb,#085eff_6%,transparent)]")}>
                    {n.author ? (
                      <span className="grid size-10 flex-none place-items-center rounded-full bg-[linear-gradient(135deg,#085eff,#001a9f)] text-[13px] font-bold text-white">
                        {n.author}
                      </span>
                    ) : (
                      n.icon && (
                        <span className="grid size-10 flex-none place-items-center rounded-xl" style={{ color: n.tone, background: `color-mix(in srgb, ${n.tone} 14%, transparent)` }}>
                          <n.icon className="size-[18px]" />
                        </span>
                      )
                    )}
                    <div className="min-w-0 flex-1 pr-6">
                      <Link href={n.href} onClick={() => setUnread((u) => u.filter((x) => x !== n.id))} className="block text-[14px] leading-[1.5] text-[var(--mg-text)]">
                        <Rich text={n.text} />
                      </Link>
                      <span className="mt-1 block text-xs text-muted-foreground">{n.meta}</span>
                      {n.actions && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {n.actions.map((a) => (
                            <Link key={a.title} href={a.href} className={btn({ sm: true })}>
                              <a.icon />
                              {a.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnread((u) => (isNew ? u.filter((x) => x !== n.id) : [...u, n.id]))}
                      title={isNew ? "Отметить прочитанным" : "Отметить непрочитанным"}
                      className="absolute top-5 right-5 grid size-5 place-items-center"
                    >
                      <i className={cn("size-[8px] rounded-full", isNew ? "bg-[#085eff]" : "border border-border")} />
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}
        {!list.length && <p className="py-14 text-center text-sm text-muted-foreground">Уведомлений нет</p>}
      </section>
    </div>
  )
}
