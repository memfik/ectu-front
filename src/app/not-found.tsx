import type { Metadata } from "next"
import Link from "next/link"
import { House, Trash2 } from "lucide-react"
import { ErrorLayout } from "@/components/layout/error-layout"
import { btn } from "@/components/list/ui"

export const metadata: Metadata = { title: "Страница не найдена — ЕСТУ" }

/** 404 (макет 39, st-404) — неизвестный адрес. */
export default function NotFound() {
  return (
    <ErrorLayout>
      <section className="nf-rise flex max-w-[520px] flex-col items-center text-center">
        <p className="nf-float bg-[linear-gradient(180deg,#7fb0ff_0%,#085eff_70%)] bg-clip-text text-[clamp(120px,22vw,200px)] leading-none font-bold tracking-[-0.05em] text-transparent tabular-nums drop-shadow-[0_20px_60px_rgba(8,94,255,0.35)]">
          404
        </p>
        <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.4px]">Страница не найдена</h1>
        <p className="mt-2 text-[15px] text-[var(--nav-text)]">Ссылка устарела или адрес набран с ошибкой.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Link href="/" className={btn({ primary: true })}>
            <House />
            На главную
          </Link>
          <Link href="/trash" className={btn()}>
            <Trash2 />
            Корзина
          </Link>
        </div>
      </section>
    </ErrorLayout>
  )
}
