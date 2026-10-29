"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, ArrowLeftRight, FileText, Hash, Image as ImageIcon, LayoutGrid, Map as MapIcon, Phone, RadioTower, Truck, UserCog, Users } from "lucide-react"
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
import { CapacityBars, Chassis, type Slot } from "@/components/passport/chassis"
import { Gallery } from "@/components/passport/gallery"
import { Card, Kv, SegBar } from "@/components/passport/ui"
import { PbxForm } from "@/components/pbx/pbx-form"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { PBX_E1, PBX_EM, pbxCapacity, pbxDetail, pbxName, pbxPair, pbxs, pbxStatus, pbxSub, usePbx } from "@/lib/api/pbx"
import { LineDocsTab } from "@/components/lines/tabs"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { nodeRows } from "@/lib/api/node-data"
import { Table } from "@/components/nodes/tabs"

/*
 * 20 АТС — паспорт /pbx/<id>: «Панель» — шасси с платами абонентов, Е1 и управления; «Схема» — ёмкость станции,
 * вкладки «Ёмкость и абоненты», «Линии и потоки», «МОЛ и ответственные», «Документация», «История перемещений».
 * TODO(API): платы, ОТА МГ/МН, Е1, E&M, СТОП, установки / отключения — в /api/phone_station их нет.
 */

type TabKey = "overview" | "cap" | "lines" | "mol" | "docs" | "moves"

const COLOR = "#4f8dff"
const STAGES: [LineStage, string, typeof Hash][] = [
  ["scene", "Панель", Hash],
  ["schema", "Схема", Hash],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]
const SLOTS: Slot[] = [
  ...Array.from({ length: 6 }, () => ({ label: "MEA-48", led: "ok" as const })),
  { label: "CMH", led: "ok", on: true, ports: 0 },
  { label: "CMH", led: "ok" },
  { label: "SIG", led: "ok", ports: 1 },
  { label: "E1 × 32", led: "ok", ports: 1 },
  { label: "E1 × 32", led: "warn", ports: 1 },
  ...Array.from({ length: 4 }, () => ({ label: "MEA-48", led: "ok" as const })),
  { label: "" },
]

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
const n0 = (v: number) => v.toLocaleString("ru-RU")

