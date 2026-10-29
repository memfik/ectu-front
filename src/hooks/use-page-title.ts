"use client"

import { useEffect } from "react"

/** Заголовок вкладки браузера для клиентской страницы (у неё не может быть `export const metadata`). */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — ЕСТУ`
  }, [title])
}
