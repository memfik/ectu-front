import { Suspense } from "react"
import { notFound } from "next/navigation"
import { EntityPassport } from "@/components/passport/entity-passport"
import { SPECS } from "@/config/registry/specs"

type Props = PageProps<"/[section]/[id]">

/** Паспорт записи раздела из конструктора (макеты 07…25). id известен только при запросе — читаем в Suspense. */
export default function EntityPage({ params }: Props) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<Props, "params">) {
  const { section, id } = await params
  if (!SPECS.some((s) => s.key === section)) notFound()
  return <EntityPassport section={section} id={+id} />
}
