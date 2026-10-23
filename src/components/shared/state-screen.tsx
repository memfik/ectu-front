import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Экран состояния (макет 39: st-empty, st-404, st-403, st-503, st-offline): значок в кольцах, крупный код,
 * заголовок, пояснение и кнопки.
 */
export function StateScreen({
  icon: Icon,
  code,
  title,
  text,
  children,
  className,
}: {
  icon: LucideIcon
  code?: string
  title: string
  text: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative flex flex-col items-center px-6 py-20 text-center", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(520px_320px_at_50%_35%,rgba(8,94,255,0.16),transparent_70%)]"
      />
      <span className="grid size-[104px] place-items-center rounded-full border border-[#085eff]/15">
        <span className="grid size-[76px] place-items-center rounded-full border border-[#085eff]/30 bg-[radial-gradient(circle,rgba(8,94,255,0.32),rgba(8,94,255,0.08))] text-[#9cc0ff] shadow-[0_0_40px_rgba(8,94,255,0.25)]">
          <Icon className="size-7" strokeWidth={1.6} />
        </span>
      </span>
      {code && (
        <b className="mt-4 bg-[linear-gradient(180deg,#d6dae2,#5d626c)] bg-clip-text font-mono text-[128px] leading-none font-bold tracking-[-4px] text-transparent max-sm:text-[88px]">
          {code}
        </b>
      )}
      <h1 className={cn("text-[26px] font-semibold tracking-[-0.4px]", code ? "mt-4" : "mt-6")}>{title}</h1>
      <p className="mt-3 max-w-[460px] text-[14px] leading-relaxed text-muted-foreground">{text}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-2.5">{children}</div>}
    </div>
  )
}
