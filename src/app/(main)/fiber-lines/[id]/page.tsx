"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Box, Cable, FileText, GitBranch, History, Image as ImageIcon, Layers, LayoutGrid, Map as MapIcon, MapPin, RadioTower, Rows3, Ruler, Server, Waypoints } from "lucide-react"
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
import { FiberLineForm } from "@/components/fiber-lines/fiber-line-form"
import { LineBackdrop, LineSchema, type LineStage } from "@/components/lines/line-stage"
import { Gallery } from "@/components/passport/gallery"
import { SegBar } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { fiberLineDetail, fiberLineName, fiberLines, fiberLineSub, fiberStatus, useFiberLine } from "@/lib/api/fiber-lines"
import { kmStr, type LineKind, type Segment } from "@/sections/lines/detail"
import { LineDocsTab, LineHistoryTab, RentTab, SegmentsTab, StrandsTab } from "@/sections/lines/tabs"

/*
 * 07 ВОЛС — паспорт трассы /fiber-lines/<id> (vols-04 «3D / Схема / Карта / Фото», вкладки vols-t1…t5, окно участка vols-x0).
 * Запись — useFiberLine(id), участки и волокна — fiberLineDetail() из lib/api/fiber-lines, вёрстка — блоки components/blocks.
 */

type TabKey = "overview" | "segments" | "strands" | "rent" | "docs" | "history"

const COLOR = "#4f8dff"
/** Волокна: подписи и цвета занятых (a) и резерва (b). */
const STRAND: LineKind["strand"] = { tab: "Волокна", stat: "Волокон", a: ["Занято", COLOR], b: ["Резерв", "#ffc53d"] }
const STAGES: [LineStage, string, typeof Box][] = [
  ["scene", "3D", Box],
  ["schema", "Схема", Layers],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

const km1 = (v: number) => kmStr(Math.round(v * 10) / 10)

export default function FiberLinePage({ params }: PageProps<"/fiber-lines/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useFiberLine(id)
  const base = useMemo(() => (x ? fiberLineDetail(x) : null), [x])
  // Участки правятся на месте (TODO(API): сохранение участков)
  const [segments, setSegments] = useState<Segment[] | null>(null)
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? fiberLineName(x) : "ВОЛС · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !base) return <RecordNotFound title="Запись не найдена" href="/fiber-lines" back="К списку ВОЛС" />

  const d = { ...base, segments: segments ?? base.segments }
  const [label, tone] = fiberStatus(x)
  const name = fiberLineName(x)
  const a = d.strands.filter((f) => f === "a").length
  const b = d.strands.filter((f) => f === "b").length
  const free = d.strands.length - a - b
  const len = d.segments.reduce((s, v) => s + v.len, 0)
  const cable = d.segments.reduce((s, v) => s + v.cable, 0)
  const points = Math.max(0, d.segments.length - 1)
  const docsUp = d.docs.filter((doc) => doc.uploaded).length
  const own = String(x.f.owner ?? "").includes("QMobile")
  const editable = !fiberLines.readOnly()

  const strandBar = (
    <SegBar
      parts={[
        { v: a, color: STRAND.a[1] },
        { v: b, color: STRAND.b[1] },
        { v: free, color: "var(--chip-bg)" },
      ]}
    />
  )
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["ВОЛС"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, scene: "/nodes/vols-3d.png", point: (i) => `Муфта М-${i + 1}` }} />}>
        <PassportHeader
          crumb="Линии и сооружения"
          listHref="/fiber-lines"
          listTitle="ВОЛС"
          title={name}
          status={{ label, tone }}
          pill={String(x.f.network ?? "ГРС")}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Ruler} t="Протяжённость" v={km1(len)} em="км" />
          <PassportStat icon={Rows3} t="Волокон" v={d.strands.length} em={`${a} занято`} />
          <PassportStat icon={MapPin} t="Муфт" v={points} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Наименование трассы", v: String(x.f.name ?? "—") },
                { t: "Протяжённость трассы, км", v: String(x.f.len ?? "—") },
                { t: "Суммарная длина кабеля, км", v: String(x.f.total ?? x.f.len ?? "—") },
                { t: "Начало участка", v: d.segments[0]?.from ?? "—" },
                { t: "УС начала участка", v: d.start.code },
                { t: "Конец участка", v: d.segments[d.segments.length - 1]?.to ?? "—" },
                { t: "УС конца участка", v: d.end.code },
                { t: "Собственник ВОК", v: String(x.f.owner ?? "—") },
                { t: "Тип сети", v: String(x.f.network ?? "—") },
                { t: "Тип кабеля", v: String(x.f.cable ?? "—") },
              ]}
            />
            <StageArea>
              {stage === "schema" && (
                <LineSchema
                  d={d}
                  k={{ color: COLOR, strip: "bars", strand: STRAND }}
                  stripTitle={`Волокна кабеля ${x.f.cable ?? ""} · занято ${a} · резерв ${b} · свободно ${free}`}
                />
              )}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: d.start.code, sub: `УС начала · ${d.start.title}`, href: d.start.nodeId ? `/nodes/${d.start.nodeId}` : undefined },
                  { icon: RadioTower, t: d.end.code, sub: `УС конца · ${d.end.title}`, href: d.end.nodeId ? `/nodes/${d.end.nodeId}` : undefined },
                  { icon: Server, t: "ODF-1", sub: `порты 1–${d.strands.length}`, href: "/odf" },
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
          { k: "strands", t: "Волокна", icon: Rows3, n: d.strands.length },
          { k: "rent", t: "Аренда КК", icon: Waypoints },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "history", t: "История", icon: History, n: d.history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Ruler} title="Протяжённость" onOpen={() => setTab("segments")}>
              {km1(len)} <em>км · кабель {kmStr(cable)} км</em>
            </SummaryCard>
            <SummaryCard icon={Rows3} title="Волокна" onOpen={() => setTab("strands")} bar={strandBar}>
              {a} / {d.strands.length} <em>занято</em>
            </SummaryCard>
            <SummaryCard icon={MapPin} title="Муфты" onOpen={() => setTab("segments")}>
              {points} <em>на трассе</em>
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
        {tab === "segments" && <SegmentsTab d={d} k={{ laying: true, point: (i) => `Муфта М-${i + 1}` }} onChange={setSegments} />}
        {tab === "strands" && (
          <StrandsTab
            x={x}
            d={d}
            k={{
              strand: STRAND,
              strandRows: () => [
                { t: "Кол-во волокон всего", v: d.strands.length },
                { t: "Принадлежит JM", v: own ? d.strands.length : 0 },
                { t: "Арендуемых", v: own ? 0 : d.strands.length },
                { t: "Занятых", v: a ? `${a} · ${d.note}` : 0 },
                { t: "Свободных", v: d.strands.filter((f) => f !== "a").length },
              ],
            }}
          />
        )}
        {tab === "rent" && <RentTab d={d} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={fiberLineSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={fiberLineSub(x)} url={qrUrl("fiber-lines", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <FiberLineForm
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
          noun={["трассу ВОЛС", "трассы ВОЛС", "трасс ВОЛС"]}
          items={[{ id: x.id, name, sub: x.f.route }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => fiberLines.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/fiber-lines")}
        />
      )}
    </div>
  )
}
