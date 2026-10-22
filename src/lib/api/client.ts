/*
 * Клиент API техучёта (как apiClient в ../techaccaunt_front/src/services/axios.js):
 * Bearer-токен из localStorage, ответ `{ success, data }` разворачивается, 401/419 — выход на /login.
 * Без NEXT_PUBLIC_API_URL фронт работает на примерных данных (src/data).
 */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")
const TOKEN = "ectu:token"

/** Включён ли режим API: задан адрес бэкенда. */
export const apiOn = () => !!API_URL

/** Токен: «Запомнить меня» — localStorage, иначе sessionStorage (до закрытия вкладки). */
export const token = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN) ?? sessionStorage.getItem(TOKEN)
    } catch {
      return null
    }
  },
  set: (t: string | null, remember = true) => {
    try {
      localStorage.removeItem(TOKEN)
      sessionStorage.removeItem(TOKEN)
      if (t) (remember ? localStorage : sessionStorage).setItem(TOKEN, t)
    } catch {}
  },
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
  }
}

type Params = Record<string, unknown>

/** Параметры как у axios: массивы — `key[]=a&key[]=b`, пустые значения пропускаются. */
function query(params?: Params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null || v === "") continue
    if (Array.isArray(v)) v.forEach((x) => q.append(`${k}[]`, String(x)))
    else q.append(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ""
}

async function request<T>(method: string, path: string, opts: { params?: Params; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const t = token.get()
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData
  const res = await fetch(`${API_URL}${path}${query(opts.params)}`, {
    method,
    credentials: "include",
    signal: opts.signal,
    headers: {
      Accept: "application/json",
      ...(opts.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
    body: opts.body ? (isForm ? (opts.body as FormData) : JSON.stringify(opts.body)) : undefined,
  })
  if (res.status === 401 || res.status === 419) {
    token.set(null)
    // Вне React-дерева роутера нет — полная перезагрузка на /login
    if (typeof window !== "undefined" && !location.pathname.startsWith("/login"))
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      location.assign(`/login?next=${encodeURIComponent(location.pathname)}`)
    throw new ApiError("Сессия истекла", res.status)
  }
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.blob()
  if (!res.ok) {
    const msg = (data as { message?: string })?.message ?? `Ошибка сервера (${res.status})`
    throw new ApiError(msg, res.status, data)
  }
  // Автораспаковка ApiResponse: { success: true, data: … } → data
  if (data && typeof data === "object" && "success" in data && (data as { data?: unknown }).data !== undefined) return (data as { data: T }).data
  return data as T
}

export const api = {
  get: <T>(path: string, params?: Params, signal?: AbortSignal) => request<T>("GET", path, { params, signal }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
}

/** Страница списка Laravel: { data, total, last_page, from, current_page } */
export type Page<R> = { data: R[]; total: number; last_page?: number; from?: number; current_page?: number }
