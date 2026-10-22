import { Suspense } from "react"
import type { Metadata } from "next"
import { AtsPassport } from "@/sections/pbx/passport"

export const metadata: Metadata = { title: "АТС · паспорт — ЕСТУ" }

type Props = PageProps<"/pbx/[id]">

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
  return <AtsPassport id={+id} />
}
