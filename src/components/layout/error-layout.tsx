/** Каркас страниц ошибок (404) вне группы (main): без шапки, по центру экрана, фон — плывущие синие пятна. */
export function ErrorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="nf-bg" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <main className="relative z-[1] grid min-h-dvh flex-1 place-items-center px-6 py-12">{children}</main>
    </>
  )
}
