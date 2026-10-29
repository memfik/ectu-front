"use client"

import { Unit1U } from "@/components/passport/chassis"
import { pdhE1, type PdhDevice } from "@/lib/api/pdh"

/** Передняя панель PDH (макет 22): 1U с портами E1 и Ethernet, выноски E1 и оптического линка. */
export function PdhPanel({ x }: { x: PdhDevice }) {
  const { z, m } = pdhE1(x)
  const shown = Math.min(m, 8)
  return (
    <Unit1U
      title="PDH"
      sub={String(x.f.model ?? "")}
      left={`${x.f.model} · 1U`}
      right={`S/N ${x.f.serial ?? x.f.client ?? "—"}`}
      groups={[
        { label: "E1 · RJ-48", ports: Array.from({ length: shown }, (_, i) => (i < z ? "up" : "free")) },
        { label: "ETH 10/100", ports: ["up"] },
      ]}
      callouts={[
        { t: `E1 · порты 1–${Math.max(1, z)}`, v: `задействовано ${z} из ${m}`, pct: (z / m) * 100, at: 14 },
        { t: "Оптический линк · Tx / Rx", v: "1310 нм · одномод", at: 72 },
      ]}
    />
  )
}
