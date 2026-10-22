import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { LiquidGlassProvider } from "@/components/ui/opaline/liquid-glass"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "ЕСТУ — QMobile",
  description: "Единая система технического учёта",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${inter.variable} dark h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-[family-name:var(--font-inter)]">
        <ThemeProvider>
          <LiquidGlassProvider>{children}</LiquidGlassProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
