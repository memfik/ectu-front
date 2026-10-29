"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, FileText, Gauge, Image as ImageIcon, Layers, LayoutGrid, Map as MapIcon, RadioTower, Rows3, Server, Spline, Truck, UserCog } from "lucide-react"
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
import { SdhForm } from "@/components/sdh/sdh-form"
import { SdhPanel, SdhShelf } from "@/components/sdh/sdh-panel"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { SDH_BOARDS, sdhCap, sdhDetail, sdhDevices, sdhName, sdhStatus, sdhStm, sdhStmAll, sdhSub, sdhVc, useSdhDevice } from "@/lib/api/sdh"
import { CapTable, capBar } from "@/components/equipment/capacity"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { EditableTable, LineDocsTab } from "@/components/lines/tabs"

/*
 * 23 SDH — паспорт устройства /sdh/<id>: панель — шасси с платами, «Полка» — 15 слотов, вкладки «Ёмкость», «Платы», МОЛ,
 * документы, история перемещений. Запись — useSdhDevice(id), документы и история — sdhDetail() из lib/api/sdh.
 * TODO(API): платы по слотам, STM-4/16, VC-3/4, E1/E3, Ethernet — нет в /api/sdh.
 */

type TabKey = "overview" | "cap" | "boards" | "mol" | "docs" | "moves"

/** Фон «Карта»: узел устройства. */
const BACKDROP = { color: "#4f8dff", point: (i: number) => `Плата ${i + 1}` }
const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Полка", Layers],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]
const BOARD_ROWS = SDH_BOARDS.map((b, i) => ({ id: String(i), num: String(i + 1), ...b }))

export default function SdhDevicePage({ params }: PageProps<"/sdh/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useSdhDevice(id)
  const d = useMemo(() => (x ? sdhDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? sdhName(x) : "SDH · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/sdh" back="К списку SDH" />

  const [label, tone] = sdhStatus(x)
  const name = sdhName(x)
  const stm = sdhStm(x)
  const vc = sdhVc(x)
  const cap = sdhCap(x)
  const stmAll = sdhStmAll(x)
  const e1 = cap[6]
  const editable = !sdhDevices.readOnly()
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["SDH"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={BACKDROP} />}>
        <PassportHeader
          crumb="Оборудование / Проводные технологии"
          listHref="/sdh"
          listTitle="SDH"
          title={name}
          status={{ label, tone }}
          pill={String(x.f.vendor) === "CISCO" ? "Cisco" : String(x.f.vendor ?? "—")}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Activity} t="STM-1" v={stm.z} em={`из ${stm.m}`} />
          <PassportStat icon={Rows3} t="VC-12" v={vc.z} em={`из ${vc.m}`} />
          <PassportStat icon={Server} t="Плат" v={11} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Идентификатор УС", v: x.nodeCode },
                { t: "Населенный пункт", v: `г. ${x.city}` },
                { t: "Адрес узла связи", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
                { t: "Производитель", v: String(x.f.vendor ?? "—") },
                { t: "Модель оборудования", v: String(x.f.model ?? "—") },
                { t: "S/N оборудования", v: "FOX1305G104" },
                { t: "Дата ввода в эксплуатацию", v: "2010-12-27" },
                { t: "М. (STM-1)", v: stm.m },
                { t: "З. (STM-1)", v: stm.z },
                { t: "М. (STM-4)", v: 4 },
              ]}
            />
            <StageArea>
              {stage === "scene" && <SdhPanel x={x} />}
              {stage === "schema" && <SdhShelf x={x} />}
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
          { k: "cap", t: "Ёмкость", icon: Gauge },
          { k: "boards", t: "Платы", icon: Server, n: 11 },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Activity} title="STM-1/4/16" onOpen={() => setTab("cap")} bar={capBar(stmAll.z, stmAll.m)}>
              {stmAll.z} / {stmAll.m}
            </SummaryCard>
            <SummaryCard icon={Rows3} title="VC-12" onOpen={() => setTab("cap")} bar={capBar(vc.z, vc.m)}>
              {vc.z} / {vc.m}
            </SummaryCard>
            <SummaryCard icon={Activity} title="E1" onOpen={() => setTab("cap")} bar={capBar(e1.z, e1.m)}>
              {e1.z} / {e1.m}
            </SummaryCard>
            <SummaryCard icon={Server} title="Платы" onOpen={() => setTab("boards")} bar={capBar(11, 15)}>
              11 <em>из 15 слотов</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "cap" && <CapTable icon={Gauge} title="Ёмкость" rows={cap} />}
        {tab === "boards" && (
          <EditableTable
            icon={Server}
            title="Платы"
            noun="плата"
            cols={[
              { k: "num", t: "№ п/п" },
              { k: "slot", t: "№ Слота", req: true },
              { k: "board", t: "Плата", req: true },
              { k: "port", t: "№ Порта" },
              { k: "sn", t: "S/N" },
            ]}
            rows={BOARD_ROWS}
          />
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={sdhSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={sdhSub(x)} url={qrUrl("sdh", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <SdhForm
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
          noun={["устройство", "устройства", "устройств"]}
          items={[{ id: x.id, name, sub: x.nodeCode }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => sdhDevices.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/sdh")}
        />
      )}
    </div>
  )
}
