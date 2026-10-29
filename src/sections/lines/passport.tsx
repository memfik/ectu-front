"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Box, FileText, History, Image as ImageIcon, Layers, LayoutGrid, Map as MapIcon } from "lucide-react"
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
  type PassportTab,
} from "@/components/blocks/passport"
import { LineBackdrop, LineSchema, type LineStage } from "@/components/lines/line-stage"
import { DeleteDialog } from "@/components/list/delete-dialog"
import { FormDrawer } from "@/components/list/form-drawer"
import { QrDialog } from "@/components/list/qr-dialog"
import { Gallery } from "@/components/passport/gallery"
import type { Media } from "@/sections/nodes/detail"
import { useRemoteRecord } from "@/lib/list/remote"
import { useRows } from "@/lib/list/store"
import { lineDetail, type LineCtx, type LineDetail, type LineKind, type Segment } from "./detail"
import { LineDocsTab, LineHistoryTab } from "./tabs"
import { RecordNotFound } from "@/components/shared/states"


/**
 * Паспорт линии связи на общем шаблоне — для разделов, ещё не переписанных явным кодом (образец — fiber-lines/[id]/page.tsx).
 * ВОЛС (макет 07: vols-04 «3D / Схема / Карта / Фото», вкладки vols-t1…t5, окно участка vols-x0),
 * КЛС (08: kls-04, kls-t1…t4) и КК (09: kk-04, kk-t1…t5). Отличия — в `LineKind` раздела.
 */
export function LinePassport({ k, id }: { k: LineKind; id: number }) {
  const router = useRouter()
  const { list, spec, section } = k
  const local = useRows(list).find((r) => r.id === id)
  const { row: x, loading } = useRemoteRecord(list, id, local)
  const base = useMemo(() => (x ? lineDetail(x, k) : null), [x, k])
  // Участки правятся на месте (TODO(API): сохранение участков)
  const [segments, setSegments] = useState<Segment[] | null>(null)
  const [stage, setStage] = useState<LineStage>(k.noScene ? "schema" : "scene")
  const [tab, setTab] = useState("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)

  if (loading) return <PassportLoading />
  if (!x || !base) return <RecordNotFound title="Запись не найдена" href={`/${section}`} back={`К списку ${spec.title}`} />

  const d: LineDetail = { ...base, segments: segments ?? base.segments }
  const status = list.card(x).status
  const a = d.strands.filter((f) => f === "a").length
  const b = d.strands.filter((f) => f === "b").length
  const c: LineCtx = {
    x,
    d,
    k,
    a,
    b,
    busy: k.busyB ? a + b : a,
    len: d.segments.reduce((s, v) => s + v.len, 0),
    cable: d.segments.reduce((s, v) => s + v.cable, 0),
    points: Math.max(0, d.segments.length - 1),
    docsUp: d.docs.filter((x) => x.uploaded).length,
    setSegments,
    open: setTab,
    gallery: setGallery,
  }
  const own = k.tabs(c)
  const tail = k.tail?.(c)
  const full = tab === "overview"
  const title = k.title ? k.title(x) : spec.name(x)
  const media: Media[] = d.media.map((src, i) => ({
    src,
    title: `${spec.name(x)} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: [spec.title],
    text: "Фото с обхода трассы.",
  }))
  const tabs: PassportTab[] = [
    { k: "overview", t: "Обзор", icon: LayoutGrid },
    ...own,
    ...(k.noDocs ? [] : [{ k: "docs", t: k.docsTab ?? "Документация", icon: FileText, n: d.docs.length }]),
    ...(tail ?? [{ k: "history", t: "История", icon: History, n: d.history.length }]),
  ]
  const labels = k.stageLabels ?? [
    ["3D", Box],
    ["Схема", Layers],
  ]
  const stages: [LineStage, string, LucideIcon][] = [
    ...(k.noScene ? [] : [["scene", ...labels[0]] as [LineStage, string, LucideIcon]]),
    ["schema", ...labels[1]],
    ["map", "Карта", MapIcon],
    ["photo", "Фото", ImageIcon],
  ]

  return (
    <div className="relative isolate">
      <PassportTop full={full} backdrop={<LineBackdrop stage={stage} d={d} k={k} />}>
        <PassportHeader
          crumb={spec.crumb}
          listHref={`/${section}`}
          listTitle={spec.title}
          title={title}
          status={status}
          pill={k.pill(x)}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={spec.readOnly ? undefined : () => setEdit(true)}
          onDelete={spec.readOnly ? undefined : () => setDel(true)}
        >
          {k.stats(c).map((st) => (
            <PassportStat key={st.t} {...st} />
          ))}
        </PassportHeader>

        {full && (
          <PassportColumns>
            <PassportCard rows={k.rows(x, d)} onAll={spec.readOnly ? undefined : () => setEdit(true)} />
            <StageArea>
              {stage === "scene" && k.sceneNode?.(c)}
              {stage === "schema" && (k.schemaNode ? k.schemaNode(c) : <LineSchema d={d} k={k} stripTitle={k.stripTitle(c)} />)}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={stages} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard items={k.related(x, d)} />
              <InputDocsCard docs={d.inputDocs} onOpen={() => setTab("docs")} />
              <ResponsibleCard />
            </PassportSide>
          </PassportColumns>
        )}
      </PassportTop>

      <PassportTabs tabs={tabs} value={tab} onChange={setTab} />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            {k.summary(c).map((sm) => (
              <SummaryCard key={sm.title} icon={sm.icon} title={sm.title} onOpen={() => setTab(sm.tab)} bar={sm.bar}>
                {sm.v}
              </SummaryCard>
            ))}
          </SummaryGrid>
        )}
        {[...own, ...(tail ?? [])].find((t) => t.k === tab)?.node}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${spec.name(x)}`} sub={spec.sub2(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && list.qr && <QrDialog {...list.qr(x)} onClose={() => setQr(false)} />}
      {edit && <FormDrawer cfg={list} id={x.id} onClose={() => setEdit(false)} onDelete={() => (setEdit(false), setDel(true))} />}
      {del && <DeleteDialog cfg={list} rows={[x]} onClose={() => setDel(false)} onDone={() => router.push(`/${section}`)} />}
    </div>
  )
}
