import { ListPage } from "@/components/list/list-page"
import { RoleGate } from "@/components/shared/states"

export const metadata = { title: "Клиенты Onyma — ЕСТУ" }

export default function Page() {
  return (
    <RoleGate section="Клиенты Onyma" roles={["admin", "ip_manager"]}>
      <ListPage list="onyma" />
    </RoleGate>
  )
}
