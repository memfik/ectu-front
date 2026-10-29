"use client"

import { useState } from "react"
import { DatabaseBackup, Play, Server } from "lucide-react"
import { btn } from "@/components/list/ui"
import { Modal } from "@/components/passport/modal"
import { toast } from "@/components/shared/toast"
import { fetchBackups, type Backup } from "@/lib/api/backups"

/** «Получить резервную копию?» (bk-03): список устройств и запуск снятия конфига. */
export function FetchDialog({ rows, onClose }: { rows: Backup[]; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      await fetchBackups(rows.map((x) => x.id))
      toast(`Запущено снятие конфига: ${rows.length} ${rows.length === 1 ? "устройство" : "устройства"}`)
      onClose()
    } catch (e) {
      toast(`Не удалось: ${(e as Error).message}`)
      setBusy(false)
    }
  }
  return (
    <Modal title="Получить резервную копию?" icon={DatabaseBackup} width={520} onClose={onClose}>
      <div className="px-6 pt-4 pb-6">
        <p className="text-[13.5px] text-muted-foreground">Будет снят текущий конфиг выбранных устройств. Это займёт ~10 секунд на устройство.</p>
        <ul className="mt-4 rounded-2xl border border-border px-4 py-2.5 text-[13.5px]">
          {rows.map((x) => (
            <li key={x.id} className="flex items-center gap-2.5 py-1 font-semibold">
              <Server className="size-4 text-muted-foreground" />
              {x.f.host} · {x.f.ip}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex justify-end gap-2.5">
          <button type="button" className={btn()} onClick={onClose}>
            Отмена
          </button>
          <button type="button" className={btn({ primary: true })} disabled={busy} onClick={run}>
            <Play />
            {busy ? "Запуск…" : "Получить"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
