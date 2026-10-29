"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog } from "radix-ui"
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Maximize,
  Minus,
  Pencil,
  Play,
  Plus,
  Star,
  Trash2,
  Upload,
  Video,
  Volume2,
  X,
} from "lucide-react"
import { btn, circ, Tag } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import type { Media } from "@/lib/api/node-detail"
import { cn } from "@/lib/utils"
import { Kv } from "./ui"

type Kind = "all" | "photo" | "video"

/**
 * Галерея «Фото и видео» на весь экран (экраны g01 фото, g02 видео): фильтр, просмотр с масштабом,
 * сведения о файле, лента миниатюр, ← → и Esc. Один компонент для узлов и оборудования.
 */
export function Gallery({
  title,
  sub,
  media,
  start = 0,
  onClose,
}: {
  title: string
  sub: string
  media: Media[]
  start?: number
  onClose: () => void
}) {
  const [kind, setKind] = useState<Kind>("all")
  const list = media.filter((m) => kind === "all" || (kind === "video") === !!m.video)
  const [i, setI] = useState(start)
  const [zoom, setZoom] = useState(1)
  const [more, setMore] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const cur = list[Math.min(i, list.length - 1)]
  const go = (n: number) => {
    setI((n + list.length) % list.length)
    setZoom(1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1)
      if (e.key === "ArrowLeft") go(i - 1)
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  })

  const thumbs = more ? list : list.slice(0, 6)
  // TODO: загрузка, скачивание, удаление, обложка и правка описания — API (файловое хранилище)
  const later = (what: string) => toast(`${what} — после подключения API`)
  const counts = { all: media.length, photo: media.filter((m) => !m.video).length, video: media.filter((m) => m.video).length }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[120] flex flex-col bg-[#08090c] p-8 text-white data-[state=open]:animate-in data-[state=open]:fade-in max-sm:p-3"
        >
          <header className="flex flex-wrap items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/5">
              <ImageIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              <p className="truncate text-[13px] text-white/60">{sub}</p>
            </div>
            <div className="ml-10 flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 max-lg:ml-0">
              {(
                [
                  ["all", "Все", null],
                  ["photo", "Фото", Camera],
                  ["video", "Видео", Video],
                ] as const
              ).map(([k, t, I]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => {
                    setKind(k)
                    setI(0)
                    setZoom(1)
                  }}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] text-white/75",
                    kind === k && "bg-white font-semibold text-[#0b0c0f]",
                  )}
                >
                  {I && <I className="size-4" />}
                  {t} {counts[k]}
                </button>
              ))}
            </div>
            <span className="ml-auto text-sm text-white/70 tabular-nums">
              {Math.min(i, list.length - 1) + 1} / {list.length}
            </span>
            <button type="button" className={cn(btn(), "border-white/10 bg-white/5 text-white")} onClick={() => later("Загрузка")}>
              <Upload />
              Загрузить
            </button>
            <a href={cur?.src} download className={cn(circ, "size-11 border-white/10 bg-white/5 text-white")} title="Скачать">
              <Download />
            </a>
            <button
              type="button"
              className={cn(circ, "size-11 border-white/10 bg-white/5 text-[#ff5257]")}
              title="Удалить"
              onClick={() => later("Удаление")}
            >
              <Trash2 />
            </button>
            <Dialog.Close className={cn(circ, "size-11 border-white/10 bg-white/5 text-white")} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>

          {cur && (
            <div className="mt-6 grid min-h-0 flex-1 grid-cols-[1fr_380px] gap-5 max-lg:grid-cols-1">
              <div ref={stage} className="relative min-h-[300px] overflow-hidden rounded-[28px] bg-black">
                <div className="absolute inset-7 overflow-hidden rounded-lg max-sm:inset-2">
                  <div
                    className="size-full bg-cover bg-center transition-transform duration-200"
                    style={{ backgroundImage: `url(${cur.src})`, transform: `scale(${zoom})` }}
                    role="img"
                    aria-label={cur.title}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => go(i - 1)}
                  aria-label="Назад"
                  className={cn(
                    circ,
                    "absolute top-1/2 left-5 size-14 -translate-y-1/2 border-white/15 bg-[rgba(18,20,25,0.75)] text-white [&_svg]:size-5",
                  )}
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={() => go(i + 1)}
                  aria-label="Вперёд"
                  className={cn(
                    circ,
                    "absolute top-1/2 right-5 size-14 -translate-y-1/2 border-white/15 bg-[rgba(18,20,25,0.75)] text-white [&_svg]:size-5",
                  )}
                >
                  <ChevronRight />
                </button>
                {cur.video ? (
                  // TODO: файл видео из хранилища — сейчас только кадр-превью
                  <div className="absolute inset-x-7 bottom-7 flex items-center gap-4 rounded-2xl border border-white/10 bg-[rgba(18,20,25,0.85)] px-5 py-3 backdrop-blur max-sm:inset-x-2">
                    <button type="button" aria-label="Воспроизвести" onClick={() => later("Воспроизведение видео")}>
                      <Play className="size-5" />
                    </button>
                    <span className="text-[13px] tabular-nums">0:00 / {cur.video}</span>
                    <span className="h-1 flex-1 rounded-full bg-white/15" />
                    <Volume2 className="size-5 text-white/70" />
                    <span className="rounded-md border border-white/15 px-1.5 text-[11px]">1x</span>
                    <button type="button" aria-label="На весь экран" onClick={() => stage.current?.requestFullscreen?.()}>
                      <Maximize className="size-5" />
                    </button>
                  </div>
                ) : (
                  <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-[rgba(18,20,25,0.85)] p-1 backdrop-blur">
                    <button
                      type="button"
                      className="grid size-9 place-items-center"
                      aria-label="Уменьшить"
                      onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-14 text-center text-[13px] tabular-nums">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      className="grid size-9 place-items-center"
                      aria-label="Увеличить"
                      onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                    >
                      <Plus className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="grid size-9 place-items-center"
                      aria-label="На весь экран"
                      onClick={() => stage.current?.requestFullscreen?.()}
                    >
                      <Maximize className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              <aside className="flex flex-col rounded-[28px] border border-white/10 bg-[rgba(20,22,27,0.9)] p-[22px] max-lg:hidden">
                <h3 className="text-lg font-semibold">{cur.title}</h3>
                <p className="mt-1 mb-3 text-[13px] text-white/55">
                  {cur.video ? `Видео · ${cur.video} · ${cur.info}` : `Фото · ${cur.info}`}
                </p>
                <div className="[&_dd]:text-white [&_div]:border-white/10 [&_dt]:text-white/60">
                  <Kv
                    rows={[
                      { t: "Автор", v: cur.author },
                      { t: "Дата съёмки", v: cur.date },
                      { t: "Геометка", v: cur.geo },
                    ]}
                  />
                </div>
                <span className="mt-4 mb-2 block text-[13px] text-white/60">Теги</span>
                <span className="flex flex-wrap gap-1.5">
                  {cur.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </span>
                <span className="mt-4 mb-2 block text-[13px] text-white/60">Описание</span>
                <p className="text-sm leading-relaxed">{cur.text}</p>
                <div className="mt-auto flex gap-2 pt-5">
                  <button
                    type="button"
                    className={cn(btn({ sm: true }), "border-white/10 bg-white/5 text-white")}
                    onClick={() => later("Обложка")}
                  >
                    <Star />
                    Сделать обложкой
                  </button>
                  <button
                    type="button"
                    className={cn(btn({ sm: true }), "border-white/10 bg-white/5 text-white")}
                    onClick={() => later("Правка описания")}
                  >
                    <Pencil />
                    Изменить
                  </button>
                </div>
              </aside>
            </div>
          )}

          <footer className="mt-5 flex items-center gap-2.5 overflow-x-auto">
            {thumbs.map((m, n) => (
              <button
                key={n}
                type="button"
                onClick={() => go(n)}
                className={cn(
                  "relative h-20 w-[120px] flex-none rounded-xl border-2 border-white/10 bg-cover bg-center",
                  n === i && "border-[#085eff]",
                )}
                style={{ backgroundImage: `url(${m.src})` }}
                aria-label={m.title}
              >
                {m.video && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-1.5 text-[11px] font-bold">▶ {m.video}</span>
                )}
              </button>
            ))}
            {!more && list.length > 6 && (
              <button
                type="button"
                onClick={() => setMore(true)}
                className="grid h-20 w-[120px] flex-none place-items-center rounded-xl border-2 border-white/10 text-lg font-semibold"
              >
                +{list.length - 6}
              </button>
            )}
            <span className="ml-auto flex-none text-[13px] text-white/55 max-sm:hidden">← → листать · Esc закрыть</span>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
