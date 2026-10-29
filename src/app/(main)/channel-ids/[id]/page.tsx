"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, Contact, FileText, Hash, History, Image as ImageIcon, LayoutGrid, Link as LinkIcon, Map as MapIcon, MapPin, Network, RadioTower, Router, Ruler } from "lucide-react"
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
import { ChannelForm } from "@/components/channel-ids/channel-form"
import { LineBackdrop, type LineStage } from "@/components/lines/line-stage"
import { Textarea } from "@/components/list/form-controls"
import { Gallery } from "@/components/passport/gallery"
import { Card, glass, Kv } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import {
  CHANNEL_KM,
  channelCompany,
  channelDetail,
  channelIface,
  channelIp,
  channelName,
  channels,
  channelSpeed,
  channelStatus,
  channelSub,
  channelVlan,
  useChannel,
  type Channel,
} from "@/lib/api/channel-ids"
import { LineDocsTab, LineHistoryTab } from "@/components/lines/tabs"

/*
 * 14 ID-каналы — паспорт /channel-ids/<id>: схема «Цепочка» — устройства от точки 1 до клиента, вкладки «Сетевые данные»,
 * «Клиент», «Пользовательские данные». TODO(API): цепочка, IP, VRF, outer VLAN, соединительная линия — нет в /api/channels.
 */

type TabKey = "overview" | "net" | "client" | "notes" | "docs" | "history"

const COLOR = "#4f8dff"
const STAGES: [LineStage, string, typeof LinkIcon][] = [
  ["schema", "Цепочка", LinkIcon],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]
const shortAddr = (a: string) => a.replace(/^(г\.|с\.) [^,]+, /, "")

