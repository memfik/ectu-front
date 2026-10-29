"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Calendar,
  CircleCheck,
  Contact,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  RadioTower,
  Satellite,
  Server,
  Truck,
  UserCog,
  Wifi,
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
import { OneWebForm } from "@/components/oneweb/oneweb-form"
import { RadioPanel, SatelliteLink } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { onewebDetail, onewebName, onewebs, onewebStatus, onewebSub, useOneWeb, type OneWeb } from "@/lib/api/oneweb"
import { MolPane, MovesPane } from "@/sections/lines/staff"
import { LineDocsTab } from "@/sections/lines/tabs"

/*
 * 32 OneWeb LEO — паспорт /oneweb/<id>: терминал Hughes и связь со спутником, «Спутник» — низкая орбита,
 * вкладки «Место установки», «Терминал», «Точка доступа», «Тест», «МОЛ и ответственные», «Документация», «История перемещений».
 * TODO(API): район, сельский округ, IMEI, IP, VLAN, точка доступа, тестовый период — нет в /api/oneweb.
 */

type TabKey = "overview" | "place" | "terminal" | "ap" | "test" | "mol" | "docs" | "moves"

const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Спутник", Satellite],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

const CLIENT = "КГУ «Школа № 12»"
const town = (x: OneWeb) => String(x.f.client ?? "—")

export default function OneWebPassportPage({ params }: PageProps<"/oneweb/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useOneWeb(id)
  const d = useMemo(() => (x ? onewebDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? onewebName(x) : "OneWeb LEO · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/oneweb" back="К списку OneWeb LEO" />

  const [label, tone] = onewebStatus(x)
  const name = onewebName(x)
  const editable = !onewebs.readOnly()
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["OneWeb LEO"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: "#4f8dff", point: (i) => `Плата ${i + 1}` }} />}>
        <PassportHeader
          crumb="Оборудование / Спутниковые технологии"
          listHref="/oneweb"
          listTitle="OneWeb LEO"
          title={name}
          status={{ label, tone }}
          pill={"LEO"}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Activity} t="MIR" v={100} em="Мбит/с" />
          <PassportStat icon={Satellite} t="Орбита" v="LEO" em="1 200 км" />
          <PassportStat icon={Wifi} t="Wi-Fi" v="EAP245" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Клиент", v: CLIENT },
                { t: "Собственник оборудования", v: "QMobile" },
                { t: "Область", v: String(x.f.oblast ?? "—") },
                { t: "Район", v: "Шиелийский" },
                { t: "Сельский округ", v: "Шиелийский с/о" },
                { t: "Населенный пункт", v: town(x) },
                { t: "Адрес", v: "Бейбитшиликский сельский округ" },
                { t: "Широта", v: x.ll[0].toFixed(4) },
                { t: "Долгота", v: x.ll[1].toFixed(4) },
                { t: "Тип абонентского терминала", v: String(x.f.terminal ?? "—") },
              ]}
            />
            <StageArea>
              {stage === "scene" && (
                <RadioPanel
                  left={String(x.f.terminal)}
                  right={String(x.f.station)}
                  indoor={{
                    t: String(x.f.terminal),
                    sub: "панель 598 × 402 мм · ESA",
                    groups: [{ label: "POE · LAN", ports: [true] }],
                  }}
                  outdoor={{
                    t: "Связь",
                    sub: "OneWeb LEO · хэндовер",
                    lines: ["LINK     UP", "SAT      0612 → 0617", "LATENCY  42 ms", "AVAIL    99.6 %"],
                    from: "терминал",
                    to: "LEO 1 200 км",
                    len: "",
                  }}
                  notes={[
                    { t: "Плоская антенна ESA", v: "луч переключается между спутниками", at: 24 },
                    { t: "PoE · LAN", v: "→ Wi-Fi точка доступа", at: 74 },
                  ]}
                />
              )}
              {stage === "schema" && (
                <SatelliteLink
                  orbit="Низкая орбита · OneWeb LEO 1 200 км"
                  up="Inbound CIR 20 / MIR 100"
                  down="Outbound CIR 20 / MIR 100"
                  station={`SHI-012 · ${String(x.f.terminal).replace(/W$/, "")}`}
                  stationSub={`${x.f.category ?? "Fixed"} · Class 1 · Wi-Fi EAP245`}
                  card={{ t: "Предоставляемые услуги", v: "WWW · ПД · Голос", sub: "VLAN 1120", ok: "Станция в работе" }}
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
          { k: "place", t: "Место установки", icon: MapPin },
          { k: "terminal", t: "Терминал", icon: Satellite },
          { k: "ap", t: "Точка доступа", icon: Wifi },
          { k: "test", t: "Тест", icon: Calendar },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Activity} title="MIR / CIR" onOpen={() => setTab("terminal")}>
              100 / 20 <em>Мбит/с</em>
            </SummaryCard>
            <SummaryCard icon={Activity} title="Интернет" onOpen={() => setTab("terminal")}>
              50 <em>Мбит/с</em>
            </SummaryCard>
            <SummaryCard icon={Contact} title="Клиент" onOpen={() => setTab("place")}>
              Школа № 12 <em>{town(x).replace(/^с\. /, "")}</em>
            </SummaryCard>
            <SummaryCard icon={CircleCheck} title="Статус" onOpen={() => setTab("test")}>
              {label}
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "place" && (
          <Card icon={MapPin} title="Место установки" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Область", v: String(x.f.oblast ?? "—") },
                { t: "Район", v: "Шиелийский" },
                { t: "Сельский округ", v: "Шиелийский с/о" },
                { t: "Населенный пункт", v: town(x) },
                { t: "Адрес", v: "ул. Абая, 14" },
                { t: "Широта", v: x.ll[0].toFixed(4) },
                { t: "Долгота", v: x.ll[1].toFixed(4) },
              ]}
            />
          </Card>
        )}
        {tab === "terminal" && (
          <Card icon={Satellite} title="Абонентский терминал" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Тип", v: String(x.f.terminal ?? "—") },
                { t: "Категория", v: String(x.f.category ?? "—") },
                { t: "Класс", v: "Class 1" },
                { t: "Название станции", v: String(x.f.station ?? "—") },
                { t: "Серийный номер", v: `HL1120-${88200 + x.id}` },
                { t: "IMEI", v: "35 881231 004412 7" },
                { t: "IP address", v: String(x.f.ip ?? "—") },
                { t: "VLAN", v: 1120 },
              ]}
            />
          </Card>
        )}
        {tab === "ap" && (
          <Card icon={Wifi} title="Точка доступа" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Модель точки доступа", v: "TP-Link EAP245" },
                { t: "MAC-адрес", v: "60:A4:B7:12:44:1C" },
                { t: "S/N", v: "22314A0012" },
              ]}
            />
          </Card>
        )}
        {tab === "test" && (
          <Card icon={Calendar} title="Тестовый период" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Статус станции", v: label },
                { t: "Дата начала теста", v: "03.06.2025" },
                { t: "Дата окончания теста", v: "03.07.2025" },
                { t: "Основание", v: "№ 211-р" },
              ]}
            />
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={onewebSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={onewebSub(x)} url={qrUrl("oneweb", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <OneWebForm
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
          icon={Satellite}
          noun={["станция", "станции", "станций"]}
          items={[{ id: x.id, name, sub: x.f.client }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => onewebs.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/oneweb")}
        />
      )}
    </div>
  )
}
