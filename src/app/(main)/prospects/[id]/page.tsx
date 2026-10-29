"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardList, Contact, History, Image as ImageIcon, Layers, LayoutGrid, Map as MapIcon, MapPin, MessageSquare, RadioTower, Tag, UserRound, Users, Wallet } from "lucide-react"
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
import { Textarea } from "@/components/list/form-controls"
import { Pill } from "@/components/list/ui"
import { Gallery } from "@/components/passport/gallery"
import { Card, Kv, SegBar } from "@/components/passport/ui"
import { ProspectForm } from "@/components/prospects/prospect-form"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import {
  CONTACT,
  distBand,
  FUNNEL,
  KCRM,
  prospectDetail,
  prospectDist,
  prospectIncome,
  prospectName,
  prospects,
  prospectStatus,
  prospectSub,
  useProspect,
  type Prospect,
} from "@/lib/api/prospects"
import { cn } from "@/lib/utils"
import { LineDocsTab, LineHistoryTab, EditableTable } from "@/sections/lines/tabs"

/*
 * 12 Потенциальные клиенты — паспорт /prospects/<id>: схема — кольца расстояний вокруг узла и путь клиента,
 * вкладки «Контакты и адрес», «Связь с инфраструктурой», «Заявки KCRM», «Комментарий».
 * TODO(API): контакты, адреса, доход и заявки — нет в /api/potential-clients; заявки — из kCRM.
 */

type TabKey = "overview" | "contacts" | "infra" | "kcrm" | "comment" | "docs" | "history"

