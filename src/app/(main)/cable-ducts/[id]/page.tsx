"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Box, Building2, Cable, FileText, History, Image as ImageIcon, Layers, LayoutGrid, Map as MapIcon, RadioTower, Rows3, Ruler, Spline, Square } from "lucide-react"
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
import { CableDuctForm } from "@/components/cable-ducts/cable-duct-form"
import { LineBackdrop, LineSchema, type LineStage } from "@/components/lines/line-stage"
import { Gallery } from "@/components/passport/gallery"
import { Card, Kv, SegBar } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { cableDuctDetail, cableDuctName, cableDucts, cableDuctStatus, cableDuctSub, useCableDuct, well } from "@/lib/api/cable-ducts"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { parseKm, type LineKind } from "@/sections/lines/detail"
import { EditableTable, LineDocsTab, LineHistoryTab } from "@/sections/lines/tabs"

/*
 * 09 Кабельная канализация — паспорт участка /cable-ducts/<id> (kk-04 «3D / Схема / Карта / Фото», вкладки kk-t1…t5):
 * колодцы вместо муфт, каналы вместо жил, длины в метрах. Запись — useCableDuct(id), участки и каналы — cableDuctDetail().
 */

type TabKey = "overview" | "wells" | "channels" | "third" | "docs" | "history"

const COLOR = "#22d3ee"
const UNIT: [string, string, string] = ["участок", "участка", "участков"]
/** Каналы: подписи и цвета занятых (a) и арендованных (b). */
const STRAND: LineKind["strand"] = { tab: "Каналы", stat: "Каналов", a: ["Занято", COLOR], b: ["Аренда", "#a78bfa"] }
const point = (i: number) => well(i + 1)
const STAGES: [LineStage, string, typeof Box][] = [
  ["scene", "3D", Box],
  ["schema", "Схема", Layers],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]
/** Предоставление сторонним организациям (TODO(API): нет в /api/kk). */
const THIRD = { len: "120", basis: "Договор № 2024/14 с ТОО «Казтелепорт»", tu: "№ 88 от 2011" }

const m = (km: number) => Math.round(km * 1000)

