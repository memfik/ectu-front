"use client"

import { useState } from "react"
import { Check, CircleAlert, FileSpreadsheet, FileUp, Upload } from "lucide-react"
import { ImportDialog } from "@/components/list/import-dialog"
import { btn, Pill } from "@/components/list/ui"
import { Card, glass } from "@/components/passport/ui"
import { LISTS } from "@/sections"
import { downloadTemplate } from "@/lib/list/import"
import { cn } from "@/lib/utils"

/*
 * Импорт Excel (макет 17): шаблоны всех разделов и история импортов; сам импорт — то же окно, что в списках
 * (тип и филиал → файл → проверка). TODO: сопоставление колонок (шаг 3 макета) и история — API.
 */

const HISTORY: [string, string, string, "ok" | "bad"][] = [
  ["Узлы связи · ЮФ", "сегодня 15:12 · 128 строк", "3 ошибки", "bad"],
  ["ВОЛС · АС", "вчера · 42 строки", "Успешно", "ok"],
  ["СПД · ВФ", "05.10 · 310 строк", "Успешно", "ok"],
  ["Клиенты · ГО", "01.10 · 12 004", "Успешно", "ok"],
]

export function ImportPage() {
  const [open, setOpen] = useState<string | null>(null)
  const sections = Object.values(LISTS).filter((l) => l.buttons.some((b) => b.onClick === "import"))

  return (
    <div className="px-(--page-gutter)">
      <section className="relative -mx-(--page-gutter) -mt-[96px] px-(--page-gutter) pt-[150px] pb-6">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(800px_400px_at_20%_30%,rgba(43,212,99,0.1),transparent_70%)]"
        />
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <p className="text-sm text-muted-foreground">Сервисы</p>
            <h1 className="mt-1.5 text-[60px] leading-[1.05] font-semibold tracking-[-1.6px] max-sm:text-[34px]">Импорт Excel</h1>
            <p className="mt-2 text-[15px] text-[var(--nav-text)]">Загрузка реестров из Excel в любой раздел ЕСТУ</p>
          </div>
          <button type="button" className={cn(btn({ primary: true }), "ml-auto")} onClick={() => setOpen("nodes")}>
            <Upload />
            Начать импорт
          </button>
        </div>
      </section>
      <div className="grid grid-cols-5 gap-3.5 max-[1279px]:grid-cols-3 max-sm:grid-cols-2">
        {(
          [
            ["Импортов в октябре", "42", "#085eff"],
            ["Строк загружено", "18 204", "#2bd463"],
            ["С ошибками", "3", "#ff5257"],
            ["Среднее время", "14 сек", "#a78bfa"],
            ["Шаблонов", String(sections.length), "#22d3ee"],
          ] as const
        ).map(([t, v, c]) => (
          <div key={t} className={cn(glass, "px-5 py-[18px]")}>
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <i className="size-[7px] rounded-full" style={{ background: c }} />
              {t}
            </span>
            <b className="mt-2 block text-[30px] font-medium tabular-nums">{v}</b>
          </div>
        ))}
      </div>
      <div className="mt-[18px] grid grid-cols-[1.6fr_1fr] items-start gap-[18px] max-[1279px]:grid-cols-1">
        <Card icon={FileSpreadsheet} title="Шаблоны" count={sections.length}>
          <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
            {sections.map((l) => (
              <div key={l.key} className="flex items-center gap-3 rounded-2xl border border-border bg-[var(--chip-bg)] p-3.5">
                <span className="grid h-10 w-10 flex-none place-items-start rounded-md bg-[rgba(43,212,99,0.14)] px-1 pt-0.5 text-[13px] font-medium text-[var(--status-ok)]">
                  XLS
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13.5px] font-semibold">{l.title}</b>
                  <button type="button" className="text-xs text-[var(--link)]" onClick={() => downloadTemplate(l)}>
                    Скачать шаблон
                  </button>
                </span>
                <button type="button" className={btn({ sm: true })} onClick={() => setOpen(l.key)} aria-label={`Импорт: ${l.title}`}>
                  <FileUp />
                </button>
              </div>
            ))}
          </div>
        </Card>
        <Card icon={Upload} title="Последние импорты">
          {HISTORY.map(([t, s, r, tone]) => (
            <div key={t} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
              <span className="grid h-10 w-10 place-items-start rounded-md bg-[rgba(43,212,99,0.14)] px-1 pt-0.5 text-[13px] font-medium text-[var(--status-ok)]">
                XLS
              </span>
              <span className="flex-1">
                <b className="block text-sm font-semibold">{t}</b>
                <span className="text-xs text-muted-foreground">{s}</span>
              </span>
              <Pill tone={tone}>
                {tone === "ok" ? <Check className="size-3" /> : <CircleAlert className="size-3" />}
                {r}
              </Pill>
            </div>
          ))}
        </Card>
      </div>
      {open && LISTS[open] && <ImportDialog key={open} cfg={LISTS[open]} onType={setOpen} onClose={() => setOpen(null)} />}
    </div>
  )
}
