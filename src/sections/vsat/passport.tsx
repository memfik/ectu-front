"use client"

import { Activity, Contact, Phone, Satellite, Server } from "lucide-react"
import { RadioPanel, SatelliteLink } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { equipmentKind } from "@/sections/lines/equipment"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { list, spec } from "./config"

/*
 * VSAT (ЗССС SkyEdge II GEO, макет 31): модем и антенна, «Спутник» — канал через KazSat-3,
 * вкладки «Услуги и скорости», «Станция», «Голосовые интерфейсы».
 * TODO(API): скорости CIR / MIR, BUC / LNB, IP, VLAN, голосовые интерфейсы — нет в /api/vsat.
 */

const SPEED = { cirOut: 2048, mirOut: 4096, cirIn: 512, mirIn: 1024 }
const VOICE = 5
const ant = (x: GenRow) => String(x.f.antenna ?? "1,8")
const short = (x: GenRow) => String(x.f.client ?? "").replace(/^(ТОО|АО) «(.*)»$/, "$2")

const VSAT = equipmentKind({
  section: "vsat",
  spec,
  list,
  pill: () => "STAR",
  panel: (c) => (
    <RadioPanel
      left={String(c.x.f.type)}
      right={`ID Vsat ${c.x.f.topology}`}
      indoor={{
        t: "Модем",
        sub: String(c.x.f.type),
        groups: [
          { label: "LAN", ports: [true, true, false, false] },
          { label: "VOICE · FXS", ports: [true, true] },
        ],
        coax: ["RX", "TX"],
      }}
      outdoor={{
        t: "Антенна",
        sub: `Ø ${ant(c.x)} м · BUC 4 W · LNB PLL`,
        lines: ["Es/No    9.4 dB", "RX LOCK  YES", "BEAM     KazSat-3", "STAR     Hub Astana"],
        from: "модем",
        to: "GEO",
        len: "антенна",
      }}
      notes={[
        { t: "LAN 1–2", v: "ПД · WWW", at: 13 },
        { t: "RX / TX · F-разъёмы", v: "→ LNB / BUC антенны", at: 78 },
      ]}
    />
  ),
  schema: (c) => (
    <SatelliteLink
      orbit="Геостационарная орбита · KazSat-3"
      up={`Inbound CIR ${SPEED.cirIn} / MIR ${SPEED.mirIn}`}
      down={`Outbound CIR ${SPEED.cirOut} / MIR ${SPEED.mirOut}`}
      station={String(c.x.f.name ?? "VSAT")}
      stationSub={`Ø ${ant(c.x)} м · BUC 4 W · PLL`}
      card={{ t: "Предоставляемые услуги", v: "WWW · ПД · Голос", sub: "VLAN 412 · STAR", ok: "Станция в работе" }}
    />
  ),
  schemaLabel: ["Спутник", Satellite],
  capTitle: "",
  cap: () => [],
  extra: () => [
    {
      k: "speed",
      t: "Услуги и скорости",
      icon: Activity,
      node: (
        <Card icon={Activity} title="Предоставляемые услуги" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "WWW, кбит/с", v: SPEED.mirOut.toLocaleString("ru-RU") },
              { t: "ПД, кбит/с", v: SPEED.cirOut.toLocaleString("ru-RU") },
              { t: "Голос, шт", v: VOICE },
              { t: "CIR, Outbound", v: SPEED.cirOut.toLocaleString("ru-RU") },
              { t: "MIR, Outbound", v: SPEED.mirOut.toLocaleString("ru-RU") },
              { t: "CIR, Inbound", v: SPEED.cirIn },
              { t: "MIR, Inbound", v: SPEED.mirIn.toLocaleString("ru-RU") },
            ]}
          />
        </Card>
      ),
    },
    {
      k: "station",
      t: "Станция",
      icon: Satellite,
      node: <StationCard />,
    },
    {
      k: "voice",
      t: "Голосовые интерфейсы",
      icon: Phone,
      node: (
        <Card icon={Phone} title="Тип голосового интерфейса" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "E&M", v: 0 },
              { t: "FXS", v: VOICE },
              { t: "FXO", v: 0 },
              { t: "Телефонная нумерация", v: "7292 44-12-01…05" },
            ]}
          />
        </Card>
      ),
    },
  ],
  stats: (c) => [
    { icon: Activity, t: "MIR ↓", v: SPEED.mirOut / 1024, em: "Мбит/с" },
    { icon: Satellite, t: "Антенна", v: ant(c.x), em: "м" },
    { icon: Phone, t: "Голос", v: VOICE, em: "линий" },
  ],
  summary: (c) => [
    {
      icon: Activity,
      title: "MIR ↓ / ↑",
      tab: "speed",
      v: (
        <>
          {SPEED.mirOut / 1024} / {SPEED.mirIn / 1024} <em>Мбит/с</em>
        </>
      ),
    },
    {
      icon: Activity,
      title: "CIR ↓ / ↑",
      tab: "speed",
      v: (
        <>
          {SPEED.cirOut / 1024} / {String(SPEED.cirIn / 1024).replace(".", ",")} <em>Мбит/с</em>
        </>
      ),
    },
    {
      icon: Phone,
      title: "Голос",
      tab: "voice",
      v: (
        <>
          {VOICE} <em>FXS</em>
        </>
      ),
    },
    { icon: Contact, title: "Клиент", tab: "speed", v: short(c.x) },
  ],
  related: () => [{ icon: Server, t: "Hub Astana", sub: "STAR · KazSat-3" }],
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Наименование", v: String(x.f.name ?? "—") },
    { t: "Клиент", v: String(x.f.client ?? "—") },
    { t: "Собственник оборудования", v: "QMobile" },
    { t: "Населенный пункт", v: String(x.f.name ?? "—") },
    { t: "Адрес", v: String(x.f.name ?? x.address) },
    { t: "Широта (N)", v: x.ll[0].toFixed(4) },
    { t: "Долгота (E)", v: x.ll[1].toFixed(4) },
    { t: "Тип модема", v: String(x.f.type ?? "—") },
    { t: "ID Vsat", v: String(x.f.topology ?? "—") },
    { t: "Диаметр антенны, м", v: ant(x) },
  ],
  lastEdit: () => ["Изменено «MIR, Outbound»", "2 048", "4 096"],
})

/** Станция (vsat-t2). */
function StationCard() {
  return (
    <Card icon={Satellite} title="Станция" className="max-w-[1200px]">
      <Kv
        rows={[
          { t: "Тип модема", v: "SkyEdge II Access" },
          { t: "ID Vsat", v: "VS-44120" },
          { t: "Диаметр антенны, м", v: "1,8" },
          { t: "BUC, W", v: 4 },
          { t: "LNB, PLL/DRO", v: "PLL" },
          { t: "Topology", v: "STAR" },
          { t: "IP Address", v: "10.212.4.18/29" },
          { t: "VLAN", v: 412 },
        ]}
      />
    </Card>
  )
}

/** Паспорт VSAT (макет 31). */
export function VsatPassport({ id }: { id: number }) {
  return <LinePassport k={VSAT} id={id} />
}
