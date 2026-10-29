"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Box, Calendar, FileText, History, Image as ImageIcon, LandPlot as LandPlotIcon, Layers, LayoutGrid, Map as MapIcon, RadioTower } from "lucide-react"
import { DeleteDialog } from "@/components/blocks/delete-dialog"
import {
  InputDocsCard,
  PassportCard,
  PassportColumns,
  PassportHeader,
  PassportLoading,
  PassportSide,
  PassportStat,
  PassportTabs,
  PassportTop,
  PhotoStrip,
  RelatedCard,
  ResponsibleCard,
  StageArea,
  StageSwitch,
  SummaryCard,
  SummaryGrid,
  TabBody,
} from "@/components/blocks/passport"
import { QrDialog } from "@/components/blocks/qr-dialog"
import { LandPlotForm } from "@/components/land-plots/land-plot-form"
import { PlotSchema, TitleDocs } from "@/components/land-plots/land-plot-parts"
import { LineBackdrop, type LineStage } from "@/components/lines/line-stage"
import { Gallery } from "@/components/passport/gallery"
import { SegBar } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import {
  landArea,
  landPlotDetail,
  landPlotName,
  landPlots,
  landPlotStatus,
  landPlotSub,
  leaseYear,
  TITLE_DOCS,
  TITLE_UP,
  useLandPlot,
} from "@/lib/api/land-plots"
import { LineDocsTab, LineHistoryTab } from "@/components/lines/tabs"

/*
 * 37 Земельные участки — паспорт /land-plots/<id>: 3D — участок с мачтой (картинка из макета), схема — контур участка
 * с размерами, вкладки «Правоустанавливающие документы», «Документация», «История».
 * Запись — useLandPlot(id), документы и история — landPlotDetail() из lib/api/land-plots.
 */

type TabKey = "overview" | "title" | "docs" | "history"

const UNIT: [string, string, string] = ["участок", "участка", "участков"]
const point = (i: number) => `Точка ${i + 1}`
const STAGES: [LineStage, string, typeof Box][] = [
  ["scene", "3D", Box],
  ["schema", "Схема", Layers],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function LandPlotPage({ params }: PageProps<"/land-plots/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useLandPlot(id)
  const d = useMemo(() => (x ? landPlotDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? landPlotName(x) : "Земельный участок · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/land-plots" back="К списку Земельные участки" />

  const [label, tone] = landPlotStatus(x)
  const name = landPlotName(x)
  const own = String(x.f.own ?? "—")
  const vols = String(x.f.vols ?? "—")
  const year = leaseYear(x)
  const editable = !landPlots.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["Земельные участки"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: "#3ddc84", scene: "/nodes/land-3d.png", point }} />}>
        <PassportHeader
          crumb="Сеть"
          listHref="/land-plots"
          listTitle="Земельные участки"
          title={name}
          status={{ label, tone }}
          pill={own}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={LandPlotIcon} t="Площадь" v={landArea(x)} em="га" />
          <PassportStat icon={Calendar} t={own === "Собственность" ? "Собственность" : "Аренда до"} v={year} />
          <PassportStat icon={FileText} t="Документов" v={`${TITLE_UP} / ${TITLE_DOCS.length}`} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Наименование", v: String(x.f.name ?? "—") },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Узел связи", v: x.nodeCode },
                { t: "ВОЛС", v: vols },
                { t: "Кадастровый номер", v: String(x.f.cadastre ?? "—") },
                { t: "Вид собственности", v: own },
                { t: "Вид объекта", v: String(x.f.kind ?? "—") },
                { t: "Площадь, га", v: String(x.f.area ?? "—") },
                { t: "Зарегистрирован", v: String(x.f.registered ?? "—") },
                { t: "Сроки аренды", v: String(x.f.lease ?? "—") },
              ]}
            />
            <StageArea>
              {stage === "schema" && <PlotSchema x={x} />}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: "узел связи", href: `/nodes/${x.nodeId}` },
                  ...(vols !== "—" ? [{ icon: LandPlotIcon, t: vols, sub: "ВОЛС", href: "/fiber-lines" }] : []),
                  { icon: FileText, t: "Гос. акт", sub: "PDF" },
                ]}
              />
              <InputDocsCard docs={d.inputDocs} onOpen={() => setTab("docs")} />
              <ResponsibleCard />
            </PassportSide>
          </PassportColumns>
        )}
      </PassportTop>

      <PassportTabs<TabKey>
        value={tab}
        onChange={setTab}
        tabs={[
          { k: "overview", t: "Обзор", icon: LayoutGrid },
          { k: "title", t: "Правоустанавливающие документы", icon: FileText, n: TITLE_DOCS.length },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "history", t: "История", icon: History, n: d.history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={LandPlotIcon} title="Площадь" onOpen={() => setTab("title")}>
              {landArea(x)} га
            </SummaryCard>
            <SummaryCard icon={Calendar} title="Аренда" onOpen={() => setTab("title")}>
              {year === "—" ? "—" : `до ${year}`}
            </SummaryCard>
            <SummaryCard
              icon={FileText}
              title="Документы"
              onOpen={() => setTab("title")}
              bar={
                <SegBar
                  parts={[
                    { v: TITLE_UP, color: "#085eff" },
                    { v: TITLE_DOCS.length - TITLE_UP, color: "var(--chip-bg)" },
                  ]}
                />
              }
            >
              {`${TITLE_UP} / ${TITLE_DOCS.length}`}
            </SummaryCard>
            <SummaryCard icon={RadioTower} title="Узел" onOpen={() => setTab("title")}>
              {x.nodeCode}
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "title" && <TitleDocs />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={landPlotSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={landPlotSub(x)} url={qrUrl("land-plots", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <LandPlotForm
          row={x}
          onClose={() => setEdit(false)}
          onDelete={() => {
            setEdit(false)
            setDel(true)
          }}
        />
      )}
      {del && (
        <DeleteDialog
          icon={LandPlotIcon}
          noun={UNIT}
          items={[{ id: x.id, name, sub: landPlotSub(x) }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => landPlots.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/land-plots")}
        />
      )}
    </div>
  )
}
