"use client"

import { usePageTitle } from "@/hooks/use-page-title"
import { useState } from "react"
import { ArrowUpRight, BarChart3, Check, ClipboardList, Columns3, Download, List, MapPin, Plus, Search } from "lucide-react"
import { Input, Select, Textarea } from "@/components/list/form-controls"
import { btn, circ, Pill } from "@/components/list/ui"
import { Modal } from "@/components/passport/modal"
import { Avatar, glass } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { BRANCHES } from "@/sections/nodes/data"
import { cn } from "@/lib/utils"

/*
 * Реестр заявок (макет 16): канбан и таблица (req-02) от поступления в ОТПП ТК до закрытия, карточка заявки со стадиями (req-03),
 * создание (req-04). Карточки перетаскиваются между колонками.
 * TODO: API заявок (связь с kCRM, сроки в рабочих днях, ответственные, тендерные).
 */

type Stage = "new" | "sent" | "answer" | "work" | "closed"
type Req = {
  id: number
  num: string
  client: string
  tech: string
  branch: string
  who: string
  days: number
  stage: Stage
  tag?: { t: string; tone: "warn" | "bad" | "ok" | "muted" | "info" }
  /** Поля карточки (req-03); у примеров без них — значения по умолчанию в `card()` */
  f?: Partial<Record<CardKey, string>>
}

type CardKey = "date" | "crm" | "region" | "address" | "service" | "techName" | "complexity" | "workType" | "tender" | "initiator" | "sent"

const STAGES: [Stage, string][] = [
  ["new", "Новые"],
  ["sent", "Отправлено в ТС / регион / СО"],
  ["answer", "Ответ получен"],
  ["work", "В работе (наряд)"],
  ["closed", "Закрыто"],
]
const PEOPLE: Record<string, [string, string]> = {
  "Д. Темирханова": ["ДТ", "linear-gradient(135deg,#f59e0b,#b45309)"],
  "Б. Дегтярь": ["БД", "linear-gradient(135deg,#0ea5e9,#0369a1)"],
  "Н. Осербай": ["НО", "linear-gradient(135deg,#a855f7,#6d28d9)"],
  "Е. Сапаров": ["ЕС", "linear-gradient(135deg,#22c55e,#15803d)"],
}

const SEED: Req[] = [
  {
    id: 1,
    num: "№ 2026-1184",
    client: "ТОО «Нуран Групп»",
    tech: "FTTB · 100 Мбит/с · АС",
    branch: "АС",
    who: "Д. Темирханова",
    days: 0,
    stage: "new",
  },
  { id: 2, num: "№ 2026-1183", client: "ИП «Ахметов»", tech: "FTTH · АС", branch: "АС", who: "Д. Темирханова", days: 1, stage: "new" },
  {
    id: 3,
    num: "№ 2026-1179",
    client: "ИП «Сапарова А.»",
    tech: "FTTH · url002.01.UF",
    branch: "УФ",
    who: "Б. Дегтярь",
    days: 3,
    stage: "sent",
    tag: { t: "Сложная", tone: "info" },
    f: { date: "02.10.2026", crm: "88501", region: "Астана", address: "ул. Кенесары, 44", service: "Интернет 100 Мбит/с", techName: "FTTH", complexity: "Сложная", workType: "Строительство", sent: "03.10.2026" },
  },
  { id: 4, num: "№ 2026-1170", client: "ТОО «Тарлан»", tech: "ID-канал L2 · ЮФ", branch: "ЮФ", who: "Н. Осербай", days: 6, stage: "sent" },
  { id: 5, num: "№ 2026-1166", client: "ТОО «A&Meirim»", tech: "FTTH · 246 м", branch: "ЮФ", who: "Б. Дегтярь", days: 4, stage: "answer" },
  {
    id: 6,
    num: "№ 2026-1158",
    client: "АО «КазТрансКом»",
    tech: "L3VPN 1 Гбит/с",
    branch: "АС",
    who: "Е. Сапаров",
    days: 9,
    stage: "work",
    tag: { t: "Задержка", tone: "bad" },
  },
  {
    id: 7,
    num: "№ 2026-1150",
    client: "ГУ «Аким. р-на»",
    tech: "Интернет 200 Мбит/с",
    branch: "АС",
    who: "Е. Сапаров",
    days: 5,
    stage: "work",
  },
  {
    id: 8,
    num: "№ 2026-1171",
    client: "ТОО «Бота-2017»",
    tech: "FTTB · подключено",
    branch: "АС",
    who: "Б. Дегтярь",
    days: 7,
    stage: "closed",
    tag: { t: "Подключено", tone: "ok" },
  },
  {
    id: 9,
    num: "№ 2026-1140",
    client: "ТОО «Орлан»",
    tech: "отказ · нет ТВ",
    branch: "АС",
    who: "Б. Дегтярь",
    days: 4,
    stage: "closed",
    tag: { t: "Отказ", tone: "muted" },
  },
]

