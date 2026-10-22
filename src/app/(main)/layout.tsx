import { Header } from "@/components/layout/header"
import { Toaster } from "@/components/shared/toast"
import { AuthGate } from "@/components/auth/auth-gate"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthGate />
      <Header />
      <main className="flex-1 overflow-x-clip pb-16">{children}</main>
      <Toaster />
    </>
  )
}
