"use client"

import { useState } from "react"
import Link from "next/link"
import { Dialog } from "radix-ui"
import {
  ArrowRight,
  Camera as CameraIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  LayoutGrid,
  Maximize,
  Move,
  Pause,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { btn, circ } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { cn } from "@/lib/utils"
import { nodeCameras, type Camera } from "@/lib/api/cameras"

/** Кадр камеры: фото с «шумом», LIVE и подписью; без сигнала — заглушка. */
export function CamFrame({ c, big, className }: { c: Camera; big?: boolean; className?: string }) {
  if (!c.online)
    return (
      <span className={cn("relative grid place-items-center overflow-hidden bg-black text-center", className)}>
        <span>
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-[rgba(255,82,87,0.16)] text-[#ff5257]">
            <CameraIcon className="size-5" />
          </span>
          <b className="mt-3 block text-[13px] font-semibold text-white">
            {c.id} · {c.nodeCode}
          </b>
          <span className="text-[12px] text-white/55">Нет сигнала с 16:12 · проверить VPN</span>
        </span>
      </span>
    )
  return (
    <span className={cn("relative block overflow-hidden bg-cover bg-center", className)} style={{ backgroundImage: `url(${c.img})` }}>
      <span className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.12)_0_1px,transparent_1px_3px)]" />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(0,0,0,0.7))]" />
      <span className="absolute top-2.5 left-2.5 rounded-md bg-[#ff3b30] px-1.5 py-0.5 text-[10px] font-bold text-white">
        ● {c.pub ? "PUBLIC" : "LIVE"}
      </span>
      <span className="absolute top-2.5 right-3 font-mono text-[10px] text-white/80">17:58:12</span>
      {big && (
        <span className="absolute top-3 left-3 mt-7 font-mono text-[11px] leading-relaxed text-white/90">
          {c.id} · {c.nodeCode} · {c.title.toUpperCase()}
          <br />
          07.10.2026 17:58:12
        </span>
      )}
    </span>
  )
}

