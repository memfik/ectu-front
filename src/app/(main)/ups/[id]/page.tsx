"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  BatteryCharging,
  BatteryFull,
  Calendar,
  FileText,
  Gauge,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  RadioTower,
  Server,
  Truck,
  UserCog,
  Zap,
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
import { Card, Kv } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { UpsForm } from "@/components/ups/ups-form"
import { UPS_BLOCKS, UPS_LOAD, upsCls, UpsFlow, upsKva, upsKw, UpsPanel, upsPower, upsYear } from "@/components/ups/ups-panels"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { ups, upsDetail, upsName, upsReplaced, upsStatus, upsSub, useUps } from "@/lib/api/ups"
import { capBar } from "@/components/equipment/capacity"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { LineDocsTab } from "@/components/lines/tabs"

/*
 * 33 ИБП — паспорт /ups/<id> (ups-04 «Панель / Схема / Карта / Фото», вкладки «Аккумуляторы», «SNMP-мониторинг»,
 * «МОЛ и ответственные», «Документация», «История перемещений»). Запись — useUps(id), документы — upsDetail().
 */

type TabKey = "overview" | "battery" | "snmp" | "mol" | "docs" | "moves"

const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Схема", Gauge],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function UpsPassportPage({ params }: PageProps<"/ups/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useUps(id)
  const d = useMemo(() => (x ? upsDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? upsName(x) : "ИБП · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/ups" back="К списку ИБП" />

  const [label, tone] = upsStatus(x)
  const name = upsName(x)
  const editable = !ups.readOnly()
  const replaced = upsReplaced(x)
  const year = upsYear(x)
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["ИБП"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: "#4f8dff", point: (i) => `Плата ${i + 1}` }} />}>
        <PassportHeader
          crumb="Оборудование / Электропитание"
          listHref="/ups"
          listTitle="ИБП"
          title={name}
          status={{ label, tone }}
          pill={upsCls(x)}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Zap} t="Мощность" v={upsKva(x)} em="кВА" />
          <PassportStat icon={BatteryFull} t="АБ" v={UPS_BLOCKS} em="шт." />
          <PassportStat icon={Calendar} t="Замена АБ" v={year} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Идентификатор УС (БС)", v: x.nodeCode },
                { t: "Населенный пункт", v: `г. ${x.city}` },
                { t: "Адрес узла связи", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
                { t: "Модель UPS", v: String(x.f.model ?? "—") },
                { t: "S/N", v: String(x.f.serial ?? "—") },
                { t: "Мощность UPS (кВА/кВт)", v: upsPower(x) },
                { t: "Классификация UPS", v: String(x.f.cls) === "Онлайн" ? "On-line" : String(x.f.cls ?? "—") },
                { t: "Исполнение UPS", v: "Напольный" },
                { t: "SNMP-карта", v: "внутренняя" },
                { t: "Количество АБ, шт.", v: UPS_BLOCKS },
              ]}
            />
            <StageArea>
              {stage === "scene" && <UpsPanel x={x} />}
              {stage === "schema" && <UpsFlow x={x} />}
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
          { k: "battery", t: "Аккумуляторы", icon: BatteryFull, n: 8 },
          { k: "snmp", t: "SNMP-мониторинг", icon: Activity },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Zap} title="Мощность" onOpen={() => setTab("battery")}>
              {upsKva(x)} кВА <em>{upsKw(x)} кВт</em>
            </SummaryCard>
            <SummaryCard icon={BatteryFull} title="АБ" onOpen={() => setTab("battery")}>
              8 × 12 В <em>9 А·ч</em>
            </SummaryCard>
            <SummaryCard icon={Calendar} title="Замена АБ" onOpen={() => setTab("battery")}>
              {replaced}
            </SummaryCard>
            <SummaryCard icon={Gauge} title="Нагрузка" onOpen={() => setTab("snmp")} bar={capBar(UPS_LOAD, 100)}>
              {UPS_LOAD}% <em>по SNMP</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "battery" && (
          <Card icon={BatteryFull} title="Аккумуляторные батареи" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Количество АБ, шт.", v: 8 },
                { t: "Напряжение, В", v: 12 },
                { t: "Ёмкость, А*ч", v: 9 },
                { t: "Дата последней замены АБ", v: replaced },
                { t: "Рекомендуемая замена", v: year === "—" ? "—" : `03.${Number(year) + 3}` },
              ]}
            />
          </Card>
        )}
        {tab === "snmp" && (
          <Card icon={Activity} title="SNMP-карта" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "SNMP-карта", v: "AP9641" },
                { t: "IP", v: "10.40.12.30" },
                { t: "Нагрузка", v: `${UPS_LOAD}%` },
                { t: "Заряд", v: "100%" },
                { t: "Время автономии", v: "18 мин" },
                { t: "Онлайн-данные", v: "— предложение" },
              ]}
            />
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={upsSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={upsSub(x)} url={qrUrl("ups", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <UpsForm
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
          icon={BatteryCharging}
          noun={["ИБП", "ИБП", "ИБП"]}
          items={[{ id: x.id, name, sub: x.nodeCode }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => ups.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/ups")}
        />
      )}
    </div>
  )
}
