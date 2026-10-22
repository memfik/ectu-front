"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, User } from "lucide-react"
import { Input } from "@/components/list/form-controls"
import { btn, checkBox } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { apiOn } from "@/lib/api/client"
import { login, logout } from "@/lib/api/session"
import { cn } from "@/lib/utils"

/**
 * Вход (макет 39, экран auth): слева карта сети и цифры, справа форма.
 * POST /api/login { username, password } → token (как techaccaunt_front/src/views/Login.vue).
 */
export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/"
  // «Выйти» в шапке ведёт сюда с ?logout=1
  const out = params.get("logout") === "1"
  useEffect(() => {
    if (out) logout()
  }, [out])
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiOn()) return router.replace(next)
    if (!username.trim() || !password) return setError("Введите логин и пароль")
    setBusy(true)
    setError("")
    try {
      await login(username.trim(), password, remember)
      router.replace(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-[1.6fr_1fr] bg-background max-lg:grid-cols-1">
      <section className="relative overflow-hidden px-20 py-24 max-lg:hidden">
        <div aria-hidden className="absolute inset-0 bg-cover bg-[position:40%_45%]" style={{ backgroundImage: "url(/home/hero.jpg)" }} />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,11,14,0.2),rgba(10,11,14,0.85)_85%)]" />
        <div className="relative flex h-full flex-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="QMobile" className="h-12 w-auto self-start" />
          <div className="mt-auto">
            <h1 className="max-w-[760px] text-[64px] leading-[1.05] font-semibold tracking-[-1.6px] text-white">ЕСТУ — единая система технического учёта</h1>
            <p className="mt-5 max-w-[520px] text-lg text-white/70">Вся сеть QMobile в одном месте: узлы, оборудование, линии, клиенты и карта.</p>
            {/* TODO(API): цифры — /api/count/statistics */}
            <div className="mt-10 flex flex-wrap gap-x-12 gap-y-4">
              {[
                ["1 387", "узлов связи в системе"],
                ["6 214", "единиц оборудования"],
                ["97%", "заполненность карты"],
                ["99,9%", "доступность по филиалам"],
              ].map(([v, t]) => (
                <span key={t}>
                  <b className="block text-[34px] font-medium text-white tabular-nums">{v}</b>
                  <span className="text-[13px] text-white/60">{t}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid place-items-center border-l border-border px-6 py-16">
        <form onSubmit={submit} className="w-[480px] max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="QMobile" className="mb-10 hidden h-10 max-lg:dark:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="QMobile" className="mb-10 hidden h-10 max-lg:block max-lg:dark:hidden" />
          <h2 className="text-[32px] font-semibold tracking-[-0.5px]">Вход в ЕСТУ</h2>
          <p className="mt-2 text-sm text-muted-foreground">Используйте корпоративную учётную запись</p>
          {!apiOn() && (
            <p className="mt-4 rounded-xl bg-[rgba(255,159,26,0.12)] px-3.5 py-2.5 text-[13px] text-[var(--status-nolink)]">
              Адрес API не задан (NEXT_PUBLIC_API_URL) — фронт работает на примерных данных, «Войти» просто откроет систему.
            </p>
          )}
          <label className="mt-6 block text-[13.5px] font-medium">
            Логин
            <Input
              icon={<User />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.example@qmobile.kz"
              autoComplete="username"
              autoFocus
              invalid={!!error && !username}
              className="mt-2 h-12"
            />
          </label>
          <label className="mt-5 block text-[13.5px] font-medium">
            Пароль
            <Input
              icon={<Lock />}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              invalid={!!error && !password}
              className="mt-2 h-12"
            />
          </label>
          <div className="mt-4 flex items-center justify-between text-[13.5px]">
            <button type="button" role="checkbox" aria-checked={remember} onClick={() => setRemember(!remember)} className="flex items-center gap-2.5">
              <span className={checkBox(remember)} />
              Запомнить меня
            </button>
            {/* TODO(API): восстановление пароля — в старом API нет; пароль меняется через службу поддержки */}
            <button type="button" className="text-[var(--link)]" onClick={() => toast("Восстановление пароля — через службу поддержки, вн. 1100")}>
              Забыли пароль?
            </button>
          </div>
          {error && <p className="mt-3 text-[13px] text-[#ff5257]">{error}</p>}
          <button type="submit" disabled={busy} className={cn(btn({ primary: true }), "mt-6 h-[52px] w-full justify-center text-[15px]")}>
            {busy ? "Входим…" : "Войти"}
          </button>
          <p className="mt-10 text-center text-[13px] text-muted-foreground">Проблемы со входом — служба поддержки, вн. 1100</p>
        </form>
      </section>
    </main>
  )
}
