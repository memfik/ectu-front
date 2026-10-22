import { Suspense } from "react"
import type { Metadata } from "next"
import { RadioBridgePassport } from "@/sections/radio-bridges/passport"

export const metadata: Metadata = { title: "Радиомосты · паспорт — ЕСТУ" }

type Props = PageProps<"/radio-bridges/[id]">

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
  return <RadioBridgePassport id={+id} />
}
