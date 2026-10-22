import Link from "next/link"
import type { ReactNode } from "react"

export function PageHero({ title, crumbs = [], children }: { title: string; crumbs?: string[]; children?: ReactNode }) {
  return (
    <section className="px-[var(--page-gutter)] pt-8 pb-6">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        {crumbs.map((c) => <span key={c}> / {c}</span>)}
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {children && <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>}
    </section>
  )
}