const COLOR = "#4f8dff"
const STAGES: [LineStage, string, typeof Layers][] = [
  ["schema", "Схема", Layers],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function ProspectPage({ params }: PageProps<"/prospects/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useProspect(id)
  const d = useMemo(() => (x ? prospectDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("schema")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? prospectName(x) : "Потенциальные клиенты · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/prospects" back="К списку Потенциальные клиенты" />

  const [label, tone] = prospectStatus(x)
  const name = prospectName(x)
  const dist = prospectDist(x)
  const band = distBand(dist)
  const income = prospectIncome(x)
  const editable = !prospects.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["Потенциальные клиенты"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, point: (i) => `Точка ${i + 1}` }} />}>
        <PassportHeader
          crumb="Клиенты"
          listHref="/prospects"
          listTitle="Потенциальные клиенты"
          title={name}
          status={{ label, tone }}
          pill={`${x.f.kind ?? "B2B"} · ${String(x.f.size ?? "").split(" ")[0]}`}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={RadioTower} t="До узла" v={dist} em="м" />
          <PassportStat icon={Tag} t="Категория" v={band} em="м" />
          <PassportStat icon={Wallet} t="Потенц. доход" v={income} em="тыс ₸/мес" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "БИН", v: String(x.f.bin ?? "—") },
                { t: "Наименование", v: String(x.f.company ?? "—") },
                { t: "Категория", v: "Частная" },
                { t: "Размер предприятия", v: String(x.f.size ?? "—") },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Тип клиента", v: String(x.f.kind ?? "—") },
                { t: "Статус", v: label },
                { t: "Дата активации", v: x.status === "client" ? "06.10.2026" : "—" },
                { t: "Телефон", v: CONTACT.phone },
                { t: "Email", v: CONTACT.email },
                { t: "Контактное лицо", v: CONTACT.person },
                { t: "Вид деятельности", v: CONTACT.activity },
              ]}
            />
            <StageArea>
              {stage === "schema" && <Rings x={x} />}
              {stage === "photo" && <PhotoStrip media={d.media} onOpen={setGallery} />}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>
            <PassportSide>
              <RelatedCard
                items={[
                  { icon: RadioTower, t: x.nodeCode, sub: `ближайший узел · ${x.f.dist} м`, href: `/nodes/${x.nodeId}` },
                  { icon: ClipboardList, t: `Заявка KCRM ${KCRM.num}`, sub: `от ${KCRM.date}`, href: "/requests" },
                  { icon: UserRound, t: "Менеджер", sub: KCRM.manager },
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
          { k: "contacts", t: "Контакты и адрес", icon: Contact },
          { k: "infra", t: "Связь с инфраструктурой", icon: RadioTower },
          { k: "kcrm", t: "Заявки KCRM", icon: ClipboardList, n: 1 },
          { k: "comment", t: "Комментарий", icon: MessageSquare },
          { k: "history", t: "История", icon: History, n: d.history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={RadioTower} title="Ближайший узел" onOpen={() => setTab("infra")}>
              {dist} м <em>{x.nodeCode}</em>
            </SummaryCard>
            <SummaryCard icon={Tag} title="Категория дистанции" onOpen={() => setTab("infra")}>
              {band} <em>м</em>
            </SummaryCard>
            <SummaryCard icon={Wallet} title="Потенциальный доход" onOpen={() => setTab("infra")}>
              {income} <em>тыс ₸ / мес</em>
            </SummaryCard>
            <SummaryCard
              icon={ClipboardList}
              title="Заявка KCRM"
              onOpen={() => setTab("kcrm")}
              bar={
                <SegBar
                  parts={[
                    { v: 2, color: "#085eff" },
                    { v: 3, color: "var(--chip-bg)" },
                  ]}
                />
              }
            >
              {KCRM.num} <em>в работе</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "contacts" && (
          <div className="grid grid-cols-2 gap-[18px] max-[1279px]:grid-cols-1">
            <Card icon={Contact} title="Контактные данные" className="self-start">
              <Kv
                rows={[
                  { t: "Телефон", v: CONTACT.phone },
                  { t: "Email", v: CONTACT.email },
                  { t: "Контактное лицо", v: CONTACT.person },
                  { t: "Вид деятельности", v: CONTACT.activity },
                ]}
              />
            </Card>
            <Card icon={MapPin} title="Адрес">
              <Kv
                rows={[
                  { t: "Юридический адрес", v: x.address },
                  { t: "Область/город", v: x.city },
                  { t: "Район", v: "Алматинский" },
                  { t: "Населённый пункт", v: `г. ${x.city}` },
                  { t: "Улица", v: x.address.split(",")[1]?.trim() ?? "—" },
                  { t: "Дом", v: x.address.split(",")[2]?.trim() ?? "—" },
                  { t: "Статус размещения", v: "Аренда" },
                  { t: "Фактический адрес", v: `${x.address.replace(/^(г\.|с\.) [^,]+, /, "")}, оф. 4` },
                ]}
              />
            </Card>
          </div>
        )}
        {tab === "infra" && (
          <Card icon={RadioTower} title="Связь с инфраструктурой" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Код узла связи", v: x.nodeCode },
                { t: "Дистанция до узла", v: `${dist} м` },
                { t: "Категория дистанции", v: `${band} м` },
                { t: "Потенциальный доход", v: `${(income * 1000).toLocaleString("ru-RU")} ₸/мес` },
                { t: "Широта клиента", v: x.ll[0].toFixed(4) },
                { t: "Долгота клиента", v: x.ll[1].toFixed(4) },
                { t: "Широта узла", v: d.route[0][0].toFixed(6) },
                { t: "Долгота узла", v: d.route[0][1].toFixed(6) },
              ]}
            />
          </Card>
        )}
        {tab === "kcrm" && (
          <EditableTable
            icon={ClipboardList}
            title="Заявки KCRM"
            noun="заявка"
            add="Создать заявку"
            cols={[
              { k: "num", t: "Заявка", req: true },
              { k: "date", t: "Дата" },
              { k: "service", t: "Услуга", opts: ["Интернет FTTB", "Интернет GPON", "IP-телефония", "L2 VPN"] },
              { k: "speed", t: "Скорость" },
              { k: "manager", t: "Менеджер" },
              {
                k: "st",
                t: "Статус",
                opts: ["В работе", "Новая", "Подключено", "Отказ"],
                show: (v) => <Pill tone={v === "Подключено" ? "ok" : v === "Отказ" ? "bad" : "info"}>{v}</Pill>,
              },
            ]}
            rows={[{ id: "1", ...KCRM, st: "В работе" }]}
          />
        )}
        {tab === "comment" && <Comment />}
        {/* «Документы ввода» на обзоре открывают вкладку документов, хотя в полосе её нет (как в общем шаблоне) */}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "history" && <LineHistoryTab d={d} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={prospectSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={prospectSub(x)} url={qrUrl("prospects", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <ProspectForm
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
          icon={Users}
          noun={["компания", "компании", "компаний"]}
          items={[{ id: x.id, name, sub: prospectSub(x).split(" · ")[0] }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => prospects.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/prospects")}
        />
      )}
    </div>
  )
}

/** Схема (cl-04-schema): кольца 0–50, 50–100, 100–250 м вокруг узла, клиент на своём расстоянии; путь клиента справа. */
function Rings({ x }: { x: Prospect }) {
  const dist = prospectDist(x)
  const m = Math.min(250, dist)
  const r = (v: number) => (v <= 50 ? (v / 50) * 95 : v <= 100 ? 95 + ((v - 50) / 50) * 55 : 150 + ((v - 100) / 150) * 80)
  const rr = r(m)
  const ang = -0.75
  const cx = 230
  const cy = 230
  const dots = Array.from({ length: 26 }, (_, i) => {
    const a = i * 2.4
    const d = 40 + ((i * 53) % 190)
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, c: i % 5 === 0 ? "#ffc53d" : i % 3 === 0 ? "#2bd463" : "#8c919b" }
  })
  const st = String(x.status)
  return (
    <div className="absolute inset-x-0 top-[60px] flex items-center justify-center gap-10 max-[1279px]:top-0 max-[1279px]:flex-col">
      <svg viewBox="0 0 460 460" className="h-[470px] w-auto flex-none" fill="none">
        <circle cx={cx} cy={cy} r="230" fill="rgba(255,82,87,0.05)" stroke="rgba(255,138,76,0.6)" strokeDasharray="4 4" />
        <circle cx={cx} cy={cy} r="150" stroke="rgba(140,145,155,0.5)" strokeDasharray="4 4" />
        <circle cx={cx} cy={cy} r="95" fill="rgba(255,197,61,0.05)" stroke="rgba(255,197,61,0.6)" strokeDasharray="4 4" />
        <circle cx={cx} cy={cy} r="55" stroke="rgba(43,212,99,0.5)" strokeDasharray="4 4" />
        <text x={cx + 170} y={cy - 165} fontSize="11" fill="#ff8a4c">
          100–250 м
        </text>
        <text x={cx + 110} y={cy - 108} fontSize="11" fill="var(--muted-foreground)">
          50–100 м
        </text>
        {dots.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4.5" fill={p.c} opacity="0.85" />
        ))}
        <line x1={cx} y1={cy} x2={cx + Math.cos(ang) * rr} y2={cy + Math.sin(ang) * rr} stroke="#fff" strokeDasharray="3 3" />
        <circle cx={cx + Math.cos(ang) * rr} cy={cy + Math.sin(ang) * rr} r="12" fill="#ffc53d" />
        <circle cx={cx + Math.cos(ang) * rr} cy={cy + Math.sin(ang) * rr} r="20" fill="#ffc53d" opacity="0.2" />
        <rect x={cx + Math.cos(ang) * rr * 0.5 - 30} y={cy + Math.sin(ang) * rr * 0.5 - 22} width="60" height="22" rx="11" fill="#0b0c10" />
        <text x={cx + Math.cos(ang) * rr * 0.5} y={cy + Math.sin(ang) * rr * 0.5 - 7} textAnchor="middle" fontSize="12" fill="#fff">
          {dist} м
        </text>
        <rect x={cx - 22} y={cy - 22} width="44" height="44" rx="11" fill="#085eff" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
          УС
        </text>
        <text x={cx} y={cy + 44} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--foreground)">
          {x.nodeCode}
        </text>
      </svg>
      <div className="w-[340px] max-w-full">
        <p className="mb-3 text-xs text-muted-foreground">Путь клиента</p>
        <div className="flex flex-col gap-3">
          {FUNNEL.map((f) => (
            <span
              key={f.k}
              className={cn(
                "rounded-2xl border border-border bg-[var(--glass-card)] px-4 py-2.5 backdrop-blur-[12px]",
                f.k === st && "border-[#ffc53d] bg-[rgba(255,197,61,0.16)]",
              )}
              style={{ width: `${f.w}%`, minWidth: 116 }}
            >
              <b className="block text-[13.5px] font-semibold whitespace-nowrap">{f.t}</b>
              <span className="text-[11.5px] whitespace-nowrap text-muted-foreground">{f.n} по сети</span>
            </span>
          ))}
        </div>
        <p className="mt-5 text-xs text-[#ffc53d]">
          ● {prospectName(x)} сейчас здесь · {String(x.status) === "none" ? "не обработан" : "обработан 06.10.2026"}
        </p>
      </div>
    </div>
  )
}

/** Комментарий (cl-t4): одно поле, сохраняется на странице. TODO(API): поле comment. */
function Comment() {
  const [v, set] = useState("Звонили 06.10 — интересует 100 Мбит/с, решение примет директор до 15.10.")
  return (
    <Card icon={MessageSquare} title="Комментарий" className="max-w-[1200px]">
      <Textarea value={v} onChange={(e) => set(e.target.value)} />
    </Card>
  )
}
