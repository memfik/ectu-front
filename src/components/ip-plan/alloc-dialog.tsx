"use client"

import { useState } from "react"
import { CircleCheck, Plus } from "lucide-react"
import { Input, Select } from "@/components/list/form-controls"
import { btn } from "@/components/list/ui"
import { Label, Modal } from "@/components/passport/modal"
import { notify, toast } from "@/components/shared/toast"
import { BLOCK, freeBlocks, ipPlan, SUBNETS, type IpAddress, type Net } from "@/lib/api/ip-plan"

const SIZE_OPTS = [
  { v: "/30", label: "/30 · 4 адреса" },
  { v: "/29", label: "/29 · 8 адресов" },
  { v: "/28", label: "/28 · 16 адресов" },
]

/**
 * «Выделить подсеть» (ip-04): сеть, размер, первая свободная, клиент, заявка KCRM.
 * Сохранение — ipPlan.save (в API — /api/ip-address-plan/create).
 */
export function AllocDialog({ net, rows, onClose }: { net: Net; rows: IpAddress[]; onClose: () => void }) {
  const nets = SUBNETS.filter((n) => !n.cidr.includes(":")).map((n) => ({ v: n.cidr, label: `${n.cidr} · ${n.t}`, net: n }))
  const [from, setFrom] = useState(net.cidr)
  const [blk, setBlk] = useState("/30")
  const [client, setClient] = useState("")
  const [kcrm, setKcrm] = useState("")
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [a, b, c] = from.split(".")
  // Первая свободная — первый адрес сети, не занятый в плане
  const taken = new Set(rows.filter((x) => x.status !== "free").map((x) => String(x.f.ip)))
  const step = BLOCK[blk] ?? 4
  let first = 1
  while (taken.has(`${a}.${b}.${c}.${first}`) && first < 250) first += step
  const ip = `${a}.${b}.${c}.${first}`

  const submit = async () => {
    setTried(true)
    if (!client.trim()) return
    const id = ipPlan.nextId()
    const row: IpAddress = {
      id,
      num: String(id),
      branch: "АС",
      nodeId: 0,
      nodeCode: "",
      city: "Астана",
      address: "",
      ll: [51.16, 71.43],
      status: "active",
      f: { ip, prefix: blk, client: client.trim(), place: "—", speed: "—", kcrm: kcrm || "—", eng: "—" },
    }
    setBusy(true)
    try {
      await ipPlan.save(row, true)
      toast(`Выделена ${ip}${blk}`)
      onClose()
    } catch (e) {
      setBusy(false)
      notify("error", "Не удалось выделить", e instanceof Error ? e.message : "Нет связи с сервером · повторите")
    }
  }

  return (
    <Modal title="Выделить подсеть" icon={Plus} width={600} onClose={onClose}>
      <form
        className="flex flex-col gap-4 px-6 pt-5 pb-6"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div>
          <Label t="Из сети" />
          <Select value={from} opts={nets} onChange={setFrom} />
        </div>
        <div>
          <Label t="Размер" />
          <Select value={blk} opts={SIZE_OPTS} onChange={setBlk} />
        </div>
        <p className="flex gap-3 rounded-2xl border border-[rgba(43,212,99,0.35)] bg-[rgba(43,212,99,0.08)] px-4 py-3">
          <CircleCheck className="mt-0.5 size-4 flex-none text-[var(--status-ok)]" />
          <span>
            <b className="block text-[13.5px] font-semibold">
              Первая свободная: {ip}
              {blk}
            </b>
            <span className="text-xs text-muted-foreground">
              ещё {Math.max(0, freeBlocks(nets.find((x) => x.v === from)?.net ?? net, blk) - 1)} свободных {blk} в этой сети
            </span>
          </span>
        </p>
        <label>
          <Label t="Клиент" req />
          <Input value={client} onChange={(e) => setClient(e.target.value)} invalid={tried && !client.trim()} placeholder="ТОО «…»" />
        </label>
        <label>
          <Label t="Заявка KCRM" />
          <Input value={kcrm} onChange={(e) => setKcrm(e.target.value)} inputMode="numeric" placeholder="88630" />
        </label>
        <div className="mt-3 flex justify-end gap-2.5">
          <button type="button" className={btn()} onClick={onClose}>
            Отмена
          </button>
          <button type="submit" disabled={busy || ipPlan.readOnly()} className={btn({ primary: true })}>
            <CircleCheck />
            Выделить
          </button>
        </div>
      </form>
    </Modal>
  )
}
