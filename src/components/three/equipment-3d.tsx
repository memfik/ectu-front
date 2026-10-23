"use client"

import dynamic from "next/dynamic"

/** 3D-модель оборудования без SSR (WebGL только в браузере). Пока грузится — `fallback` (картинка из макета). */
export const Equipment3D = dynamic(() => import("./viewer"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse rounded-3xl bg-[var(--chip-bg)] opacity-40" />,
})
export type { ModelKey } from "./viewer"
