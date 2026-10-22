"use client"

import { useState } from "react"
import { Activity, Contact, FileText, Hash, Link as LinkIcon, MapPin, Network, RadioTower, Router, Ruler } from "lucide-react"
import { Textarea } from "@/components/list/form-controls"
import { Card, glass, Kv } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { type LineCtx, type LineKind } from "@/sections/lines/detail"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { list, spec } from "./config"

/*
 * ID-канал в паспорте (макет 14): схема — цепочка устройств от точки 1 до клиента, вкладки «Сетевые данные»,
 * «Клиент», «Пользовательские данные». TODO(API): цепочка, IP, VRF, outer VLAN, соединительная линия — нет в /api/id-channels.
 */

const iface = (x: GenRow) => {
  const [router = "—", port = "—"] = String(x.f.iface ?? "").split(" · ")
  return { router, port }
}
const vlan = (x: GenRow) => String(x.f.vlan ?? "— / —").split(" / ")
const speedN = (x: GenRow) => String(x.f.speed ?? "—").split(" ")
const KM = "1,8"
const ip = (x: GenRow) => `10.${vlan(x)[0]}.0.14/30`
const company = (x: GenRow) => String(x.f.client ?? "—").replace(/^(ТОО|ИП|АО) «(.*)»$/, "$2")

/** Цепочка канала (idc-04-schema): точка 1 → коммутатор → маршрутизатор → МСС → клиент. */
function Chain({ c }: { c: LineCtx }) {
  const { router, port } = iface(c.x)
  const nodes = [
    { t: "Точка 1", sub: c.x.nodeCode, color: "#2f6bff" },
    { t: "sw1.ast009", sub: `Gi1/0/3 · VLAN ${vlan(c.x)[0]}`, color: "#22d3ee" },
    { t: router, sub: `${port} · VRF CLIENTS`, color: "#a78bfa" },
    { t: "МСС Астана", sub: "Te0/0/0", color: "#22d3ee" },
    { t: "Точка 2", sub: `Клиент · ${c.x.address.replace(/^(г\.|с\.) [^,]+, /, "")}`, color: "#2bd463" },
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
            <i
              className="block size-[52px] rounded-2xl border-[3px] bg-[#0b0c10]"
              style={{ borderColor: n.color, boxShadow: `0 0 18px ${n.color}66` }}
            />
            <b className="mt-3 text-[13.5px] font-semibold">{n.t}</b>
            <span className="text-[11px] text-muted-foreground">{n.sub}</span>
          </span>
        ))}
      </div>
      <section className={`${glass} mx-auto mt-14 flex w-fit gap-20 px-7 py-5`}>
        <span>
          <span className="block text-xs text-muted-foreground">Пропускная способность</span>
          <b className="text-[28px] font-semibold">{String(c.x.f.speed ?? "—")}</b>
        </span>
        <span>
          <span className="block text-xs text-muted-foreground">IP address</span>
          <b className="mt-2 block text-xl font-semibold">{ip(c.x)}</b>
        </span>
      </section>
    </div>
  )
}

