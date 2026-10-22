import { Suspense } from "react"
import type { Metadata } from "next"
import { DwdmPassport } from "@/sections/dwdm/passport"

export const metadata: Metadata = { title: "DWDM · паспорт — ЕСТУ" }

type Props = PageProps<"/dwdm/[id]">

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
  return <DwdmPassport id={+id} />
}
