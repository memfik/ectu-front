import { Suspense } from "react"
import type { Metadata } from "next"
import { SdhPassport } from "@/sections/sdh/passport"

export const metadata: Metadata = { title: "SDH · паспорт — ЕСТУ" }

type Props = PageProps<"/sdh/[id]">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function Page({ params }: Props) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<Props, "params">) {
  const { id } = await params
  return <SdhPassport id={+id} />
}
