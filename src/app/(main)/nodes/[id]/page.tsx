import { Suspense } from "react"
import type { Metadata } from "next"
import { NodePassport } from "@/sections/nodes/passport"

export const metadata: Metadata = { title: "Паспорт узла связи — ЕСТУ" }

type Props = PageProps<"/nodes/[id]">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function NodePage({ params }: Props) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<Props, "params">) {
  const { id } = await params
  return <NodePassport id={+id} />
}
