"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  FileText,
  Globe,
  Hash,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Monitor,
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
import { StationForm } from "@/components/oneweb-form/station-form"
import { RadioPanel, SatelliteLink } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { onewebStations, stationDetail, stationName, stationStatus, stationSub, useOneWebStation, type OneWebStation } from "@/lib/api/oneweb-form"
import { capBar } from "@/components/equipment/capacity"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { LineDocsTab } from "@/components/lines/tabs"

/*
 * 42 Станция OneWeb (форма учёта мониторинга) — паспорт /oneweb-form/<id>: панель и «Спутник» — как у OneWeb LEO (32),
 * вкладки «Мониторинг», «МОЛ и ответственные», «Документация», «История перемещений».
 * TODO(API): связность, трафик, простои, последний сигнал — из «Мониторинга OneWeb» (/api/oneweb/traffic-*), сейчас пример.
 */

type TabKey = "overview" | "monitor" | "mol" | "docs" | "moves"

const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Спутник", Satellite],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

const f = (x: OneWebStation, k: keyof OneWebStation["f"]) => String(x.f[k] ?? "—")
const UP: Record<string, number> = { work: 99.6, idle: 71.2, never: 0 }
const up = (x: OneWebStation) => UP[x.status] ?? 0
const pctStr = (v: number) => String(v).replace(".", ",")
const ll = (x: OneWebStation) =>
  f(x, "coords")
    .split(",")
    .map((v) => Number(v).toFixed(2))
    .join(", ")
const STATE: Record<string, string> = { work: "Работает", idle: "Простой", never: "Не запускалась" }

export default function OneWebStationPassportPage({ params }: PageProps<"/oneweb-form/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useOneWebStation(id)
  const d = useMemo(() => (x ? stationDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? stationName(x) : "Форма учёта OneWeb · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/oneweb-form" back="К списку Форма учёта OneWeb" />

  const [label, tone] = stationStatus(x)
  const name = stationName(x)
  const editable = !onewebStations.readOnly()
  const work = x.status === "work"
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["Форма учёта OneWeb"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: "#4f8dff", point: (i) => `Плата ${i + 1}` }} />}>
        <PassportHeader
          crumb="Оборудование / Мониторинг OneWeb"
          listHref="/oneweb-form"
          listTitle="Форма учёта OneWeb"
          title={name}
          status={{ label, tone }}
          pill={"LEO"}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={SatelliteDish} t="Станция" v={f(x, "station")} />
          <PassportStat icon={Activity} t="Связность" v={pctStr(up(x))} em="%" />
          <PassportStat icon={MapPin} t="Координаты" v={ll(x)} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Название станции", v: f(x, "station") },
                { t: "Серийный номер", v: f(x, "serial") },
                { t: "IMEI", v: f(x, "imei") },
                { t: "IP-адрес", v: f(x, "ip") },
                { t: "Широта", v: f(x, "coords").split(",")[0] },
                { t: "Долгота", v: f(x, "coords").split(",")[1]?.trim() ?? "—" },
              ]}
            />
            <StageArea>
              {stage === "scene" && (
                <RadioPanel
                  left="Hughes HL1100W"
                  right={f(x, "station")}
                  indoor={{ t: "Hughes HL1100W", sub: "панель 598 × 402 мм · ESA", groups: [{ label: "POE · LAN", ports: [work] }] }}
                  outdoor={{
                    t: "Связь",
                    sub: "OneWeb LEO · хэндовер",
                    lines: work
                      ? ["LINK     UP", "SAT      0612 → 0617", "LATENCY  42 ms", `AVAIL    ${up(x)} %`]
                      : ["LINK     DOWN", "SAT      —", "LATENCY  —", `AVAIL    ${up(x)} %`],
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
                  station={`${f(x, "station")} · Hughes HL1100`}
                  stationSub={`S/N ${f(x, "serial")} · IP ${f(x, "ip")}`}
                  card={{ t: "Связность за 30 дней", v: `${pctStr(up(x))}%`, sub: STATE[x.status], ok: work ? "Станция в работе" : "" }}
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
          { k: "monitor", t: "Мониторинг", icon: Activity },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={SatelliteDish} title="Станция" onOpen={() => setTab("monitor")}>
              {f(x, "station")}
            </SummaryCard>
            <SummaryCard icon={Hash} title="IMEI" onOpen={() => setTab("monitor")}>
              …{f(x, "imei").slice(-6)}
            </SummaryCard>
            <SummaryCard icon={Globe} title="IP-адрес" onOpen={() => setTab("monitor")}>
              {f(x, "ip")}
            </SummaryCard>
            <SummaryCard icon={Activity} title="Связность" onOpen={() => setTab("monitor")} bar={capBar(up(x), 100)}>
              {pctStr(up(x))}%
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "monitor" && (
          <Card icon={Activity} title="Мониторинг станции" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Статус", v: STATE[x.status] },
                { t: "Связность за 30 дней", v: `${pctStr(up(x))}%` },
                { t: "Трафик вниз / вверх", v: x.status === "never" ? "—" : "48,2 / 6,1 ГБ" },
                { t: "Последний простой", v: x.status === "never" ? "—" : "04.10 02:14 – 02:40" },
                { t: "Последний сигнал", v: work ? "сегодня 18:22" : "—" },
              ]}
            />
            <p className="mt-3 text-xs text-muted-foreground">Данные мониторинга подтягиваются из «Мониторинга OneWeb»</p>
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={stationSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={stationSub(x)} url={qrUrl("oneweb-form", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <StationForm
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
          icon={Monitor}
          noun={["станция", "станции", "станций"]}
          items={[{ id: x.id, name, sub: x.f.serial }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => onewebStations.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/oneweb-form")}
        />
      )}
    </div>
  )
}
