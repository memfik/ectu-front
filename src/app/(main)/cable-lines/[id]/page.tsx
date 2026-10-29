"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Box, Cable, FileText, GitBranch, History, Image as ImageIcon, Layers, LayoutGrid, Map as MapIcon, MapPin, Phone, RadioTower, Rows3, Ruler, Waypoints } from "lucide-react"
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
import { CableLineForm } from "@/components/cable-lines/cable-line-form"
import { LineBackdrop, LineSchema, type LineStage } from "@/components/lines/line-stage"
import { Gallery } from "@/components/passport/gallery"
import { SegBar } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { cableLineCount, cableLineDetail, cableLineName, cableLines, cableLineStatus, cableLineSub, useCableLine } from "@/lib/api/cable-lines"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { kmStr, type LineKind, type Segment } from "@/lib/api/lines"
import { LineDocsTab, LineHistoryTab, SegmentsTab, StrandsTab } from "@/components/lines/tabs"

/*
 * 08 КЛС — паспорт трассы /cable-lines/<id> (kls-04 «3D / Схема / Карта / Фото», вкладки kls-t1…t4).
 * Запись — useCableLine(id), участки и медные пары — cableLineDetail() из lib/api/cable-lines, вёрстка — блоки components/blocks.
 */

type TabKey = "overview" | "segments" | "strands" | "docs" | "history"

const COLOR = "#ffc53d"
const UNIT: [string, string, string] = ["трасса", "трассы", "трасс"]
/** Медные пары: подписи и цвета своих JM (a) и арендованных (b). */
const STRAND: LineKind["strand"] = { tab: "Медные пары", stat: "Медных пар", a: ["JM", COLOR], b: ["Аренда", "#a78bfa"] }
const point = (i: number) => `Бокс М-${i + 1}`
const STAGES: [LineStage, string, typeof Box][] = [
  ["scene", "3D", Box],
  ["schema", "Схема", Layers],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

const km1 = (v: number) => kmStr(Math.round(v * 10) / 10)

export default function CableLinePage({ params }: PageProps<"/cable-lines/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useCableLine(id)
  const base = useMemo(() => (x ? cableLineDetail(x) : null), [x])
  // Участки правятся на месте (TODO(API): сохранение участков)
  const [segments, setSegments] = useState<Segment[] | null>(null)
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? cableLineName(x) : "КЛС · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !base) return <RecordNotFound title="Запись не найдена" href="/cable-lines" back="К списку КЛС" />

  const d = { ...base, segments: segments ?? base.segments }
  const [label, tone] = cableLineStatus(x)
  const name = cableLineName(x)
  const a = d.strands.filter((f) => f === "a").length
  const b = d.strands.filter((f) => f === "b").length
  const free = d.strands.length - a - b
  // «Занято» у КЛС — свои и арендованные пары
  const busy = a + b
  const len = d.segments.reduce((s, v) => s + v.len, 0)
  const cable = d.segments.reduce((s, v) => s + v.cable, 0)
  const docsUp = d.docs.filter((doc) => doc.uploaded).length
  const c = cableLineCount(x)
  const editable = !cableLines.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["КЛС"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, scene: "/nodes/kls-3d.png", point }} />}>
        <PassportHeader
          crumb="Линии и сооружения"
          listHref="/cable-lines"
          listTitle="КЛС"
          title={name}
          status={{ label, tone }}
          // В записи КЛС нет типа сети — как в старом паспорте, «ГРС»
          pill="ГРС"
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Ruler} t="Протяжённость" v={km1(len)} em="км" />
          <PassportStat icon={Rows3} t="Медных пар" v={d.strands.length} em={`${busy} занято`} />
          <PassportStat icon={MapPin} t="Участков" v={d.segments.length} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Наименование трассы КЛС", v: String(x.f.name ?? "—") },
                { t: "Протяжённость трассы, км", v: String(x.f.len ?? "—") },
                { t: "Суммарная длина кабеля, км", v: String(cable.toFixed(2)).replace(".", ",") },
                { t: "Начало участка", v: d.start.title },
                { t: "Конец участка", v: d.end.title },
                { t: "Тип сети", v: "ГРС" },
                { t: "Принадлежность кабеля", v: String(x.f.owner ?? "—") },
                { t: "Общее кол-во медных пар", v: c.total },
                { t: "Пар принадл. JM", v: c.a },
                { t: "Арендуемых пар", v: c.b },
              ]}
            />
            <StageArea>
              {stage === "schema" && (
                <LineSchema d={d} k={{ color: COLOR, strip: "dots", strand: STRAND }} stripTitle={`Медные пары ТПП ${d.strands.length}×2 · JM ${a} · аренда ${b} · свободно ${free}`} />
              )}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: "АТС-21", href: `/nodes/${x.nodeId}` },
                  { icon: Phone, t: "АТС Iskratel SI 2000", sub: "станция", href: "/pbx" },
                  { icon: Waypoints, t: "КК №44", sub: "канализация", href: "/cable-ducts" },
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
          { k: "segments", t: "Участки", icon: GitBranch, n: d.segments.length },
          { k: "strands", t: "Медные пары", icon: Rows3, n: d.strands.length },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "history", t: "История", icon: History, n: d.history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Ruler} title="Протяжённость" onOpen={() => setTab("segments")}>
              {km1(len)} <em>км</em>
            </SummaryCard>
            <SummaryCard
              icon={Rows3}
              title="Медные пары"
              onOpen={() => setTab("strands")}
              bar={
                <SegBar
                  parts={[
                    { v: a, color: STRAND.a[1] },
                    { v: b, color: STRAND.b[1] },
                    { v: free, color: "var(--chip-bg)" },
                  ]}
                />
              }
            >
              {busy} / {d.strands.length} <em>занято</em>
            </SummaryCard>
            <SummaryCard icon={GitBranch} title="Участки" onOpen={() => setTab("segments")}>
              {d.segments.length}
            </SummaryCard>
            <SummaryCard
              icon={FileText}
              title="Документы"
              onOpen={() => setTab("docs")}
              bar={
                <SegBar
                  parts={[
                    { v: docsUp, color: "var(--status-ok)" },
                    { v: d.docs.length - docsUp, color: "var(--chip-bg)" },
                  ]}
                />
              }
            >
              {docsUp} / {d.docs.length} <em>загружено</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "segments" && <SegmentsTab d={d} k={{ point }} onChange={setSegments} />}
        {tab === "strands" && (
          <StrandsTab
            x={x}
            d={d}
            k={{
              strand: STRAND,
              strandRows: () => [
                { t: "Общее количество медных пар", v: d.strands.length },
                { t: "Принадлежит JM", v: a },
                { t: "Арендуемых", v: b },
                { t: "Свободно", v: free },
              ],
            }}
          />
        )}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={cableLineSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={cableLineSub(x)} url={qrUrl("cable-lines", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <CableLineForm
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
          icon={Cable}
          noun={UNIT}
          items={[{ id: x.id, name, sub: cableLineSub(x) }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => cableLines.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/cable-lines")}
        />
      )}
    </div>
  )
}
