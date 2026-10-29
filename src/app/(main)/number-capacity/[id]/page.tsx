"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Circle, CircleCheck, FileText, Hash, Image as ImageIcon, LayoutGrid, Map as MapIcon, PieChart, RadioTower, Server, Truck, UserCog, Users } from "lucide-react"
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
import { NumberCapacityForm } from "@/components/number-capacity/number-capacity-form"
import { Gallery } from "@/components/passport/gallery"
import { Card, glass, SegBar } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import {
  numberCapacities,
  numberCapacityDetail,
  numberCode,
  numberCounts,
  numberName,
  numberRange,
  numberShares,
  numberStations,
  numberStatus,
  numberSub,
  useNumberCapacity,
  type NumberCapacity,
} from "@/lib/api/number-capacity"
import { cn } from "@/lib/utils"
import { EditableTable, LineDocsTab } from "@/components/lines/tabs"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { Table } from "@/components/nodes/tabs"

/*
 * 21 Номерная ёмкость — паспорт /number-capacity/<id>: 3D — станции в стойках (картинка из макета), «Ёмкость» — полоса
 * нумерационного ресурса и станции в ёмкости, вкладки «Оборудование в ёмкости», «Распределение», МОЛ, документы, перемещения.
 * TODO(API): оборудование в ёмкости и распределение (клиенты / служебные / оператору) — нет в /api/phone_number_capacities.
 */

type TabKey = "overview" | "eq" | "share" | "mol" | "docs" | "moves"

const COLOR = "#4f8dff"
const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "3D", Server],
  ["schema", "Ёмкость", PieChart],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

const n0 = (v: number) => v.toLocaleString("ru-RU")
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
const bar = (a: number, b: number) => (
  <SegBar
    parts={[
      { v: a, color: "#085eff" },
      { v: b - a, color: "var(--chip-bg)" },
    ]}
  />
)

