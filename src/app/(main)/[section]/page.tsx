import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ALL_SECTIONS, findSection, groupOf } from "@/config/nav"
import { PageHero } from "@/components/shared/page-hero"

export function generateStaticParams() {
  return ALL_SECTIONS.map((s) => ({ section: s.slug }))
}

/** Заглушка раздела, у которого ещё нет своей папки в src/sections и маршрута (номер = файл макета). */
export default function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  return (
    <Suspense fallback={<PageHero title="" crumbs={[]} />}>
      <SectionContent params={params} />
    </Suspense>
  )
}

async function SectionContent({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
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
