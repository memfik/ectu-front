import { Suspense } from "react"
import type { Metadata } from "next"
import { OneWebPassport } from "@/sections/oneweb/passport"

export const metadata: Metadata = { title: "OneWeb LEO · паспорт — ЕСТУ" }

type Props = PageProps<"/oneweb/[id]">

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
  return <OneWebPassport id={+id} />
}
