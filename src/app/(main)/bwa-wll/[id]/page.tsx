import { Suspense } from "react"
import type { Metadata } from "next"
import { WllPassport } from "@/sections/bwa-wll/passport"

export const metadata: Metadata = { title: "БШД WLL · паспорт — ЕСТУ" }

type Props = PageProps<"/bwa-wll/[id]">

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
  return <WllPassport id={+id} />
}
