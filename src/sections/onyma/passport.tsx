"use client"

import { Globe, Layers, Link as LinkIcon, Network, RadioTower, RefreshCw, UserRound, Users, Wallet } from "lucide-react"
import { Pill } from "@/components/list/ui"
import { Card, glass } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { type LineCtx, type LineKind } from "@/sections/lines/detail"
import { Table } from "@/sections/nodes/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import { cn } from "@/lib/utils"
import { list, spec } from "./config"

/*
 * Клиент Onyma в паспорте (макет 13): только чтение, схема — лицевой счёт и его сервисы, вкладка «Сервисы».
 * TODO(API): сервисы абонента, ID подключения, логин PPPoE, точка предоставления — из Onyma, в /api/onyma их нет.
 */

const SEG: Record<string, string> = { SOHO: "Микробизнес", SME: "Малый бизнес", Enterprise: "Крупный бизнес", Gov: "Госсектор" }
const services = (c: LineCtx) => [
  {
    t: `Интернет ${c.x.f.speed ?? ""}`,
    sub: `Статический IP ${c.x.f.ip ?? "—"} · PPPoE alm_orlan`,
    vrf: "global",
    desc: `Статический IP ${c.x.f.ip ?? "—"}`,
    speed: String(c.x.f.speed ?? "—"),
  },
  { t: "ID-канал L2 до филиала", sub: "ID-00231 · 50 Мбит/с", vrf: "CLIENTS", desc: "ID-00231 до филиала", speed: "50 Мбит/с" },
  { t: "IP-телефония", sub: "5 номеров", vrf: "VOICE", desc: "5 номеров", speed: "—" },
]

