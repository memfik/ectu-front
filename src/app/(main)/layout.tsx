import { Header } from "@/components/layout/header"
import { Notifications, Toaster } from "@/components/shared/toast"
import { AuthGate } from "@/components/auth/auth-gate"
import { OfflineScreen } from "@/components/shared/states"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthGate />
      <Header />
      <main className="flex-1 overflow-x-clip pb-16">{children}</main>
      <OfflineScreen />
      <Toaster />
      <Notifications />
    </>
  )
}