/** Срок по нормативу — 5 р.д.; больше — «просрочено». */
const LIMIT = 5

/** Краткий статус для таблицы (req-02). */
const short = (r: Req): [string, "warn" | "bad" | "ok" | "muted" | "info"] =>
  r.tag && r.tag.t !== "Сложная"
    ? [r.tag.t, r.tag.tone]
    : r.stage === "new"
      ? ["Новая", "muted"]
      : r.stage === "sent"
        ? ["Отправлено в ТС", "info"]
        : r.stage === "answer"
          ? ["Ответ получен", "info"]
          : r.stage === "work"
            ? ["В работе", "warn"]
            : ["Закрыто", "ok"]

/** Поля карточки заявки: из записи или по умолчанию (TODO(API): заявка целиком из kCRM / реестра). */
function card(r: Req): Record<CardKey, string> {
  const n = Number(r.num.slice(-4))
  return {
    date: `${String(Math.max(1, 6 - (r.days % 6))).padStart(2, "0")}.10.2026`,
    crm: String(88000 + (n % 1000)),
    region: BRANCHES.find((b) => b.v === r.branch)?.full.replace(/ филиал.*/, "") ?? r.branch,
    address: "—",
    service: r.tech.split(" · ")[1] ?? "Интернет 100 Мбит/с",
    techName: r.tech.split(" ")[0],
    complexity: "Обычная",
    workType: "Подключение",
    tender: "Нет",
    initiator: "Д. Темирханова",
    sent: r.stage === "new" ? "—" : "03.10.2026",
    ...r.f,
  }
}

