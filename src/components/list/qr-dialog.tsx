"use client"

import { useMemo, useState } from "react"
import { Dialog } from "radix-ui"
import { Copy, Download, FileText, Image as ImageIcon, Printer, QrCode, X } from "lucide-react"
import { encode } from "uqr"
import { toast } from "@/components/shared/toast"
import { cn } from "@/lib/utils"
import { btn, circ } from "./ui"

type Layout = "sticker" | "a4"

/** Путь SVG по модулям QR; центр 5×5 пропускается под синий квадрат-логотип (запас коррекции H). */
function qrPath(url: string) {
  const { data, size } = encode(url, { ecc: "H", border: 0 })
  const c = Math.floor(size / 2)
  let d = ""
  data.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on && !(Math.abs(x - c) <= 2 && Math.abs(y - c) <= 2)) d += `M${x} ${y}h1v1h-1z`
    }),
  )
  return { d, size, c }
}

function QrSvg({ url, className }: { url: string; className?: string }) {
  const { d, size, c } = useMemo(() => qrPath(url), [url])
  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className={className} shapeRendering="crispEdges" aria-label={`QR: ${url}`}>
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#fff" />
      <path d={d} fill="#000" />
      <rect x={c - 1.5} y={c - 1.5} width={4} height={4} rx={1} fill="#085eff" />
    </svg>
  )
}

/** QR-код для наклейки (экран n-10): ссылка на запись, наклейка 50×30 или лист A4 на 24 шт., PNG и печать. */
export function QrDialog({ title, sub, url, onClose }: { title: string; sub: string; url: string; onClose: () => void }) {
  const [layout, setLayout] = useState<Layout>("sticker")

  const png = () => {
    const svg = document.querySelector<SVGSVGElement>("#qr-svg svg")
    if (!svg) return
    const img = new Image()
    img.onload = () => {
      const k = 8
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = svg.viewBox.baseVal.width * k
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      const a = document.createElement("a")
      a.href = canvas.toDataURL("image/png")
      a.download = `QR_${title}.png`
      a.click()
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
  }

  const print = () => {
    const svg = document.querySelector("#qr-svg svg")?.outerHTML ?? ""
    const w = window.open("", "_blank")
    if (!w) return toast("Разрешите всплывающие окна для печати")
    const esc = (v: string) => v.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]!)
    const label = `<div class="l">${svg}<div><b>${esc(title)}</b><span>${esc(sub)}</span></div></div>`
    w.document.write(`<!doctype html><meta charset="utf-8"><title>QR · ${esc(title)}</title>
<style>@page{size:${layout === "a4" ? "A4" : "50mm 30mm"};margin:${layout === "a4" ? "8mm" : "0"}}body{margin:0;font:7pt Inter,system-ui,sans-serif}
.g{display:grid;grid-template-columns:repeat(${layout === "a4" ? 3 : 1},50mm);gap:${layout === "a4" ? "3mm 12mm" : "0"}}
.l{width:50mm;height:30mm;box-sizing:border-box;padding:2mm;display:flex;gap:2mm;align-items:center;${layout === "a4" ? "border:0.2mm dashed #bbb" : ""}}
.l svg{width:26mm;height:26mm;flex:none}.l b{display:block;font-size:8pt}.l span{display:block;color:#444;margin-top:1mm}</style>
<div class="g">${Array(layout === "a4" ? 24 : 1)
      .fill(label)
      .join("")}</div>`)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-[rgba(5,6,9,0.55)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[111] w-[460px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-6 text-[var(--mg-text)] shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
        >
          <header className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              <QrCode className="size-[18px]" />
            </span>
            <Dialog.Title className="flex-1 text-xl font-semibold">QR-код для наклейки</Dialog.Title>
            <Dialog.Close className={circ} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>

          <div id="qr-svg" className="mx-auto mt-5 size-60 overflow-hidden rounded-[20px] bg-white p-3">
            <QrSvg url={url} className="size-full" />
          </div>
          <b className="mt-4 block text-center text-lg font-semibold">{title}</b>
          <p className="mt-0.5 text-center text-[13px] text-muted-foreground">{sub}</p>

          <div className="mt-4 flex h-11 items-center gap-2 rounded-[14px] border border-[var(--dd-line)] bg-[var(--chip-bg)] pr-2 pl-3.5 text-[13px] text-muted-foreground">
            <span className="flex-1 truncate">{url}</span>
            <button
              type="button"
              aria-label="Скопировать ссылку"
              className="grid size-8 place-items-center rounded-lg hover:bg-[var(--nav-hover)]"
              onClick={() => navigator.clipboard?.writeText(url).then(() => toast("Ссылка скопирована"))}
            >
              <Copy className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {(
              [
                ["sticker", "Наклейка 50×30", ImageIcon],
                ["a4", "A4 · 24 шт.", FileText],
              ] as const
            ).map(([k, t, I]) => (
              <button
                key={k}
                type="button"
                aria-pressed={layout === k}
                onClick={() => setLayout(k)}
                className={cn(
                  "flex h-12 items-center gap-2.5 rounded-[14px] border border-[var(--dd-line)] bg-[var(--chip-bg)] px-4 text-sm",
                  layout === k && "border-[#085eff] bg-[rgba(8,94,255,0.12)] shadow-[0_0_0_1px_#085eff]",
                )}
              >
                <I className="size-[18px]" />
                {t}
              </button>
            ))}
          </div>

          <footer className="mt-6 flex justify-end gap-2.5">
            <button type="button" className={btn()} onClick={png}>
              <Download />
              Скачать PNG
            </button>
            <button type="button" className={btn({ primary: true })} onClick={print}>
              <Printer />
              Печать
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
