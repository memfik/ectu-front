"use client"

import { usePageTitle } from "@/hooks/use-page-title"
import { useState } from "react"
import { RotateCw } from "lucide-react"
import { btn } from "@/components/list/ui"
import { glass } from "@/components/passport/ui"
import { Equipment3D, type ModelKey } from "@/components/three/equipment-3d"
import { MODELS } from "@/components/three/models"
import { cn } from "@/lib/utils"

/*
 * 3D-каталог оборудования (папка «3D-интерактив» / «3D-оборудование» архива макетов): модели по типу корпуса на Three.js.
 * TODO: «Передняя панель» с выносками и редактор портов из 3D-оборудование.html — порты и их состояние из spd_equipment_ports (API на запись).
 */
export default function Equipment3DPage() {
  usePageTitle("3D-каталог")
  const [model, setModel] = useState<ModelKey>("node")
  const [rotate, setRotate] = useState(true)
  return (
    <div className="px-(--page-gutter) pb-8">
      <section className="flex flex-wrap items-end gap-5 pt-8 pb-5">
        <div>
          <p className="text-sm text-muted-foreground">Оборудование</p>
          <h1 className="mt-1.5 text-[52px] leading-[1.05] font-semibold tracking-[-1.4px] max-sm:text-[32px]">3D-каталог</h1>
          <p className="mt-2 text-[15px] text-[var(--nav-text)]">Модели оборудования по типу корпуса · вращение мышью, колесо — масштаб, правая кнопка — сдвиг</p>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(MODELS) as ModelKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setModel(k)}
            className={cn(
              "h-10 rounded-full border border-border px-4 text-[13px]",
              model === k ? "border-[#085eff] bg-[#085eff] font-semibold text-white" : "text-[var(--nav-text)] hover:text-foreground",
            )}
          >
            {MODELS[k].title}
          </button>
        ))}
        <button type="button" className={cn(btn(), "ml-auto", rotate && "border-[#085eff]")} onClick={() => setRotate(!rotate)}>
          <RotateCw />
          Автоповорот
        </button>
      </div>
      <section className={cn(glass, "relative mt-[18px] h-[calc(100vh-330px)] min-h-[480px] overflow-hidden")}>
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_55%_45%,rgba(8,94,255,0.16),transparent_70%)]" />
        <Equipment3D key={model} model={model} autoRotate={rotate} className="absolute inset-0" />
        <p className="pointer-events-none absolute bottom-4 left-5 text-[12px] text-muted-foreground">Наведите на устройство в стойке — подсказка с его именем</p>
      </section>
    </div>
  )
}
