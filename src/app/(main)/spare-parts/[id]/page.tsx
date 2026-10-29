"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftRight,
  Box,
  CircleCheck,
  FileText,
  History,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Package,
  RadioTower,
  Route,
  Truck,
  UserCog,
  Wallet,
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
import { Card, Kv } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { SparePartForm } from "@/components/spare-parts/spare-part-form"
import { SparePath } from "@/components/spare-parts/spare-path"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import {
  isInstalled,
  money,
  replacedAt,
  SPARE_STATUS,
  spareCat,
  spareField,
  spareMol,
  spareMoves,
  sparePartDetail,
  sparePartName,
  spareParts,
  sparePartSub,
  sparePoint,
  spareStatus,
  useSparePart,
} from "@/lib/api/spare-parts"
import { Table } from "@/components/nodes/tabs"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { LineDocsTab } from "@/components/lines/tabs"

/*
 * 35 ЗИП — паспорт позиции /spare-parts/<id>: 3D — стеллаж склада (картинка из макета, TODO three.js), «Путь» — склад ФО → МОЛ →
 * узел → установлено вместо; вкладки «Местонахождение», «Документ получения», «Установлено вместо», «Движение», «МОЛ и ответственные»,
 * «Документация», «История перемещений». Запись — useSparePart(id), документы и история — sparePartDetail() из lib/api/spare-parts.
 * TODO(API): движение ЗИП — /api/replacements/movement-history (сейчас пример), снятый модуль — нет в API.
 */

type TabKey = "overview" | "place" | "receipt" | "instead" | "flow" | "mol" | "docs" | "moves"

const KEY = "spare-parts"
const TITLE = "ЗИП"
const COLOR = "#4f8dff"
const SCENE = "/equipment/zip-3d.png"
const STAGES: [LineStage, string, typeof Box][] = [
  ["scene", "3D", Box],
  ["schema", "Путь", Route],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function SparePartPassportPage({ params }: PageProps<"/spare-parts/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useSparePart(id)
  const d = useMemo(() => (x ? sparePartDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? sparePartName(x) : `${TITLE} · паспорт`)

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href={`/${KEY}`} back={`К списку ${TITLE}`} />

  const [label, tone] = spareStatus(x)
  const name = sparePartName(x)
  const f = (k: Parameters<typeof spareField>[1], def?: string) => spareField(x, k, def)
  const st = SPARE_STATUS[x.status]?.[0]
  const cat = spareCat(x)
  const mol = spareMol(x)
  const moves = spareMoves(x)
  const editable = !spareParts.readOnly()

  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: [TITLE],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: COLOR, scene: SCENE, point: sparePoint }} />}>
        <PassportHeader
          crumb="Оборудование / Склад"
          listHref={`/${KEY}`}
          listTitle={TITLE}
          title={name}
          status={{ label, tone }}
          pill={cat[0]}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Wallet} t="Стоимость" v={money(f("cost"))} em="тг" />
          <PassportStat icon={CircleCheck} t="Статус" v={st} />
          <PassportStat icon={History} t="Замена" v={replacedAt(x)} />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Категория", v: f("category") },
                { t: "Наименование оборудования", v: f("name") },
                { t: "Инвентарный номер", v: f("inv") },
                { t: "Серийный номер (S/N)", v: f("serial") },
                { t: "Стоимость за ед., тг. без НДС", v: f("cost") },
                { t: "Принадлежность ЗИП", v: f("owner") },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Адрес склада ФО", v: f("warehouse") },
                { t: "МОЛ, ФИО", v: mol },
                { t: "Email МОЛ", v: f("molEmail", "e.saparov@qmobile.kz") },
                { t: "Должность МОЛ", v: f("molPost", "Ведущий инженер") },
                { t: "Отдел МОЛ", v: f("molDept", "Отдел эксплуатации СПД") },
              ]}
            />
            <StageArea>
              {stage === "schema" && <SparePath x={x} />}
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
          { k: "place", t: "Местонахождение", icon: MapPin },
          { k: "receipt", t: "Документ получения", icon: FileText },
          { k: "instead", t: "Установлено вместо", icon: ArrowLeftRight },
          { k: "flow", t: "Движение", icon: History, n: moves.length },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Package} title="Категория" onOpen={() => setTab("place")}>
              {cat[0]} <em>{cat[1]}</em>
            </SummaryCard>
            <SummaryCard icon={CircleCheck} title="Статус" onOpen={() => setTab("flow")}>
              {st}
            </SummaryCard>
            <SummaryCard icon={MapPin} title="Где" onOpen={() => setTab("instead")}>
              {isInstalled(x) ? (
                <>
                  {x.nodeCode} <em>{f("eqId").replace(" · порт", " ·")}</em>
                </>
              ) : (
                f("warehouse")
              )}
            </SummaryCard>
            <SummaryCard icon={Box} title="Стоимость" onOpen={() => setTab("receipt")}>
              {money(f("cost"))} <em>тг без НДС</em>
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "place" && (
          <Card icon={MapPin} title="Местонахождение и МОЛ" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Адрес склада ФО", v: f("warehouse") },
                { t: "МОЛ, ФИО", v: mol },
                { t: "Email МОЛ", v: f("molEmail", "e.saparov@qmobile.kz") },
                { t: "Должность МОЛ", v: f("molPost", "Ведущий инженер") },
                { t: "Отдел МОЛ", v: f("molDept", "Отдел эксплуатации СПД") },
                { t: "Телефон МОЛ", v: f("molPhone", "+7 701 *** 55 31") },
              ]}
            />
          </Card>
        )}
        {tab === "receipt" && (
          <Card icon={FileText} title="Документ получения" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Реквизиты получения", v: f("received", "Накладная № 2211 от 04.02.2026") },
                { t: "От кого", v: f("sender", "ГО Астана") },
                { t: "Стоимость за ед., тг. без НДС", v: money(f("cost")) },
              ]}
            />
          </Card>
        )}
        {tab === "instead" && (
          <Card icon={ArrowLeftRight} title="Установлено вместо · документ замены" className="max-w-[1200px]">
            {isInstalled(x) ? (
              <Kv
                rows={[
                  { t: "Реквизиты документа замены", v: f("replaceDoc") },
                  { t: "Кому", v: f("receiver", "Б. Дегтярь") },
                  { t: "Адрес узла связи (места установки)", v: f("siteAddress", x.address) },
                  { t: "Тип оборудования", v: f("eqType") },
                  { t: "ID оборудования", v: f("eqId") },
                  { t: "Узел", v: x.nodeCode },
                  { t: "Снятый модуль", v: "GLC-LH-SMD S/N AGC1435U4PJ" },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">ЗИП ещё не установлен — {st?.toLowerCase()}.</p>
            )}
          </Card>
        )}
        {tab === "flow" && (
          <Card icon={History} title={`Движение ЗИП · ${moves.length}`}>
            <Table
              head={["Дата", "Тип операции", "Откуда", "Куда", "Пользователь", "Примечание"]}
              rows={moves.map((r, i) => ({ key: i, cells: [r[0], <b key="t">{r[1]}</b>, r[2], r[3], r[4], r[5]] }))}
            />
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={sparePartSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={sparePartSub(x)} url={qrUrl(KEY, x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <SparePartForm
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
          icon={Package}
          noun={["позиция", "позиции", "позиций"]}
          items={[{ id: x.id, name, sub: sparePartSub(x).split(" · ")[0] }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => spareParts.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push(`/${KEY}`)}
        />
      )}
    </div>
  )
}
