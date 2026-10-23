"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { ChevronLeft, FileX, House, Lock, RefreshCw, ServerCrash, Trash2, WifiOff } from "lucide-react"
import { btn } from "@/components/list/ui"
import { StateScreen } from "@/components/shared/state-screen"
import { toast } from "@/components/shared/toast"
import { useUser } from "@/lib/api/session"

/* Состояния из макета 39: 404, 403, 503, офлайн, загрузка. */

export function NotFoundState() {
  return (
    <StateScreen icon={FileX} code="404" title="Страница не найдена" text="Возможно, ссылка устарела или запись удалена. Проверьте Корзину или вернитесь на главную.">
      <Link href="/" className={btn({ primary: true })}>
        <House />
        На главную
      </Link>
      <Link href="/trash" className={btn()}>
        <Trash2 />
        Корзина
      </Link>
    </StateScreen>
  )
}

export function ForbiddenState({ section, roles }: { section: string; roles: string[] }) {
  return (
    <StateScreen
      icon={Lock}
      code="403"
      title="Нет доступа"
      text={`Раздел «${section}» доступен ролям ${roles.join(" и ")}. Обратитесь к администратору ЕСТУ.`}
    >
      {/* TODO(API): заявка на доступ */}
      <button type="button" className={btn({ primary: true })} onClick={() => toast("Запрос доступа отправлен администратору ЕСТУ")}>
        Запросить доступ
      </button>
      <Link href="/" className={btn()}>
        <House />
        На главную
      </Link>
    </StateScreen>
  )
}

export function UnavailableState({ onRetry }: { onRetry: () => void }) {
  return (
    <StateScreen
      icon={ServerCrash}
      code="503"
      title="Сервис временно недоступен"
      text="Идут технические работы или сервер не ответил. Данные не потеряны — попробуйте обновить страницу позже."
    >
      <button type="button" className={btn({ primary: true })} onClick={onRetry}>
        <RefreshCw />
        Обновить
      </button>
    </StateScreen>
  )
}

/** Раздел только для ролей (как замок в меню): у остальных — экран 403. */
export function RoleGate({ section, roles, children }: { section: string; roles: string[]; children: React.ReactNode }) {
  const user = useUser()
  if (!roles.some((r) => user.roles.includes(r))) return <ForbiddenState section={section} roles={roles} />
  return children
}

const subscribe = (on: () => void) => {
  addEventListener("online", on)
  addEventListener("offline", on)
  return () => {
    removeEventListener("online", on)
    removeEventListener("offline", on)
  }
}

/** Нет сети — экран поверх страницы (st-offline); пропадает сам, когда связь вернётся. */
export function OfflineScreen() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  if (online) return null
  return (
    <div className="fixed inset-x-0 top-[88px] bottom-0 z-[55] bg-background/95 backdrop-blur-sm">
      <StateScreen
        icon={WifiOff}
        title="Нет подключения к интернету"
        text="Изменения сохранятся, когда связь появится. Показаны последние загруженные данные."
        className="pt-32"
      >
        <button type="button" className={btn({ primary: true })} onClick={() => location.reload()}>
          <RefreshCw />
          Повторить
        </button>
      </StateScreen>
    </div>
  )
}

/** Паспорт: записи нет (удалена или неверный id) — 404 с возвратом к списку раздела. */
export function RecordNotFound({ title, href, back }: { title: string; href: string; back: string }) {
  return (
    <StateScreen icon={FileX} code="404" title={title} text="Возможно, запись удалена или ссылка устарела. Проверьте Корзину или вернитесь к списку.">
      <Link href={href} className={btn({ primary: true })}>
        <ChevronLeft />
        {back}
      </Link>
      <Link href="/trash" className={btn()}>
        <Trash2 />
        Корзина
      </Link>
    </StateScreen>
  )
}
