"use client"

import { use, useMemo, useState } from "react"
import { Globe, History, Image as ImageIcon, Layers, LayoutGrid, Link as LinkIcon, Map as MapIcon, Network, RadioTower, RefreshCw, UserRound, Users, Wallet } from "lucide-react"
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
import { Pill } from "@/components/list/ui"
import { Gallery } from "@/components/passport/gallery"
import { Card, glass } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, qrUrl } from "@/lib/api/equipment"
import { onymaDetail, onymaName, onymaServices, onymaStatus, onymaSub, SEGMENT_NAME, useOnymaClient, type OnymaClient } from "@/lib/api/onyma"
import { cn } from "@/lib/utils"
import { LineDocsTab, LineHistoryTab } from "@/sections/lines/tabs"
import { Table } from "@/sections/nodes/tabs"

/*
 * 13 Клиенты Onyma — паспорт /onyma/<id>: только чтение (без правки и удаления), схема «Счёт» — лицевой счёт и его сервисы,
 * вкладка «Сервисы». TODO(API): сервисы абонента, ID подключения, логин PPPoE, точка предоставления — из Onyma, в /api/onyma их нет.
 */

type TabKey = "overview" | "services" | "docs" | "history"

const COLOR = "#4f8dff"
const STAGES: [LineStage, string, typeof Layers][] = [
  ["schema", "Счёт", Layers],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function OnymaClientPage({ params }: PageProps<"/onyma/[id]">) {
  const id = +use(params).id
  const { row: x, loading } = useOnymaClient(id)
  const d = useMemo(() => (x ? onymaDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("schema")
  const [tab, setTab] = useState<TabKey>("overview")
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? onymaName(x) : "Клиенты Onyma · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/onyma" back="К списку Клиенты Onyma" />

  const [label, tone] = onymaStatus(x)
  const name = onymaName(x)
  const services = onymaServices(x)

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["Клиенты Onyma"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, point: (i) => `Точка ${i + 1}` }} />}>
        <PassportHeader
          crumb="Клиенты"
          listHref="/onyma"
          listTitle="Клиенты Onyma"
          title={name}
          status={{ label, tone }}
          pill={String(x.f.segment ?? "—")}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
        >
          <PassportStat icon={Wallet} t="Лицевой счёт" v={String(x.f.account ?? "—")} />
          <PassportStat icon={Network} t="Сервисов" v={services.length} />
          <PassportStat icon={RefreshCw} t="Синхронизация" v="06:30" em="сегодня" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              rows={[
                { t: "Наименование", v: String(x.f.company ?? "—") },
                { t: "Лицевой счёт", v: String(x.f.account ?? "—") },
                { t: "Номер договора", v: `№ ${x.f.contract ?? "—"}` },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Бизнес-сегментация", v: String(x.f.segment ?? "—") },
                { t: "Адрес", v: x.address },
                { t: "Точка предоставления сервиса", v: `${x.address.replace(/^(г\.|с\.) [^,]+, /, "")}, оф. 4` },
                { t: "ID подключения", v: `CN-${552100 + x.id}` },
                { t: "Сеть", v: "ГМС" },
                { t: "Статический IP", v: String(x.f.ip ?? "—") },
                { t: "Логин PPPoE", v: "alm_orlan" },
                { t: "Скорость", v: String(x.f.speed ?? "—") },
              ]}
            />
            <StageArea>
              {stage === "schema" && <Account x={x} />}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: "узел подключения", href: `/nodes/${x.nodeId}` },
                  { icon: LinkIcon, t: "ID-00231", sub: "ID-канал", href: "/channel-ids" },
                  { icon: Users, t: "Потенциальный клиент", sub: "БИН 000440005502", href: "/prospects/1" },
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
          { k: "services", t: "Сервисы", icon: Network, n: services.length },
          { k: "history", t: "История", icon: History, n: d.history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Wallet} title="Лицевой счёт" onOpen={() => setTab("services")}>
              {String(x.f.account ?? "—")}
            </SummaryCard>
            <SummaryCard icon={Network} title="Сервисы" onOpen={() => setTab("services")}>
              {services.length} <em>{x.status === "active" ? "активны" : "закрыты"}</em>
            </SummaryCard>
            <SummaryCard icon={Globe} title="Статический IP" onOpen={() => setTab("services")}>
              {String(x.f.ip ?? "—")}
            </SummaryCard>
            <SummaryCard icon={UserRound} title="Менеджер" onOpen={() => setTab("services")}>
              Темирханова <em>Д.</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "services" && (
          <Card
            icon={Network}
            title="Сервисы абонента"
            count={services.length}
            action={<span className="rounded-full bg-[var(--chip-bg)] px-3 py-1 text-xs text-muted-foreground">из Onyma · только чтение</span>}
          >
            <Table
              head={["Сервис", "Статус", "VRF", "Описание", "Скорость"]}
              rows={services.map((s, i) => ({
                key: i,
                cells: [
                  s.t.replace(/ \d.*$/, ""),
                  <Pill key="s" tone={x.status === "active" ? "ok" : "muted"}>
                    {label}
                  </Pill>,
                  s.vrf,
                  s.desc,
                  s.speed,
                ],
              }))}
            />
          </Card>
        )}
        {/* «Документы ввода» на обзоре открывают вкладку документов, хотя в полосе её нет (как в общем шаблоне) */}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={onymaSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={onymaSub(x)} url={qrUrl("onyma", x.id)} onClose={() => setQr(false)} />}
    </div>
  )
}

