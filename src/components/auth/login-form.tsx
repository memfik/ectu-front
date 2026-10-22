"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, LogIn, User } from "lucide-react"
import { Input } from "@/components/list/form-controls"
import { btn } from "@/components/list/ui"
import { apiOn } from "@/lib/api/client"
import { login, logout } from "@/lib/api/session"
import { cn } from "@/lib/utils"

/** Форма входа: POST /api/login { username, password } → token (как в techaccaunt_front/src/views/Login.vue). */
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
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return setError("Введите логин и пароль")
    setBusy(true)
    setError("")
    try {
      await login(username.trim(), password)
      router.replace(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(900px_500px_at_50%_0%,rgba(8,94,255,0.25),transparent_70%)] px-4">
      <form onSubmit={submit} className="w-[420px] max-w-full rounded-[28px] border border-border bg-[var(--glass-card)] p-8 backdrop-blur-[18px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt="QMobile" className="hidden h-9 dark:block" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-black.png" alt="QMobile" className="h-9 dark:hidden" />
        <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.5px]">Вход в ЕСТУ</h1>
        <p className="mt-1 text-sm text-muted-foreground">Единая система технического учёта · учётная запись техучёта</p>
        {!apiOn() && (
          <p className="mt-4 rounded-xl bg-[rgba(255,159,26,0.12)] px-3.5 py-2.5 text-[13px] text-[var(--status-nolink)]">
            Адрес API не задан (NEXT_PUBLIC_API_URL) — фронт работает на примерных данных, вход не нужен.
          </p>
        )}
        <label className="mt-6 block text-[13.5px] font-medium">
          Логин
          <Input icon={<User />} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus className="mt-2" />
        </label>
        <label className="mt-4 block text-[13.5px] font-medium">
          Пароль
          <span className="relative mt-2 block">
            <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Скрыть пароль" : "Показать пароль"} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        </label>
        {error && <p className="mt-3 text-[13px] text-[#ff5257]">{error}</p>}
        <button type="submit" disabled={busy || !apiOn()} className={cn(btn({ primary: true }), "mt-6 w-full justify-center")}>
          <LogIn />
          {busy ? "Входим…" : "Войти"}
        </button>
      </form>
    </main>
  )
}
