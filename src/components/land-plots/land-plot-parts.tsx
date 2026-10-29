"use client"

import { FileText, Upload } from "lucide-react"
import { Card } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { landArea, TITLE_DOCS, TITLE_UP, type LandPlot } from "@/lib/api/land-plots"
import { cn } from "@/lib/utils"

/*
 * Части паспорта земельного участка (макет 37): вкладка правоустанавливающих документов (lp-t1)
 * и схема — контур участка с размерами (lp-04-schema).
 * TODO(API): контур и размеры участка, файлы правоустанавливающих документов — нет в /api/land-plots.
 */

/** Вкладка lp-t1: правоустанавливающие документы. */
export function TitleDocs() {
  const upload = () => toast("Загрузка документов — после подключения API")
  return (
    <Card icon={FileText} title="Документы" count={TITLE_DOCS.length} className="max-w-[1100px]">
      <div className="flex flex-col gap-2">
        {TITLE_DOCS.map((t, i) => (
          <div key={t} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
            <span className="grid size-8 flex-none place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
              <FileText className="size-4" />
            </span>
            <b className="text-[13.5px] font-semibold">{t}</b>
            <span
              className={cn(
                "flex-none rounded-full px-2.5 py-1 text-xs font-medium",
                i < TITLE_UP ? "bg-[rgba(43,212,99,0.14)] text-[var(--status-ok)]" : "bg-[var(--chip-bg)] text-muted-foreground",
              )}
            >
              {i < TITLE_UP ? "Загружено" : "Нет файла"}
            </span>
            <button
              type="button"
              onClick={upload}
              aria-label="Загрузить файл"
              className="grid size-8 place-items-center rounded-full bg-[var(--chip-bg)] text-muted-foreground hover:text-foreground [&_svg]:size-4"
            >
              <Upload />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}

/** Схема: контур участка с размерами сторон, АМС, контейнер и ввод ВОЛС. */
export function PlotSchema({ x }: { x: LandPlot }) {
  const vols = String(x.f.vols ?? "—")
  return (
    <div className="absolute inset-x-0 top-[50px] flex justify-center max-[1279px]:top-0">
      <svg viewBox="0 0 640 460" className="h-[480px] w-auto max-w-full" fill="none">
        <text x="300" y="34" textAnchor="middle" fontSize="11" fill="#3ddc84">
          кад. № {String(x.f.cadastre ?? "—").split(",")[0]} · {landArea(x)} га
        </text>
        <path d="M120 70 L520 50 L560 330 L170 370 Z" fill="rgba(61,220,132,0.12)" stroke="#3ddc84" strokeWidth="2.5" />
        <text x="320" y="52" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
          24,1 м
        </text>
        <text x="555" y="200" fontSize="10" fill="var(--muted-foreground)">
          31,4 м
        </text>
        <text x="360" y="375" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
          24,8 м
        </text>
        <text x="138" y="215" textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
          32,0 м
        </text>
        <rect x="290" y="175" width="56" height="56" rx="8" fill="#085eff" />
        <text x="318" y="207" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">
          АМС
        </text>
        <rect x="380" y="245" width="76" height="40" rx="8" fill="var(--glass-card-solid)" stroke="var(--border)" />
        <text x="418" y="269" textAnchor="middle" fontSize="9.5" fill="var(--foreground)">
          контейнер
        </text>
        {vols !== "—" && (
          <>
            <path d="M170 370 L70 420" stroke="#4f8dff" strokeWidth="2" strokeDasharray="6 5" />
            <text x="90" y="445" textAnchor="middle" fontSize="10.5" fill="#4f8dff">
              {vols}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