export default function NumberCapacityPassportPage({ params }: PageProps<"/number-capacity/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useNumberCapacity(id)
  const d = useMemo(() => (x ? numberCapacityDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? `Код ${numberCode(x)}` : "Номерная ёмкость · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/number-capacity" back="К списку Номерная ёмкость" />

  const [label, tone] = numberStatus(x)
  const name = numberName(x)
  const v = numberCounts(x)
  const r = numberRange(x)
  const editable = !numberCapacities.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["Номерная ёмкость"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop
        full={tab === "overview"}
        backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, scene: "/nodes/num-3d.png", point: (i) => `Станция ${i + 1}` }} />}
      >
        <PassportHeader
          crumb="Оборудование / Автоматическая электросвязь"
          listHref="/number-capacity"
          listTitle="Номерная ёмкость"
          title={`Код ${numberCode(x)}`}
          status={{ label, tone }}
          pill="ГМС"
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Hash} t="Ресурс" v={n0(v.res)} em="номеров" />
          <PassportStat icon={CircleCheck} t="Задействовано" v={n0(v.used)} />
          <PassportStat icon={Circle} t="Свободно" v={n0(v.free)} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Город / область", v: String(x.f.town ?? x.city) },
                { t: "Реквизиты ТУ и Приказа Регулятора", v: String(x.f.tu ?? "—") },
                { t: "Идентификатор УС", v: x.nodeCode },
                { t: "Код", v: numberCode(x) },
                { t: "Начало", v: r.a || "—" },
                { t: "Окончание", v: r.b || "—" },
                { t: "Ресурс номеров", v: n0(v.res) },
                { t: "Монтировано номеров", v: n0(v.mounted) },
                { t: "Задействовано номеров", v: n0(v.used) },
              ]}
            />
            <StageArea>
              {stage === "schema" && <Resource x={x} />}
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
          { k: "eq", t: "Оборудование в ёмкости", icon: Server, n: 3 },
          { k: "share", t: "Распределение", icon: Users },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Hash} title="Ресурс" onOpen={() => setTab("eq")}>
              {n0(v.res)} <em>номеров</em>
            </SummaryCard>
            <SummaryCard icon={CircleCheck} title="Монтировано" onOpen={() => setTab("eq")} bar={bar(v.mounted, v.res)}>
              {n0(v.mounted)} <em>{pct(v.mounted, v.res)}%</em>
            </SummaryCard>
            <SummaryCard icon={Users} title="Задействовано" onOpen={() => setTab("share")} bar={bar(v.used, v.res)}>
              {n0(v.used)} <em>{pct(v.used, v.res)}% ресурса</em>
            </SummaryCard>
            <SummaryCard icon={Circle} title="Свободно" onOpen={() => setTab("share")}>
              {n0(v.free)}
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "eq" && (
          <EditableTable
            icon={Server}
            title="Оборудование"
            noun="оборудование"
            cols={[
              { k: "eq", t: "Оборудование", req: true },
              { k: "net", t: "Тип сети", opts: ["ГМС", "ГРС", "ГАС", "МС"] },
              { k: "type", t: "Тип станции" },
              { k: "range", t: "Монтировано (нумерационный диапазон)" },
              { k: "z", t: "Задействовано" },
              { k: "owner", t: "Собственник оборудования" },
              { k: "note", t: "Пояснения" },
            ]}
            rows={numberStations(x).map((s, i) => ({
              id: String(i),
              eq: s.eq === "Резерв" ? "—" : s.eq,
              net: s.eq === "Резерв" ? "—" : "ГМС",
              type: s.type === "—" ? "Резерв" : s.type,
              range: `${s.from}–${s.to}`,
              z: n0(s.z),
              owner: s.owner,
              note: s.note,
            }))}
          />
        )}
        {tab === "share" && (
          <Card icon={PieChart} title="Распределение номеров">
            <Table
              head={["Тип", "Монтировано (М.)", "Задействовано (З.)", "Свободно", "Загрузка"]}
              rows={numberShares(x).map((s) => ({
                key: s.t,
                cells: [
                  <b key="t">{s.t}</b>,
                  n0(s.m),
                  n0(s.z),
                  n0(s.m - s.z),
                  <span key="p" className="flex items-center gap-3">
                    <span className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                      <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${pct(s.z, s.m)}%` }} />
                    </span>
                    {pct(s.z, s.m)}%
                  </span>,
                ],
              }))}
            />
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={numberSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={numberSub(x)} url={qrUrl("number-capacity", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <NumberCapacityForm
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
          icon={Hash}
          noun={["код", "кода", "кодов"]}
          items={[{ id: x.id, name, sub: numberSub(x).split(" · ")[0] }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => numberCapacities.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/number-capacity")}
        />
      )}
    </div>
  )
}

/** «Ёмкость» (num-04-schema): полоса ресурса по назначению и станции с диапазонами. */
function Resource({ x }: { x: NumberCapacity }) {
  const { res } = numberCounts(x)
  const sh = numberShares(x)
  const { a, b } = numberRange(x)
  const free = Math.max(0, res - sh.reduce((s, v) => s + v.z, 0))
  return (
    <div className="absolute inset-x-0 top-[120px] px-[6%] max-[1279px]:top-0">
      <p className="mb-4 text-[13px] text-muted-foreground">
        Нумерационный ресурс · код {numberCode(x)} · {a}–{b}
      </p>
      <div className="flex h-14 gap-1 overflow-hidden rounded-xl bg-[var(--chip-bg)]">
        {sh.map((s) => (
          <i key={s.t} className="block h-full first:rounded-l-xl" style={{ width: `${pct(s.z, res)}%`, background: s.color }} />
        ))}
      </div>
      <p className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {sh.map((s) => (
          <span key={s.t} style={{ color: s.color === "#0d5bff" ? "#4f8dff" : s.color }}>
            {s.t} {n0(s.z)}
          </span>
        ))}
        <span className="text-muted-foreground">Свободно {n0(free)}</span>
      </p>
      <p className="mt-10 mb-3 text-[13px] text-muted-foreground">Станции в ёмкости</p>
      <div className="flex flex-col gap-2.5">
        {numberStations(x).map((s) => {
          const all = s.to - s.from + 1
          return (
            <div key={s.eq} className={cn(glass, "flex items-center gap-4 rounded-2xl px-5 py-3")}>
              <span className="min-w-0 flex-1">
                <b className="block text-sm font-semibold">
                  {s.eq}
                  {s.sub && ` · ${s.sub}`}
                </b>
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  {s.from}–{s.to}
                </span>
              </span>
              <span className="h-1.5 w-60 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${pct(s.z, all)}%` }} />
              </span>
              <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">
                {s.z} / {all}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
