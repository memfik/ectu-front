import { Suspense } from "react"
import type { Metadata } from "next"
import { EntityPassport } from "@/components/passport/entity-passport"

export const metadata: Metadata = { title: "ЗССС SkyEdge II GEO · паспорт — ЕСТУ" }

type Props = PageProps<"/vsat/[id]">

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
  return <EntityPassport section="vsat" id={+id} />
}
