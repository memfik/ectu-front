"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Contact, FileText, Image as ImageIcon, LayoutGrid, Map as MapIcon, MapPin, Radio, RadioTower, Ruler, Server, Signal, Truck, UserCog, Users, Wifi } from "lucide-react"
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
import { BwaForm } from "@/components/bwa/bwa-form"
import { BwaCoverage, BwaPanel } from "@/components/bwa/bwa-stage"
import { LineBackdrop, type LineStage } from "@/components/lines/line-stage"
import { Gallery } from "@/components/passport/gallery"
import { Card, Kv } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { bwaAzimuth, bwaDetail, bwaInv, bwaName, bwaPoint, bwaSectors, bwaStatus, bwaSub, bwaSubs, bwaWidth, RCS, STATIONS } from "@/lib/api/bwa"
import { useWimax, WIMAX_PASSPORT, WIMAX_VENDORS, wimax } from "@/lib/api/bwa-wimax"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { CapTable, capBar } from "@/components/equipment/capacity"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { EditableTable, LineDocsTab } from "@/components/lines/tabs"

/*
 * 27 БШД WiMAX — паспорт БС /bwa-wimax/<id> (wimax-04 «Панель / Покрытие / Карта / Фото»): вкладки «Зона покрытия»,
 * «Абонентская ёмкость», «Абонентские станции», «МОЛ и ответственные», «Документация», «История перемещений».
 * Запись — useWimax(id), документы и история — bwaDetail() из lib/api/bwa, вёрстка — блоки components/blocks.
 * TODO(API): азимуты, ширина полосы, РЧС, абонентские станции — нет в /api/bhd-wimax-equipments.
 */

type TabKey = "overview" | "zone" | "subs" | "stations" | "mol" | "docs" | "moves"

const KEY = "bwa-wimax"
const TITLE = "БШД WiMAX"
const P = WIMAX_PASSPORT
const COLOR = "#4f8dff"
const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Покрытие", Signal],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function WimaxPassportPage({ params }: PageProps<"/bwa-wimax/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useWimax(id)
  const d = useMemo(() => (x ? bwaDetail(KEY, x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? bwaName(x) : `${TITLE} · паспорт`)

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href={`/${KEY}`} back={`К списку ${TITLE}`} />

  const [label, tone] = bwaStatus(x)
  const name = bwaName(x)
  const { z, m } = bwaSubs(x)
  const n = bwaSectors(x)
  const w = bwaWidth(x)
  const editable = !wimax.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: [TITLE],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, point: bwaPoint }} />}>
        <PassportHeader
          crumb="Оборудование / Беспроводные технологии"
          listHref={`/${KEY}`}
          listTitle={TITLE}
          title={name}
          status={{ label, tone }}
          pill={String(x.f.network ?? "ГРС")}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Signal} t="Секторов" v={n} em={`× ${w}°`} />
          <PassportStat icon={Users} t="Абонентов" v={z} em={`из ${m}`} />
          <PassportStat icon={Ruler} t="Покрытие" v={P.km} em="км" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Тип сети", v: String(x.f.network ?? "—") },
                { t: "Вендор", v: P.vendor },
                { t: "Модель", v: String(x.f.model ?? "—") },
                { t: "Серийный номер ODU БС/АК", v: String(x.f.serial ?? "—") },
                { t: "Инвентарный номер", v: bwaInv(x) },
                { t: "Секторов, шт", v: n },
                { t: "Ширина сектора (°)", v: w },
                { t: "Длина покрытия (км)", v: P.km },
                { t: "Азимут (°)", v: bwaAzimuth(x) },
                { t: "Частота несущей, MHz", v: String(x.f.freq ?? "—") },
              ]}
            />
            <StageArea>
              {stage === "scene" && <BwaPanel x={x} />}
              {stage === "schema" && <BwaCoverage n={n} km={P.km} freq={String(x.f.freq)} used={z} total={m} />}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: "узел связи", href: `/nodes/${x.nodeId}` },
                  { icon: UserCog, t: "Е. Сапаров", sub: "МОЛ" },
                  { icon: Contact, t: "Абонентские станции", sub: `${STATIONS.length - 1} АК` },
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
          { k: "zone", t: "Зона покрытия", icon: Signal },
          { k: "subs", t: "Абонентская ёмкость", icon: Users, n: z },
          { k: "stations", t: "Абонентские станции", icon: MapPin, n: STATIONS.length },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Signal} title="Сектора" onOpen={() => setTab("zone")}>
              {`${n} × ${w}°`}
            </SummaryCard>
            <SummaryCard icon={Users} title="Абоненты" onOpen={() => setTab("subs")} bar={capBar(z, m)}>
              {`${z} / ${m}`}
            </SummaryCard>
            <SummaryCard icon={Radio} title="Частота" onOpen={() => setTab("zone")}>
              {String(x.f.freq)} <em>MHz</em>
            </SummaryCard>
            <SummaryCard icon={Ruler} title="Покрытие" onOpen={() => setTab("zone")}>
              {`${P.km} км`}
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "zone" && (
          <Card icon={Signal} title="Зона покрытия" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Секторов, шт", v: n },
                { t: "Ширина сектора (°)", v: w },
                { t: "Длина покрытия (км)", v: P.km },
                { t: "Азимут (°)", v: bwaAzimuth(x) },
                { t: "Частота несущей, MHz", v: String(x.f.freq ?? "—") },
                { t: "Ширина полосы частот, MHz", v: P.band },
                { t: "Пропускная способность сектора", v: "60 Мбит/с" },
                { t: "Разрешение РЧС", v: RCS },
              ]}
            />
          </Card>
        )}
        {tab === "subs" && <CapTable icon={Users} title="Абонентская ёмкость" rows={[{ t: "Лицензии / абоненты", m, z }]} />}
        {tab === "stations" && (
          <EditableTable
            icon={MapPin}
            title="Место установки"
            noun="станция"
            cols={[
              { k: "num", t: "№ п/п" },
              { k: "type", t: "Тип станции", opts: ["БС", "АК"] },
              { k: "rcs", t: "Разрешение РЧС" },
              { k: "place", t: "Место установки", req: true },
              { k: "client", t: "Клиент" },
            ]}
            rows={STATIONS.map((s, i) => ({ id: String(i), num: String(i + 1), ...s }))}
          />
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={bwaSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={bwaSub(x)} url={qrUrl(KEY, x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <BwaForm
          section={KEY}
          title={TITLE}
          source={wimax}
          vendors={WIMAX_VENDORS}
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
          icon={Wifi}
          noun={["базовая станция", "базовые станции", "базовых станций"]}
          items={[{ id: x.id, name, sub: bwaSub(x).split(" · ")[0] }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => wimax.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push(`/${KEY}`)}
        />
      )}
    </div>
  )
}
