import { Suspense } from "react"
import type { Metadata } from "next"
import { NumberPassport } from "@/sections/number-capacity/passport"

export const metadata: Metadata = { title: "Номерная ёмкость · паспорт — ЕСТУ" }

type Props = PageProps<"/number-capacity/[id]">

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
  return <NumberPassport id={+id} />
}
