"use client"

import { bwaKind } from "@/sections/lines/bwa"
import { LinePassport } from "@/sections/lines/passport"
import { list, spec } from "./config"

const K = bwaKind(spec, list, { km: 6, band: 7, vendor: "Alvarion" })

/** Паспорт БШД WiMAX (макет 27). */
export function WimaxPassport({ id }: { id: number }) {
  return <LinePassport k={K} id={id} />
}
