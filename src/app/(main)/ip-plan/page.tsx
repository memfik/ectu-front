import { IpPlanPage } from "@/sections/ip-plan/page"
import { RoleGate } from "@/components/shared/states"

export const metadata = { title: "Единый IP-план — ЕСТУ" }

export default function Page() {
  return (
    <RoleGate section="Единый IP-план" roles={["admin", "ip_manager"]}>
      <IpPlanPage />
    </RoleGate>
  )
}
