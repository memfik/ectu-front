import { Suspense } from "react"
import type { Metadata } from "next"
import { ChannelPassport } from "@/sections/channel-ids/passport"

export const metadata: Metadata = { title: "ID-каналы · паспорт — ЕСТУ" }

type Props = PageProps<"/channel-ids/[id]">

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
  return <ChannelPassport id={+id} />
}
