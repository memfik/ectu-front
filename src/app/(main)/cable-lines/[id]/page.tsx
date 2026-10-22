import { Suspense } from "react"
import type { Metadata } from "next"
import { KlsPassport } from "@/sections/cable-lines/passport"

export const metadata: Metadata = { title: "КЛС · паспорт — ЕСТУ" }

type Props = PageProps<"/cable-lines/[id]">

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
  return <KlsPassport id={+id} />
}
