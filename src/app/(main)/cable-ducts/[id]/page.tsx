import { Suspense } from "react"
import type { Metadata } from "next"
import { KkPassport } from "@/sections/cable-ducts/passport"

export const metadata: Metadata = { title: "Кабельная канализация · паспорт — ЕСТУ" }

type Props = PageProps<"/cable-ducts/[id]">

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
  return <KkPassport id={+id} />
}
