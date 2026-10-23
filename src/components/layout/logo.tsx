import Link from "next/link"

/** Логотип по теме: белый на тёмной, чёрный на светлой. Рядом — «ЕСТУ» и версия, как в макете 01. */
export function Logo() {
  return (
    <Link href="/" aria-label="ЕСТУ — на главную" className="flex flex-none items-center gap-3 justify-self-start">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.png" alt="QMobile" className="hidden h-7 w-auto sm:h-9 dark:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-black.png" alt="QMobile" className="h-7 w-auto sm:h-9 dark:hidden" />
      <i className="block h-[30px] w-px bg-[var(--dd-line)] max-sm:hidden" />
      <span className="leading-[1.1] whitespace-nowrap max-sm:hidden">
        <b className="block text-xl font-bold tracking-[-0.3px]">ЕСТУ</b>
        <span className="text-[11.5px] tracking-[0.4px] text-muted-foreground">v6.1</span>
      </span>
    </Link>
  )
}
