import { Suspense } from "react"
import type { Metadata } from "next"
import { ProspectPassport } from "@/sections/prospects/passport"

export const metadata: Metadata = { title: "Потенциальные клиенты · паспорт — ЕСТУ" }

type Props = PageProps<"/prospects/[id]">

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
  return <ProspectPassport id={+id} />
}
