import { Suspense } from "react"
import { SummaryFilesPage } from "@/sections/summary-files/page"

export const metadata = { title: "Сводные файлы — ЕСТУ" }

export default function Page() {
  return (
    <Suspense>
      <SummaryFilesPage />
    </Suspense>
  )
}