export default function RequestsBoard() {
  usePageTitle("Заявки")
  const [list, setList] = useState(SEED)
  const [q, setQ] = useState("")
  const [branch, setBranch] = useState("")
  const [who, setWho] = useState("")
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const [create, setCreate] = useState<Stage | null>(null)
  const [view, setView] = useState<"board" | "table">("board")
  const [open, setOpen] = useState<number | null>(null)
  const opened = list.find((r) => r.id === open)
  const shown = list.filter(
    (r) =>
      (!branch || r.branch === branch) &&
      (!who || r.who === who) &&
      `${r.num} ${r.client} ${r.tech}`.toLowerCase().includes(q.trim().toLowerCase()),
  )
  const move = (id: number, stage: Stage) => {
    const r = list.find((x) => x.id === id)
    if (!r || r.stage === stage) return
    setList(list.map((x) => (x.id === id ? { ...x, stage } : x)))
    toast(`${r.num} → «${STAGES.find((s) => s[0] === stage)?.[1]}»`)
  }
  const kpis: [string, string, string, string][] = [
    ["В работе", String(list.filter((r) => r.stage !== "closed").length + 37), "", "#085eff"],
    ["Просрочено", String(list.filter((r) => r.stage !== "closed" && r.days > LIMIT).length + 6), "> срока", "#ff5257"],
    ["Средний срок", "5,2", "р.д.", "#a78bfa"],
    ["Закрыто в октябре", String(list.filter((r) => r.stage === "closed").length + 29), "", "#2bd463"],
    ["Тендерные", "4", "", "#ffc24a"],
  ]

  return (
    <div className="relative isolate px-(--page-gutter)">
      <section className="relative -mx-(--page-gutter) -mt-[96px] px-(--page-gutter) pt-[150px] pb-6">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(800px_400px_at_20%_30%,rgba(8,94,255,0.14),transparent_70%)]"
        />
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <p className="text-sm text-muted-foreground">Сервисы</p>
            <h1 className="mt-1.5 text-[60px] leading-[1.05] font-semibold tracking-[-1.6px] max-sm:text-[34px]">
              Реестр заявок <em className="text-[42px] font-normal text-muted-foreground not-italic max-sm:text-[24px]">1 407</em>
            </h1>
            <p className="mt-2 text-[15px] text-[var(--nav-text)]">Заявки на подключение · от поступления в ОТПП ТК до закрытия</p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <button type="button" className={btn()} onClick={() => toast("Сводный отчёт — после подключения API")}>
              <BarChart3 />
              Сводный отчёт
            </button>
            <button type="button" className={btn()} onClick={() => toast("Отчёт — после подключения API")}>
              <Download />
              Отчёт
            </button>
            <button type="button" className={btn({ primary: true })} onClick={() => setCreate("new")}>
              <Plus />
              Создать
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-5 gap-3.5 max-[1279px]:grid-cols-3 max-sm:grid-cols-2">
        {kpis.map(([t, v, n, c]) => (
          <div key={t} className={cn(glass, "px-5 py-[18px]")}>
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <i className="size-[7px] rounded-full" style={{ background: c }} />
              {t}
            </span>
            <b className="mt-2 block text-[30px] font-medium tabular-nums">
              {v}
              {n && <em className="ml-1.5 text-[13px] font-normal text-muted-foreground not-italic">{n}</em>}
            </b>
          </div>
        ))}
      </div>

      <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
        <Input
          icon={<Search />}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Клиент, адрес, № заявки, № kCRM…"
          className="h-11 w-[340px] rounded-full max-sm:w-full"
        />
        <Select
          value={branch}
          opts={[{ v: "", label: "Все филиалы" }, ...BRANCHES.map((b) => ({ v: b.v, label: `Филиал: ${b.v}` }))]}
          onChange={setBranch}
          className="h-11 w-[180px] rounded-full"
        />
        <Select
          value={who}
          opts={[{ v: "", label: "Ответственный: все" }, ...Object.keys(PEOPLE).map((p) => ({ v: p, label: p }))]}
          onChange={setWho}
          className="h-11 w-[220px] rounded-full"
        />
        <span className="ml-auto flex gap-1 rounded-full bg-[var(--chip-bg)] p-1">
          {(
            [
              ["board", Columns3, "Канбан"],
              ["table", List, "Таблица"],
            ] as const
          ).map(([k, Icon, t]) => (
            <button
              key={k}
              type="button"
              title={t}
              aria-label={t}
              onClick={() => setView(k)}
              className={cn("grid size-9 place-items-center rounded-full", view === k ? "bg-[var(--nav-on-bg)] text-[var(--nav-on)]" : "text-muted-foreground")}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </span>
      </div>

      {view === "table" && (
        <section className={cn(glass, "mt-[18px] overflow-x-auto p-3")}>
          <table className="w-full min-w-[1000px] border-separate border-spacing-y-1.5 text-[13.5px]">
            <thead>
              <tr className="text-left text-[12.5px] text-muted-foreground">
                {["№ заявки", "Дата поступления", "Клиент", "Филиал", "Технология", "Ответственный", "Краткий статус", "Срок", ""].map((h) => (
                  <th key={h} className="px-3.5 py-1 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const [st, tone] = short(r)
                const c = card(r)
                return (
                  <tr key={r.id} onClick={() => setOpen(r.id)} className="cursor-pointer [&>td]:bg-[var(--chip-bg)] [&>td]:px-3.5 [&>td]:py-3">
                    <td className="rounded-l-xl font-mono font-semibold">{r.num.replace("№ ", "")}</td>
                    <td>{c.date}</td>
                    <td className="font-semibold">{r.client}</td>
                    <td>{r.branch}</td>
                    <td>{c.techName}</td>
                    <td>{r.who}</td>
                    <td>
                      <Pill tone={tone} className="[&>i]:hidden">
                        {st}
                      </Pill>
                    </td>
                    <td className={cn("tabular-nums", r.stage !== "closed" && r.days > LIMIT && "text-[#ff5257]")}>{r.days} р.д.</td>
                    <td className="rounded-r-xl text-right">
                      <span className={circ}>
                        <ArrowUpRight />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      <div className={cn("mt-[18px] grid grid-cols-5 gap-3.5 overflow-x-auto pb-4 max-[1279px]:grid-cols-[repeat(5,300px)]", view === "table" && "hidden")}>
        {STAGES.map(([k, t]) => {
          const items = shown.filter((r) => r.stage === k)
          return (
            <section
              key={k}
              onDragOver={(e) => (e.preventDefault(), setOver(k))}
              onDragLeave={() => setOver(null)}
              onDrop={() => {
                if (drag !== null) move(drag, k)
                setDrag(null)
                setOver(null)
              }}
              className={cn(
                glass,
                "flex min-h-[420px] flex-col p-3 transition-colors",
                over === k && "border-[#085eff] bg-[rgba(8,94,255,0.08)]",
              )}
            >
              <header className="mb-3 flex items-center gap-2 px-1.5">
                <b className="text-[13.5px] font-semibold">{t}</b>
                <em className="rounded-full bg-[var(--chip-bg)] px-2 text-xs not-italic">{items.length}</em>
              </header>
              <div className="flex flex-1 flex-col gap-2.5">
                {items.map((r) => {
                  const [ini, color] = PEOPLE[r.who] ?? ["?", "#8c919b"]
                  const late = r.stage !== "closed" && r.days > LIMIT
                  return (
                    <article
                      key={r.id}
                      draggable
                      onDragStart={() => setDrag(r.id)}
                      onDragEnd={() => setDrag(null)}
                      onClick={() => setOpen(r.id)}
                      className={cn(
                        "cursor-grab rounded-2xl border border-border bg-[var(--glass-card-solid)] p-3.5 active:cursor-grabbing",
                        drag === r.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <b className="text-[13px] text-[var(--link)]">{r.num}</b>
                        {r.tag && (
                          <Pill tone={r.tag.tone} className="ml-auto h-[22px] px-2 text-[11px] [&>i]:hidden">
                            {r.tag.t}
                          </Pill>
                        )}
                      </div>
                      <b className="mt-1.5 block text-sm font-semibold">{r.client}</b>
                      <span className="text-xs text-muted-foreground">{r.tech}</span>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <Avatar initials={ini} color={color} className="size-6 text-[10px]" />
                        <span className="flex-1 text-muted-foreground">{r.who}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 tabular-nums",
                            late ? "bg-[rgba(255,59,59,0.14)] text-[#ff5257]" : "bg-[var(--chip-bg)]",
                          )}
                        >
                          {r.days} р.д.
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setCreate(k)}
                className="mt-2.5 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-[13px] text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-4" />
                Добавить
              </button>
            </section>
          )
        })}
      </div>
      {create && (
        <CreateDialog
          stage={create}
          next={Math.max(...list.map((r) => Number(r.num.slice(-4)))) + 1}
          onClose={() => setCreate(null)}
          onSave={(r) => setList([{ ...r, id: Date.now() }, ...list])}
        />
      )}
      {opened && (
        <RequestDrawer
          r={opened}
          onClose={() => setOpen(null)}
          onSave={(stage) => {
            move(opened.id, stage)
            setOpen(null)
          }}
        />
      )}
    </div>
  )
}

const STEPS = ["Поступила", "Отправлена в ТС", "Ответ", "Наряд", "Закрыта"]

/** req-03: карточка заявки — стадии, поля, точка подключения. Клик по стадии меняет её, «Сохранить» — применяет. */
function RequestDrawer({ r, onClose, onSave }: { r: Req; onClose: () => void; onSave: (s: Stage) => void }) {
  const [step, setStep] = useState(STAGES.findIndex((s) => s[0] === r.stage))
  const c = card(r)
  const rows: [string, string][] = [
    ["№ заявки", r.num.replace("№ ", "")],
    ["Дата поступления в ОТПП ТК", c.date],
    ["Наименование клиента", r.client],
    ["Инициатор", c.initiator],
    ["Ответственный", r.who],
    ["Сложность задачи", c.complexity],
    ["№ kCRM", c.crm],
    ["Филиал / Регион", `${r.branch} / ${c.region}`],
    ["Адрес", c.address],
    ["Требуемая услуга", c.service],
    ["Технология подключения", c.techName],
    ["Дата отправки в ТС\\регион\\СО", c.sent],
    ["Дата получения ответа", step >= 2 ? "07.10.2026" : "—"],
    ["Срок исполнения, р.д.", `${r.days} из ${LIMIT}`],
    ["Тип работ", c.workType],
    ["Распоряжение / Наряд", step >= 3 ? "№ 118-р / № 2041" : "— / —"],
    ["Тендерная", c.tender],
  ]
  return (
    <Modal side title={`Заявка ${r.num}`} sub={`${r.client} · ${c.techName} · срок ${r.days} из ${LIMIT} р.д.`} icon={ClipboardList} width={600} onClose={onClose}>
      <div className="flex-1 overflow-y-auto px-7 py-5">
        <ol className="mb-4 grid grid-cols-5">
          {STEPS.map((t, i) => (
            <li key={t} className="relative flex flex-col items-center gap-1.5 text-center">
              {i > 0 && <i className={cn("absolute top-3.5 right-1/2 h-0.5 w-full", i <= step ? "bg-[#2bd463]" : "bg-border")} />}
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "relative z-[1] grid size-7 place-items-center rounded-full border text-[11px] font-semibold",
                  i < step
                    ? "border-[#2bd463] bg-[rgba(43,212,99,0.16)] text-[#2bd463]"
                    : i === step
                      ? "border-[#085eff] bg-[#085eff] text-white"
                      : "border-border bg-background text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </button>
              <span className={cn("text-[11px]", i === step ? "text-foreground" : "text-muted-foreground")}>{t}</span>
            </li>
          ))}
        </ol>
        <dl className="text-[13.5px]">
          {rows.map(([t, v]) => (
            <div key={t} className="flex justify-between gap-4 border-b border-border py-3">
              <dt className="text-muted-foreground">{t}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase after:h-px after:flex-1 after:bg-border">
          Точка подключения
        </p>
        <div className={cn(glass, "grid grid-cols-2 gap-x-6 gap-y-2 p-4 text-[13px]")}>
          {(
            [
              ["№ т.п.", "1"],
              ["Филиал", r.branch],
              ["Адрес", c.address],
              ["Услуга", c.service],
              ["Статус", step >= 4 ? "Подключено" : step >= 2 ? "ТВ получены" : "Ожидает ТВ"],
            ] as const
          ).map(([t, v]) => (
            <span key={t}>
              <span className="block text-[11.5px] text-muted-foreground">{t}</span>
              <b className="font-medium">{v}</b>
            </span>
          ))}
        </div>
      </div>
      <footer className="flex gap-2.5 border-t border-[var(--dd-line)] px-7 py-4">
        <button type="button" className={btn()} onClick={() => toast("Правка точки подключения — после подключения API")}>
          <MapPin />
          Редактировать точку
        </button>
        <button type="button" className={cn(btn(), "ml-auto")} onClick={onClose}>
          Отмена
        </button>
        <button type="button" className={btn({ primary: true })} onClick={() => onSave(STAGES[step][0])}>
          <Check />
          Сохранить
        </button>
      </footer>
    </Modal>
  )
}

const OPTS = {
  region: ["Астана", "Алматы", "Шымкент", "Караганда", "Актобе", "Уральск", "Атырау", "Павлодар"],
  service: ["Интернет 50 Мбит/с", "Интернет 100 Мбит/с", "Интернет 200 Мбит/с", "ID-канал L2", "L3VPN 1 Гбит/с", "IP-телефония"],
  techName: ["FTTB", "FTTH", "ID-канал L2", "L3VPN", "РРЛ", "VSAT"],
  complexity: ["Обычная", "Сложная"],
  workType: ["Подключение", "Строительство", "Модернизация"],
  tender: ["Нет", "Да"],
}

/** req-04: новая заявка — шторка с полями реестра. */
function CreateDialog({
  stage,
  next,
  onClose,
  onSave,
}: {
  stage: Stage
  next: number
  onClose: () => void
  onSave: (r: Omit<Req, "id">) => void
}) {
  const [v, setV] = useState<Record<string, string>>({ who: "", branch: "", date: "" })
  const set = (k: string) => (t: string) => setV({ ...v, [k]: t })
  const need = ["crm", "client", "branch", "address", "service", "who", "date"]
  const save = () => {
    const miss = need.filter((k) => !v[k]?.trim())
    if (miss.length) return toast(`Заполните обязательные поля: ${miss.length}`)
    onSave({
      num: `№ 2026-${next}`,
      client: v.client.trim(),
      tech: `${v.techName || "FTTB"} · ${v.service} · ${v.branch}`,
      branch: v.branch,
      who: v.who,
      days: 0,
      stage,
      tag: v.complexity === "Сложная" ? { t: "Сложная", tone: "info" } : undefined,
      f: { date: v.date, crm: v.crm, region: v.region, address: v.address, service: v.service, techName: v.techName, complexity: v.complexity, workType: v.workType, tender: v.tender },
    })
    toast(`Заявка № 2026-${next} создана`)
    onClose()
  }
  const label = (t: string, req?: boolean) => (
    <span className="mb-2 block text-[13.5px] font-medium">
      {t} {req && <span className="text-[#ff5257]">*</span>}
    </span>
  )
  const sel = (k: keyof typeof OPTS, t: string) => (
    <div>
      {label(t)}
      <Select value={v[k] ?? ""} placeholder="Выберите" opts={OPTS[k].map((o) => ({ v: o, label: o }))} onChange={set(k)} />
    </div>
  )
  return (
    <Modal side title="Новая заявка" sub="Поля со * обязательны" icon={ClipboardList} width={600} onClose={onClose}>
      <div className="flex-1 overflow-y-auto px-7 py-5">
        <p className="mb-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">Заявка</p>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            {label("№ kCRM", true)}
            <Input value={v.crm ?? ""} onChange={(e) => set("crm")(e.target.value)} placeholder="—" />
          </div>
          <div>
            {label("Наименование клиента", true)}
            <Input value={v.client ?? ""} onChange={(e) => set("client")(e.target.value)} placeholder="ТОО «…» или БИН" />
          </div>
          <div>
            {label("Филиал", true)}
            <Select value={v.branch} placeholder="Выберите" opts={BRANCHES.map((b) => ({ v: b.v, label: b.full }))} onChange={set("branch")} />
          </div>
          {sel("region", "Регион")}
          <div className="col-span-full">
            {label("Адрес", true)}
            <Input value={v.address ?? ""} onChange={(e) => set("address")(e.target.value)} placeholder="—" />
          </div>
          <div>
            {label("Требуемая услуга", true)}
            <Select value={v.service ?? ""} placeholder="Выберите" opts={OPTS.service.map((o) => ({ v: o, label: o }))} onChange={set("service")} />
          </div>
          {sel("techName", "Технология подключения")}
          {sel("complexity", "Сложность задачи")}
        </div>
        <p className="mt-6 mb-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">Исполнение</p>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            {label("Ответственный", true)}
            <Select value={v.who} placeholder="Выберите" opts={Object.keys(PEOPLE).map((p) => ({ v: p, label: p }))} onChange={set("who")} />
          </div>
          {sel("workType", "Тип работ")}
          {sel("tender", "Тендерная")}
          <div>
            {label("Дата поступления в ОТПП ТК", true)}
            <Input value={v.date} onChange={(e) => set("date")(e.target.value)} placeholder="дд.мм.гггг" />
          </div>
          <div className="col-span-full">
            {label("Комментарий")}
            <Textarea value={v.note ?? ""} onChange={(e) => set("note")(e.target.value)} placeholder="Контакт клиента, примечание" />
          </div>
        </div>
      </div>
      <footer className="flex justify-end gap-2.5 border-t border-[var(--dd-line)] px-7 py-4">
        <button type="button" className={btn()} onClick={onClose}>
          Отмена
        </button>
        <button type="button" className={btn({ primary: true })} onClick={save}>
          <Check />
          Создать
        </button>
      </footer>
    </Modal>
  )
}
