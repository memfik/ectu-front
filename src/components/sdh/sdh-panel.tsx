"use client"

import { Chassis, Shelf, type Slot } from "@/components/passport/chassis"
import type { SdhDevice } from "@/lib/api/sdh"

/*
 * SDH в паспорте (макет 23): «Панель» — шасси с платами, «Полка» — 15 слотов.
 * TODO(API): платы по слотам (иерархия шасси → платы по parent_id) — нет в /api/sdh.
 */

const PANEL: Slot[] = [
  { label: "TCC2P", led: "ok" },
  { label: "XC-VXC", led: "ok" },
  { label: "MRC12", led: "ok", on: true, ports: 0 },
  { label: "MRC12", led: "ok", ports: 4 },
  { label: "CE-100T", led: "ok" },
  { label: "E1-63", led: "ok", ports: 1 },
  { label: "E1-63", led: "ok", ports: 1 },
  { label: "" },
  { label: "CE-100T", led: "warn" },
  { label: "STM-4", led: "ok", ports: 4 },
  { label: "" },
  { label: "XC-VXC", led: "ok" },
  { label: "TCC2P", led: "ok" },
  { label: "" },
  { label: "" },
]
/** Полка 15 слотов (sdh-04-schema): синие — оптика и кросс, зелёные — трибутарные, пустой — 12. */
const SHELF = ["SL16", "SL16", "SL4", "SL4", "SL1", "SL1", "PQ1 E1", "PQ1 E1", "PL3 E3", "EFS8", "EGS4", "", "GXCSA", "GXCSA", "SCC"]

/** Передняя панель: шасси с платами и выноски. */
export function SdhPanel({ x }: { x: SdhDevice }) {
  return (
    <Chassis
      title="SDH"
      sub={String(x.f.model ?? "")}
      left={`${x.f.model} · полка 1`}
      right="STM-16 · VC-12 · E1"
      slots={PANEL}
      callouts={[
        { t: "Слот 6 · MRC12 · STM-16", v: "кольцо Уральск — Аксай", pct: 100, at: 14 },
        { t: "E1-63", v: "VC-12: 71 из 71", pct: 100, at: 50 },
        { t: "Слот 14 · CE-100T", v: "Ethernet over SDH · 2 из 8", at: 34, below: true },
      ]}
    />
  )
}

/** Полка: 15 слотов с подписями плат. */
export function SdhShelf({ x }: { x: SdhDevice }) {
  return (
    <Shelf
      title={`${x.f.model} M12 · ${x.nodeCode}`}
      sub="Полка 1 · 15 слотов · кольцо Астана-Север"
      slots={SHELF.map((b) => ({ label: b, tone: !b ? "off" : /^SL|GXC/.test(b) ? "blue" : "ok" }))}
      note="STM-16 → SDH ast011 · STM-16 → SDH alm-магистраль"
    />
  )
}
