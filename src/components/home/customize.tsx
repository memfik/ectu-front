"use client"

import { createContext, use, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Camera,
  Check,
  ClipboardList,
  DatabaseBackup,
  Eye,
  EyeOff,
  Globe,
  GripVertical,
  LayoutDashboard,
  Map as MapIcon,
  Plus,
  RotateCcw,
  Shield,
  Users,
} from "lucide-react"
import { btn } from "@/components/list/ui"
import { Modal } from "@/components/passport/modal"
import { Card } from "@/components/passport/ui"
import { cn } from "@/lib/utils"

/*
 * Настройка главной (макет 06, home-02/03): скрыть виджет, вернуть и добавить новые — у каждого пользователя своя главная.
 * TODO(API): хранить в профиле пользователя (сейчас localStorage); перетаскивание и размер виджетов не сделаны.
 */

type Layout = { hidden: string[]; extra: string[] }
const STORE = "ectu.home-layout"
const EMPTY: Layout = { hidden: [], extra: [] }

const subscribe = (on: () => void) => {
  addEventListener("storage", on)
  addEventListener(STORE, on)
  return () => {
    removeEventListener("storage", on)
    removeEventListener(STORE, on)
  }
}
const read = () => {
  try {
    return localStorage.getItem(STORE) ?? ""
  } catch {
    return ""
  }
}
const parse = (raw: string): Layout => {
  try {
    return { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    return EMPTY
  }
}
const write = (l: Layout) => {
  try {
    localStorage.setItem(STORE, JSON.stringify(l))
  } catch {}
  dispatchEvent(new Event(STORE))
}

export function useHomeLayout() {
  const raw = useSyncExternalStore(subscribe, read, () => "")
  const layout = parse(raw)
  return {
    layout,
    toggle: (id: string) =>
      write({ ...layout, hidden: layout.hidden.includes(id) ? layout.hidden.filter((x) => x !== id) : [...layout.hidden, id] }),
    setExtra: (extra: string[], shown: string[]) => write({ hidden: layout.hidden.filter((x) => !shown.includes(x)), extra }),
    reset: () => write(EMPTY),
  }
}

type Ctx = { edit: boolean; hidden: string[]; toggle: (id: string) => void }
export const HomeEdit = createContext<Ctx>({ edit: false, hidden: [], toggle: () => {} })

/** Обёртка виджета: в режиме настройки — пунктир, ручка и «скрыть»; скрытый виджет виден только в режиме настройки. */
export function W({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { edit, hidden, toggle } = use(HomeEdit)
  const off = hidden.includes(id)
  if (off && !edit) return null
  if (!edit) return <div className={cn("min-w-0 [&>*]:h-full", className)}>{children}</div>
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-[26px] outline-2 outline-offset-2 outline-[#085eff]/45 outline-dashed [&>*]:h-full",
        className,
      )}
    >
      <div className={cn("transition-opacity", off && "pointer-events-none opacity-30")}>{children}</div>
      <span className="absolute -top-4 right-5 z-[2] flex gap-1.5">
        <span
          className="grid size-8 cursor-grab place-items-center rounded-full bg-[var(--dd-bg)] text-muted-foreground shadow"
          title="Перетаскивание — скоро"
        >
          <GripVertical className="size-4" />
        </span>
        <button
          type="button"
          onClick={() => toggle(id)}
          title={off ? "Показать" : "Скрыть"}
          className="grid size-8 place-items-center rounded-full bg-[var(--dd-bg)] text-muted-foreground shadow hover:text-foreground"
        >
          {off ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </div>
  )
}

/** Баннер режима настройки (home-02). */
export function EditBar({ onReset, onDone }: { onReset: () => void; onDone: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#085eff]/40 bg-[rgba(8,94,255,0.1)] px-4 py-3">
      <LayoutDashboard className="size-5" />
      <b className="text-sm font-semibold">Настройка главной</b>
      <span className="text-[12.5px] text-muted-foreground">
        Скрывайте лишнее и добавляйте виджеты · у каждого пользователя своя главная
      </span>
      <span className="ml-auto flex gap-2">
        <button type="button" className={btn({ sm: true })} onClick={onReset}>
          <RotateCcw />
          Сбросить
        </button>
        <button type="button" className={btn({ sm: true, primary: true })} onClick={onDone}>
          <Check />
          Готово
        </button>
      </span>
    </div>
  )
}

/** Виджеты окна «Добавить виджеты» (home-03): часть — уже на главной (скрываемые), часть — дополнительные. */
export const WIDGETS: { id: string; t: string; s: string; icon: LucideIcon; extra?: boolean }[] = [
  { id: "mybranch", t: "Мини-карта сети", s: "узлы и ВОЛС вашего филиала", icon: MapIcon },
  { id: "cameras", t: "Камеры", s: "6 избранных камер", icon: Camera },
  { id: "requests", t: "Заявки", s: "новые заявки на подключение", icon: ClipboardList },
  { id: "growth", t: "График роста", s: "узлы, оборудование, ВОЛС", icon: Activity },
  { id: "smartnet", t: "SmartNET", s: "истекающие контракты", icon: Shield, extra: true },
  { id: "backups", t: "Резервные копии", s: "результат ночного бэкапа", icon: DatabaseBackup, extra: true },
  { id: "ipplan", t: "IP-план", s: "занятость подсетей", icon: Globe, extra: true },
  { id: "funnel", t: "Воронка клиентов", s: "статусы потенциальных клиентов", icon: Users, extra: true },
]

export function AddWidgets({
  layout,
  onClose,
  onApply,
}: {
  layout: Layout
  onClose: () => void
  onApply: (extra: string[], shown: string[]) => void
}) {
  const on = (w: (typeof WIDGETS)[number]) => (w.extra ? layout.extra.includes(w.id) : !layout.hidden.includes(w.id))
  return (
    <Modal title="Добавить виджеты" icon={LayoutDashboard} width={640} onClose={onClose}>
      <AddForm key={JSON.stringify(layout)} initial={WIDGETS.filter(on).map((w) => w.id)} onClose={onClose} onApply={onApply} />
    </Modal>
  )
}

function AddForm({
  initial,
  onClose,
  onApply,
}: {
  initial: string[]
  onClose: () => void
  onApply: (extra: string[], shown: string[]) => void
}) {
  const [sel, setSel] = useState(initial)
  const added = sel.filter((id) => !initial.includes(id)).length
  return (
    <div className="px-6 pt-4 pb-6">
      <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
        {WIDGETS.map((w) => {
          const active = sel.includes(w.id)
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setSel(active ? sel.filter((x) => x !== w.id) : [...sel, w.id])}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors",
                active ? "border-[#085eff]/60 bg-[rgba(8,94,255,0.12)]" : "border-border hover:bg-[var(--nav-hover)]",
              )}
            >
              <span className="grid size-8 flex-none place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
                <w.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[13px] font-semibold">{w.t}</b>
                <span className="block truncate text-[11.5px] text-muted-foreground">{w.s}</span>
              </span>
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-md border",
                  active ? "border-[#085eff] bg-[#085eff] text-white" : "border-border",
                )}
              >
                {active && <Check className="size-3.5" />}
              </span>
            </button>
          )
        })}
      </div>
      <footer className="mt-6 flex justify-end gap-2.5">
        <button type="button" className={btn()} onClick={onClose}>
          Отмена
        </button>
        <button
          type="button"
          className={btn({ primary: true })}
          onClick={() => {
            onApply(
              sel.filter((id) => WIDGETS.find((w) => w.id === id)?.extra),
              sel.filter((id) => !WIDGETS.find((w) => w.id === id)?.extra),
            )
            onClose()
          }}
        >
          <Plus />
          {added ? `Добавить ${added}` : "Применить"}
        </button>
      </footer>
    </div>
  )
}

