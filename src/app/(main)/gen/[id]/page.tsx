import { Suspense } from "react"
import type { Metadata } from "next"
import { GenPassport } from "@/sections/gen/passport"

export const metadata: Metadata = { title: "ГЭУ · паспорт — ЕСТУ" }

type Props = PageProps<"/gen/[id]">

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
  return <GenPassport id={+id} />
}
