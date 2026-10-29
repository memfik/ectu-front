import { Header } from "@/components/layout/header"
import { Toaster } from "@/components/shared/toast"

/**
 * Каркас страниц ошибок (404) вне группы (main): шапка с меню остаётся под рукой, фон — плывущие синие пятна,
 * без проверки входа и уведомлений.
 */
export function ErrorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="nf-bg" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <Header />
      <main className="relative z-[1] flex-1 overflow-x-clip pb-16">{children}</main>
      <Toaster />
    </>
  )
}
