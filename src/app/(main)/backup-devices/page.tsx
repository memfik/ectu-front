import { redirect } from "next/navigation"

/** «Список устройств» для резервного копирования — те же устройства, что в «Резервных копиях» (макет 18). */
export default function Page() {
  redirect("/backups")
}
