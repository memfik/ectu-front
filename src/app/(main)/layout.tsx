import { Header } from "@/components/layout/header"
import { Toaster } from "@/components/shared/toast"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-x-clip pb-16">{children}</main>
      <Toaster />
    </>
  )
}
