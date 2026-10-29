"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, AudioWaveform, ConciergeBell, Contact, FileText, Image as ImageIcon, LayoutGrid, Map as MapIcon, Radio, RadioTower, Ruler, Server, Truck, UserCog } from "lucide-react"
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
import { Gallery } from "@/components/passport/gallery"
import { Card, Kv } from "@/components/passport/ui"
import { RadioBridgeForm } from "@/components/radio-bridges/radio-bridge-form"
import { RadioBridgeFreq, RadioBridgePanel, RadioBridgeSpan } from "@/components/radio-bridges/radio-bridge-panel"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import {
  RADIO_BRIDGE_CLIENT,
  RADIO_BRIDGE_RCS,
  RADIO_BRIDGE_TX,
  radioBridgeDetail,
  radioBridgeLen,
  radioBridgeMbps,
  radioBridgeName,
  radioBridges,
  radioBridgeStatus,
  radioBridgeSub,
  useRadioBridge,
} from "@/lib/api/radio-bridges"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { LineDocsTab } from "@/components/lines/tabs"

/*
 * 26 Радиомосты — паспорт /radio-bridges/<id>: PoE-адаптер и радиоблок, пролёт до клиента, вкладки «Частоты», «Услуги»,
 * МОЛ, документы, история перемещений. Запись — useRadioBridge(id), документы и история — radioBridgeDetail().
 * TODO(API): частоты, сигнал, РЧС, клиент, услуги — нет в /api/radio-bridges.
 */

type TabKey = "overview" | "freq" | "services" | "mol" | "docs" | "moves"

/** Фон «Карта»: узел радиомоста. */
const BACKDROP = { color: "#4f8dff", point: (i: number) => `Плата ${i + 1}` }
const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Трасса", Ruler],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function RadioBridgePage({ params }: PageProps<"/radio-bridges/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useRadioBridge(id)
  const d = useMemo(() => (x ? radioBridgeDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? radioBridgeName(x) : "Радиомосты · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/radio-bridges" back="К списку Радиомосты" />

  const [label, tone] = radioBridgeStatus(x)
  const name = radioBridgeName(x)
  const mbps = radioBridgeMbps(x)
  const len = radioBridgeLen(x)
  const editable = !radioBridges.readOnly()
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["Радиомосты"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={BACKDROP} />}>
        <PassportHeader
          crumb="Оборудование / Беспроводные технологии"
          listHref="/radio-bridges"
          listTitle="Радиомосты"
          title={`Радиомост ${x.nodeCode} → клиент`}
          status={{ label, tone }}
          pill={String(x.f.network ?? "ГАС")}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Activity} t="Пропускная" v={mbps} em="Мбит/с" />
          <PassportStat icon={Ruler} t="Трасса" v={len} em="км" />
          <PassportStat icon={Radio} t="Частоты" v="5 ГГц" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Вендор", v: String(x.f.vendor) === "Ubiquiti" ? "Ubiquiti Networks" : String(x.f.vendor ?? "—") },
                { t: "Модель", v: String(x.f.model ?? "—") },
                { t: "Тип сети", v: String(x.f.network ?? "—") },
                { t: "Пропускная способность радиомоста, Мбит/с", v: mbps },
                { t: "Протяженность трассы, км", v: len },
                { t: "Разрешение РЧС", v: RADIO_BRIDGE_RCS },
                { t: "Дата установки радиомоста", v: "2026-07-08" },
                { t: "Номер и дата распоряжения/наряда", v: "наряд в kcrm 72268-УФ/01072026/1028" },
                { t: "Номер и дата акта о вводе", v: "№ 9 от 20.02.2024" },
                { t: "Точка установки # 1", v: x.address },
              ]}
            />
            <StageArea>
              {stage === "scene" && <RadioBridgePanel x={x} />}
              {stage === "schema" && <RadioBridgeSpan x={x} />}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: "узел связи", href: `/nodes/${x.nodeId}` },
                  { icon: UserCog, t: "Е. Сапаров", sub: "МОЛ" },
                  { icon: FileText, t: "Паспорт оборудования", sub: "PDF" },
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
          { k: "freq", t: "Частоты", icon: Radio },
          { k: "services", t: "Услуги", icon: ConciergeBell },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Activity} title="Пропускная" onOpen={() => setTab("freq")}>
              {mbps} <em>Мбит/с</em>
            </SummaryCard>
            <SummaryCard icon={Ruler} title="Трасса" onOpen={() => setTab("freq")}>
              {len} км
            </SummaryCard>
            <SummaryCard icon={Radio} title="Tx1 / Tx2" onOpen={() => setTab("freq")}>
              {RADIO_BRIDGE_TX[0]} / {RADIO_BRIDGE_TX[1]} <em>MHz</em>
            </SummaryCard>
            <SummaryCard icon={Contact} title="Клиент" onOpen={() => setTab("services")}>
              {RADIO_BRIDGE_CLIENT}
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "freq" && <RadioBridgeFreq x={x} />}
        {tab === "services" && (
          <Card icon={ConciergeBell} title="Предоставляемые услуги" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Интернет, кбит/с", v: (mbps * 1024).toLocaleString("ru-RU") },
                { t: "Передача данных, кбит/с", v: (mbps * 512).toLocaleString("ru-RU") },
                { t: "Количество голосовых каналов, шт", v: 0 },
                { t: "Примечание", v: "последняя миля до БЦ" },
              ]}
            />
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={radioBridgeSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={radioBridgeSub(x)} url={qrUrl("radio-bridges", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <RadioBridgeForm
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
          icon={AudioWaveform}
          noun={["радиомост", "радиомоста", "радиомостов"]}
          items={[{ id: x.id, name, sub: x.f.route }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => radioBridges.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/radio-bridges")}
        />
      )}
    </div>
  )
}
