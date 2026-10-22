import { Suspense } from "react"
import type { Metadata } from "next"
import { RrlPassport } from "@/sections/rrl/passport"

export const metadata: Metadata = { title: "РРЛ · паспорт — ЕСТУ" }

type Props = PageProps<"/rrl/[id]">

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
  return <RrlPassport id={+id} />
}
