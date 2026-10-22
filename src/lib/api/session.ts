"use client"

import { useSyncExternalStore } from "react"
import { CURRENT_USER } from "@/lib/current-user"
import { api, apiOn, token } from "./client"

/*
 * Сессия: пользователь (`/api/users/profile`) и филиалы (`/api/get-filials`).
 * В демо-режиме (без API) — пользователь из макета.
 */

export type Filial = { id: number; name: string; short_name: string }
type Profile = { name?: string; username?: string; email?: string; roles?: (string | { name: string })[]; permissions?: string[]; filials?: Filial[] }
export type User = typeof CURRENT_USER & { permissions: string[]; filials: Filial[] }

const DEMO: User = { ...CURRENT_USER, permissions: [], filials: [] }

let user: User | null = null
let filials: Filial[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l))

function fromProfile(p: Profile): User {
  const name = p.name ?? p.username ?? "Пользователь"
  const parts = name.split(/\s+/)
  return {
    initial: (parts[0]?.[0] ?? "?").toUpperCase(),
    login: p.username ?? "",
    name,
    email: p.email ?? "",
    roles: (p.roles ?? []).map((r) => (typeof r === "string" ? r : r.name)),
    branch: p.filials?.[0] ? `${p.filials[0].name}` : "",
    permissions: p.permissions ?? [],
    filials: p.filials ?? [],
  }
}

let loading: Promise<void> | null = null
/** Загрузить профиль и справочник филиалов (один раз за сессию). */
export function loadSession() {
  if (!apiOn() || !token.get()) return Promise.resolve()
  loading ??= Promise.all([
    api.get<Profile | { user: Profile }>("/api/users/profile").then((p) => {
      user = fromProfile("user" in p && p.user ? p.user : (p as Profile))
    }),
    api.get<{ filials?: Filial[] } | Filial[]>("/api/get-filials").then((d) => {
      filials = Array.isArray(d) ? d : (d.filials ?? [])
    }),
  ])
    .then(emit)
    .catch(() => {
      loading = null
    })
  return loading
}

export function useUser(): User {
  return useSyncExternalStore(
    subscribe,
    () => user ?? DEMO,
    () => DEMO
  )
}

/** Филиал по короткому коду («АС») → id в API. */
export const filialId = (short: string) => filials.find((f) => f.short_name === short)?.id
export const filialShort = (id: number | string | undefined) => filials.find((f) => String(f.id) === String(id))?.short_name

export async function login(username: string, password: string) {
  const r = await api.post<{ token?: string; user?: Profile }>("/api/login", { username, password })
  if (!r.token) throw new Error("Сервер не вернул токен")
  token.set(r.token)
  if (r.user) user = fromProfile(r.user)
  loading = null
  await loadSession()
  emit()
}

export async function logout() {
  try {
    await api.post("/api/logout")
  } catch {}
  token.set(null)
  user = null
  loading = null
  emit()
}
