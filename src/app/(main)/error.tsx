"use client"

import { UnavailableState } from "@/components/shared/states"

/** Ошибка страницы или API — экран 503 из макета 39. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <UnavailableState onRetry={reset} />
}
