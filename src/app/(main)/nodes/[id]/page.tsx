"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Activity,
  ArrowUpRight,
  Box,
  Cable,
  ChevronLeft,
  Copy,
  FileText,
  History,
  Image as ImageIcon,
  LayoutGrid,
  Link as LinkIcon,
  Map as MapIcon,
  Maximize2,
  MessageSquare,
  Pencil,
  RadioTower,
  Server,
  Trash2,
  UserCog,
  Users,
} from "lucide-react"
import { DeleteDialog } from "@/components/blocks/delete-dialog"
import { PassportColumns, PassportLoading, PassportStat, PassportTabs, PassportTop, StageArea, StageSwitch, TabBody, type PassportTab } from "@/components/blocks/passport"
import { btn, checkBox, circ, Pill, Tag, type Tone } from "@/components/list/ui"
import { useNodeDetail } from "@/components/nodes/detail-store"
import { LinkFiberDialog, LocationDialog, PeopleDrawer, UploadDialog } from "@/components/nodes/dialogs"
import { NodeForm } from "@/components/nodes/node-form"
import { NodeOverview, type TabKey } from "@/components/nodes/overview"
import { ClientsTab, CommentsTab, DocsTab, EquipmentTab, FibersTab, HistoryTab, IdTab, PeopleTab } from "@/components/nodes/tabs"
import { Gallery } from "@/components/passport/gallery"
import { Avatar, glass, Kv } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { toast } from "@/components/shared/toast"
import { Equipment3D } from "@/components/three/equipment-3d"
import { usePageTitle } from "@/hooks/use-page-title"
import { BRANCHES, nodes, nodeStatus, OWNERSHIP, street, useNode, useNodes } from "@/lib/api/nodes"
import { cn } from "@/lib/utils"

/*
 * 02 Узлы связи — паспорт узла /nodes/<id> (экраны p01 «3D-схема», p02 «Карта», p03 «Фото», вкладки t01…t08, окна np-01…np-04).
 * Запись — useNode(id) из lib/api/nodes, содержимое вкладок — useNodeDetail() (примеры, components/nodes/detail-store),
 * вёрстка — блоки components/blocks/passport и части узла из components/nodes.
 */

const PointsMap = dynamic(() => import("@/components/map/points-map").then((m) => m.PointsMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[var(--feat-bg)]" />,
})

type Stage = "scene" | "map" | "photo"
const STAGES: [Stage, string, typeof Box][] = [
  ["scene", "3D-схема", Box],
  ["map", "Карта", MapIcon],
  ["photo", "Фото", ImageIcon],
]

type Point = { id: number; ll: [number, number]; title: string; sub: string; tone: Tone }

