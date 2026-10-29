"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Contact,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  Phone,
  RadioTower,
  Satellite,
  SatelliteDish,
  Server,
  Truck,
  UserCog,
} from "lucide-react"
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
import { RadioPanel, SatelliteLink } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { VsatForm } from "@/components/vsat/vsat-form"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { useVsat, vsatDetail, vsatName, vsats, vsatStatus, vsatSub, type Vsat } from "@/lib/api/vsat"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { LineDocsTab } from "@/components/lines/tabs"

/*
 * 31 ЗССС SkyEdge II GEO (VSAT) — паспорт /vsat/<id>: модем и антенна, «Спутник» — канал через KazSat-3,
 * вкладки «Услуги и скорости», «Станция», «Голосовые интерфейсы», «МОЛ и ответственные», «Документация», «История перемещений».
 * TODO(API): скорости CIR / MIR, BUC / LNB, IP, VLAN, голосовые интерфейсы — нет в /api/triple_s.
 */

type TabKey = "overview" | "speed" | "station" | "voice" | "mol" | "docs" | "moves"

const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Спутник", Satellite],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

const SPEED = { cirOut: 2048, mirOut: 4096, cirIn: 512, mirIn: 1024 }
const VOICE = 5
const ant = (x: Vsat) => String(x.f.antenna ?? "1,8")
const short = (x: Vsat) => String(x.f.client ?? "").replace(/^(ТОО|АО) «(.*)»$/, "$2")

