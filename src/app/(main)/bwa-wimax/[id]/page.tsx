import { Suspense } from "react"
import type { Metadata } from "next"
import { WimaxPassport } from "@/sections/bwa-wimax/passport"

export const metadata: Metadata = { title: "БШД WiMAX · паспорт — ЕСТУ" }

type Props = PageProps<"/bwa-wimax/[id]">

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
  return <WimaxPassport id={+id} />
}