export default function PbxPassportPage({ params }: PageProps<"/pbx/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = usePbx(id)
  const d = useMemo(() => (x ? pbxDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? String(x.f.object ?? pbxName(x)) : "АТС · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/pbx" back="К списку АТС" />

  const [label, tone] = pbxStatus(x)
  const name = pbxName(x)
  const { used, total } = pbxPair(x)
  const ota = Number(x.f.ota)
  const cap = pbxCapacity(x)
  const node = nodeRows().find((v) => v.id === x.nodeId)
  const editable = !pbxs.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["АТС"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, point: (i) => `Плата ${i + 1}` }} />}>
        <PassportHeader
          crumb="Оборудование / Автоматическая электросвязь"
          listHref="/pbx"
          listTitle="АТС"
          title={String(x.f.object ?? name)}
          status={{ label, tone }}
          pill={String(x.f.network ?? "ГМС")}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Phone} t="Ёмкость" v={n0(used)} em={`из ${n0(total)} портов`} />
          <PassportStat icon={Users} t="ОТА" v={n0(ota)} em="абонентов" />
          <PassportStat icon={Activity} t="E1" v={PBX_E1.z} em="потока" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Наименование объекта связи", v: String(x.f.object ?? "—") },
                { t: "Идентификатор УС", v: x.nodeCode },
                { t: "Населенный пункт", v: `г. ${x.city}` },
                { t: "Адрес объекта связи", v: (node?.address ?? x.address).replace(/^(г\.|с\.) [^,]+, /, "") },
                { t: "Тип сети*", v: String(x.f.network ?? node?.network ?? "—") },
                { t: "Модель станции", v: String(x.f.model ?? "—") },
                { t: "Наличие выхода в СТОП (+/-)", v: "+" },
                { t: "Кол-во установок за период (АИС, ф. № 3)", v: 14 },
                { t: "Кол-во отключений за период", v: 31 },
                { t: "Ёмкость монтированная (порт)", v: total },
              ]}
            />
            <StageArea>
              {stage === "scene" && (
                <Chassis
                  title="АТС"
                  sub={String(x.f.model ?? "")}
                  left={`${x.f.model} · полка 1`}
                  right={`ёмкость ${used} / ${total} портов`}
                  slots={SLOTS}
                  callouts={[
                    { t: "Платы MEA-48 · абонентские", v: `${x.f.ota} ОТА подключено`, pct: pct(ota, total), at: 12 },
                    { t: "E1 · потоки", v: `${PBX_E1.m * 2} смонтировано · ${PBX_E1.z / 2 - 2} задействовано`, pct: 16, at: 48 },
                    { t: "Плата управления CMH", v: "активная · резерв в слоте 8", at: 36, below: true },
                  ]}
                />
              )}
              {stage === "schema" && (
                <CapacityBars
                  title="Ёмкость станции и подключения"
                  rows={[
                    ...cap.map((r) => ({ t: r.t.replace("ОТА с выходом на ", "ОТА · ").replace("Порты станции", "Порты"), a: r.z, b: r.m })),
                    { t: "E1 (поток)", a: PBX_E1.z, b: PBX_E1.m },
                    { t: "E&M (порт)", a: PBX_EM.z, b: PBX_EM.m },
                  ]}
                  note="М. — монтировано · З. — задействовано"
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
          { k: "cap", t: "Ёмкость и абоненты", icon: Hash },
          { k: "lines", t: "Линии и потоки", icon: Activity },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard
              icon={Phone}
              title="Ёмкость"
              onOpen={() => setTab("cap")}
              bar={
                <SegBar
                  parts={[
                    { v: used, color: "#085eff" },
                    { v: total - used, color: "var(--chip-bg)" },
                  ]}
                />
              }
            >
              {pct(used, total)}%{" "}
              <em>
                {n0(used)} / {n0(total)}
              </em>
            </SummaryCard>
            <SummaryCard icon={Users} title="ОТА" onOpen={() => setTab("cap")}>
              {n0(ota)} <em>абонентов</em>
            </SummaryCard>
            <SummaryCard icon={Activity} title="Потоки E1" onOpen={() => setTab("lines")}>
              {PBX_E1.z}
            </SummaryCard>
            <SummaryCard icon={ArrowLeftRight} title="За период" onOpen={() => setTab("lines")}>
              +14 / −31 <em>установки / отключения</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "cap" && (
          <Card icon={Hash} title="Ёмкость и абоненты">
            <Table
              head={["Тип", "Монтировано (М.)", "Задействовано (З.)", "Свободно", "Загрузка"]}
              rows={cap.map((r) => ({
                key: r.t,
                cells: [
                  <b key="t">{r.t}</b>,
                  n0(r.m),
                  n0(r.z),
                  n0(r.m - r.z),
                  <span key="p" className="flex items-center gap-3">
                    <span className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                      <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${pct(r.z, r.m)}%` }} />
                    </span>
                    {pct(r.z, r.m)}%
                  </span>,
                ],
              }))}
            />
          </Card>
        )}
        {tab === "lines" && (
          <Card icon={Activity} title="Линии и потоки" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "E&M (порт)", v: PBX_EM.z },
                { t: "Е1 (поток)", v: PBX_E1.z },
                { t: "Двухпроводная СЛ (СТОП), номеров", v: 30 },
                { t: "Наличие выхода в СТОП", v: "+" },
                { t: "Телефонов КТС", v: 64 },
                { t: "Установок за период", v: 14 },
                { t: "Отключений за период", v: 31 },
              ]}
            />
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={pbxSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={pbxSub(x)} url={qrUrl("pbx", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <PbxForm
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
          icon={Phone}
          noun={["станция", "станции", "станций"]}
          items={[{ id: x.id, name, sub: pbxSub(x).split(" · ")[0] }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => pbxs.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/pbx")}
        />
      )}
    </div>
  )
}
