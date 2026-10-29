import { NextResponse, type NextRequest } from "next/server"

/** «Список устройств» для резервного копирования — те же устройства, что в «Резервных копиях» (макет 18). Настоящий 307, без страницы. */
export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/backups", req.url), 307)
}