export default function NodePage({ params }: PageProps<"/nodes/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const all = useNodes()
  const { row: x, loading } = useNode(id)
  const [stage, setStage] = useState<Stage>("scene")
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [showNodes, setShowNodes] = useState(true)
  const [gallery, setGallery] = useState<number | null>(null)
  // Окна паспорта: местоположение (np-01), ВОЛС (np-02), документы (np-03), ответственные (np-04)
  const [dlg, setDlg] = useState<{ k: "location" | "fiber" | "people" } | { k: "upload"; kind?: string; files?: File[] } | null>(null)
  const d = useNodeDetail(x)
  usePageTitle(x ? x.code : "Паспорт узла связи")
  // Верх целиком (сцена и колонки) — только на «Обзоре», на остальных вкладках — одна шапка
  const full = tab === "overview"

  if (loading) return <PassportLoading />
  if (!x || !d) return <RecordNotFound title="Узел не найден" href="/nodes" back="К списку узлов" />

  const branch = BRANCHES.find((b) => b.v === x.branch)
  const [label, tone] = nodeStatus(x)
  const tabs: PassportTab<TabKey>[] = [
    { k: "overview", t: "Обзор", icon: LayoutGrid },
    { k: "fibers", t: "ВОЛС трассы", icon: Cable, n: d.fibers.length },
    { k: "equipment", t: "Оборудование", icon: Server, n: d.equipment.length },
    { k: "id", t: "ID-каналы", icon: LinkIcon, n: d.idChannels.length },
    { k: "clients", t: "Потенциальные клиенты", icon: Users, n: d.clients.total },
    { k: "people", t: "Ответственные", icon: UserCog, n: d.people.length },
    { k: "docs", t: "Документация", icon: FileText, n: d.docs.length },
    { k: "comments", t: "Комментарий", icon: MessageSquare, n: d.comments.length },
    { k: "history", t: "История", icon: History, n: d.history.length },
  ]
  // TODO(API): узлы рядом — /api/map/search/nodes; в режиме API пока только сам узел
  const near: Point[] = (nodes.isRemote() ? [x] : all)
    .filter((r) => r.city === x.city && r.onMap)
    .map((r) => ({ id: r.id, ll: r.ll, title: r.code, sub: r.object, tone: nodeStatus(r)[1] }))

  return (
    <div className="relative isolate">
      {/* ----- верх: шапка, колонки и сцена ----- */}
      <PassportTop full={full} backdrop={<Backdrop stage={stage} points={showNodes ? near : near.filter((n) => n.id === x.id)} id={x.id} />}>
        <header className="relative z-[2] flex flex-wrap items-center gap-x-[18px] gap-y-4 px-(--page-gutter)">
          <button type="button" onClick={() => router.push("/nodes")} className={cn(circ, "size-[54px] [&_svg]:size-5")} aria-label="Назад к списку">
            <ChevronLeft />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-[var(--nav-text)]">
              <Link href="/nodes" className="hover:text-foreground">
                Сеть / Узлы связи
              </Link>{" "}
              / Паспорт узла связи
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-3.5 text-4xl font-semibold tracking-[-0.6px] max-sm:text-[26px]">
              {x.code}
              <button
                type="button"
                aria-label="Скопировать ID"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigator.clipboard?.writeText(x.code).then(() => toast("ID скопирован"))}
              >
                <Copy className="size-5" />
              </button>
              <Pill tone={tone}>{label}</Pill>
              <span className="inline-flex h-[26px] items-center rounded-full bg-[var(--chip-bg)] px-2.5 text-xs font-semibold">{x.network}</span>
            </h1>
          </div>
          <div className="ml-12 flex flex-wrap gap-x-[34px] gap-y-3 max-[1500px]:ml-0">
            <PassportStat icon={Activity} t="Волокон ВОЛС" v={d.capacity.fibers[1] || 0} em={`${d.capacity.fibers[0]} занято`} />
            <PassportStat icon={Server} t="Оборудование" v={160} em="12 типов" />
            <PassportStat icon={LinkIcon} t="ID-каналы" v={d.idChannels.length} />
            <PassportStat icon={Users} t="Потенц. клиенты" v={d.clients.total} em={`до ${d.clients.radius} м`} />
          </div>
          <div className="ml-auto flex gap-2.5">
            <Link href={`/map?node=${x.code}`} className={btn()}>
              <MapIcon />
              На карту сети
            </Link>
            <button type="button" className={btn({ primary: true })} onClick={() => setEdit(true)}>
              <Pencil />
              Редактировать
            </button>
            <button
              type="button"
              aria-label="Удалить узел"
              onClick={() => setDel(true)}
              className={cn(circ, "size-11 text-[#ff5257] hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
            >
              <Trash2 />
            </button>
          </div>
        </header>

        {full && (
          <PassportColumns>
            {/* слева: паспорт и ёмкость */}
            <div className="flex flex-col gap-[18px]">
              <section className={cn(glass, "p-[22px]")}>
                <header className="mb-3 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-[11px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                    <RadioTower className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <h3 className="flex-1 text-base font-semibold">Паспорт узла</h3>
                  <button type="button" className={circ} title="Все поля" onClick={() => setEdit(true)}>
                    <Maximize2 />
                  </button>
                </header>
                <Kv
                  rows={[
                    { t: "Филиал", v: branch?.full ?? x.branch },
                    { t: "Порядковый № УС в филиале", v: x.num || "—" },
                    { t: "Идентификатор (ID)", v: x.code },
                    { t: "Населённый пункт", v: `г. ${x.city}` },
                    { t: "Адрес", v: street(x.address) },
                    { t: "Объект", v: x.object },
                    { t: "Тип сети", v: x.network },
                    { t: "Форма владения УС", v: OWNERSHIP[x.ownership] },
                    { t: "Группа эксплуатации", v: x.opsGroup === "ЦТ" ? "Центр телекоммуникаций" : x.opsGroup || "—" },
                    { t: "Расположение ГЭ", v: x.opsPlace || "—" },
                    { t: "Удалённость от ГЭ", v: `${String(x.opsKm).replace(".", ",")} км` },
                  ]}
                />
              </section>
              <section className={cn(glass, "p-[22px]")}>
                <header className="mb-3 flex items-center gap-3">
                  <Activity className="size-5 text-[var(--link)]" />
                  <h3 className="flex-1 text-base font-semibold">Ёмкость узла</h3>
                  <span className="rounded-full bg-[rgba(43,212,99,0.14)] px-2.5 py-0.5 text-xs font-semibold text-[var(--status-ok)]">98%</span>
                </header>
                {(
                  [
                    ["Портовая (СПД)", d.capacity.ports],
                    ["Волокна (ВОЛС)", d.capacity.fibers],
                  ] as const
                ).map(([t, [a, b]]) => (
                  <div key={t} className="flex items-center gap-4 py-1.5 text-[13.5px]">
                    <span className="w-[140px] text-muted-foreground">{t}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                      <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${b ? (a / b) * 100 : 0}%` }} />
                    </span>
                    <b className="w-14 text-right font-medium tabular-nums">
                      {a} / {b || "—"}
                    </b>
                  </div>
                ))}
              </section>
            </div>

            {/* центр: подписи сцены и переключатель */}
            <StageArea>
              {stage === "scene" &&
                d.scene.map((c) => (
                  <div
                    key={c.label}
                    className="absolute max-w-[240px] rounded-2xl border border-border bg-[var(--glass-card)] px-4 py-2.5 backdrop-blur-[12px]"
                    style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translateY(-50%)" }}
                  >
                    <span className="block text-[11px] text-muted-foreground">{c.label}</span>
                    <b className="block text-[13.5px] font-semibold whitespace-nowrap">{c.title}</b>
                    {c.bar !== undefined && (
                      <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-[var(--chip-bg)]">
                        <i className="block h-full rounded-full bg-[#085eff]" style={{ width: `${c.bar}%` }} />
                      </span>
                    )}
                  </div>
                ))}
              {stage === "map" && (
                <div className="absolute top-0 left-0 w-[220px] rounded-2xl border border-border bg-[var(--glass-card)] p-4 backdrop-blur-[12px]">
                  <span className="mb-2 block text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">Слои</span>
                  {(
                    [
                      ["Узлы связи", showNodes, () => setShowNodes(!showNodes)],
                      // TODO: слои ВОЛС, клиентов и участков — геометрии из API (общие с «Картой сети», 05)
                      ["ВОЛС трассы", false, null],
                      ["Потенциальные клиенты", false, null],
                      ["Земельные участки", false, null],
                    ] as const
                  ).map(([t, on, toggle]) => (
                    <button
                      key={t}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      disabled={!toggle}
                      title={toggle ? undefined : "Слой появится вместе с «Картой сети»"}
                      onClick={() => toggle?.()}
                      className="flex w-full items-center gap-2.5 py-1 text-left text-[13.5px] disabled:opacity-50"
                    >
                      <span className={checkBox(on)} />
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {stage === "photo" && (
                <div className="absolute inset-x-0 bottom-20 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-4">
                    <button type="button" className={btn({ primary: true })} onClick={() => setGallery(0)}>
                      <Maximize2 />
                      Открыть галерею
                    </button>
                    <span className="text-[13px] text-[var(--nav-text)]">12 фото · 2 видео · обновлено {x.updated || "—"}</span>
                  </div>
                  <div className="flex gap-2.5">
                    {d.media.slice(0, 6).map((m, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setGallery(i)}
                        aria-label={m.title}
                        className={cn("relative h-[62px] w-[86px] rounded-xl border-2 border-transparent bg-cover bg-center", i === 0 && "border-[#085eff]")}
                        style={{ backgroundImage: `url(${m.src})` }}
                      >
                        {m.video && <span className="absolute bottom-1 left-1 rounded-full bg-black/70 px-1.5 text-[10px] font-bold text-white">▶ {m.video}</span>}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setGallery(6)}
                      className="grid h-[62px] w-[86px] place-items-center rounded-xl border border-border bg-[var(--glass-card)] text-sm font-semibold"
                    >
                      +{d.media.length - 6}
                    </button>
                  </div>
                </div>
              )}
              <StageSwitch items={STAGES} value={stage} onChange={setStage} />
            </StageArea>

            {/* справа: расположение / узлы рядом, технологии, фото, ответственный */}
            <div className="flex flex-col gap-[18px]">
              {stage === "map" ? (
                <section className={cn(glass, "p-[22px]")}>
                  <header className="mb-2 flex items-center gap-3">
                    <MapIcon className="size-5 text-[var(--link)]" />
                    <h3 className="text-base font-semibold">
                      Узлы рядом <em className="font-normal text-muted-foreground not-italic">{Math.min(4, near.length - 1)}</em>
                    </h3>
                  </header>
                  {near
                    .filter((n) => n.id !== x.id)
                    .slice(0, 4)
                    .map((n) => (
                      <Link key={n.id} href={`/nodes/${n.id}`} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                        <span className="grid size-9 place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
                          <RadioTower className="size-[17px]" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-sm font-semibold">{n.title}</b>
                          <span className="block truncate text-xs text-muted-foreground">{n.sub}</span>
                        </span>
                        <Pill tone={n.tone}>{n.tone === "warn" ? "Реконстр." : n.tone === "bad" ? "Выведен" : "В работе"}</Pill>
                      </Link>
                    ))}
                </section>
              ) : (
                <section className={cn(glass, "overflow-hidden")}>
                  <div className="relative h-[170px]">
                    <PointsMap mini points={near} selected={x.id} onSelect={(n) => n !== x.id && router.push(`/nodes/${n}`)} className="absolute inset-0" />
                    <span className="absolute bottom-3 left-3 z-[1] rounded-lg bg-[rgba(10,11,14,0.8)] px-2 py-1 text-[11px] font-semibold text-white tabular-nums">
                      {d.coords}
                    </span>
                  </div>
                  <div className="flex items-end gap-3 px-[22px] py-4">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] text-muted-foreground">Расположение</span>
                      <b className="block truncate text-sm font-semibold">{x.address}</b>
                    </span>
                    <button type="button" className={circ} title="Изменить местоположение" onClick={() => setDlg({ k: "location" })}>
                      <Pencil />
                    </button>
                    <button type="button" className={circ} title="Открыть на карте" onClick={() => setStage("map")}>
                      <ArrowUpRight />
                    </button>
                  </div>
                </section>
              )}
              <section className={cn(glass, "p-[22px]")}>
                <span className="block text-[13px] text-muted-foreground">Подключение УС к сети филиала</span>
                <span className="mt-2 mb-4 flex flex-wrap gap-1.5">{x.techNode.length ? x.techNode.map((t) => <Tag key={t}>{t}</Tag>) : "—"}</span>
                <span className="block text-[13px] text-muted-foreground">Подключение клиентов к УС</span>
                <span className="mt-2 flex flex-wrap gap-1.5">{x.tech.length ? x.tech.map((t) => <Tag key={t}>{t}</Tag>) : "—"}</span>
              </section>
              {stage === "scene" && (
                <button
                  type="button"
                  onClick={() => setStage("photo")}
                  className="relative h-[122px] overflow-hidden rounded-3xl border border-border bg-cover bg-[position:center_35%] text-left text-white"
                  style={{ backgroundImage: "url(/nodes/tower.jpg)" }}
                >
                  <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,14,0.88),rgba(10,11,14,0.1))]" />
                  <span className="absolute top-[18px] left-5">
                    <span className="block text-xs text-white/70">Фото объекта · {d.media.length - 2}</span>
                    <b className="mt-1 block text-[15px] font-semibold">АМС {x.code.split(".")[0]} · 40 м</b>
                  </span>
                  <span className="absolute bottom-3.5 left-5 flex gap-1.5">
                    {d.media.slice(0, 2).map((m, i) => (
                      <i key={i} className="size-[34px] rounded-[9px] border border-white/25 bg-cover" style={{ backgroundImage: `url(${m.src})` }} />
                    ))}
                    <em className="grid size-[34px] place-items-center rounded-[9px] bg-white/12 text-[11px] font-semibold not-italic">+{d.media.length - 4}</em>
                  </span>
                </button>
              )}
              <section className={cn(glass, "flex items-center gap-3 px-[18px] py-3.5")}>
                <Avatar initials={d.people[0].initials} color={d.people[0].color} className="size-11" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">Ответственный за эксплуатацию</span>
                  <b className="block truncate text-sm font-semibold">{d.people[0].name}</b>
                </span>
                <span className="flex">
                  {d.people.slice(1, 2).map((p) => (
                    <Avatar key={p.initials} initials={p.initials} color={p.color} className="size-8 text-[11px] ring-2 ring-[var(--glass-card-solid)]" />
                  ))}
                  {d.people.length > 1 && (
                    <span className="-ml-1.5 grid size-8 place-items-center rounded-full bg-[var(--chip-bg)] text-[11px] font-semibold ring-2 ring-[var(--glass-card-solid)]">
                      +1
                    </span>
                  )}
                </span>
              </section>
            </div>
          </PassportColumns>
        )}
      </PassportTop>

      {/* ----- вкладки ----- */}
      <PassportTabs tabs={tabs} value={tab} onChange={setTab} />

      <TabBody>
        {tab === "overview" ? (
          <NodeOverview d={d} onTab={setTab} onGallery={(i = 0) => setGallery(i)} />
        ) : tab === "fibers" ? (
          <FibersTab node={x} d={d} onLink={() => setDlg({ k: "fiber" })} />
        ) : tab === "equipment" ? (
          <EquipmentTab node={x} d={d} onManage={() => setDlg({ k: "people" })} />
        ) : tab === "id" ? (
          <IdTab d={d} />
        ) : tab === "clients" ? (
          <ClientsTab node={x} d={d} />
        ) : tab === "people" ? (
          <PeopleTab d={d} onManage={() => setDlg({ k: "people" })} />
        ) : tab === "docs" ? (
          <DocsTab d={d} onUpload={(kind, files) => setDlg({ k: "upload", kind, files })} />
        ) : tab === "comments" ? (
          <CommentsTab d={d} />
        ) : (
          <HistoryTab d={d} />
        )}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и видео · ${x.code}`} sub={`${x.object} · ${x.address}`} media={d.media} start={gallery} onClose={() => setGallery(null)} />}
      {dlg?.k === "location" && <LocationDialog node={x} d={d} onClose={() => setDlg(null)} />}
      {dlg?.k === "fiber" && <LinkFiberDialog node={x} d={d} onClose={() => setDlg(null)} />}
      {dlg?.k === "upload" && <UploadDialog node={x} d={d} kind={dlg.kind} files={dlg.files} onClose={() => setDlg(null)} />}
      {dlg?.k === "people" && <PeopleDrawer node={x} d={d} onClose={() => setDlg(null)} />}
      {edit && (
        <NodeForm
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
          noun={["узел связи", "узла связи", "узлов связи"]}
          items={[{ id: x.id, name: x.code }]}
          warning="Связанные ВОЛС, оборудование и ID-каналы останутся, но потеряют привязку к узлу."
          reasons={["Демонтаж", "Дубликат записи", "Ошибка ввода", "Передано другому филиалу", "Списание"]}
          onConfirm={(reason) => nodes.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/nodes")}
        />
      )}
    </div>
  )
}

/** Фон верхней части: 3D-сцена (контейнер, АМС, ВОЛС — models.ts из прототипа «3D-интерактив»), карта или фото. */
function Backdrop({ stage, points, id }: { stage: Stage; points: Point[]; id: number }) {
  const router = useRouter()
  if (stage === "map")
    return (
      <div className="absolute inset-0 z-[1]">
        <PointsMap points={points} selected={id} onSelect={(n) => n !== id && router.push(`/nodes/${n}`)} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--background)_0,transparent_18%,transparent_80%,var(--background)_100%)]" />
      </div>
    )
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_55%_45%,rgba(8,94,255,0.16),transparent_70%)]" />
      {stage === "scene" ? (
        <div className="pointer-events-auto absolute top-[150px] left-1/2 h-[726px] w-[1100px] -translate-x-1/2 max-[1279px]:hidden">
          <Equipment3D model="node" zoom={0.8} autoRotate={false} className="absolute inset-0" />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/nodes/g-1.jpg)" }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,14,0.92)_0,rgba(10,11,14,0.35)_30%,rgba(10,11,14,0.1)_50%,rgba(10,11,14,0.35)_70%,rgba(10,11,14,0.92)_100%),linear-gradient(180deg,rgba(10,11,14,0.9)_0,transparent_25%,transparent_70%,var(--background)_100%)]" />
        </>
      )}
    </div>
  )
}