/** Пользовательские данные (idc-t3): заметка в Markdown. TODO(API): поле user_data. */
function Notes() {
  const [v, set] = useState(
    "**Примечание.** Канал резервируется через ast011 при аварии ВОЛС №49.\n\n**Основание.** Заявка KCRM № 88412 от 06.10.2026.",
  )
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

const IDC: LineKind = {
  section: "channel-ids",
  spec,
  list,
  point: (i) => `Точка ${i + 1}`,
  color: "#4f8dff",
  noScene: true,
  noDocs: true,
  schemaNode: (c) => <Chain c={c} />,
  stageLabels: [
    ["", LinkIcon],
    ["Цепочка", LinkIcon],
  ],
  strand: { tab: "", stat: "", a: ["", "#4f8dff"], b: ["", "#ffc53d"] },
  strip: "bars",
  stripTitle: () => "",
  count: () => ({ total: 0, a: 0, b: 0 }),
  pill: (x) => `${String(x.f.type ?? "").replace("VPN", "")} · ${x.f.speed ?? "—"}`,
  stats: (c) => [
    { icon: Activity, t: "Скорость", v: speedN(c.x)[0], em: speedN(c.x)[1] },
    { icon: Hash, t: "VLAN", v: String(c.x.f.vlan ?? "—"), em: "inner / outer" },
    { icon: Ruler, t: "Протяжённость", v: KM, em: "км" },
  ],
  summary: (c) => [
    {
      icon: Activity,
      title: "Скорость",
      tab: "net",
      v: (
        <>
          {speedN(c.x)[0]} <em>{speedN(c.x)[1]}</em>
        </>
      ),
    },
    {
      icon: Router,
      title: "Router",
      tab: "net",
      v: (
        <>
          {iface(c.x).router} <em>{iface(c.x).port}</em>
        </>
      ),
    },
    {
      icon: Hash,
      title: "VLAN",
      tab: "net",
      v: (
        <>
          {String(c.x.f.vlan ?? "—")} <em>inner / outer</em>
        </>
      ),
    },
    {
      icon: Contact,
      title: "Клиент",
      tab: "client",
      v: (
        <>
          {company(c.x)} <em>Л/с 7 001 245 118</em>
        </>
      ),
    },
  ],
  tabs: (c) => [
    {
      k: "net",
      t: "Сетевые данные",
      icon: Network,
      node: (
        <div className="grid grid-cols-2 gap-[18px] max-[1279px]:grid-cols-1">
          <Card icon={Router} title="Маршрутизация">
            <Kv
              rows={[
                { t: "Router", v: iface(c.x).router },
                { t: "Interface", v: iface(c.x).port },
                { t: "IP address", v: ip(c.x) },
                { t: "VRF", v: "CLIENTS" },
                { t: "Inner Vlan ID", v: vlan(c.x)[0] },
                { t: "Outer Vlan ID", v: vlan(c.x)[1] ?? "—" },
                { t: "Описание интерфейса", v: `${company(c.x).toUpperCase()} ${String(c.x.f.type ?? "").replace("VPN", "")}` },
                { t: "Пропускная способность", v: String(c.x.f.speed ?? "—") },
              ]}
            />
          </Card>
          <Card icon={MapPin} title="Подключение">
            <Kv
              rows={[
                { t: "Точка подключения 1", v: c.x.nodeCode },
                { t: "Точка подключения 2", v: c.x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
                { t: "Используемый вид оборудования", v: "SFP 1000BaseLX" },
                { t: "Дата подключения", v: "12.10.2026" },
                { t: "Протяжённость", v: `${KM} км` },
                { t: "Узел связи", v: c.x.nodeCode },
                { t: "Адрес", v: c.x.address.replace(/^(г\.|с\.) [^,]+, /, "") },
                { t: "Объект", v: c.d.start.title },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      k: "client",
      t: "Клиент",
      icon: Contact,
      node: (
        <Card icon={Contact} title="Клиент" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "ID Биллинга (Onyma)", v: `CN-${552100 + c.x.id}` },
              { t: "Лицевой счёт", v: "7 001 245 118" },
              { t: "Наименование клиента", v: String(c.x.f.client ?? "—") },
              { t: "Электронный адрес клиента", v: "info@orlan2000.kz" },
              { t: "Соединительная линия", v: "СО-4412" },
              { t: "Наименование СО", v: "ВОК клиента" },
              { t: "ID СО", v: "SO-88" },
            ]}
          />
        </Card>
      ),
    },
    { k: "notes", t: "Пользовательские данные", icon: FileText, node: <Notes /> },
  ],
  ends: (x, a) => [
    { code: x.nodeCode, title: a ? (/^УС/.test(a.object) ? a.object : `УС «${a.object}»`) : x.nodeCode, nodeId: a?.id },
    { code: "—", title: String(x.f.client ?? "Клиент") },
  ],
  rows: (x) => [
    { t: "ID-канала", v: String(x.f.cid ?? "—") },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Тип канала", v: String(x.f.type ?? "—") },
    { t: "Тип трафика", v: String(x.f.traffic ?? "Data") },
    { t: "Тип среды передач", v: "ВОЛС" },
    { t: "Уровень/направление", v: "Доступ" },
    { t: "Вид", v: "Корпоративный" },
    { t: "Router", v: iface(x).router },
    { t: "Interface", v: iface(x).port },
    { t: "IP address", v: ip(x) },
    { t: "VRF", v: "CLIENTS" },
    { t: "Inner Vlan ID", v: vlan(x)[0] },
  ],
  related: (x) => [
    { icon: RadioTower, t: x.nodeCode, sub: "точка подключения 1", href: `/nodes/${x.nodeId}` },
    { icon: Router, t: iface(x).router, sub: iface(x).port, href: "/routers" },
    { icon: Contact, t: "Клиент Onyma", sub: "Л/с 7 001 245 118", href: "/onyma/1" },
  ],
  strandRows: () => [],
  inputDocs: [
    { t: "Основание", n: "Заявка KCRM № 88412" },
    { t: "Дата подключения", n: "12.10.2026" },
    { t: "Соединительная линия", n: "СО-4412" },
  ],
  docs: [],
  lastEdit: (_, x) => ["Изменена пропускная способность", "50 Мбит/с", String(x.f.speed ?? "100 Мбит/с")],
}

/** Паспорт ID-канала (макет 14). */
export function ChannelPassport({ id }: { id: number }) {
  return <LinePassport k={IDC} id={id} />
}