/** Схема «Счёт» (on-04-schema): карточка лицевого счёта и ветки к сервисам. */
function Account({ x }: { x: OnymaClient }) {
  const [label, tone] = onymaStatus(x)
  return (
    <div className="absolute inset-x-0 top-[110px] flex items-center justify-center gap-0 px-[3%] max-[1279px]:top-0 max-[1279px]:flex-col max-[1279px]:gap-4">
      <section className={cn(glass, "w-[420px] max-w-full flex-none p-7")}>
        <span className="text-[11.5px] text-muted-foreground">Лицевой счёт</span>
        <b className="block text-[32px] font-semibold tracking-[-0.5px] tabular-nums">{String(x.f.account ?? "—")}</b>
        <span className="mt-5 block text-[11.5px] text-muted-foreground">Договор</span>
        <b className="block text-base font-semibold">№ {String(x.f.contract ?? "—")}</b>
        <span className="mt-5 block text-[11.5px] text-muted-foreground">Бизнес-сегментация</span>
        <b className="block text-base font-semibold">
          {String(x.f.segment ?? "—")} · {SEGMENT_NAME[String(x.f.segment)] ?? ""}
        </b>
        <Pill tone={tone} className="mt-6">
          {label}
        </Pill>
        <p className="mt-8 text-[11.5px] text-muted-foreground">Синхронизировано с Onyma сегодня 06:30</p>
      </section>
      <svg viewBox="0 0 60 300" className="h-[300px] w-[60px] flex-none max-[1279px]:hidden" fill="none">
        {[50, 150, 250].map((y) => (
          <path key={y} d={`M0 150 C30 150 30 ${y} 60 ${y}`} stroke="#4f8dff" strokeOpacity="0.6" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex w-[380px] max-w-full flex-col gap-6">
        {onymaServices(x).map((s, i) => (
          <section
            key={s.t}
            className={cn(
              "rounded-2xl border px-6 py-5 backdrop-blur-[12px]",
              i === 2 ? "border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.08)]" : "border-[rgba(79,141,255,0.35)] bg-[rgba(8,94,255,0.1)]",
            )}
          >
            <b className="block text-base font-semibold">{s.t}</b>
            <span className="mt-1 block text-xs text-muted-foreground">{s.sub}</span>
          </section>
        ))}
      </div>
    </div>
  )
}
