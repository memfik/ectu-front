import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = { title: "Вход — ЕСТУ" }

/** Вход в ЕСТУ (логин техучёта). Макет 39 «Вход и состояния» — TODO: перенести оформление. */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
