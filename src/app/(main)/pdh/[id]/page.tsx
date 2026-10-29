"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, Calendar, Contact, FileText, Gauge, GitBranch, Image as ImageIcon, LayoutGrid, Map as MapIcon, Network, RadioTower, Server, Truck, UserCog } from "lucide-react"
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
import { CapacityBars } from "@/components/passport/chassis"
import { Gallery } from "@/components/passport/gallery"
import { PdhForm } from "@/components/pdh/pdh-form"
import { PdhPanel } from "@/components/pdh/pdh-panel"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { PDH_CLIENT, pdhCap, pdhDetail, pdhDevices, pdhE1, pdhEth, pdhName, pdhStatus, pdhSub, usePdhDevice } from "@/lib/api/pdh"
import { CapTable, capBar } from "@/components/equipment/capacity"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { LineDocsTab } from "@/components/lines/tabs"

/*
 * 22 PDH — паспорт устройства /pdh/<id>: панель 1U с портами E1 и Ethernet, ёмкость интерфейсов, МОЛ, документы,
 * история перемещений. Запись — usePdhDevice(id), документы и история — pdhDetail() из lib/api/pdh.
 * TODO(API): E3, Ethernet 10/100/1000, производитель, дата ввода, клиент — в /api/pdh их нет.
 */

type TabKey = "overview" | "cap" | "mol" | "docs" | "moves"

/** Фон «Карта»: узел устройства. */
const BACKDROP = { color: "#4f8dff", point: (i: number) => `Плата ${i + 1}` }
const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Схема", Gauge],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function PdhDevicePage({ params }: PageProps<"/pdh/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = usePdhDevice(id)
  const d = useMemo(() => (x ? pdhDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? pdhName(x) : "PDH · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/pdh" back="К списку PDH" />

  const [label, tone] = pdhStatus(x)
  const name = pdhName(x)
  const e1 = pdhE1(x)
  const eth = pdhEth(x)
  const cap = pdhCap(x)
  const editable = !pdhDevices.readOnly()
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["PDH"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={BACKDROP} />}>
        <PassportHeader
          crumb="Оборудование / Проводные технологии"
          listHref="/pdh"
          listTitle="PDH"
          title={name}
          status={{ label, tone }}
          pill={String(x.f.vendor ?? "—")}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Activity} t="E1" v={e1.z} em={`из ${e1.m}`} />
          <PassportStat icon={Network} t="Ethernet" v={eth.z} em={`из ${eth.m}`} />
          <PassportStat icon={Calendar} t="В работе с" v={2014} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Вендор", v: String(x.f.vendor ?? "—") },
                { t: "Модель оборудования", v: String(x.f.model ?? "—") },
                { t: "Производитель", v: x.f.vendor === "RAD" ? "RAD Data Communications" : String(x.f.vendor ?? "—") },
                { t: "Идентификатор УС", v: x.nodeCode },
                { t: "Населенный пункт", v: x.city },
                { t: "S/N оборудования", v: String(x.f.serial ?? x.f.client ?? "—") },
                { t: "Дата ввода в эксплуатацию", v: "14.06.2014" },
                { t: "Фактический адрес", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
                { t: "Наименование клиента", v: PDH_CLIENT },
                { t: "М. (E1)", v: e1.m },
              ]}
            />
            <StageArea>
              {stage === "scene" && <PdhPanel x={x} />}
              {stage === "schema" && (
                <CapacityBars title="Интерфейсы PDH · М. / З." rows={cap.map((r) => ({ t: r.t, a: r.z, b: r.m }))} note="М. — монтировано · З. — задействовано" />
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
          { k: "cap", t: "Ёмкость интерфейсов", icon: Gauge },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Activity} title="E1" onOpen={() => setTab("cap")} bar={capBar(e1.z, e1.m)}>
              {e1.z} / {e1.m}
            </SummaryCard>
            <SummaryCard icon={Activity} title="E3" onOpen={() => setTab("cap")} bar={capBar(1, 2)}>
              1 / 2
            </SummaryCard>
            <SummaryCard icon={Network} title="Ethernet 10/100/1000" onOpen={() => setTab("cap")} bar={capBar(eth.z, eth.m)}>
              {eth.z} / {eth.m}
            </SummaryCard>
            <SummaryCard icon={Contact} title="Клиент" onOpen={() => setTab("cap")}>
              КазТрансКом <em>АО</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "cap" && <CapTable icon={Gauge} title="Ёмкость интерфейсов" rows={cap} />}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={pdhSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={pdhSub(x)} url={qrUrl("pdh", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <PdhForm
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
          icon={GitBranch}
          noun={["устройство", "устройства", "устройств"]}
          items={[{ id: x.id, name, sub: x.nodeCode }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => pdhDevices.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/pdh")}
        />
      )}
    </div>
  )
}
