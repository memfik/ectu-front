"use client"

import { useState } from "react"
import { ClipboardList, Contact, MapPin, MessageSquare, RadioTower, Tag, UserRound, Wallet } from "lucide-react"
import { Textarea } from "@/components/list/form-controls"
import { Pill } from "@/components/list/ui"
import { Card, Kv, SegBar } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { type LineCtx, type LineKind } from "@/sections/lines/detail"
import { EditableTable } from "@/sections/lines/tabs"
import { BRANCHES } from "@/sections/nodes/data"
import { cn } from "@/lib/utils"
import { list, spec } from "./config"

/*
 * Потенциальный клиент в паспорте (макет 12): схема — кольца расстояний вокруг узла и путь клиента,
 * вкладки «Контакты и адрес», «Связь с инфраструктурой», «Заявки KCRM», «Комментарий».
 * TODO(API): контакты, адреса, доход и заявки — нет в /api/potential-clients; заявки — из kCRM.
 */

const dist = (c: LineCtx) => Number(c.x.f.dist) || 0
const band = (m: number) => (m <= 30 ? "до 30" : m <= 50 ? "30–50" : m <= 100 ? "50–100" : "100–250")
/** Потенциальный доход, тыс ₸/мес — по размеру компании. */
const income = (c: LineCtx) => {
  const sz = String(c.x.f.size ?? "")
  return /Средн/.test(sz) ? 420 : /41|21|11/.test(sz) ? 180 : /6–10/.test(sz) ? 120 : 60
}
const FUNNEL = [
  { k: "none", t: "Не обработан", n: "38 912", w: 100 },
  { k: "processed", t: "Обработан", n: "3 506", w: 60 },
  { k: "kcrm", t: "Заявка KCRM", n: "1 120", w: 34 },
  { k: "client", t: "Клиент", n: "662", w: 26 },
]
const KCRM = { num: "№ 88412", date: "06.10.2026", service: "Интернет FTTB", speed: "100 Мбит/с", manager: "Д. Темирханова" }
const CONTACT = { phone: "+7 717 *** 44 10", email: "info@orlan2000.kz", person: "Ахметов Б. К.", activity: "Авиаперевозки" }

/** Схема (cl-04-schema): кольца 0–50, 50–100, 100–250 м вокруг узла, клиент на своём расстоянии; путь клиента справа. */
function Rings({ c }: { c: LineCtx }) {
  const m = Math.min(250, dist(c))
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
  const st = String(c.x.status)
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
          {dist(c)} м
        </text>
        <rect x={cx - 22} y={cy - 22} width="44" height="44" rx="11" fill="#085eff" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
          УС
        </text>
        <text x={cx} y={cy + 44} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--foreground)">
          {c.x.nodeCode}
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
          ● {spec.name(c.x)} сейчас здесь · {String(c.x.status) === "none" ? "не обработан" : "обработан 06.10.2026"}
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

