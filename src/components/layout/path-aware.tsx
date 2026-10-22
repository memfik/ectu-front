"use client"

import { Suspense, type ReactNode } from "react"
import { usePathname } from "next/navigation"

/*
 * С cacheComponents путь страницы с динамическим [id] неизвестен при пререндере, и usePathname()
 * без Suspense блокирует весь layout. Читаем путь внутри границы; fallback — та же разметка без активного пункта.
 */
export function PathAware({ render }: { render: (path: string | null) => ReactNode }) {
  return (
    <Suspense fallback={render(null)}>
      <Read render={render} />
    </Suspense>
  )
}

function Read({ render }: { render: (path: string | null) => ReactNode }) {
  return render(usePathname())
}

/** Путь относится к разделу (сам раздел или его запись). */
export const inSection = (path: string | null, href: string) => !!path && (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`))
