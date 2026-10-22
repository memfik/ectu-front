import { Suspense } from "react"
import type { Metadata } from "next"
import { OdfPassport } from "@/sections/odf/passport"

export const metadata: Metadata = { title: "ODF · паспорт — ЕСТУ" }

type Props = PageProps<"/odf/[id]">

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
  return <OdfPassport id={+id} />
}
