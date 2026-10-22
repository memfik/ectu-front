"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiOn, token } from "@/lib/api/client"
import { loadSession } from "@/lib/api/session"

/** В режиме API без токена — на /login; с токеном — подгружает профиль и филиалы. */
export function AuthGate() {
  const router = useRouter()
  useEffect(() => {
    if (!apiOn()) return
    if (!token.get()) router.replace(`/login?next=${encodeURIComponent(location.pathname)}`)
    else loadSession()
  }, [router])
  return null
}
