"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, DatabaseBackup, Download, Play } from "lucide-react"
import { btn } from "@/components/list/ui"
import { Modal } from "@/components/passport/modal"
import { toast } from "@/components/shared/toast"
import { apiOn } from "@/lib/api/client"
import { backupConfig, backupStatus, fetchBackupContent, type Backup } from "@/lib/api/backups"
import { cn } from "@/lib/utils"

/** Шторка резервной копии (bk-02): данные устройства и конфиг — полный, изменения или лог снятия. */
export function ConfigDrawer({ x, onClose, onFetch, onDownload }: { x: Backup; onClose: () => void; onFetch: () => void; onDownload: () => void }) {
  const [tab, setTab] = useState<"full" | "diff" | "log">(x.status === "changed" ? "diff" : "full")
  const [remote, setRemote] = useState<string | null>(null)
  // В API — содержимое последнего бэкапа
  useEffect(() => {
    if (!apiOn()) return
    fetchBackupContent(x.id)
      .then(setRemote)
      .catch(() => setRemote(null))
  }, [x.id])
  const lines = remote ? remote.split("\n") : backupConfig(x)
  const plus = lines.filter((l) => l.startsWith("+")).length
  const minus = lines.filter((l) => l.startsWith("-")).length
  const time = String(x.f.date).split(" ")[1] ?? ""
  const shown =
    tab === "log"
      ? [
          `[03:00:01] connect ${x.f.ip}:22 ssh`,
          "[03:00:02] auth ok (tacacs)",
          "[03:00:03] terminal length 0",
          "[03:00:04] show running-config",
          `[03:00:09] saved ${x.f.host}_20261007_0300.cfg (${lines.length} строк)`,
          x.status === "error" ? "[03:00:09] ERROR: timeout" : "[03:00:09] done",
        ]
      : tab === "diff"
        ? lines
        : lines.filter((l) => !l.startsWith("-")).map((l) => (l.startsWith("+") ? ` ${l.slice(1)}` : l))
  return (
    <Modal side title={`Резервная копия · ${x.f.host}`} sub={`07.10.2026 ${time} · ${plus + minus} строки изменились`} icon={DatabaseBackup} width={720} onClose={onClose}>
      <div className="flex-1 overflow-y-auto px-7 py-4">
        <dl className="text-[13.5px]">
          {(
            [
              ["Имя устройства", x.f.host],
              ["IP адрес", x.f.ip],
              ["Тип ОС", x.f.os],
              ["Филиал", x.branch],
              ["Статус", x.status === "changed" ? "Успешно · изменён" : backupStatus(x)[0]],
              ["Дата создания", `07.10.2026 ${time}`],
              ["Запустил", x.f.by],
            ] as const
          ).map(([t, v]) => (
            <div key={t} className="flex justify-between gap-4 border-b border-border py-3.5">
              <dt className="text-muted-foreground">{t}</dt>
              <dd className="font-medium">{String(v ?? "—")}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase after:h-px after:flex-1 after:bg-border">
          Конфигурация
        </p>
        <div className="mb-3 flex gap-2">
          {(
            [
              ["full", "Полная"],
              ["diff", "Изменения"],
              ["log", "Логирование"],
            ] as const
          ).map(([k, t]) => (
            <button
              key={k}
              type="button"
              aria-pressed={tab === k}
              onClick={() => setTab(k)}
              className={cn("flex h-10 items-center gap-2 rounded-full border border-border px-4 text-[13.5px]", tab === k && "border-[#085eff] bg-[rgba(8,94,255,0.16)]")}
            >
              {t}
              {k === "diff" && (
                <em className="rounded-full bg-[var(--chip-bg)] px-2 text-[11px] not-italic">
                  +{plus} −{minus}
                </em>
              )}
            </button>
          ))}
        </div>
        <pre className="overflow-x-auto rounded-2xl border border-border bg-[#0b0c10] py-3 font-mono text-[12.5px] leading-[1.6] text-[#d5d9e0] not-dark:bg-[#f6f7f9] not-dark:text-[#1c1c1e]">
          {shown.map((l, i) => (
            <div
              key={i}
              className={cn(
                "px-4 whitespace-pre",
                l.startsWith("!") && i === 0 && "text-muted-foreground",
                tab === "diff" && l.startsWith("-") && "bg-[rgba(255,59,59,0.14)] text-[#ff7b7b] line-through",
                tab === "diff" && l.startsWith("+") && "bg-[rgba(43,212,99,0.14)] text-[#5ee08b]",
                /ERROR/.test(l) && "text-[#ff7b7b]",
              )}
            >
              {tab === "diff" && /^[+-]/.test(l) ? ` ${l.slice(1)}` : l}
            </div>
          ))}
        </pre>
      </div>
      <footer className="flex items-center gap-2.5 border-t border-[var(--dd-line)] px-7 py-4">
        <button type="button" className={btn()} onClick={() => toast("Предыдущая копия — после подключения API (/history)")}>
          <ChevronLeft />
          Предыдущая
        </button>
        <span className="flex-1" />
        <button type="button" className={btn()} onClick={onDownload}>
          <Download />
          Скачать
        </button>
        <button type="button" className={btn({ primary: true })} onClick={onFetch}>
          <Play />
          Получить сейчас
        </button>
      </footer>
    </Modal>
  )
}
