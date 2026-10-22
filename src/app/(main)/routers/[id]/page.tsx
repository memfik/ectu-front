import { Suspense } from "react"
import type { Metadata } from "next"
import { SpdPassport } from "@/sections/spd/passport"

export const metadata: Metadata = { title: "Паспорт маршрутизатора — ЕСТУ" }

type Props = PageProps<"/routers/[id]">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function RouterPage({ params }: Props) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<Props, "params">) {
  const { id } = await params
  return <SpdPassport kind="router" id={+id} />
}
