"use client"

import { bwaKind } from "@/sections/lines/bwa"
import { LinePassport } from "@/sections/lines/passport"
import { list, spec } from "./config"

const K = bwaKind(spec, list, { km: 15, band: 1, vendor: "Ubiquiti Networks" })

/** Паспорт БШД WLL (макет 29). */
export function WllPassport({ id }: { id: number }) {
  return <LinePassport k={K} id={id} />
}
