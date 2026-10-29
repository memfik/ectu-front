"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  Radio,
  RadioTower,
  Server,
  Signal,
  Truck,
  UserCog,
  Users,
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
import { Pill } from "@/components/list/ui"
import { TrunkBsForm } from "@/components/trunk-bs/trunk-bs-form"
import { TrunkPanel } from "@/components/trunk-bs/trunk-panel"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { trunkDetail, trunkName, trunkStations, trunkStatus, trunkSub, trunkTerminals, useTrunkStation, type TrunkBs } from "@/lib/api/trunk-bs"
import { Coverage } from "@/sections/lines/bwa"
import { MolPane, MovesPane } from "@/sections/lines/staff"
import { EditableTable, LineDocsTab } from "@/sections/lines/tabs"

/*
 * 30 БС Транк — паспорт /trunk-bs/<id>: ретранслятор с дисплеем каналов, покрытие 25 км,
 * вкладки «Абонентские терминалы», «МОЛ и ответственные», «Документация», «История перемещений».
 * TODO(API): частоты, стандарт, высота АМС, терминалы (ISSI, владелец) — нет в /api/bc.
 */

type TabKey = "overview" | "terminals" | "mol" | "docs" | "moves"

const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Покрытие", Signal],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

const state = (x: TrunkBs) => String(x.f.state ?? "в работе")
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const TERMINALS = [
  { type: "Motorola MTP3550", owner: "ТОО «Тенгизшевройл»", issi: "1001", st: "Активен" },
  { type: "Motorola MTP3550", owner: "АО «КазМунайГаз»", issi: "1002", st: "Активен" },
  { type: "Motorola MTM5400", owner: "Аким. Кульсары", issi: "1010", st: "Выключен" },
]

export default function TrunkBsPassportPage({ params }: PageProps<"/trunk-bs/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useTrunkStation(id)
  const d = useMemo(() => (x ? trunkDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? trunkName(x) : "БС Транк · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/trunk-bs" back="К списку БС Транк" />

  const [label, tone] = trunkStatus(x)
  const name = trunkName(x)
  const editable = !trunkStations.readOnly()
  const terminals = trunkTerminals(x)
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["БС Транк"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: "#4f8dff", point: (i) => `Плата ${i + 1}` }} />}>
        <PassportHeader
          crumb="Оборудование / Беспроводные технологии"
          listHref="/trunk-bs"
          listTitle="БС Транк"
          title={name}
          status={{ label, tone }}
          pill={"TETRA"}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Users} t="Терминалов" v={terminals} />
          <PassportStat icon={Activity} t="Состояние" v={cap(state(x))} />
          <PassportStat icon={RadioTower} t="АМС" v={36} em="м" />
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
                { t: "Тип/модель БС", v: String(x.f.model ?? "—") },
                { t: "Место установки", v: String(x.f.place ?? "—") },
                { t: "Состояние БС", v: state(x) },
                { t: "Количество абонентских терминалов, шт.", v: terminals },
                { t: "Тип абонентского терминала", v: "Motorola GP-680" },
              ]}
            />
            <StageArea>
              {stage === "scene" && <TrunkPanel x={x} />}
              {stage === "schema" && <Coverage n={1} km={25} freq="410" used={terminals} total={Math.max(64, terminals)} />}
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
          { k: "terminals", t: "Абонентские терминалы", icon: Users, n: terminals },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Users} title="Терминалы" onOpen={() => setTab("terminals")}>
              {terminals} <em>Motorola MTP3550</em>
            </SummaryCard>
            <SummaryCard icon={Activity} title="Состояние БС" onOpen={() => setTab("terminals")}>
              {cap(state(x))}
            </SummaryCard>
            <SummaryCard icon={RadioTower} title="Место" onOpen={() => setTab("terminals")}>
              АМС 36 м
            </SummaryCard>
            <SummaryCard icon={Radio} title="Стандарт" onOpen={() => setTab("terminals")}>
              TETRA
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "terminals" && (
          <EditableTable
            icon={Users}
            title="Абонентские терминалы"
            noun="терминал"
            cols={[
              { k: "num", t: "№" },
              { k: "type", t: "Тип абонентского терминала", req: true },
              { k: "owner", t: "Владелец" },
              { k: "issi", t: "ISSI" },
              { k: "st", t: "Статус", opts: ["Активен", "Выключен"], show: (v) => <Pill tone={v === "Активен" ? "ok" : "muted"}>{v}</Pill> },
            ]}
            rows={TERMINALS.map((t, i) => ({ id: String(i), num: String(i + 1), ...t }))}
          />
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={trunkSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={trunkSub(x)} url={qrUrl("trunk-bs", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <TrunkBsForm
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
          icon={RadioTower}
          noun={["станция", "станции", "станций"]}
          items={[{ id: x.id, name, sub: x.nodeCode }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => trunkStations.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/trunk-bs")}
        />
      )}
    </div>
  )
}