export default function VsatPassportPage({ params }: PageProps<"/vsat/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useVsat(id)
  const d = useMemo(() => (x ? vsatDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? vsatName(x) : "ЗССС SkyEdge II GEO · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/vsat" back="К списку ЗССС SkyEdge II GEO" />

  const [label, tone] = vsatStatus(x)
  const name = vsatName(x)
  const editable = !vsats.readOnly()
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["ЗССС SkyEdge II GEO"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: "#4f8dff", point: (i) => `Плата ${i + 1}` }} />}>
        <PassportHeader
          crumb="Оборудование / Спутниковые технологии"
          listHref="/vsat"
          listTitle="ЗССС SkyEdge II GEO"
          title={name}
          status={{ label, tone }}
          pill={"STAR"}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Activity} t="MIR ↓" v={SPEED.mirOut / 1024} em="Мбит/с" />
          <PassportStat icon={Satellite} t="Антенна" v={ant(x)} em="м" />
          <PassportStat icon={Phone} t="Голос" v={VOICE} em="линий" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Наименование", v: String(x.f.name ?? "—") },
                { t: "Клиент", v: String(x.f.client ?? "—") },
                { t: "Собственник оборудования", v: "QMobile" },
                { t: "Населенный пункт", v: String(x.f.name ?? "—") },
                { t: "Адрес", v: String(x.f.name ?? x.address) },
                { t: "Широта (N)", v: x.ll[0].toFixed(4) },
                { t: "Долгота (E)", v: x.ll[1].toFixed(4) },
                { t: "Тип модема", v: String(x.f.type ?? "—") },
                { t: "ID Vsat", v: String(x.f.topology ?? "—") },
                { t: "Диаметр антенны, м", v: ant(x) },
              ]}
            />
            <StageArea>
              {stage === "scene" && (
                <RadioPanel
                  left={String(x.f.type)}
                  right={`ID Vsat ${x.f.topology}`}
                  indoor={{
                    t: "Модем",
                    sub: String(x.f.type),
                    groups: [
                      { label: "LAN", ports: [true, true, false, false] },
                      { label: "VOICE · FXS", ports: [true, true] },
                    ],
                    coax: ["RX", "TX"],
                  }}
                  outdoor={{
                    t: "Антенна",
                    sub: `Ø ${ant(x)} м · BUC 4 W · LNB PLL`,
                    lines: ["Es/No    9.4 dB", "RX LOCK  YES", "BEAM     KazSat-3", "STAR     Hub Astana"],
                    from: "модем",
                    to: "GEO",
                    len: "антенна",
                  }}
                  notes={[
                    { t: "LAN 1–2", v: "ПД · WWW", at: 13 },
                    { t: "RX / TX · F-разъёмы", v: "→ LNB / BUC антенны", at: 78 },
                  ]}
                />
              )}
              {stage === "schema" && (
                <SatelliteLink
                  orbit="Геостационарная орбита · KazSat-3"
                  up={`Inbound CIR ${SPEED.cirIn} / MIR ${SPEED.mirIn}`}
                  down={`Outbound CIR ${SPEED.cirOut} / MIR ${SPEED.mirOut}`}
                  station={String(x.f.name ?? "VSAT")}
                  stationSub={`Ø ${ant(x)} м · BUC 4 W · PLL`}
                  card={{ t: "Предоставляемые услуги", v: "WWW · ПД · Голос", sub: "VLAN 412 · STAR", ok: "Станция в работе" }}
                />
              )}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: "узел связи", href: `/nodes/${x.nodeId}` },
                  { icon: UserCog, t: "Е. Сапаров", sub: "МОЛ" },
                  { icon: Server, t: "Hub Astana", sub: "STAR · KazSat-3" },
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
          { k: "speed", t: "Услуги и скорости", icon: Activity },
          { k: "station", t: "Станция", icon: Satellite },
          { k: "voice", t: "Голосовые интерфейсы", icon: Phone },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Activity} title="MIR ↓ / ↑" onOpen={() => setTab("speed")}>
              {SPEED.mirOut / 1024} / {SPEED.mirIn / 1024} <em>Мбит/с</em>
            </SummaryCard>
            <SummaryCard icon={Activity} title="CIR ↓ / ↑" onOpen={() => setTab("speed")}>
              {SPEED.cirOut / 1024} / {String(SPEED.cirIn / 1024).replace(".", ",")} <em>Мбит/с</em>
            </SummaryCard>
            <SummaryCard icon={Phone} title="Голос" onOpen={() => setTab("voice")}>
              {VOICE} <em>FXS</em>
            </SummaryCard>
            <SummaryCard icon={Contact} title="Клиент" onOpen={() => setTab("speed")}>
              {short(x)}
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "speed" && (
          <Card icon={Activity} title="Предоставляемые услуги" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "WWW, кбит/с", v: SPEED.mirOut.toLocaleString("ru-RU") },
                { t: "ПД, кбит/с", v: SPEED.cirOut.toLocaleString("ru-RU") },
                { t: "Голос, шт", v: VOICE },
                { t: "CIR, Outbound", v: SPEED.cirOut.toLocaleString("ru-RU") },
                { t: "MIR, Outbound", v: SPEED.mirOut.toLocaleString("ru-RU") },
                { t: "CIR, Inbound", v: SPEED.cirIn },
                { t: "MIR, Inbound", v: SPEED.mirIn.toLocaleString("ru-RU") },
              ]}
            />
          </Card>
        )}
        {/* Станция (vsat-t2) */}
        {tab === "station" && (
          <Card icon={Satellite} title="Станция" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Тип модема", v: "SkyEdge II Access" },
                { t: "ID Vsat", v: "VS-44120" },
                { t: "Диаметр антенны, м", v: "1,8" },
                { t: "BUC, W", v: 4 },
                { t: "LNB, PLL/DRO", v: "PLL" },
                { t: "Topology", v: "STAR" },
                { t: "IP Address", v: "10.212.4.18/29" },
                { t: "VLAN", v: 412 },
              ]}
            />
          </Card>
        )}
        {tab === "voice" && (
          <Card icon={Phone} title="Тип голосового интерфейса" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "E&M", v: 0 },
                { t: "FXS", v: VOICE },
                { t: "FXO", v: 0 },
                { t: "Телефонная нумерация", v: "7292 44-12-01…05" },
              ]}
            />
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={vsatSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={vsatSub(x)} url={qrUrl("vsat", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <VsatForm
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
          icon={SatelliteDish}
          noun={["станция", "станции", "станций"]}
          items={[{ id: x.id, name, sub: x.f.client }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => vsats.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/vsat")}
        />
      )}
    </div>
  )
}
