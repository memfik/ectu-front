"use client"

import { Radio } from "lucide-react"
import { RadioPanel, RadioSpan } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { RRL_RCS, RRL_TX, rrlEnds, rrlMbps, type RrlSpan } from "@/lib/api/rrl"

/*
 * РРЛ в паспорте (макет 25): «Панель» — IDU и ODU с уровнем сигнала, «Трасса» — пролёт между мачтами, вкладка «Частоты».
 * TODO(API): Tx1/Tx2, RSL/SNR, РЧС — нет в /api/rrl.
 */

const street = (x: RrlSpan) => x.address.replace(/^(г\.|с\.) [^,]+, /, "")

/** IDU в аппаратной и ODU на мачте. */
export function RrlPanel({ x }: { x: RrlSpan }) {
  return (
    <RadioPanel
      left={String(x.f.model)}
      right={`${x.f.bw} · ${x.f.len} км`}
      indoor={{
        t: "IDU",
        sub: String(x.f.model),
        groups: [{ label: "GE · LAN", ports: [true, true, false, false] }],
        e1: true,
        odu: true,
      }}
      outdoor={{
        t: "ODU · на мачте",
        sub: `Tx1 ${RRL_TX.tx1} · Tx2 ${RRL_TX.tx2} MHz`,
        lines: ["RSL   -41.6 dBm", "SNR    31.2 dB", "MOD   256QAM", `CAP   ${rrlMbps(x)} Mbps`],
        from: "Точка #1",
        to: "Точка #2",
        len: `${x.f.len} км`,
      }}
      notes={[
        { t: "GE · LAN 1–2", v: "задействовано 2 из 4", pct: 50, at: 10 },
        { t: "ODU · IF кабель", v: "N-type → антенна на АМС", at: 70 },
      ]}
    />
  )
}

/** Пролёт между мачтами: точки А и Б, длина, частоты. */
export function RrlSpanSchema({ x }: { x: RrlSpan }) {
  return (
    <RadioSpan
      len={`${x.f.len} км`}
      bw={String(x.f.bw)}
      label="РРЛ · пропускная способность"
      tx={[RRL_TX.tx1, RRL_TX.tx2]}
      a={`${rrlEnds(x)[0] ?? x.nodeCode} · ${street(x)}`}
      b={rrlEnds(x)[1] ?? "—"}
    />
  )
}

/** Вкладка «Частоты»: Tx1 / Tx2, разрешение РЧС. */
export function RrlFreq({ x }: { x: RrlSpan }) {
  return (
    <Card icon={Radio} title="Частоты и разрешение РЧС" className="max-w-[1200px]">
      <Kv
        rows={[
          { t: "Tx1, MHz", v: RRL_TX.tx1.toLocaleString("ru-RU") },
          { t: "Tx2, MHz", v: RRL_TX.tx2.toLocaleString("ru-RU") },
          { t: "Разрешение РЧС", v: RRL_RCS },
          { t: "Пропускная способность", v: String(x.f.bw ?? "—") },
          { t: "Протяжённость трассы", v: `${x.f.len} км` },
        ]}
      />
    </Card>
  )
}
