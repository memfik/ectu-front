"use client"

import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  FileText,
  Fuel,
  Gauge,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  Package,
  RadioTower,
  Server,
  Truck,
  UserCog,
  Zap,
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
import { GenForm } from "@/components/gen/gen-form"
import { GEN_FUEL, genDiesel, GenHousing, genKva, genKw, GenPanel, genPower, genTank, genYear } from "@/components/gen/gen-panels"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { genDetail, genField, genName, genStatus, genSub, genUnits, useGenUnit, type GenUnit } from "@/lib/api/gen"
import { capBar } from "@/components/equipment/capacity"
import { MolPane, MovesPane } from "@/components/lines/staff"
import { LineDocsTab } from "@/components/lines/tabs"

/*
 * 34 ГЭУ — паспорт /gen/<id> (dgu-04 «Панель / Схема / Карта / Фото», вкладки «Двигатель и топливо», «Исполнение»,
 * «МОЛ и ответственные», «Документация», «История перемещений»). Запись — useGenUnit(id), документы — genDetail().
 */

type TabKey = "overview" | "engine" | "exec" | "mol" | "docs" | "moves"

const STAGES: [LineStage, string, typeof Server][] = [
  ["scene", "Панель", Server],
  ["schema", "Схема", Gauge],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

export default function GenPassportPage({ params }: PageProps<"/gen/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useGenUnit(id)
  const d = useMemo(() => (x ? genDetail(x) : null), [x])
  const [stage, setStage] = useState<LineStage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? genName(x) : "ГЭУ · паспорт")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Запись не найдена" href="/gen" back="К списку ГЭУ" />

  const [label, tone] = genStatus(x)
  const name = genName(x)
  const editable = !genUnits.readOnly()
  const f = (k: keyof GenUnit["f"]) => genField(x, k)
  const media = d.media.map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: ["ГЭУ"],
    text: "Фото с обхода трассы.",
  }))

  return (
    <div className="relative isolate">
      <PassportTop full={tab === "overview"} backdrop={<LineBackdrop stage={stage} d={d} k={{ color: "#4f8dff", point: (i) => `Плата ${i + 1}` }} />}>
        <PassportHeader
          crumb="Оборудование / Электропитание"
          listHref="/gen"
          listTitle="ГЭУ"
          title={name}
          status={{ label, tone }}
          pill={genDiesel(x) ? "Дизель" : "Бензин"}
          mapHref={`/map?node=${x.nodeCode}`}
          onQr={() => setQr(true)}
          onEdit={editable ? () => setEdit(true) : undefined}
          onDelete={editable ? () => setDel(true) : undefined}
        >
          <PassportStat icon={Zap} t="Мощность" v={genKva(x)} em="кВА" />
          <PassportStat icon={Fuel} t="Бак" v={genTank(x)} em="л" />
          <PassportStat icon={Calendar} t="С" v={genYear(x)} em="года" />
        </PassportHeader>

        {tab === "overview" && (
          <PassportColumns>
            <PassportCard
              onAll={editable ? () => setEdit(true) : undefined}
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "Идентификатор УС (БС)", v: x.nodeCode },
                { t: "Населенный пункт", v: `г. ${x.city}` },
                { t: "Адрес узла связи", v: x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
                { t: "Модель оборудования", v: f("model") },
                { t: "S/N", v: f("serial") },
                { t: "Мощность номинальная, кВА/кВт", v: genPower(x) },
                { t: "Кол-во фаз", v: f("phases") },
                { t: "Тип двигателя", v: f("engine") },
                { t: "Генератор", v: f("generator") },
                { t: "Тип топлива", v: f("fuel") },
              ]}
            />
            <StageArea>
              {stage === "scene" && <GenPanel x={x} />}
              {stage === "schema" && <GenHousing x={x} />}
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
          { k: "engine", t: "Двигатель и топливо", icon: Fuel },
          { k: "exec", t: "Исполнение", icon: Package },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: 2 },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "moves", t: "История перемещений", icon: Truck, n: 3 },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <SummaryGrid>
            <SummaryCard icon={Zap} title="Мощность" onOpen={() => setTab("exec")}>
              {genKva(x)} кВА <em>{genKw(x)} кВт</em>
            </SummaryCard>
            <SummaryCard icon={Fuel} title="Топливо" onOpen={() => setTab("engine")} bar={capBar(GEN_FUEL, 100)}>
              {GEN_FUEL}% <em>из {genTank(x)} л</em>
            </SummaryCard>
            <SummaryCard icon={Gauge} title="Автоматизация" onOpen={() => setTab("exec")}>
              {f("automation")}
            </SummaryCard>
            <SummaryCard icon={Calendar} title="В работе с" onOpen={() => setTab("moves")}>
              {genYear(x)}
            </SummaryCard>
          </SummaryGrid>
        )}
        {tab === "engine" && (
          <Card icon={Fuel} title="Двигатель и топливо" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Тип двигателя", v: f("engine") },
                { t: "Генератор", v: f("generator") },
                { t: "Тип топлива", v: f("fuel") },
                { t: "Емкость бака, литров", v: genTank(x) },
                { t: "Кол-во фаз", v: f("phases") },
              ]}
            />
          </Card>
        )}
        {tab === "exec" && (
          <Card icon={Package} title="Исполнение и автоматизация" className="max-w-[1200px]">
            <Kv
              rows={[
                { t: "Исполнение", v: f("execution") },
                { t: "Степень подвижности", v: f("mobility") },
                { t: "Степень автоматизации (I-IV)", v: f("automation") },
                { t: "Мощность номинальная", v: `${genKva(x)} кВА / ${genKw(x)} кВт` },
              ]}
            />
          </Card>
        )}
        {tab === "mol" && <MolPane x={x} />}
        {tab === "docs" && <LineDocsTab d={d} onGallery={setGallery} />}
        {tab === "moves" && <MovesPane x={x} />}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и схемы · ${name}`} sub={genSub(x)} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={genSub(x)} url={qrUrl("gen", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <GenForm
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
          icon={Fuel}
          noun={["ГЭУ", "ГЭУ", "ГЭУ"]}
          items={[{ id: x.id, name, sub: x.nodeCode }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => genUnits.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/gen")}
        />
      )}
    </div>
  )
}