const CL: LineKind = {
  section: "prospects",
  spec,
  list,
  point: (i) => `Точка ${i + 1}`,
  color: "#4f8dff",
  noScene: true,
  noDocs: true,
  schemaNode: (c) => <Rings c={c} />,
  strand: { tab: "", stat: "", a: ["", "#4f8dff"], b: ["", "#ffc53d"] },
  strip: "bars",
  stripTitle: () => "",
  count: () => ({ total: 0, a: 0, b: 0 }),
  pill: (x) => `${x.f.kind ?? "B2B"} · ${String(x.f.size ?? "").split(" ")[0]}`,
  stats: (c) => [
    { icon: RadioTower, t: "До узла", v: dist(c), em: "м" },
    { icon: Tag, t: "Категория", v: band(dist(c)), em: "м" },
    { icon: Wallet, t: "Потенц. доход", v: income(c), em: "тыс ₸/мес" },
  ],
  summary: (c) => [
    {
      icon: RadioTower,
      title: "Ближайший узел",
      tab: "infra",
      v: (
        <>
          {dist(c)} м <em>{c.x.nodeCode}</em>
        </>
      ),
    },
    {
      icon: Tag,
      title: "Категория дистанции",
      tab: "infra",
      v: (
        <>
          {band(dist(c))} <em>м</em>
        </>
      ),
    },
    {
      icon: Wallet,
      title: "Потенциальный доход",
      tab: "infra",
      v: (
        <>
          {income(c)} <em>тыс ₸ / мес</em>
        </>
      ),
    },
    {
      icon: ClipboardList,
      title: "Заявка KCRM",
      tab: "kcrm",
      v: (
        <>
          {KCRM.num} <em>в работе</em>
        </>
      ),
      bar: (
        <SegBar
          parts={[
            { v: 2, color: "#085eff" },
            { v: 3, color: "var(--chip-bg)" },
          ]}
        />
      ),
    },
  ],
  tabs: (c) => [
    {
      k: "contacts",
      t: "Контакты и адрес",
      icon: Contact,
      node: (
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
                { t: "Юридический адрес", v: c.x.address },
                { t: "Область/город", v: c.x.city },
                { t: "Район", v: "Алматинский" },
                { t: "Населённый пункт", v: `г. ${c.x.city}` },
                { t: "Улица", v: c.x.address.split(",")[1]?.trim() ?? "—" },
                { t: "Дом", v: c.x.address.split(",")[2]?.trim() ?? "—" },
                { t: "Статус размещения", v: "Аренда" },
                { t: "Фактический адрес", v: `${c.x.address.replace(/^(г\.|с\.) [^,]+, /, "")}, оф. 4` },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      k: "infra",
      t: "Связь с инфраструктурой",
      icon: RadioTower,
      node: (
        <Card icon={RadioTower} title="Связь с инфраструктурой" className="max-w-[1200px]">
          <Kv
            rows={[
              { t: "Код узла связи", v: c.x.nodeCode },
              { t: "Дистанция до узла", v: `${dist(c)} м` },
              { t: "Категория дистанции", v: `${band(dist(c))} м` },
              { t: "Потенциальный доход", v: `${(income(c) * 1000).toLocaleString("ru-RU")} ₸/мес` },
              { t: "Широта клиента", v: c.x.ll[0].toFixed(4) },
              { t: "Долгота клиента", v: c.x.ll[1].toFixed(4) },
              { t: "Широта узла", v: c.d.route[0][0].toFixed(6) },
              { t: "Долгота узла", v: c.d.route[0][1].toFixed(6) },
            ]}
          />
        </Card>
      ),
    },
    {
      k: "kcrm",
      t: "Заявки KCRM",
      icon: ClipboardList,
      n: 1,
      node: (
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
      ),
    },
    { k: "comment", t: "Комментарий", icon: MessageSquare, node: <Comment /> },
  ],
  ends: (x, a) => [
    { code: x.nodeCode, title: a ? a.object : x.nodeCode, nodeId: a?.id },
    { code: "—", title: spec.name(x) },
  ],
  rows: (x) => [
    { t: "БИН", v: String(x.f.bin ?? "—") },
    { t: "Наименование", v: String(x.f.company ?? "—") },
    { t: "Категория", v: "Частная" },
    { t: "Размер предприятия", v: String(x.f.size ?? "—") },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Тип клиента", v: String(x.f.kind ?? "—") },
    { t: "Статус", v: list.card(x).status.label },
    { t: "Дата активации", v: x.status === "client" ? "06.10.2026" : "—" },
    { t: "Телефон", v: CONTACT.phone },
    { t: "Email", v: CONTACT.email },
    { t: "Контактное лицо", v: CONTACT.person },
    { t: "Вид деятельности", v: CONTACT.activity },
  ],
  related: (x) => [
    { icon: RadioTower, t: x.nodeCode, sub: `ближайший узел · ${x.f.dist} м`, href: `/nodes/${x.nodeId}` },
    { icon: ClipboardList, t: `Заявка KCRM ${KCRM.num}`, sub: `от ${KCRM.date}`, href: "/requests" },
    { icon: UserRound, t: "Менеджер", sub: KCRM.manager },
  ],
  strandRows: () => [],
  inputDocs: (x) => [
    { t: "Юридический адрес", n: x.address },
    { t: "Фактический адрес", n: `${x.address}, оф. 4` },
    { t: "Координаты", n: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}` },
  ],
  docs: [],
  lastEdit: (_, x) => ["Статус клиента изменён", "Не обработан", list.card(x).status.label],
}

/** Паспорт потенциального клиента (макет 12). */
export function ProspectPassport({ id }: { id: number }) {
  return <LinePassport k={CL} id={id} />
}
