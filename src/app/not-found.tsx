import type { Metadata } from "next"
import Link from "next/link"
import { House, Trash2 } from "lucide-react"
import { ErrorLayout } from "@/components/layout/error-layout"
import { btn } from "@/components/list/ui"
import { LiquidGlass } from "@/components/ui/opaline/liquid-glass"
import { groupItems, NAV_GROUPS } from "@/config/nav"

export const metadata: Metadata = { title: "Страница не найдена — ЕСТУ" }

/** 404 (макет 39, st-404) — неизвестный адрес: свой каркас, крупная «404» и разделы всех групп меню. */
export default function NotFound() {
  return (
    <ErrorLayout>
      <section className="nf-rise px-(--page-gutter) pt-20 pb-12 text-center max-sm:pt-12">
        <p className="nf-float bg-[linear-gradient(180deg,#5b9bff,#085eff)] bg-clip-text text-[148px] leading-none font-bold tracking-[-6px] text-transparent tabular-nums max-sm:text-[96px]">
          404
        </p>
        <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.6px] max-sm:text-2xl">Страница не найдена</h1>
        <p className="mx-auto mt-2 max-w-[480px] text-[15px] text-[var(--nav-text)]">
          Возможно, ссылка устарела или запись удалена. Вернитесь на главную, загляните в Корзину или выберите раздел ниже.
        </p>
        <div className="mt-7 flex justify-center gap-2.5">
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

      <section className="mx-auto grid max-w-[1320px] grid-cols-3 gap-4 px-(--page-gutter) max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
        {NAV_GROUPS.map((g, i) => {
          const items = groupItems(g).filter((x) => x.section)
          return (
            <LiquidGlass
              key={g.key}
              bezel={14}
              className="nf-rise block rounded-3xl px-[22px] py-5 max-sm:px-4"
              // карточки появляются по очереди, после заголовка
              style={{ animationDelay: `${150 + i * 70}ms` }}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-[11px] bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
                  <g.icon className="size-[18px]" />
                </span>
                <b className="text-base font-semibold">{g.title}</b>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">{items.length}</span>
              </div>
              <ul className="flex flex-col gap-0.5">
                {items.slice(0, 6).map((x) => (
                  <li key={x.href}>
                    <Link href={x.href} className="group -mx-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-[13.5px] transition-colors hover:bg-[var(--nav-hover)]">
                      <x.icon className="size-4 flex-none text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#085eff] motion-reduce:transition-none" />
                      <span className="truncate">{x.title}</span>
                      {x.section && <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{x.section.num}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </LiquidGlass>
          )
        })}
      </section>
    </ErrorLayout>
  )
}
