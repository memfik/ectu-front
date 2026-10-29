"use client"

import { Radio } from "lucide-react"
import { RadioPanel, RadioSpan } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { RADIO_BRIDGE_CLIENT, RADIO_BRIDGE_RCS, RADIO_BRIDGE_TX, radioBridgeLen, radioBridgeMbps, type RadioBridge } from "@/lib/api/radio-bridges"

/*
 * Радиомост в паспорте (макет 26): «Панель» — PoE-адаптер и радиоблок, «Трасса» — пролёт до клиента, вкладка «Частоты».
 * TODO(API): частоты, сигнал, РЧС, клиент — нет в /api/radio-bridges.
 */

/** PoE-адаптер в узле и радиоблок. */
export function RadioBridgePanel({ x }: { x: RadioBridge }) {
  return (
    <RadioPanel
      left={String(x.f.model)}
      right={String(x.f.bw)}
      indoor={{
        t: "PoE",
        sub: "Gigabit PoE 24V",
        groups: [
          { label: "LAN", ports: [true] },
          { label: "POE", ports: [true] },
        ],
      }}
      outdoor={{
        t: "Радиомост",
        sub: String(x.f.model),
        lines: ["SIGNAL  -56 dBm", "CCQ      98 %", `CAP      ${radioBridgeMbps(x)} Mbps`, `DIST     ${radioBridgeLen(x).replace(",", ".")} km`],
        from: "УС",
        to: "клиент",
        len: "",
      }}
      notes={[{ t: "PoE-адаптер · LAN", v: "→ коммутатор узла", at: 10 }]}
    />
  )
}

/** Пролёт от узла до клиента. */
export function RadioBridgeSpan({ x }: { x: RadioBridge }) {
  return (
    <RadioSpan
      len={`${radioBridgeLen(x)} км`}
      bw={String(x.f.bw)}
      label="Радиомост · пропускная способность"
      tx={RADIO_BRIDGE_TX}
      a={`${x.nodeCode} · ${x.address.replace(/^(г\.|с\.) [^,]+, /, "")}`}
      b={`${RADIO_BRIDGE_CLIENT} · клиент`}
    />
  )
}

/** Вкладка «Частоты»: Tx1 / Tx2, разрешение РЧС. */
export function RadioBridgeFreq({ x }: { x: RadioBridge }) {
  return (
    <Card icon={Radio} title="Частоты и разрешение РЧС" className="max-w-[1200px]">
      <Kv
        rows={[
          { t: "Tx1, MHz", v: RADIO_BRIDGE_TX[0].toLocaleString("ru-RU") },
          { t: "Tx2, MHz", v: RADIO_BRIDGE_TX[1].toLocaleString("ru-RU") },
          { t: "Разрешение РЧС", v: RADIO_BRIDGE_RCS },
          { t: "Пропускная способность", v: String(x.f.bw ?? "—") },
        ]}
      />
    </Card>
  )
}
