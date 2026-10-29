"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Box, FileText, History, Image as ImageIcon, Layers, LayoutGrid, Map as MapIcon, RadioTower, Ruler, Signal, Waves } from "lucide-react"
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
import { MastForm } from "@/components/masts/mast-form"
import { MastTower, mastLevels } from "@/components/masts/mast-tower"
import { Gallery } from "@/components/passport/gallery"
import { SegBar } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { mastDetail, mastName, masts, mastStatus, mastSub, useMast } from "@/lib/api/masts"
import { EditableTable, LineDocsTab, LineHistoryTab } from "@/sections/lines/tabs"

/*
 * 11 АМС — паспорт /masts/<id>: сцена — мачта (картинка макета), схема — площадки по высоте с нагрузкой,
 * вкладки «Площадки и нагрузка», «Разрешительные документы». Площадки — жилы паспорта линии (a — занята).
 * Запись — useMast(id), площадки и документы — mastDetail() из lib/api/masts.
 */

type TabKey = "overview" | "load" | "docs" | "history"

const COLOR = "#4f8dff"
const UNIT: [string, string, string] = ["АМС", "АМС", "АМС"]
const point = (i: number) => `Опора ${i + 1}`
const STAGES: [LineStage, string, typeof Box][] = [
  ["scene", "3D", Box],
  ["schema", "Схема", Layers],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function MastPage({ params }: PageProps<"/masts/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useMast(id)
  const d = useMemo(() => (x ? mastDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? mastName(x) : "АМС · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/masts" back="К списку АМС" />

  const [label, tone] = mastStatus(x)
  const name = mastName(x)
  const h = Number(x.f.height) || 40
  const levels = mastLevels(h, d.strands.length)
  const a = d.strands.filter((f) => f === "a").length
  const b = d.strands.filter((f) => f === "b").length
  const docsUp = d.docs.filter((doc) => doc.uploaded).length
  const editable = !masts.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["АМС"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, scene: "/nodes/ams-3d.png", point }} />}>
        <PassportHeader
          crumb="Линии и сооружения"
          listHref="/masts"
          listTitle="АМС"
          title={name}
          status={{ label, tone }}
          pill={`${x.f.type ?? "Мачта"} · ${x.f.height ?? "—"} м`}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Ruler} t="Высота" v={h} em="м" />
          <PassportStat icon={Layers} t="Площадок" v={d.strands.length} em={`${d.strands.length - a} свободна`} />
          <PassportStat icon={FileText} t="Документы" v={`${docsUp} / ${d.docs.length}`} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Идентификатор УС (БС)", v: x.nodeCode },
                { t: "Населённый пункт", v: String(x.f.town ?? `г. ${x.city}`) },
                { t: "Адрес узла связи", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
                { t: "Адрес установки", v: String(x.f.place ?? "—") },
                { t: "Собственник площадки", v: String(x.f.owner ?? "—") },
                { t: "Тип АМС", v: String(x.f.type ?? "—") },
                { t: "Модель / производитель", v: "МАР-40/ Брянский завод металлоконструкций" },
                { t: "Высота, м", v: String(x.f.height ?? "—") },
                { t: "Площадок для оборудования", v: 3 },
                { t: "Широта (N)", v: x.ll[0].toFixed(8) },
              ]}
            />
            <StageArea>
              {stage === "schema" && <MastTower h={h} strands={d.strands} />}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: "узел связи", href: `/nodes/${x.nodeId}` },
                  { icon: Waves, t: `РРЛ → ${d.end.title}`, sub: "площадка 2", href: "/rrl" },
                  { icon: Signal, t: "БС LTE · 4 сектора", sub: "площадка 3", href: "/bwa-lte" },
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
          { k: "load", t: "Площадки и нагрузка", icon: Layers, n: d.strands.length },
          { k: "docs", t: "Разрешительные документы", icon: FileText, n: d.docs.length },
          { k: "history", t: "История", icon: History, n: d.history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Ruler} title="Высота" onOpen={() => setTab("load")}>
              {h} <em>м · {String(x.f.type ?? "мачта").toLowerCase()}</em>
            </SummaryCard>
            <SummaryCard
              icon={Layers}
              title="Площадки"
              onOpen={() => setTab("load")}
              bar={
                <SegBar
                  parts={[
                    { v: a, color: COLOR },
                    { v: b, color: "#ffc53d" },
                    { v: d.strands.length - a - b, color: "var(--chip-bg)" },
                  ]}
                />
              }
            >
              {a} / {d.strands.length} <em>заняты</em>
            </SummaryCard>
            <SummaryCard icon={Signal} title="Нагрузка" onOpen={() => setTab("load")}>
              6 <em>антенн</em>
            </SummaryCard>
            <SummaryCard
              icon={FileText}
              title="Документы"
              onOpen={() => setTab("docs")}
              bar={
                <SegBar
                  parts={[
                    { v: docsUp, color: "var(--status-ok)" },
                    { v: d.docs.length - docsUp, color: "#ff5257" },
                  ]}
                />
              }
            >
              {docsUp} / {d.docs.length} <em>нет экспертизы</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "load" && (
          <EditableTable
            icon={Layers}
            title="Существующая нагрузка (установленное оборудование)"
            noun="оборудование"
            cols={[
              { k: "pl", t: "Площадка", req: true },
              { k: "h", t: "Высота" },
              { k: "eq", t: "Оборудование" },
              { k: "az", t: "Азимут" },
              { k: "owner", t: "Владелец" },
            ]}
            rows={[
              { id: "1", pl: "3", h: `${levels[2]} м`, eq: "БС LTE · 4 сектора", az: "0 / 90 / 180 / 270°", owner: "QMobile" },
              { id: "2", pl: "2", h: `${levels[1]} м`, eq: `РРЛ Ø0,6 → ${d.end.title}`, az: "62°", owner: "QMobile" },
              { id: "3", pl: "2", h: `${levels[1]} м`, eq: "РРЛ Ø0,3 → ast011", az: "214°", owner: "QMobile" },
              { id: "4", pl: "1", h: `${levels[0]} м`, eq: "", az: "", owner: "свободна" },
            ]}
          />
        )}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={mastSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={mastSub(x)} url={qrUrl("masts", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <MastForm
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
          icon={RadioTower}
          noun={UNIT}
          items={[{ id: x.id, name, sub: mastSub(x) }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => masts.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/masts")}
        />
      )}
    </div>
  )
}
