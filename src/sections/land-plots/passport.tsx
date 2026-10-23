"use client"

import { toast } from "@/components/shared/toast"
import { Calendar, FileText, LandPlot, RadioTower, Upload } from "lucide-react"
import { Card, SegBar } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { type LineKind } from "@/sections/lines/detail"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { cn } from "@/lib/utils"
import { list, spec } from "./config"

/*
 * Земельный участок (макет 37): 3D — участок с мачтой (картинка из макета), схема — контур участка с размерами,
 * вкладки «Правоустанавливающие документы», «Документация», «История».
 * TODO(API): контур и размеры участка, файлы правоустанавливающих документов — нет в /api/land-plots.
 */

const f = (x: GenRow, k: string, d = "—") => String(x.f[k] ?? d)
const ha = (x: GenRow) => f(x, "area", "0").replace(".", ",")
const leaseYear = (x: GenRow) => f(x, "lease").match(/\d{4}/)?.[0] ?? "—"

const TITLE_DOCS = [
  "Гос. акт",
  "Постановление",
  "Тех. паспорт",
  "Договор купли/аренды",
  "Свидетельство о регистрации",
  "Акт приёма-передачи",
  "Акт ввода в эксплуатацию",
]
const TITLE_UP = 5

/** Вкладка lp-t1: правоустанавливающие документы. */
function TitleDocs() {
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

/** Схема (lp-04-schema): контур участка с размерами сторон, АМС, контейнер и ввод ВОЛС. */
function Plot({ x }: { x: GenRow }) {
  return (
    <div className="absolute inset-x-0 top-[50px] flex justify-center max-[1279px]:top-0">
      <svg viewBox="0 0 640 460" className="h-[480px] w-auto max-w-full" fill="none">
        <text x="300" y="34" textAnchor="middle" fontSize="11" fill="#3ddc84">
          кад. № {f(x, "cadastre").split(",")[0]} · {ha(x)} га
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
        {f(x, "vols") !== "—" && (
          <>
            <path d="M170 370 L70 420" stroke="#4f8dff" strokeWidth="2" strokeDasharray="6 5" />
            <text x="90" y="445" textAnchor="middle" fontSize="10.5" fill="#4f8dff">
              {f(x, "vols")}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}

const LAND: LineKind = {
  section: "land-plots",
  spec,
  list,
  point: (i) => `Точка ${i + 1}`,
  color: "#3ddc84",
  scene: "/nodes/land-3d.png",
  schemaNode: (c) => <Plot x={c.x} />,
  strand: { tab: "", stat: "", a: ["", "#3ddc84"], b: ["", "#ffc53d"] },
  strip: "bars",
  stripTitle: () => "",
  count: () => ({ total: 0, a: 0, b: 0 }),
  pill: (x) => f(x, "own"),
  stats: (c) => [
    { icon: LandPlot, t: "Площадь", v: ha(c.x), em: "га" },
    { icon: Calendar, t: f(c.x, "own") === "Собственность" ? "Собственность" : "Аренда до", v: leaseYear(c.x) },
    { icon: FileText, t: "Документов", v: `${TITLE_UP} / ${TITLE_DOCS.length}` },
  ],
  summary: (c) => [
    { icon: LandPlot, title: "Площадь", tab: "title", v: <>{ha(c.x)} га</> },
    { icon: Calendar, title: "Аренда", tab: "title", v: leaseYear(c.x) === "—" ? "—" : `до ${leaseYear(c.x)}` },
    {
      icon: FileText,
      title: "Документы",
      tab: "title",
      v: `${TITLE_UP} / ${TITLE_DOCS.length}`,
      bar: (
        <SegBar
          parts={[
            { v: TITLE_UP, color: "#085eff" },
            { v: TITLE_DOCS.length - TITLE_UP, color: "var(--chip-bg)" },
          ]}
        />
      ),
    },
    { icon: RadioTower, title: "Узел", tab: "title", v: c.x.nodeCode },
  ],
  tabs: () => [{ k: "title", t: "Правоустанавливающие документы", icon: FileText, n: TITLE_DOCS.length, node: <TitleDocs /> }],
  ends: (x, a) => [
    { code: x.nodeCode, title: a ? a.object : x.nodeCode, nodeId: a?.id },
    { code: "—", title: "—" },
  ],
  rows: (x) => [
    { t: "Наименование", v: f(x, "name") },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Узел связи", v: x.nodeCode },
    { t: "ВОЛС", v: f(x, "vols") },
    { t: "Кадастровый номер", v: f(x, "cadastre") },
    { t: "Вид собственности", v: f(x, "own") },
    { t: "Вид объекта", v: f(x, "kind") },
    { t: "Площадь, га", v: f(x, "area") },
    { t: "Зарегистрирован", v: f(x, "registered") },
    { t: "Сроки аренды", v: f(x, "lease") },
  ],
  related: (x) => [
    { icon: RadioTower, t: x.nodeCode, sub: "узел связи", href: `/nodes/${x.nodeId}` },
    ...(f(x, "vols") !== "—" ? [{ icon: LandPlot, t: f(x, "vols"), sub: "ВОЛС", href: "/fiber-lines" }] : []),
    { icon: FileText, t: "Гос. акт", sub: "PDF" },
  ],
  strandRows: () => [],
  inputDocs: [
    { t: "Гос. акт", n: "PDF" },
    { t: "Договор аренды", n: "есть" },
    { t: "Фото", n: "6" },
  ],
  docs: [
    { name: "Паспорт оборудования", req: "PDF · производитель", uploaded: true },
    { name: "Номер и дата акта о вводе в эксплуатацию", req: "№ 154 от 12.03.2019", uploaded: true },
    { name: "Распоряжение / наряд", req: "№ 007-р", uploaded: true },
    { name: "Схема подключения", req: "—", uploaded: false },
  ],
  lastEdit: () => ["Изменено поле паспорта", "—", "заполнено"],
}

/** Паспорт земельного участка (макет 37). */
export function LandPassport({ id }: { id: number }) {
  return <LinePassport k={LAND} id={id} />
}
