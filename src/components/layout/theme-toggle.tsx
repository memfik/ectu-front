"use client"

import { Moon, Sun } from "lucide-react"
import { GlassButton } from "@/components/ui/opaline/glass-button"
import { useThemeTransition } from "@/hooks/use-theme-transition"

export function ThemeToggle() {
  const { toggleTheme } = useThemeTransition()
  return (
    <GlassButton size="sm" onClick={(e) => toggleTheme(e)} aria-label="Сменить тему">
      <Sun className="hidden size-4 dark:block" strokeWidth={1.75} />
      <Moon className="size-4 dark:hidden" strokeWidth={1.75} />
    </GlassButton>
  )
}