export default function ChannelPage({ params }: PageProps<"/channel-ids/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useChannel(id)
  const d = useMemo(() => (x ? channelDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("schema")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? channelName(x) : "ID-каналы · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/channel-ids" back="К списку ID-каналы" />

  const [label, tone] = channelStatus(x)
  const name = channelName(x)
  const { router: rt, port } = channelIface(x)
  const vlan = channelVlan(x)
  const speed = channelSpeed(x)
  const ip = channelIp(x)
  const company = channelCompany(x)
  const editable = !channels.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["ID-каналы"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, point: (i) => `Точка ${i + 1}` }} />}>
        <PassportHeader
          crumb="Клиенты"
          listHref="/channel-ids"
          listTitle="ID-каналы"
          title={name}
          status={{ label, tone }}
          pill={`${String(x.f.type ?? "").replace("VPN", "")} · ${x.f.speed ?? "—"}`}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Activity} t="Скорость" v={speed[0]} em={speed[1]} />
          <PassportStat icon={Hash} t="VLAN" v={String(x.f.vlan ?? "—")} em="inner / outer" />
          <PassportStat icon={Ruler} t="Протяжённость" v={CHANNEL_KM} em="км" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "ID-канала", v: String(x.f.cid ?? "—") },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Тип канала", v: String(x.f.type ?? "—") },
                { t: "Тип трафика", v: String(x.f.traffic ?? "Data") },
                { t: "Тип среды передач", v: "ВОЛС" },
                { t: "Уровень/направление", v: "Доступ" },
                { t: "Вид", v: "Корпоративный" },
                { t: "Router", v: rt },
                { t: "Interface", v: port },
                { t: "IP address", v: ip },
                { t: "VRF", v: "CLIENTS" },
                { t: "Inner Vlan ID", v: vlan[0] },
              ]}
            />
            <StageArea>
              {stage === "schema" && <Chain x={x} />}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: "точка подключения 1", href: `/nodes/${x.nodeId}` },
                  { icon: Router, t: rt, sub: port, href: "/routers" },
                  { icon: Contact, t: "Клиент Onyma", sub: "Л/с 7 001 245 118", href: "/onyma/1" },
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
          { k: "net", t: "Сетевые данные", icon: Network },
          { k: "client", t: "Клиент", icon: Contact },
          { k: "notes", t: "Пользовательские данные", icon: FileText },
          { k: "history", t: "История", icon: History, n: d.history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Activity} title="Скорость" onOpen={() => setTab("net")}>
              {speed[0]} <em>{speed[1]}</em>
            </SummaryCard>
            <SummaryCard icon={Router} title="Router" onOpen={() => setTab("net")}>
              {rt} <em>{port}</em>
            </SummaryCard>
            <SummaryCard icon={Hash} title="VLAN" onOpen={() => setTab("net")}>
              {String(x.f.vlan ?? "—")} <em>inner / outer</em>
            </SummaryCard>
            <SummaryCard icon={Contact} title="Клиент" onOpen={() => setTab("client")}>
              {company} <em>Л/с 7 001 245 118</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "net" && (
          <div className="grid grid-cols-2 gap-[18px] max-[1279px]:grid-cols-1">
            <Card icon={Router} title="Маршрутизация">
              <Kv
                rows={[
                  { t: "Router", v: rt },
                  { t: "Interface", v: port },
                  { t: "IP address", v: ip },
                  { t: "VRF", v: "CLIENTS" },
                  { t: "Inner Vlan ID", v: vlan[0] },
                  { t: "Outer Vlan ID", v: vlan[1] ?? "—" },
                  { t: "Описание интерфейса", v: `${company.toUpperCase()} ${String(x.f.type ?? "").replace("VPN", "")}` },
                  { t: "Пропускная способность", v: String(x.f.speed ?? "—") },
                ]}
              />
            </Card>
            <Card icon={MapPin} title="Подключение">
              <Kv
                rows={[
                  { t: "Точка подключения 1", v: x.nodeCode },
                  { t: "Точка подключения 2", v: shortAddr(x.address) },
                  { t: "Используемый вид оборудования", v: "SFP 1000BaseLX" },
                  { t: "Дата подключения", v: "12.10.2026" },
                  { t: "Протяжённость", v: `${CHANNEL_KM} км` },
                  { t: "Узел связи", v: x.nodeCode },
                  { t: "Адрес", v: shortAddr(x.address) },
                  { t: "Объект", v: d.start.title },
                ]}
              />
            </Card>
          </div>
        )}
        {tab === "client" && (
          <Card icon={Contact} title="Клиент" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "ID Биллинга (Onyma)", v: `CN-${552100 + x.id}` },
                { t: "Лицевой счёт", v: "7 001 245 118" },
                { t: "Наименование клиента", v: String(x.f.client ?? "—") },
                { t: "Электронный адрес клиента", v: "info@orlan2000.kz" },
                { t: "Соединительная линия", v: "СО-4412" },
                { t: "Наименование СО", v: "ВОК клиента" },
                { t: "ID СО", v: "SO-88" },
              ]}
            />
          </Card>
        )}
        {tab === "notes" && <Notes />}
        {/* «Документы ввода» на обзоре открывают вкладку документов, хотя в полосе её нет (как в общем шаблоне) */}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={channelSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={channelSub(x)} url={qrUrl("channel-ids", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <ChannelForm
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
          icon={LinkIcon}
          noun={["канал", "канала", "каналов"]}
          items={[{ id: x.id, name, sub: channelSub(x).split(" · ")[0] }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => channels.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/channel-ids")}
        />
      )}
    </div>
  )
}

/** Цепочка канала (idc-04-schema): точка 1 → коммутатор → маршрутизатор → МСС → клиент. */
function Chain({ x }: { x: Channel }) {
  const { router, port } = channelIface(x)
  const vlan = channelVlan(x)
  const nodes = [
    { t: "Точка 1", sub: x.nodeCode, color: "#2f6bff" },
    { t: "sw1.ast009", sub: `Gi1/0/3 · VLAN ${vlan[0]}`, color: "#22d3ee" },
    { t: router, sub: `${port} · VRF CLIENTS`, color: "#a78bfa" },
    { t: "МСС Астана", sub: "Te0/0/0", color: "#22d3ee" },
    { t: "Точка 2", sub: `Клиент · ${shortAddr(x.address)}`, color: "#2bd463" },
  ]
  const links = ["ВОЛС №49 · вол. 3", "patch", "L2 trunk", "ВОК клиента 0,4 км"]
  return (
    <div className="absolute inset-x-0 top-[220px] px-[3%] max-[1279px]:top-6">
      <div className="relative grid grid-cols-5">
        <i className="absolute top-[26px] right-[10%] left-[10%] h-[3px] rounded-full bg-[#2f6bff] shadow-[0_0_14px_rgba(47,107,255,0.7)]" />
        {links.map((l, i) => (
          <em
            key={l}
            className="absolute -top-[22px] -translate-x-1/2 rounded-full border border-border bg-[var(--glass-card-solid)] px-3 py-0.5 text-[11px] whitespace-nowrap not-italic"
            style={{ left: `${20 * i + 20}%` }}
          >
            {l}
          </em>
        ))}
        {nodes.map((n) => (
          <span key={n.t} className="relative flex flex-col items-center text-center">
            <i className="block size-[52px] rounded-2xl border-[3px] bg-[#0b0c10]" style={{ borderColor: n.color, boxShadow: `0 0 18px ${n.color}66` }} />
            <b className="mt-3 text-[13.5px] font-semibold">{n.t}</b>
            <span className="text-[11px] text-muted-foreground">{n.sub}</span>
          </span>
        ))}
      </div>
      <section className={`${glass} mx-auto mt-14 flex w-fit gap-20 px-7 py-5`}>
        <span>
          <span className="block text-xs text-muted-foreground">Пропускная способность</span>
          <b className="text-[28px] font-semibold">{String(x.f.speed ?? "—")}</b>
        </span>
        <span>
          <span className="block text-xs text-muted-foreground">IP address</span>
          <b className="mt-2 block text-xl font-semibold">{channelIp(x)}</b>
        </span>
      </section>
    </div>
  )
}

/** Пользовательские данные (idc-t3): заметка в Markdown. TODO(API): поле user_data. */
function Notes() {
  const [v, set] = useState("**Примечание.** Канал резервируется через ast011 при аварии ВОЛС №49.\n\n**Основание.** Заявка KCRM № 88412 от 06.10.2026.")
  return (
    <Card
      icon={FileText}
      title="Пользовательские данные"
      className="max-w-[1200px]"
      action={<span className="rounded-full bg-[var(--chip-bg)] px-3 py-1 text-xs text-muted-foreground">Markdown</span>}
    >
      <Textarea value={v} onChange={(e) => set(e.target.value)} minRows={5} />
    </Card>
  )
}
