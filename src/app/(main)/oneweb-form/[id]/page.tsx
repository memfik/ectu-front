import { Suspense } from "react"
import type { Metadata } from "next"
import { OnewebFormPassport } from "@/sections/oneweb-form/passport"

export const metadata: Metadata = { title: "Станция OneWeb · паспорт — ЕСТУ" }

type Props = PageProps<"/oneweb-form/[id]">

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
  return <OnewebFormPassport id={+id} />
}
