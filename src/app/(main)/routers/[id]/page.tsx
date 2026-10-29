"use client"

import { use, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  ArrowUpRight,
  Box,
  ChevronLeft,
  Copy,
  Cpu,
  FileText,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  Maximize2,
  Router,
  Pencil,
  QrCode,
  RadioTower,
  Rows3,
  Server,
  Shield,
  Trash2,
  Truck,
  UserCog,
} from "lucide-react"
import { DeleteDialog } from "@/components/blocks/delete-dialog"
import { PassportColumns, PassportLoading, PassportStat, PassportTabs, StageSwitch, TabBody } from "@/components/blocks/passport"
import { QrDialog } from "@/components/blocks/qr-dialog"
import { btn, circ, Pill } from "@/components/list/ui"
import { Gallery } from "@/components/passport/gallery"
import { Avatar, Card, glass, Kv } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { toast } from "@/components/shared/toast"
import { FrontPanel, Rack, SpdOverview, type SpdTab } from "@/components/spd/passport-parts"
import { SpdForm } from "@/components/spd/spd-form"
import { CapacityTab, ChildrenTab, MolTab, MovesTab, PortDialog, PortsTab, ServiceTab } from "@/components/spd/tabs"
import { Equipment3D } from "@/components/three/equipment-3d"
import { usePageTitle } from "@/hooks/use-page-title"
import { branchFull, SPD_REMOVE, spdQrUrl, spdStatus, spdSub } from "@/lib/api/spd"
import { spdDetail, type Port, type SpdDetail } from "@/lib/api/spd-detail"
import { routers, useRouterRow } from "@/lib/api/routers"
import { cn } from "@/lib/utils"
import { nodeRows } from "@/sections/nodes/data"
import { DocsTab } from "@/sections/nodes/tabs"

/*
 * 04 Маршрутизаторы — паспорт /routers/<id> (тот же паспорт, что у коммутаторов: макет 03, экраны sw-01b…sw-11).
 * Запись — useRouterRow(id), содержимое вкладок — spdDetail() из lib/api/spd-detail, части сцены — components/spd.
 */

type Stage = "3d" | "panel" | "rack" | "photo"
const STAGES: [Stage, string, typeof Box][] = [
  ["3d", "3D", Box],
  ["panel", "Передняя панель", Server],
  ["rack", "Стойка", Rows3],
  ["photo", "Фото", ImageIcon],
]

const noop = () => () => {}