export default function CableDuctPage({ params }: PageProps<"/cable-ducts/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useCableDuct(id)
  const base = useMemo(() => (x ? cableDuctDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? cableDuctName(x) : "Кабельная канализация · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !base) return <RecordNotFound title="Запись не найдена" href="/cable-ducts" back="К списку Кабельная канализация" />

  const d = base
  const [label, tone] = cableDuctStatus(x)
  const name = cableDuctName(x)
  const a = d.strands.filter((f) => f === "a").length
  const b = d.strands.filter((f) => f === "b").length
  const len = d.segments.reduce((s, v) => s + v.len, 0)
  const cable = d.segments.reduce((s, v) => s + v.cable, 0)
  /** Колодцы трассы: у начала, между участками, у конца. */
  const wells = [d.route[0], ...d.pointLl, d.route[d.route.length - 1]]
  const editable = !cableDucts.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["Кабельная канализация"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, scene: "/nodes/kk-3d.png", point }} />}>
        <PassportHeader
          crumb="Линии и сооружения"
          listHref="/cable-ducts"
          listTitle="Кабельная канализация"
          title={name}
          status={{ label, tone }}
          pill="2–4 канала"
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Ruler} t="Длина трассы" v={m(len)} em="м" />
          <PassportStat icon={Rows3} t="Каналов" v={d.strands.length} em={`${a} занято`} />
          <PassportStat icon={Square} t="Колодцев" v={wells.length} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Наименование участка", v: String(x.f.name ?? "—") },
                { t: "Описание", v: String(x.f.desc ?? "Одноканальная кабельная канализация") },
                { t: "Прокол", v: x.f.puncture === "Да" ? "Да, под пр. Республики" : "Нет" },
                { t: "Кол-во колодцев", v: String(x.f.wells ?? d.segments.length + 1) },
                { t: "Дата ввода в эксплуатацию", v: "14.06.2011" },
                { t: "Документ о вводе", v: "Акт № 33" },
                { t: "Длина трассы, м", v: String(x.f.len ?? "—") },
                { t: "Общая протяжённость трассы, м", v: m(cable) },
                { t: "Кол-во каналов", v: String(x.f.channels ?? "—") },
                { t: "канал/км", v: (((Number(x.f.channels) || 1) * parseKm(x.f.len)) / 1000 || 0).toFixed(2).replace(".", ",") },
              ]}
            />
            <StageArea>
              {stage === "schema" && (
                <LineSchema
                  d={d}
                  k={{ color: COLOR, square: true, meters: true, segLabel: (s) => `${s.channels} канала`, strip: "duct", strand: STRAND }}
                  stripTitle={`Сечение канализации · ${d.strands.length} канала · занято ${a}`}
                />
              )}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: Cable, t: "ВОЛС №49", sub: "проходит по КК", href: "/fiber-lines/49" },
                  { icon: Cable, t: "КЛС №18", sub: "проходит по КК", href: "/cable-lines/18" },
                  { icon: RadioTower, t: x.nodeCode, sub: "ввод в КСО", href: `/nodes/${x.nodeId}` },
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
          { k: "wells", t: "Колодцы", icon: Square, n: wells.length },
          { k: "channels", t: "Каналы", icon: Rows3, n: d.strands.length },
          { k: "third", t: "Сторонним организациям", icon: Building2, n: 1 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "history", t: "История", icon: History, n: d.history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Ruler} title="Длина трассы" onOpen={() => setTab("wells")}>
              {m(len)} <em>м · общая {m(cable)} м</em>
            </SummaryCard>
            <SummaryCard
              icon={Rows3}
              title="Каналы"
              onOpen={() => setTab("channels")}
              bar={
                <SegBar
                  parts={[
                    { v: a, color: STRAND.a[1] },
                    { v: b, color: STRAND.b[1] },
                    { v: d.strands.length - a - b, color: "var(--chip-bg)" },
                  ]}
                />
              }
            >
              {a} / {d.strands.length} <em>занято</em>
            </SummaryCard>
            <SummaryCard icon={Square} title="Колодцы" onOpen={() => setTab("wells")}>
              {wells.length}{" "}
              <em>
                {well(0)} … {well(wells.length - 1)}
              </em>
            </SummaryCard>
            <SummaryCard icon={Building2} title="Сторонним" onOpen={() => setTab("third")}>
              {THIRD.len} <em>м · 1 договор</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "wells" && (
          <EditableTable
            icon={Square}
            title="Колодцы"
            noun="колодец"
            cols={[
              { k: "num", t: "№", req: true },
              { k: "type", t: "Тип", opts: ["ККС-2", "ККС-3", "ККС-4", "ККС-5"] },
              { k: "ll", t: "Координаты" },
              { k: "channels", t: "Каналов" },
              { k: "pass", t: "Что проходит" },
            ]}
            rows={wells.map((ll, i) => ({
              id: String(i),
              num: well(i),
              type: i % 2 ? "ККС-2" : "ККС-3",
              ll: `${ll[0].toFixed(4)}, ${ll[1].toFixed(4)}`,
              channels: String(d.segments[Math.min(i, d.segments.length - 1)]?.channels ?? 4),
              pass: ["ВОЛС №49, КЛС №18", "ВОЛС №49", "КЛС №18", ""][i % 4],
            }))}
          />
        )}
        {tab === "channels" && (
          <EditableTable
            icon={Rows3}
            title="Каналы"
            noun="канал"
            cols={[
              { k: "num", t: "Канал", req: true },
              { k: "busy", t: "Занят", opts: ["Да", "Нет"] },
              { k: "cable", t: "Кабель" },
              { k: "owner", t: "Владелец" },
            ]}
            rows={d.strands.map((f, i) => ({
              id: String(i),
              num: String(i + 1),
              busy: f === "free" ? "Нет" : "Да",
              cable: f === "free" ? "" : ["ВОЛС №49 · ОКЛ-0,22-32", "КЛС №18 · ТПП 50×2", "ВОК ТОО «Казтелепорт»"][i % 3],
              owner: f === "free" ? "" : i % 3 === 2 ? `Аренда · ${THIRD.len} м` : "QMobile",
            }))}
          />
        )}
        {tab === "third" && (
          <Card icon={Building2} title="Предоставление сторонним организациям" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Протяжённость КК предоставляемой сторонним организациям, м", v: THIRD.len },
                { t: "Основание (номер договора, письмо)", v: THIRD.basis },
                { t: "Реквизиты технических условий (ТУ)", v: THIRD.tu },
              ]}
            />
          </Card>
        )}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={cableDuctSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={cableDuctSub(x)} url={qrUrl("cable-ducts", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <CableDuctForm
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
          icon={Spline}
          noun={UNIT}
          items={[{ id: x.id, name, sub: cableDuctSub(x) }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => cableDucts.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/cable-ducts")}
        />
      )}
    </div>
  )
}
