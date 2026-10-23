import { Suspense } from "react"
import type { Metadata } from "next"
import { SparePassport } from "@/sections/spare-parts/passport"

export const metadata: Metadata = { title: "ЗИП · паспорт — ЕСТУ" }

type Props = PageProps<"/spare-parts/[id]">

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
  return <SparePassport id={+id} />
}
