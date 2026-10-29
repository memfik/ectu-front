"use client"

import { useState } from "react"
import { ChevronDown, GitFork, Search } from "lucide-react"
import { Input } from "@/components/list/form-controls"
import { Bar } from "@/components/list/ui"
import { SUBNETS, type Net } from "@/lib/api/ip-plan"
import { cn } from "@/lib/utils"

/** Дерево подсетей (ip-01): свёрнутые ветки, поиск по подсети и описанию, доля занятых адресов. */
export function SubnetTree({ value, onChange }: { value: string; onChange: (cidr: string) => void }) {
  const [q, setQ] = useState("")
  const [closed, setClosed] = useState<Set<string>>(new Set())
  // Узел скрыт, если свёрнут кто-то из его предков
  const visible = SUBNETS.filter((n, i) => {
    if (q.trim()) return `${n.cidr} ${n.t}`.toLowerCase().includes(q.trim().toLowerCase())
    let d = n.depth
    for (let j = i - 1; j >= 0 && d > 0; j--)
      if (SUBNETS[j].depth < d) {
        if (closed.has(SUBNETS[j].cidr)) return false
        d = SUBNETS[j].depth
      }
    return true
  })
  const hasKids = (n: Net) => {
    const i = SUBNETS.indexOf(n)
    return SUBNETS[i + 1]?.depth > n.depth
  }
  return (
    <section className="rounded-3xl border border-border bg-[var(--glass-card)] p-[22px] backdrop-blur-[18px]">
      <header className="mb-4 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-[11px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
          <GitFork className="size-[18px]" />
        </span>
        <h3 className="text-base font-semibold">Дерево подсетей</h3>
      </header>
      <Input icon={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Подсеть или описание…" className="mb-3 rounded-full" />
      {visible.map((n) => {
        const on = n.cidr === value
        const kids = hasKids(n)
        return (
          <div
            key={n.cidr}
            className={cn("flex h-10 items-center gap-2 rounded-xl border border-transparent pr-3 text-[13px]", on && "border-[#2f6bff] bg-[rgba(8,94,255,0.12)]")}
            style={{ paddingLeft: 8 + n.depth * 22 }}
          >
            <button
              type="button"
              aria-label={closed.has(n.cidr) ? "Развернуть" : "Свернуть"}
              disabled={!kids}
              onClick={() => {
                const s = new Set(closed)
                if (s.has(n.cidr)) s.delete(n.cidr)
                else s.add(n.cidr)
                setClosed(s)
              }}
              className="grid size-5 flex-none place-items-center text-muted-foreground disabled:invisible"
            >
              <ChevronDown className={cn("size-3.5 transition-transform", closed.has(n.cidr) && "-rotate-90")} />
            </button>
            <button type="button" onClick={() => onChange(n.cidr)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <b className="font-mono font-semibold whitespace-nowrap">{n.cidr}</b>
              <span className="truncate text-muted-foreground">{n.t}</span>
              <span className="ml-auto flex flex-none items-center gap-3">
                <Bar pct={n.pct} color={n.pct > 80 ? "#ff5257" : "#085eff"} className="h-[5px] w-14" />
                <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{n.pct}%</span>
              </span>
            </button>
          </div>
        )
      })}
    </section>
  )
}