/** cam-02: видео узла — плеер, архив с событиями, камеры узла, сведения о камере. */
export function CameraDialog({ cam, onClose }: { cam: Camera; onClose: () => void }) {
  const list = cam.pub ? [cam] : nodeCameras(cam.nodeId)
  const [cur, setCur] = useState(cam)
  const online = list.filter((c) => c.online).length
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[rgba(5,6,9,0.6)] backdrop-blur-[4px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[101] max-h-[calc(100vh-24px)] w-[1200px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[28px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-5 shadow-[var(--dd-shadow)]"
        >
          <header className="mb-4 flex flex-wrap items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              <CameraIcon className="size-[18px]" />
            </span>
            <Dialog.Title className="text-lg font-semibold">
              {cam.pub ? `Веб-камера · ${cam.title}` : `Видео · ${cam.nodeCode} · ${cam.nodeTitle}`}
            </Dialog.Title>
            {!cam.pub && (
              <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2.5 py-1 text-[11px] text-[var(--status-ok)]">
                ● {list.length} камеры · {online} online
              </span>
            )}
            <button type="button" className={cn(btn({ sm: true }), "ml-auto")} onClick={() => toast("Фрагмент архива — после подключения видеосервера")}>
              <Download />
              Скачать фрагмент
            </button>
            <Dialog.Close className={circ} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>
          <div className="grid grid-cols-[1fr_300px] gap-4 max-[1000px]:grid-cols-1">
            <div className="min-w-0">
              <div className="relative">
                <CamFrame c={cur} big className="aspect-video w-full rounded-2xl" />
                {cur.online && (
                  <>
                    <span className="absolute right-4 bottom-20 grid size-[120px] place-items-center rounded-full bg-black/45 text-white/80 max-sm:hidden">
                      <ChevronUp className="absolute top-2 size-4" />
                      <ChevronDown className="absolute bottom-2 size-4" />
                      <ChevronLeft className="absolute left-2 size-4" />
                      <ChevronRight className="absolute right-2 size-4" />
                      <span className="grid size-9 place-items-center rounded-full bg-white/15">
                        <Move className="size-4" />
                      </span>
                    </span>
                    <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-xl bg-black/55 px-3 py-2 text-white backdrop-blur-sm">
                      <Pause className="size-4" />
                      <span className="text-[11px] font-semibold">LIVE</span>
                      <span className="h-1 flex-1 rounded-full bg-[#085eff]" />
                      {[ZoomIn, ZoomOut, CameraIcon, Volume2, Maximize].map((I, i) => (
                        <I key={i} className="size-4 text-white/80" />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {!cur.pub && (
                <>
                  <div className="relative mt-3 h-12 rounded-xl bg-[var(--chip-bg)] px-2 pt-2">
                    <span className="flex h-4 gap-1">
                      <i className="w-[38%] rounded-sm bg-[#085eff]/70" />
                      <i className="w-[28%] rounded-sm bg-[#085eff]/70" />
                      <i className="w-[32%] rounded-sm bg-[#085eff]/70" />
                    </span>
                    {[22, 47, 61, 78].map((x, i) => (
                      <i key={x} className="absolute top-1 h-6 w-0.5" style={{ left: `${x}%`, background: i === 1 ? "#ff5257" : "#ffc24a" }} />
                    ))}
                    <span className="mt-1 flex justify-between text-[9px] text-muted-foreground">
                      {["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
                    <span>
                      <i className="mr-1.5 inline-block size-1.5 rounded-full bg-[#085eff]" />
                      Запись (архив 14 дней)
                    </span>
                    <span>
                      <i className="mr-1.5 inline-block size-1.5 rounded-full bg-[#ffc24a]" />
                      Движение
                    </span>
                    <span>
                      <i className="mr-1.5 inline-block size-1.5 rounded-full bg-[#ff5257]" />
                      Открытие двери
                    </span>
                  </p>
                </>
              )}
            </div>
            <aside className="flex flex-col gap-2">
              <span className="text-[12px] text-muted-foreground">
                {cam.pub ? "Источник" : `Камеры узла · ${list.length}`}
              </span>
              {list.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCur(c)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-2 text-left",
                    c.id === cur.id ? "border-[#085eff]/60 bg-[rgba(8,94,255,0.1)]" : "border-border",
                  )}
                >
                  <CamFrame c={{ ...c, online: true }} className="h-9 w-14 flex-none rounded-md [&>span:not(:first-child)]:hidden" />
                  <span className="min-w-0 flex-1">
                    <b className="block text-[12.5px] font-semibold">{c.id}</b>
                    <span className="block truncate text-[11px] text-muted-foreground">{c.title}</span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px]",
                      c.online ? "bg-[rgba(43,212,99,0.14)] text-[var(--status-ok)]" : "bg-[rgba(255,82,87,0.14)] text-[#ff5257]",
                    )}
                  >
                    ● {c.online ? "Live" : "Offline"}
                  </span>
                </button>
              ))}
              <p className="mt-2 flex items-center gap-3 text-[11px] font-semibold tracking-[1px] text-muted-foreground uppercase after:h-px after:flex-1 after:bg-border">
                Камера
              </p>
              <dl className="text-[12.5px]">
                {(
                  [
                    ["Модель", cur.model],
                    ["Поток", cur.pub ? "снимок раз в 1–5 мин" : "RTSP → WebRTC"],
                    ["Задержка", cur.pub ? "—" : "0,4 с"],
                    ["Сеть", cur.pub ? "публичный источник" : `VPN ${cur.branch} · ${cur.ip}`],
                    ["Архив", cur.pub ? "нет" : "14 дней · 186 ГБ"],
                  ] as const
                ).map(([t, v]) => (
                  <div key={t} className="flex justify-between gap-3 border-b border-border py-2">
                    <dt className="text-muted-foreground">{t}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                <Link href="/cameras" className={btn({ sm: true })}>
                  <LayoutGrid />
                  Видеостена
                </Link>
                {!cam.pub && (
                  <Link href={`/nodes/${cam.nodeId}`} className={btn({ sm: true })}>
                    <ArrowRight />
                    Паспорт узла
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
