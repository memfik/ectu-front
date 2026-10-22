import { Suspense } from "react"
import { MapPage } from "@/components/map/map-page"

export const metadata = { title: "Карта сети — ЕСТУ" }

/** Параметры (?node=, ?layer=) читаются в Suspense (cacheComponents). */
export default function NetworkMapPage() {
  return (
    <Suspense>
      <MapPage />
    </Suspense>
  )
}
