"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, ConciergeBell, FileText, Image as ImageIcon, LayoutGrid, Map as MapIcon, Network, Radio, RadioTower, Ruler, Server, Truck, UserCog } from "lucide-react"
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
import { RrlForm } from "@/components/rrl/rrl-form"
import { RrlFreq, RrlPanel, RrlSpanSchema } from "@/components/rrl/rrl-panel"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { RRL_CAP, RRL_RCS, rrlDetail, rrlMbps, rrlName, rrlSpans, rrlStatus, rrlSub, useRrlSpan } from "@/lib/api/rrl"
import { CapTable, capBar } from "@/components/equipment/capacity"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { LineDocsTab } from "@/components/lines/tabs"

/*
 * 25 РРЛ — паспорт пролёта /rrl/<id>: панель — IDU и ODU, «Трасса» — пролёт между мачтами, вкладки «Частоты»,
 * «Потоки Е1 и Ethernet», «Услуги», МОЛ, документы, история перемещений.
 * Запись — useRrlSpan(id), документы и история — rrlDetail() из lib/api/rrl.
 * TODO(API): Tx1/Tx2, RSL/SNR, РЧС, Е1, услуги — нет в /api/rrl.
 */

type TabKey = "overview" | "freq" | "cap" | "services" | "mol" | "docs" | "moves"

/** Фон «Карта»: узел пролёта. */
const BACKDROP = { color: "#4f8dff", point: (i: number) => `Плата ${i + 1}` }
const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Трасса", Ruler],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function RrlSpanPage({ params }: PageProps<"/rrl/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useRrlSpan(id)
  const d = useMemo(() => (x ? rrlDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? rrlName(x) : "РРЛ · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/rrl" back="К списку РРЛ" />

  const [label, tone] = rrlStatus(x)
  const name = rrlName(x)
  const mbps = rrlMbps(x)
  const editable = !rrlSpans.readOnly()
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["РРЛ"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={BACKDROP} />}>
        <PassportHeader
          crumb="Оборудование / Беспроводные технологии"
          listHref="/rrl"
          listTitle="РРЛ"
          title={name}
          status={{ label, tone }}
          pill="ГРС"
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Activity} t="Пропускная" v={mbps} em="Мбит/с" />
          <PassportStat icon={Ruler} t="Трасса" v={String(x.f.len ?? "—")} em="км" />
          <PassportStat icon={Network} t="Ethernet" v={2} em="из 4" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Тип сети", v: "ГРС" },
                { t: "Вендор", v: String(x.f.vendor ?? "—") },
                { t: "Модель", v: String(x.f.model ?? "—") },
                { t: "Пропускная способность, Мбит/с", v: mbps },
                { t: "Протяженность трассы РРЛ, км", v: String(x.f.len ?? "—") },
                { t: "Разрешение РЧС", v: RRL_RCS },
                { t: "Дата установки РРЛ", v: "2014-07-29" },
                { t: "Номер и дата распоряжения/наряда", v: "Наряд № 3221 от 18.09.2014" },
                { t: "Номер и дата акта о вводе", v: "ВП-430 от 05.08.2014 г" },
                { t: "Точка установки # 1", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
              ]}
            />
            <StageArea>
              {stage === "scene" && <RrlPanel x={x} />}
              {stage === "schema" && <RrlSpanSchema x={x} />}
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
          { k: "cap", t: "Потоки Е1 и Ethernet", icon: Activity },
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
              {x.f.len} км
            </SummaryCard>
            <SummaryCard icon={Activity} title="E1" onOpen={() => setTab("cap")} bar={capBar(8, 16)}>
              8 / 16
            </SummaryCard>
            <SummaryCard icon={Network} title="Ethernet" onOpen={() => setTab("cap")} bar={capBar(2, 4)}>
              2 / 4
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "freq" && <RrlFreq x={x} />}
        {tab === "cap" && <CapTable icon={Activity} title="Потоки Е1 и порты Ethernet" rows={RRL_CAP} />}
        {tab === "services" && (
          <Card icon={ConciergeBell} title="Предоставляемые услуги" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Интернет, кбит/с", v: "102 400" },
                { t: "Передача данных, кбит/с", v: "51 200" },
                { t: "Количество голосовых каналов, шт", v: 30 },
                { t: "Номер распоряжения/наряда", v: "№ 044-р" },
                { t: "Примечание", v: "резерв ВОЛС на Косшы" },
              ]}
            />
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={rrlSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={rrlSub(x)} url={qrUrl("rrl", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <RrlForm
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
          icon={Radio}
          noun={["пролёт", "пролёта", "пролётов"]}
          items={[{ id: x.id, name, sub: x.f.model }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => rrlSpans.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/rrl")}
        />
      )}
    </div>
  )
}