/** Схема «Счёт» (on-04-schema): карточка лицевого счёта и ветки к сервисам. */
function Account({ c }: { c: LineCtx }) {
  const st = list.card(c.x).status
  return (
    <div className="absolute inset-x-0 top-[110px] flex items-center justify-center gap-0 px-[3%] max-[1279px]:top-0 max-[1279px]:flex-col max-[1279px]:gap-4">
      <section className={cn(glass, "w-[420px] max-w-full flex-none p-7")}>
        <span className="text-[11.5px] text-muted-foreground">Лицевой счёт</span>
        <b className="block text-[32px] font-semibold tracking-[-0.5px] tabular-nums">{String(c.x.f.account ?? "—")}</b>
        <span className="mt-5 block text-[11.5px] text-muted-foreground">Договор</span>
        <b className="block text-base font-semibold">№ {String(c.x.f.contract ?? "—")}</b>
        <span className="mt-5 block text-[11.5px] text-muted-foreground">Бизнес-сегментация</span>
        <b className="block text-base font-semibold">
          {String(c.x.f.segment ?? "—")} · {SEG[String(c.x.f.segment)] ?? ""}
        </b>
        <Pill tone={st.tone} className="mt-6">
          {st.label}
        </Pill>
        <p className="mt-8 text-[11.5px] text-muted-foreground">Синхронизировано с Onyma сегодня 06:30</p>
      </section>
      <svg viewBox="0 0 60 300" className="h-[300px] w-[60px] flex-none max-[1279px]:hidden" fill="none">
        {[50, 150, 250].map((y) => (
          <path key={y} d={`M0 150 C30 150 30 ${y} 60 ${y}`} stroke="#4f8dff" strokeOpacity="0.6" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex w-[380px] max-w-full flex-col gap-6">
        {services(c).map((s, i) => (
          <section
            key={s.t}
            className={cn(
              "rounded-2xl border px-6 py-5 backdrop-blur-[12px]",
              i === 2
                ? "border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.08)]"
                : "border-[rgba(79,141,255,0.35)] bg-[rgba(8,94,255,0.1)]",
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

const ON: LineKind = {
  section: "onyma",
  spec,
  list,
  point: (i) => `Точка ${i + 1}`,
  color: "#4f8dff",
  noScene: true,
  noDocs: true,
  schemaNode: (c) => <Account c={c} />,
  stageLabels: [
    ["", Layers],
    ["Счёт", Layers],
  ],
  strand: { tab: "", stat: "", a: ["", "#4f8dff"], b: ["", "#ffc53d"] },
  strip: "bars",
  stripTitle: () => "",
  count: () => ({ total: 0, a: 0, b: 0 }),
  pill: (x) => String(x.f.segment ?? "—"),
  stats: (c) => [
    { icon: Wallet, t: "Лицевой счёт", v: String(c.x.f.account ?? "—") },
    { icon: Network, t: "Сервисов", v: services(c).length },
    { icon: RefreshCw, t: "Синхронизация", v: "06:30", em: "сегодня" },
  ],
  summary: (c) => [
    { icon: Wallet, title: "Лицевой счёт", tab: "services", v: String(c.x.f.account ?? "—") },
    {
      icon: Network,
      title: "Сервисы",
      tab: "services",
      v: (
        <>
          {services(c).length} <em>{c.x.status === "active" ? "активны" : "закрыты"}</em>
        </>
      ),
    },
    { icon: Globe, title: "Статический IP", tab: "services", v: String(c.x.f.ip ?? "—") },
    {
      icon: UserRound,
      title: "Менеджер",
      tab: "services",
      v: (
        <>
          Темирханова <em>Д.</em>
        </>
      ),
    },
  ],
  tabs: (c) => [
    {
      k: "services",
      t: "Сервисы",
      icon: Network,
      n: services(c).length,
      node: (
        <Card
          icon={Network}
          title="Сервисы абонента"
          count={services(c).length}
          action={
            <span className="rounded-full bg-[var(--chip-bg)] px-3 py-1 text-xs text-muted-foreground">из Onyma · только чтение</span>
          }
        >
          <Table
            head={["Сервис", "Статус", "VRF", "Описание", "Скорость"]}
            rows={services(c).map((s, i) => ({
              key: i,
              cells: [
                s.t.replace(/ \d.*$/, ""),
                <Pill key="s" tone={c.x.status === "active" ? "ok" : "muted"}>
                  {list.card(c.x).status.label}
                </Pill>,
                s.vrf,
                s.desc,
                s.speed,
              ],
            }))}
          />
        </Card>
      ),
    },
  ],
  ends: (x, a) => [
    { code: x.nodeCode, title: a ? a.object : x.nodeCode, nodeId: a?.id },
    { code: "—", title: spec.name(x) },
  ],
  rows: (x) => [
    { t: "Наименование", v: String(x.f.company ?? "—") },
    { t: "Лицевой счёт", v: String(x.f.account ?? "—") },
    { t: "Номер договора", v: `№ ${x.f.contract ?? "—"}` },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Бизнес-сегментация", v: String(x.f.segment ?? "—") },
    { t: "Адрес", v: x.address },
    { t: "Точка предоставления сервиса", v: `${x.address.replace(/^(г\.|с\.) [^,]+, /, "")}, оф. 4` },
    { t: "ID подключения", v: `CN-${552100 + x.id}` },
    { t: "Сеть", v: "ГМС" },
    { t: "Статический IP", v: String(x.f.ip ?? "—") },
    { t: "Логин PPPoE", v: "alm_orlan" },
    { t: "Скорость", v: String(x.f.speed ?? "—") },
  ],
  related: (x) => [
    { icon: RadioTower, t: x.nodeCode, sub: "узел подключения", href: `/nodes/${x.nodeId}` },
    { icon: LinkIcon, t: "ID-00231", sub: "ID-канал", href: "/channel-ids" },
    { icon: Users, t: "Потенциальный клиент", sub: "БИН 000440005502", href: "/prospects/1" },
  ],
  strandRows: () => [],
  inputDocs: (x) => [
    { t: "Договор", n: `№ ${x.f.contract ?? "—"}` },
    { t: "Электронный адрес", n: "info@orlan2000.kz" },
    { t: "Источник", n: "Onyma · только чтение" },
  ],
  docs: [],
  lastEdit: (_, x) => ["Изменена скорость", "50 Мбит/с", String(x.f.speed ?? "100 Мбит/с")],
}

/** Паспорт клиента Onyma (макет 13). */
export function OnymaPassport({ id }: { id: number }) {
  return <LinePassport k={ON} id={id} />
}