export default function RouterPage({ params }: PageProps<"/routers/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useRouterRow(id)
  // Содержимое вкладок — пример по записи (TODO(API): порты, ёмкость, под-оборудование, МОЛ, перемещения)
  const [edits, setD] = useState<SpdDetail | null>(null)
  const d = edits ?? (x ? spdDetail(x) : null)
  const [stage, setStage] = useState<Stage>("3d")
  const [tab, setTab] = useState<SpdTab>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  const [port, setPort] = useState<Port | "new" | null>(null)
  const client = useSyncExternalStore(noop, () => true, () => false)
  usePageTitle(x ? x.host : "Паспорт маршрутизатора")

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Оборудование не найдено" href="/routers" back="К списку" />

  const [label, tone] = spdStatus(x)
  const node = nodeRows().find((n) => n.id === x.nodeId)
  const used = d.ports.filter((p) => p.oper === "up").length
  const down = d.ports.filter((p) => p.admin === "up" && p.oper === "down" && p.desc !== "—").length
  const free = d.ports.length - used - down
  const full = tab === "overview"
  const editable = !routers.readOnly()
  const update = (fn: (d: SpdDetail) => SpdDetail) => setD((s) => fn(s ?? d))

  return (
    <div className="relative isolate">
      <section className={cn("relative -mt-[96px] overflow-hidden pt-[112px]", full ? "min-h-[910px] max-[1279px]:min-h-0 max-[1279px]:pb-6" : "pb-6")}>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(900px_400px_at_55%_45%,rgba(8,94,255,0.16),transparent_70%)]" />
        {full && stage === "photo" && (
          <div aria-hidden className="absolute inset-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${d.media[0].src})` }} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,14,0.92)_0,rgba(10,11,14,0.35)_30%,rgba(10,11,14,0.1)_50%,rgba(10,11,14,0.35)_70%,rgba(10,11,14,0.92)_100%),linear-gradient(180deg,rgba(10,11,14,0.9)_0,transparent_25%,transparent_70%,var(--background)_100%)]" />
          </div>
        )}

        <header className="relative z-[2] flex flex-wrap items-center gap-x-[18px] gap-y-4 px-(--page-gutter)">
          <button type="button" onClick={() => router.push("/routers")} className={cn(circ, "size-[54px] [&_svg]:size-5")} aria-label="Назад к списку">
            <ChevronLeft />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-[var(--nav-text)]">
              Оборудование / СПД /{" "}
              <Link href="/routers" className="hover:text-foreground">
                Маршрутизаторы
              </Link>{" "}
              / Паспорт оборудования
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-3 text-4xl font-semibold tracking-[-0.6px] max-sm:text-[26px]">
              {x.host}
              <button
                type="button"
                aria-label="Скопировать hostname"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigator.clipboard?.writeText(x.host).then(() => toast("Hostname скопирован"))}
              >
                <Copy className="size-5" />
              </button>
              <Pill tone={tone}>{label}</Pill>
              <span className="inline-flex h-[26px] items-center rounded-full bg-[var(--chip-bg)] px-2.5 text-xs font-semibold">router</span>
              <span className="inline-flex h-[26px] items-center rounded-full bg-[var(--chip-bg)] px-2.5 text-xs font-semibold">{x.network}</span>
            </h1>
          </div>
          <div className="ml-12 flex flex-wrap gap-x-[34px] gap-y-3 max-[1500px]:ml-0">
            <PassportStat icon={Server} t="Порты" v={used} em={`из ${d.ports.length} задействовано`} />
            <PassportStat icon={Layers} t="Под-оборудование" v={d.children.length} />
            {d.service.smartnet && <PassportStat icon={Shield} t="SmartNET" v={d.service.days} em="дня до конца" />}
          </div>
          <div className="ml-auto flex gap-2.5">
            <button type="button" className={cn(circ, "size-11")} title="QR-код" onClick={() => setQr(true)}>
              <QrCode />
            </button>
            <Link href={`/map?node=${x.nodeCode}`} className={btn()}>
              <MapIcon />
              На карту сети
            </Link>
            {editable && (
              <button type="button" className={btn({ primary: true })} onClick={() => setEdit(true)}>
                <Pencil />
                Редактировать
              </button>
            )}
            {editable && (
              <button
                type="button"
                aria-label="Удалить"
                onClick={() => setDel(true)}
                className={cn(circ, "size-11 text-[#ff5257] hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
              >
                <Trash2 />
              </button>
            )}
          </div>
        </header>

        {full && (
          <PassportColumns>
            <Card
              icon={Server}
              title="Паспорт оборудования"
              className="self-start"
              action={
                <button type="button" className={circ} title="Все поля" onClick={() => setEdit(true)}>
                  <Maximize2 />
                </button>
              }
            >
              <Kv
                rows={[
                  { t: "Нумерация", v: x.num },
                  { t: "Филиал", v: branchFull(x.branch) },
                  { t: "Идентификатор УС", v: x.nodeCode },
                  { t: "Населённый пункт", v: x.city },
                  { t: "Адрес узла связи", v: x.address },
                  { t: "Тип сети", v: x.network },
                  { t: "Тип оборудования", v: "router" },
                  { t: "Hostname", v: x.host },
                  { t: "IP-адрес управления", v: x.ip },
                  { t: "Тип ОС / прошивка", v: x.os },
                  { t: "Модель оборудования", v: x.model },
                  { t: "S/N оборудования", v: x.serial },
                ]}
              />
            </Card>

            <div className="relative min-h-[660px] max-[1279px]:min-h-[480px]">
              {stage === "3d" && (
                <div className="absolute inset-x-0 top-0 bottom-16">
                  {/* 3D: стойки с выделенным устройством — models.ts из прототипа «3D-интерактив» */}
                  {/* 3D — только в браузере: dynamic(ssr: false) при серверном рендере оставляет метку перехода на клиент (data-dgst) */}
                  {client && <Equipment3D model="router" zoom={0.75} className="absolute inset-0" />}
                </div>
              )}
              {stage === "panel" && <FrontPanel x={x} d={d} onPort={setPort} />}
              {stage === "rack" && <Rack d={d} />}
              {stage === "photo" && (
                <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-4">
                  <button type="button" className={btn({ primary: true })} onClick={() => setGallery(0)}>
                    <Maximize2 />
                    Открыть галерею
                  </button>
                  <div className="flex gap-2.5">
                    {d.media.map((m, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setGallery(i)}
                        aria-label={m.title}
                        className={cn("relative h-[62px] w-[86px] rounded-xl border-2 border-transparent bg-cover bg-center", i === 0 && "border-[#085eff]")}
                        style={{ backgroundImage: `url(${m.src})` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </div>

            <div className="flex flex-col gap-[18px]">
              <Card
                icon={RadioTower}
                title="Узел связи"
                action={
                  <Link href={`/nodes/${x.nodeId}`} className={circ} aria-label="Паспорт узла">
                    <ArrowUpRight />
                  </Link>
                }
              >
                <div className="h-[120px] rounded-2xl bg-cover bg-center" style={{ backgroundImage: "url(/nodes/clients.jpg)" }} />
                <Link href={`/nodes/${x.nodeId}`} className="mt-3 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                    <RadioTower className="size-[17px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold">{x.nodeCode}</b>
                    <span className="block truncate text-xs text-muted-foreground">{node?.address ?? `${x.city}, ${x.address}`}</span>
                  </span>
                  <Pill tone="ok">В работе</Pill>
                </Link>
              </Card>
              <Card icon={Cpu} title="Комплектация">
                <Kv
                  rows={[
                    { t: "№ порта", v: d.children[0]?.port ?? "—" },
                    { t: "Тип модуля", v: "1000BaseLX SFP" },
                    { t: "S/N модуля", v: d.children[0]?.serial ?? "—" },
                  ]}
                />
              </Card>
              <button type="button" onClick={() => setTab("mol")} className={cn(glass, "flex items-center gap-3 px-[18px] py-3.5 text-left")}>
                <Avatar initials={d.people[0].initials} color={d.people[0].color} className="size-11" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">МОЛ · ответственный</span>
                  <b className="block truncate text-sm font-semibold">{d.people[0].name}</b>
                </span>
                {d.people[1] && <Avatar initials={d.people[1].initials} color={d.people[1].color} className="size-8 text-[11px]" />}
              </button>
            </div>
          </PassportColumns>
        )}
      </section>

      <PassportTabs<SpdTab>
        value={tab}
        onChange={setTab}
        tabs={[
          { k: "overview", t: "Обзор", icon: LayoutGrid },
          { k: "ports", t: "Порты", icon: Server, n: d.ports.length },
          { k: "capacity", t: "Портовая ёмкость", icon: Activity },
          { k: "children", t: "Под-оборудование", icon: Layers, n: d.children.length },
          { k: "mol", t: "МОЛ и ответственные", icon: UserCog, n: d.people.length },
          { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
          { k: "service", t: "Ввод и сервис", icon: Shield },
          { k: "moves", t: "История перемещений", icon: Truck, n: d.moves.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && <SpdOverview d={d} used={used} down={down} free={free} onTab={setTab} />}
        {tab === "ports" && <PortsTab d={d} onEdit={setPort} />}
        {tab === "capacity" && <CapacityTab d={d} onSave={(capacity) => update((s) => ({ ...s, capacity }))} />}
        {tab === "children" && <ChildrenTab d={d} onChange={(children) => update((s) => ({ ...s, children }))} />}
        {tab === "mol" && <MolTab d={d} onChange={(mol) => update((s) => ({ ...s, mol }))} />}
        {tab === "docs" && <DocsTab d={d} onUpload={() => toast("Загрузка документов оборудования — после подключения API")} />}
        {tab === "service" && <ServiceTab d={d} onChange={(service) => update((s) => ({ ...s, service }))} />}
        {tab === "moves" && <MovesTab d={d} x={x} onChange={(moves) => update((s) => ({ ...s, moves }))} />}
      </TabBody>

      {port && (
        <PortDialog
          port={port === "new" ? null : port}
          next={d.ports.length + 1}
          onClose={() => setPort(null)}
          onSave={(p) =>
            update((s) => ({
              ...s,
              ports: s.ports.some((o) => o.id === p.id) ? s.ports.map((o) => (o.id === p.id ? p : o)) : [...s.ports, p],
            }))
          }
          onDelete={(p) => update((s) => ({ ...s, ports: s.ports.filter((o) => o.id !== p.id) }))}
        />
      )}
      {gallery !== null && <Gallery title={`Фото и видео · ${x.host}`} sub={`${x.model} · ${x.nodeCode}`} media={d.media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={x.host} sub={spdSub(x)} url={spdQrUrl(x)} onClose={() => setQr(false)} />}
      {edit && (
        <SpdForm
          kind="router"
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
          icon={Router}
          noun={["маршрутизатор", "маршрутизатора", "маршрутизаторов"]}
          items={[{ id: x.id, name: x.host, sub: x.model }]}
          {...SPD_REMOVE}
          onConfirm={(reason) => routers.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/routers")}
        />
      )}
    </div>
  )
}
