import { Suspense } from "react"
import type { Metadata } from "next"
import { LandPassport } from "@/sections/land-plots/passport"

export const metadata: Metadata = { title: "Земельный участок · паспорт — ЕСТУ" }

type Props = PageProps<"/land-plots/[id]">

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
  return <LandPassport id={+id} />
}
