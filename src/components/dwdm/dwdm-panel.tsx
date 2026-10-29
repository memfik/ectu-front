"use client"

import { Rows3 } from "lucide-react"
import { Chassis, Shelf, type Slot } from "@/components/passport/chassis"
import { Card } from "@/components/passport/ui"
import { dwdmLambda, type DwdmDevice } from "@/lib/api/dwdm"
import { cn } from "@/lib/utils"

/*
 * DWDM в паспорте (макет 24): «Панель» — шасси, «Полка» — 16 слотов, вкладка «Длины волн» — сетка C-band.
 * TODO(API): платы, трансиверы, ошибки LOS, длины волн C-band — нет в /api/dwdm.
 */

/** Сетка C-band, шаг 0,8 нм: 40 каналов от 1529,0 нм. */
const GRID = Array.from({ length: 40 }, (_, i) => (1529 + i * 0.8).toFixed(1))
const SHELF = ["FIU", "M40V", "D40", "OAU1", "OBU1", "N402", "N402", "N402", "TN54", "TN54", "TN54", "", "XCH", "XCH", "SCC", "PIU"]
const PANEL: Slot[] = [
  { label: "TNC", led: "ok" },
  { label: "OPT-AMP", led: "ok", ports: 4 },
  { label: "10X10G", led: "ok", on: true, ports: 0 },
  { label: "10X10G", led: "ok", ports: 4 },
  { label: "OTU2-XP", led: "ok", ports: 4 },
  { label: "100G", led: "bad", ports: 4 },
  { label: "QSFP28", led: "ok", ports: 4 },
  { label: "" },
  { label: "" },
  { label: "TNC", led: "ok" },
  { label: "" },
  { label: "" },
  { label: "" },
  { label: "" },
  { label: "" },
]

/** Передняя панель: шасси с платами и выноски. */
export function DwdmPanel({ x }: { x: DwdmDevice }) {
  return (
    <Chassis
      title="DWDM"
      sub={String(x.f.model ?? "")}
      left={`${x.f.model} · полка 1`}
      right="OTU4 · 100GE · C-band"
      slots={PANEL}
      callouts={[
        { t: "10X10G-LC · 10 × 10G", v: "10G-LR-1310nm · 3 из 10", pct: 30, at: 14 },
        { t: "QSFP28-100G", v: `trunk OTU4 → ${String(x.f.dir ?? "").split(" — ")[1] ?? "Аксай"}`, pct: 100, at: 46 },
        { t: "Слот 6 · трансивер", v: "ошибка LOS · проверить", at: 37, below: true },
      ]}
    />
  )
}

/** Полка: 16 слотов, слот 11 — с ошибкой. */
export function DwdmShelf({ x }: { x: DwdmDevice }) {
  const { z, m } = dwdmLambda(x)
  return (
    <Shelf
      title={`Cisco NCS 2006 · ${x.nodeCode}`}
      sub={`40 λ × 100G · C-band · магистраль ${x.f.dir ?? "Астана — Караганда"} (212 км)`}
      slots={SHELF.map((b, i) => ({ label: b, tone: !b ? "off" : i === 10 ? "bad" : /^M40|D40|XCH/.test(b) ? "blue" : "ok" }))}
      note={`${z} из ${m} длин волн · 1 трансивер с ошибкой (слот 11)`}
    />
  )
}

/** Длины волн C-band: занятые — синие. */
export function DwdmWaves({ x }: { x: DwdmDevice }) {
  const { z } = dwdmLambda(x)
  return (
    <Card icon={Rows3} title="Длины волн C-band" count={GRID.length}>
      <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-2 max-[1279px]:grid-cols-10">
        {GRID.map((w, i) => (
          <span
            key={w}
            title={`${w} нм · ${i < z ? "занято" : "свободно"}`}
            className={cn(
              "grid h-10 place-items-center rounded-lg border text-[11px] tabular-nums",
              i < z ? "border-[#2f5fd0] bg-[rgba(8,94,255,0.22)] text-foreground" : "border-border text-muted-foreground",
            )}
          >
            {w}
          </span>
        ))}
      </div>
      <p className="mt-4 flex gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-[#085eff]" />
          Занято {z}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-[#5b606b]" />
          Свободно {GRID.length - z}
        </span>
      </p>
    </Card>
  )
}
