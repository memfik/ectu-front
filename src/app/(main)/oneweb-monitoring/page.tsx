import { OnewebMonitoringPage } from "@/sections/oneweb-monitoring/page"
import { RoleGate } from "@/components/shared/states"

export const metadata = { title: "Мониторинг OneWeb — ЕСТУ" }

export default function Page() {
  return (
    <RoleGate section="Мониторинг OneWeb" roles={["admin"]}>
      <OnewebMonitoringPage />
    </RoleGate>
  )
}
