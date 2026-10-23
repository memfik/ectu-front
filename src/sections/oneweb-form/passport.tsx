"use client"

import { Activity, Globe, Hash, MapPin, Satellite, SatelliteDish } from "lucide-react"
import { RadioPanel, SatelliteLink } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { capBar, equipmentKind } from "@/sections/lines/equipment"
import type { GenRow } from "@/sections/make"
import { list, spec } from "./config"

/*
 * Станция OneWeb (макет 42): панель и «Спутник» — как у OneWeb LEO (32), вкладка «Мониторинг».
 * TODO(API): связность, трафик, простои, последний сигнал — из «Мониторинга OneWeb» (/api/oneweb/traffic-*), сейчас пример.
 */

const f = (x: GenRow, k: string) => String(x.f[k] ?? "—")
const UP = { work: 99.6, idle: 71.2, never: 0 } as Record<string, number>
const up = (x: GenRow) => UP[x.status] ?? 0
const pctStr = (v: number) => String(v).replace(".", ",")
const ll = (x: GenRow) =>
  f(x, "coords")
    .split(",")
    .map((v) => Number(v).toFixed(2))
    .join(", ")
const STATE: Record<string, string> = { work: "Работает", idle: "Простой", never: "Не запускалась" }

const OWM = equipmentKind({
  section: "oneweb-form",
  spec,
  list,
  pill: () => "LEO",
  panel: (c) => (
    <RadioPanel
      left="Hughes HL1100W"
      right={f(c.x, "station")}
      indoor={{ t: "Hughes HL1100W", sub: "панель 598 × 402 мм · ESA", groups: [{ label: "POE · LAN", ports: [c.x.status === "work"] }] }}
      outdoor={{
        t: "Связь",
        sub: "OneWeb LEO · хэндовер",
        lines:
          c.x.status === "work"
            ? ["LINK     UP", "SAT      0612 → 0617", "LATENCY  42 ms", `AVAIL    ${up(c.x)} %`]
            : ["LINK     DOWN", "SAT      —", "LATENCY  —", `AVAIL    ${up(c.x)} %`],
        from: "терминал",
        to: "LEO 1 200 км",
        len: "",
      }}
      notes={[
        { t: "Плоская антенна ESA", v: "луч переключается между спутниками", at: 24 },
        { t: "PoE · LAN", v: "→ Wi-Fi точка доступа", at: 74 },
      ]}
    />
  ),
  schema: (c) => (
    <SatelliteLink
      orbit="Низкая орбита · OneWeb LEO 1 200 км"
      up="Inbound CIR 20 / MIR 100"
      down="Outbound CIR 20 / MIR 100"
      station={`${f(c.x, "station")} · Hughes HL1100`}
      stationSub={`S/N ${f(c.x, "serial")} · IP ${f(c.x, "ip")}`}
      card={{ t: "Связность за 30 дней", v: `${pctStr(up(c.x))}%`, sub: STATE[c.x.status], ok: c.x.status === "work" ? "Станция в работе" : "" }}
    />
  ),
  schemaLabel: ["Спутник", Satellite],
  capTitle: "",
  cap: () => [],
  extra: (c) => [
    {
      k: "monitor",
      t: "Мониторинг",
      icon: Activity,
      node: (
        <Card icon={Activity} title="Мониторинг станции" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Статус", v: STATE[c.x.status] },
              { t: "Связность за 30 дней", v: `${pctStr(up(c.x))}%` },
              { t: "Трафик вниз / вверх", v: c.x.status === "never" ? "—" : "48,2 / 6,1 ГБ" },
              { t: "Последний простой", v: c.x.status === "never" ? "—" : "04.10 02:14 – 02:40" },
              { t: "Последний сигнал", v: c.x.status === "work" ? "сегодня 18:22" : "—" },
            ]}
          />
          <p className="mt-3 text-xs text-muted-foreground">Данные мониторинга подтягиваются из «Мониторинга OneWeb»</p>
        </Card>
      ),
    },
  ],
  stats: (c) => [
    { icon: SatelliteDish, t: "Станция", v: f(c.x, "station") },
    { icon: Activity, t: "Связность", v: pctStr(up(c.x)), em: "%" },
    { icon: MapPin, t: "Координаты", v: ll(c.x) },
  ],
  summary: (c) => [
    { icon: SatelliteDish, title: "Станция", tab: "monitor", v: f(c.x, "station") },
    { icon: Hash, title: "IMEI", tab: "monitor", v: `…${f(c.x, "imei").slice(-6)}` },
    { icon: Globe, title: "IP-адрес", tab: "monitor", v: f(c.x, "ip") },
    { icon: Activity, title: "Связность", tab: "monitor", v: `${pctStr(up(c.x))}%`, bar: capBar(up(c.x), 100) },
  ],
  rows: (x) => [
    { t: "Название станции", v: f(x, "station") },
    { t: "Серийный номер", v: f(x, "serial") },
    { t: "IMEI", v: f(x, "imei") },
    { t: "IP-адрес", v: f(x, "ip") },
    { t: "Широта", v: f(x, "coords").split(",")[0] },
    { t: "Долгота", v: f(x, "coords").split(",")[1]?.trim() ?? "—" },
  ],
  lastEdit: () => ["Изменён IP-адрес", "100.64.12.17", "100.64.12.18"],
})

/** Паспорт станции OneWeb (макет 42). */
export function OnewebFormPassport({ id }: { id: number }) {
  return <LinePassport k={OWM} id={id} />
}
