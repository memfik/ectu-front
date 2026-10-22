"use client"

import { bwaKind } from "@/sections/lines/bwa"
import { LinePassport } from "@/sections/lines/passport"
import { list, spec } from "./config"

const K = bwaKind(spec, list, { km: 8, band: 20, vendor: "Telrad Networks" })

/** Паспорт БШД Telrad LTE (макет 28). */
export function LtePassport({ id }: { id: number }) {
  return <LinePassport k={K} id={id} />
}