/** Дополнительные виджеты (цифры макета; TODO(API): SmartNET, бэкапы, IP-план, воронка). */
export function ExtraWidget({ id }: { id: string }) {
  const rows: Record<string, { icon: LucideIcon; t: string; href: string; items: [string, string, string?][] }> = {
    smartnet: {
      icon: Shield,
      t: "SmartNET",
      href: "/switches",
      items: [
        ["Истекают до конца года", "4", "#ffc24a"],
        ["Истекли", "1", "#ff5257"],
        ["Активные контракты", "1 212"],
      ],
    },
    backups: {
      icon: DatabaseBackup,
      t: "Резервные копии",
      href: "/backups",
      items: [
        ["Успешно", "1 284", "#2bd463"],
        ["С ошибкой", "16", "#ff5257"],
        ["Время", "сегодня, 03:00"],
      ],
    },
    ipplan: {
      icon: Globe,
      t: "IP-план",
      href: "/ip-plan",
      items: [
        ["Адресов занято", "71%", "#4f8dff"],
        ["Свободных подсетей /24", "38"],
        ["Не совпадает с Onyma", "12", "#ffc24a"],
      ],
    },
    funnel: {
      icon: Users,
      t: "Воронка клиентов",
      href: "/prospects",
      items: [
        ["Не обработан", "38 912", "#8c919b"],
        ["Обработан", "3 506", "#ffc24a"],
        ["Клиент", "662", "#2bd463"],
      ],
    },
  }
  const w = rows[id]
  if (!w) return null
  return (
    <Card icon={w.icon} title={w.t}>
      {w.items.map(([t, v, c]) => (
        <Link key={t} href={w.href} className="flex items-center justify-between border-b border-border py-2.5 text-[13px] last:border-0">
          <span className="flex items-center gap-2 text-muted-foreground">
            {c && <i className="size-2 rounded-full" style={{ background: c }} />}
            {t}
          </span>
          <b className="font-semibold tabular-nums">{v}</b>
        </Link>
      ))}
    </Card>
  )
}
