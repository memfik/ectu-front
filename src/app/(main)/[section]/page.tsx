import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ALL_SECTIONS, findSection, groupOf } from "@/config/nav"
import { PageHero } from "@/components/shared/page-hero"
import { ListPage } from "@/components/list/list-page"
import { SPECS } from "@/config/registry/specs"

export function generateStaticParams() {
  return ALL_SECTIONS.map((s) => ({ section: s.slug }))
}

/** Раздел из конструктора (config/registry) — шаблон «Список»; остальные — заглушка до переноса макета. */
export default function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  return (
    <Suspense fallback={<PageHero title="" crumbs={[]} />}>
      <SectionContent params={params} />
    </Suspense>
  )
}

async function SectionContent({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (SPECS.some((x) => x.key === section)) return <ListPage list={section} />
  const s = findSection(section)
  if (!s) notFound()
  const group = groupOf(s.slug)
  return (
    <>
      <PageHero title={s.title} crumbs={group ? [group.title] : []} />
      <p className="px-[var(--page-gutter)] text-sm text-muted-foreground">
        Раздел в разработке · макет {s.num}
      </p>
    </>
  )
}
