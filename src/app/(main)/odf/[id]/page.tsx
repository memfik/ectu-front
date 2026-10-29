"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Cable, Circle, CircleCheck, EthernetPort, FileText, History, Image as ImageIcon, LayoutGrid, Map as MapIcon, RadioTower, Server } from "lucide-react"
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
import { LineBackdrop, type LineStage } from "@/components/lines/line-stage"
import { Pill } from "@/components/list/ui"
import { OdfForm } from "@/components/odf/odf-form"
import { ODF_VOLS, OdfPanel, OdfPorts, PORT_STATE, PORT_USED } from "@/components/odf/odf-scene"
import { Gallery } from "@/components/passport/gallery"
import { SegBar } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { odfDetail, odfName, odfs, odfStatus, odfSub, useOdf } from "@/lib/api/odf"
import { EditableTable, LineDocsTab, LineHistoryTab } from "@/components/lines/tabs"

/*
 * 10 ODF — паспорт кросса /odf/<id>: сцена — передняя панель кросса, схема — порты, вкладка «Порты» (кроссировка).
 * Направление кабеля — узел Б и ВОЛС, которая заходит в кросс. Запись — useOdf(id), порты — odfDetail() из lib/api/odf.
 */

type TabKey = "overview" | "ports" | "docs" | "history"

const UNIT: [string, string, string] = ["кросс", "кросса", "кроссов"]
const RESERVE = "#ffc53d"
const point = (i: number) => `Муфта М-${i + 1}`
const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Схема", EthernetPort],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function OdfPage({ params }: PageProps<"/odf/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useOdf(id)
  const d = useMemo(() => (x ? odfDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? odfName(x) : "ODF · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/odf" back="К списку ODF" />

  const [label, tone] = odfStatus(x)
  const name = odfName(x)
  const a = d.strands.filter((f) => f === "a").length
  const b = d.strands.filter((f) => f === "b").length
  const docsUp = d.docs.filter((doc) => doc.uploaded).length
  const editable = !odfs.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["ODF"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: "#4f8dff", point }} />}>
        <PassportHeader
          crumb="Линии и сооружения"
          listHref="/odf"
          listTitle="ODF"
          title={name}
          status={{ label, tone }}
          pill={String(x.f.conn ?? "SC/UPC")}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={EthernetPort} t="Портов" v={d.strands.length} em="всего" />
          <PassportStat icon={CircleCheck} t="Задействовано" v={a} />
          <PassportStat icon={Circle} t="Свободно" v={d.strands.length - a - b} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Узел А (размещение кросса)", v: x.nodeCode },
                { t: "Узел Б (направление кабеля)", v: String(x.f.nodeB ?? "—") },
                { t: "Тип монтажа", v: String(x.f.mount ?? "—") },
                { t: "Всего портов", v: d.strands.length },
                { t: "Задействовано портов", v: a },
                { t: "Свободных портов", v: d.strands.length - a },
                { t: "Тип коннектора", v: String(x.f.conn ?? "—") },
                { t: "Тип волокна", v: "SM G.652D" },
              ]}
            />
            <StageArea>
              {stage === "scene" && <OdfPanel x={x} strands={d.strands} a={a} />}
              {stage === "schema" && <OdfPorts x={x} strands={d.strands} a={a} end={d.end.title} />}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: "Узел А · размещение", href: `/nodes/${x.nodeId}` },
                  { icon: RadioTower, t: String(x.f.nodeB ?? "—"), sub: "Узел Б · направление", href: d.end.nodeId ? `/nodes/${d.end.nodeId}` : undefined },
                  { icon: Cable, t: ODF_VOLS, sub: `волокна 1–${d.strands.length}`, href: "/fiber-lines/49" },
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
          { k: "ports", t: "Порты", icon: EthernetPort, n: d.strands.length },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "history", t: "История", icon: History, n: d.history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard
              icon={EthernetPort}
              title="Порты"
              onOpen={() => setTab("ports")}
              bar={
                <SegBar
                  parts={[
                    { v: a, color: PORT_USED },
                    { v: b, color: RESERVE },
                    { v: d.strands.length - a - b, color: "var(--chip-bg)" },
                  ]}
                />
              }
            >
              {a} / {d.strands.length} <em>задействовано</em>
            </SummaryCard>
            <SummaryCard icon={Cable} title="ВОЛС" onOpen={() => setTab("ports")}>
              №49 <em>→ {d.end.title}</em>
            </SummaryCard>
            <SummaryCard icon={Server} title="Коннектор" onOpen={() => setTab("ports")}>
              {String(x.f.conn ?? "SC/UPC")} <em>G.652D</em>
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
        {tab === "ports" && (
          <EditableTable
            icon={EthernetPort}
            title="Кроссировка портов"
            noun="порт"
            cols={[
              { k: "num", t: "Порт", req: true },
              {
                k: "state",
                t: "Состояние",
                opts: ["Занят", "Резерв", "Свободен"],
                show: (v) => <Pill tone={v === "Занят" ? "ok" : v === "Резерв" ? "warn" : "muted"}>{v}</Pill>,
              },
              { k: "fiber", t: "Волокно" },
              { k: "to", t: "Куда" },
              { k: "desc", t: "Описание" },
            ]}
            rows={d.strands
              .map((f, i) => ({ f, i }))
              .filter(({ f, i }) => f !== "free" || i === a + b)
              .slice(0, 12)
              .map(({ f, i }) => ({
                id: String(i),
                num: String(i + 1),
                state: PORT_STATE[f][0],
                fiber: f === "free" ? "" : `${f === "b" ? "ВОЛС №52" : ODF_VOLS} · ${i + 1}`,
                to: f === "a" ? ["sw1.ast009 Gi1/0/25", "sw1.ast009 Gi1/0/26", "ID-00231"][i % 3] : "",
                desc: f === "a" ? ["uplink", "uplink-2", "FTTB клиент"][i % 3] : f === "b" ? "под ID-канал" : "",
              }))}
          />
        )}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={odfSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={odfSub(x)} url={qrUrl("odf", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <OdfForm
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
          icon={Server}
          noun={UNIT}
          items={[{ id: x.id, name, sub: odfSub(x) }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => odfs.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/odf")}
        />
      )}
    </div>
  )
}
