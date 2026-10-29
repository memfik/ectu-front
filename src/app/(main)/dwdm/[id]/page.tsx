"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, CircleAlert, FileText, Image as ImageIcon, Layers, LayoutGrid, Map as MapIcon, RadioTower, Rows3, Server, Truck, UserCog } from "lucide-react"
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
import { DwdmForm } from "@/components/dwdm/dwdm-form"
import { DwdmPanel, DwdmShelf, DwdmWaves } from "@/components/dwdm/dwdm-panel"
import { LineBackdrop, type LineStage } from "@/components/lines/line-stage"
import { Pill } from "@/components/list/ui"
import { Gallery } from "@/components/passport/gallery"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { DWDM_BOARDS, dwdmDetail, dwdmDevices, dwdmLambda, dwdmName, dwdmStatus, dwdmSub, dwdmTbit, dwdmVendor, useDwdmDevice } from "@/lib/api/dwdm"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { capBar } from "@/sections/lines/equipment"
import { MolPane, MovesPane } from "@/sections/lines/staff"
import { EditableTable, LineDocsTab } from "@/sections/lines/tabs"

/*
 * 24 DWDM — паспорт устройства /dwdm/<id>: панель — шасси, «Полка» — 16 слотов, вкладки «Платы и трансиверы», «Длины волн»,
 * МОЛ, документы, история перемещений. Запись — useDwdmDevice(id), документы и история — dwdmDetail() из lib/api/dwdm.
 * TODO(API): платы, трансиверы, ошибки LOS, длины волн C-band — нет в /api/dwdm.
 */

type TabKey = "overview" | "boards" | "waves" | "mol" | "docs" | "moves"

/** Фон «Карта»: узел устройства. */
const BACKDROP = { color: "#4f8dff", point: (i: number) => `Плата ${i + 1}` }
const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Полка", Layers],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]
const BOARD_ROWS = DWDM_BOARDS.map((b, i) => ({ id: String(i), num: String(i + 1), ...b }))

export default function DwdmDevicePage({ params }: PageProps<"/dwdm/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useDwdmDevice(id)
  const d = useMemo(() => (x ? dwdmDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? dwdmName(x) : "DWDM · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/dwdm" back="К списку DWDM" />

  const [label, tone] = dwdmStatus(x)
  const name = dwdmName(x)
  const lambda = dwdmLambda(x)
  const editable = !dwdmDevices.readOnly()
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["DWDM"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={BACKDROP} />}>
        <PassportHeader
          crumb="Оборудование / Проводные технологии"
          listHref="/dwdm"
          listTitle="DWDM"
          title={name}
          status={{ label, tone }}
          pill={dwdmVendor(x)}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Rows3} t="Длин волн" v={lambda.z} em={`из ${lambda.m}`} />
          <PassportStat icon={Server} t="Плат" v={14} />
          <PassportStat icon={Activity} t="Ёмкость" v={dwdmTbit(x)} em="Тбит/с" />
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
                { t: "Производитель", v: dwdmVendor(x) },
                { t: "Модель оборудования", v: String(x.f.model ?? "—") },
                { t: "S/N оборудования", v: "SAL1834Z17Y" },
                { t: "Дата ввода в эксплуатацию", v: "2013-12-31" },
              ]}
            />
            <StageArea>
              {stage === "scene" && <DwdmPanel x={x} />}
              {stage === "schema" && <DwdmShelf x={x} />}
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
          { k: "boards", t: "Платы и трансиверы", icon: Server, n: 14 },
          { k: "waves", t: "Длины волн", icon: Rows3, n: 40 },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Rows3} title="Длины волн" onOpen={() => setTab("waves")} bar={capBar(lambda.z, lambda.m)}>
              {lambda.z} / {lambda.m}
            </SummaryCard>
            <SummaryCard icon={Activity} title="Ёмкость" onOpen={() => setTab("waves")}>
              {dwdmTbit(x)} Тбит/с
            </SummaryCard>
            <SummaryCard icon={Server} title="Платы" onOpen={() => setTab("boards")} bar={capBar(14, 16)}>
              14 / 16
            </SummaryCard>
            <SummaryCard icon={CircleAlert} title="Ошибки" onOpen={() => setTab("boards")}>
              1 <em>трансивер</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "boards" && (
          <EditableTable
            icon={Server}
            title="Платы"
            noun="плата"
            cols={[
              { k: "num", t: "№ п/п" },
              { k: "slot", t: "№ Слота", req: true },
              { k: "board", t: "Плата", req: true },
              { k: "sfp", t: "Тип трансивера" },
              { k: "sn", t: "S/N" },
              { k: "port", t: "№ Порта", show: (v) => (/ошибка/.test(v) ? <Pill tone="bad">{v}</Pill> : v || "—") },
            ]}
            rows={BOARD_ROWS}
          />
        )}
        {tab === "waves" && <DwdmWaves x={x} />}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={dwdmSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={dwdmSub(x)} url={qrUrl("dwdm", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <DwdmForm
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
          icon={Rows3}
          noun={["устройство", "устройства", "устройств"]}
          items={[{ id: x.id, name, sub: x.nodeCode }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => dwdmDevices.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/dwdm")}
        />
      )}
    </div>
  )
}
