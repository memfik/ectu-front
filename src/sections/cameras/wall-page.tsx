"use client"

import { useState } from "react"
import { Grid2x2, Grid3x3, Maximize, Plus, Search } from "lucide-react"
import { Input, Select } from "@/components/list/form-controls"
import { btn } from "@/components/list/ui"
import { BRANCHES } from "@/sections/nodes/data"
import { cn } from "@/lib/utils"
import { CamFrame, CameraDialog } from "./camera-dialog"
import { ConnectDialog } from "./connect-dialog"
import { cameras, type Camera } from "./data"

/*
 * Видеостена (макет 05, cam-03): все камеры узлов с фильтрами, сетка 3 или 4 в ряд, «Подключить камеру» (cam-04),
 * клик — видео узла (cam-02). TODO(API): потоки WebRTC вместо превью.
 */

type Filter = "all" | "online" | "offline" | "alarm"

export function CameraWallPage() {
  const all = cameras()
  const [f, setF] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const [branch, setBranch] = useState("АС")
  const [cols, setCols] = useState<3 | 4>(3)
  const [more, setMore] = useState(1)
  const [open, setOpen] = useState<Camera | null>(null)
  const [connect, setConnect] = useState(false)
  const count = (k: Filter) =>
    all.filter((c) => (k === "all" ? true : k === "online" ? c.online : k === "offline" ? !c.online : c.alarm)).length
  const list = all.filter(
    (c) =>
      (f === "all" || (f === "online" ? c.online : f === "offline" ? !c.online : c.alarm)) &&
      (!branch || c.branch === branch) &&
      `${c.id} ${c.nodeCode} ${c.title}`.toLowerCase().includes(q.trim().toLowerCase()),
  )
  const page = cols * 3 * more
  return (
    <div className="px-(--page-gutter) pb-10">
      <section className="pt-8 pb-6">
        <p className="text-sm text-muted-foreground">Сеть / Карта сети</p>
        <h1 className="mt-1.5 text-[52px] leading-[1.05] font-semibold tracking-[-1.4px] max-sm:text-[32px]">
          Видеостена <em className="text-[32px] font-normal text-muted-foreground not-italic">{all.length} камер</em>
        </h1>
      </section>
      <div className="flex flex-wrap items-center gap-2.5">
        <Input icon={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Узел, камера…" className="h-11 w-[300px] rounded-full" />
        {(
          [
            ["all", "Все"],
            ["online", "Online"],
            ["offline", "Offline"],
            ["alarm", "С тревогами"],
          ] as const
        ).map(([k, t]) => (
          <button
            key={k}
            type="button"
            onClick={() => setF(k)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-full border border-border px-4 text-[13px]",
              f === k ? "border-[#085eff] bg-[rgba(8,94,255,0.18)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t} <em className="rounded-full bg-[var(--chip-bg)] px-2 text-[11px] not-italic">{count(k)}</em>
          </button>
        ))}
        <Select
          value={branch}
          opts={[{ v: "", label: "Все филиалы" }, ...BRANCHES.map((b) => ({ v: b.v, label: `Филиал: ${b.v}` }))]}
          onChange={setBranch}
          className="h-11 w-[170px] rounded-full"
        />
        <span className="ml-auto flex gap-1 rounded-full bg-[var(--chip-bg)] p-1">
          {(
            [
              [4, Grid3x3],
              [3, Grid2x2],
            ] as const
          ).map(([n, I]) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} в ряд`}
              onClick={() => setCols(n)}
              className={cn("grid size-9 place-items-center rounded-full", cols === n ? "bg-[var(--nav-on-bg)] text-[var(--nav-on)]" : "text-muted-foreground")}
            >
              <I className="size-4" />
            </button>
          ))}
        </span>
        <button type="button" className={btn({ primary: true })} onClick={() => setConnect(true)}>
          <Plus />
          Подключить камеру
        </button>
      </div>
      <div className={cn("mt-[18px] grid gap-3.5 max-sm:grid-cols-1", cols === 3 ? "grid-cols-3 max-[1279px]:grid-cols-2" : "grid-cols-4 max-[1279px]:grid-cols-2")}>
        {list.slice(0, page).map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setOpen(c)}
            className={cn("group relative overflow-hidden rounded-2xl border text-left", i === 0 ? "border-[#085eff]" : "border-border")}
          >
            <CamFrame c={c} className="aspect-video w-full" />
            {c.online && (
              <>
                <span className="absolute bottom-3 left-4 text-white">
                  <b className="block text-[13px] font-semibold">
                    {c.id} · {c.nodeCode}
                  </b>
                  <span className="text-[12px] text-white/70">{c.title}</span>
                </span>
                <span className="absolute right-3 bottom-3 grid size-8 place-items-center rounded-lg bg-black/40 text-white/80">
                  <Maximize className="size-4" />
                </span>
              </>
            )}
          </button>
        ))}
      </div>
      {list.length > page && (
        <div className="mt-5 flex justify-center">
          <button type="button" className={btn()} onClick={() => setMore(more + 1)}>
            Показать ещё · {list.length - page}
          </button>
        </div>
      )}
      {!list.length && <p className="py-16 text-center text-muted-foreground">Камер не найдено</p>}
      {open && <CameraDialog cam={open} onClose={() => setOpen(null)} />}
      {connect && <ConnectDialog onClose={() => setConnect(false)} />}
    </div>
  )
}
