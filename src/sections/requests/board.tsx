"use client"

import { useState } from "react"
import { Dialog } from "radix-ui"
import { BarChart3, Check, ClipboardList, Download, Plus, Search, X } from "lucide-react"
import { Input, Select, Textarea } from "@/components/list/form-controls"
import { btn, circ, Pill } from "@/components/list/ui"
import { Avatar, glass } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { BRANCHES, nodeRows } from "@/sections/nodes/data"
import { cn } from "@/lib/utils"

/*
 * Реестр заявок (макет 16): канбан от поступления в ОТПП ТК до закрытия. Карточки перетаскиваются между колонками.
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
}

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

export function RequestsBoard() {
  const [list, setList] = useState(SEED)
  const [q, setQ] = useState("")
  const [branch, setBranch] = useState("")
  const [who, setWho] = useState("")
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const [create, setCreate] = useState<Stage | null>(null)
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
      </div>

      <div className="mt-[18px] grid grid-cols-5 gap-3.5 overflow-x-auto pb-4 max-[1279px]:grid-cols-[repeat(5,300px)]">
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
    </div>
  )
}

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
  const nodes = nodeRows()
  const [v, setV] = useState({ client: "", tech: "FTTB", speed: "100 Мбит/с", node: "", who: "Д. Темирханова", note: "" })
  const save = () => {
    if (!v.client.trim() || !v.node) return toast("Укажите клиента и узел связи")
    const n = nodes.find((x) => x.code === v.node)!
    onSave({
      num: `№ 2026-${next}`,
      client: v.client.trim(),
      tech: `${v.tech} · ${v.speed} · ${n.code}`,
      branch: n.branch,
      who: v.who,
      days: 0,
      stage,
    })
    toast(`Заявка № 2026-${next} создана`)
    onClose()
  }
  const label = (t: string, req?: boolean) => (
    <span className="mb-2 block text-[13.5px] font-medium">
      {t} {req && <span className="text-[#ff5257]">*</span>}
    </span>
  )
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[rgba(5,6,9,0.55)] backdrop-blur-[3px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[101] w-[600px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-border bg-background p-6"
        >
          <header className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[rgba(8,94,255,0.16)] text-[var(--link)]">
              <ClipboardList className="size-5" />
            </span>
            <Dialog.Title className="flex-1 text-xl font-semibold">Новая заявка на подключение</Dialog.Title>
            <Dialog.Close className={circ} aria-label="Закрыть">
              <X />
            </Dialog.Close>
          </header>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-full">
              {label("Клиент", true)}
              <Input value={v.client} onChange={(e) => setV({ ...v, client: e.target.value })} placeholder="ТОО «…» или БИН" />
            </div>
            <div>
              {label("Технология")}
              <Select
                value={v.tech}
                opts={["FTTB", "FTTH", "ID-канал L2", "L3VPN", "Интернет"].map((t) => ({ v: t, label: t }))}
                onChange={(t) => setV({ ...v, tech: t })}
              />
            </div>
            <div>
              {label("Скорость")}
              <Select
                value={v.speed}
                opts={["50 Мбит/с", "100 Мбит/с", "200 Мбит/с", "1 Гбит/с"].map((t) => ({ v: t, label: t }))}
                onChange={(t) => setV({ ...v, speed: t })}
              />
            </div>
            <div>
              {label("Узел связи", true)}
              <Select
                value={v.node}
                placeholder="Начните вводить ID…"
                opts={nodes.map((n) => ({ v: n.code, label: `${n.code} · ${n.object}` }))}
                onChange={(t) => setV({ ...v, node: t })}
              />
            </div>
            <div>
              {label("Ответственный")}
              <Select value={v.who} opts={Object.keys(PEOPLE).map((p) => ({ v: p, label: p }))} onChange={(t) => setV({ ...v, who: t })} />
            </div>
            <div className="col-span-full">
              {label("Комментарий")}
              <Textarea value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="Адрес, контакт, № kCRM" />
            </div>
          </div>
          <footer className="mt-6 flex justify-end gap-2.5">
            <Dialog.Close className={btn()}>Отмена</Dialog.Close>
            <button type="button" className={btn({ primary: true })} onClick={save}>
              <Check />
              Создать
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
