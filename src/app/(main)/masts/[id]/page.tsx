import { Suspense } from "react"
import type { Metadata } from "next"
import { AmsPassport } from "@/sections/masts/passport"

export const metadata: Metadata = { title: "АМС · паспорт — ЕСТУ" }

type Props = PageProps<"/masts/[id]">

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
  return <AmsPassport id={+id} />
}
