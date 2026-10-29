"use client"

import { RoleGate } from "@/components/shared/states"
import { usePageTitle } from "@/hooks/use-page-title"
import { useState } from "react"
import Link from "next/link"
import { Activity, ArrowUpRight, CalendarDays, Clock, Download, SatelliteDish, Table2 } from "lucide-react"
import { btn, circ, Pill } from "@/components/list/ui"
import { Modal } from "@/components/passport/modal"
import { glass } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import type { Tone } from "@/components/list/ui"
import { cn } from "@/lib/utils"

/*
 * Мониторинг OneWeb (макет 38, ow-01/02): статусы станций, отчёты по трафику / пакетам / простоям, трафик по дням,
 * простои по типу терминала, станции и карточка станции с простоями. Доступ — admin.
 * TODO(API): /api/oneweb/traffic-summary, /api/oneweb/traffic-history (формат не сверен) — сейчас цифры макета.
 */

type Station = {
  id: number
  name: string
  town: string
  client: string
  st: "work" | "idle" | "never"
  traffic: string
  down: string
  imei: string
  serial: string
  ip: string
  term: string
  ll: string
}

const ST: Record<Station["st"], [string, Tone]> = { work: ["Работает", "ok"], idle: ["Простой", "warn"], never: ["Не запускалась", "bad"] }

const STATIONS: Station[] = [
  { id: 112, name: "SHI-012", town: "Шиели", client: "КГУ «Школа № 12»", st: "work", traffic: "48,2 ГБ", down: "0 ч", imei: "35 881231 004412 7", serial: "HL1120-88231", ip: "100.64.12.18", term: "Hughes HL1120", ll: "44.1712, 66.7412" },
  { id: 113, name: "ZHN-004", town: "Жанакорган", client: "Акимат с/о", st: "idle", traffic: "12,1 ГБ", down: "14 ч", imei: "35 881231 007120 2", serial: "HL1120-77120", ip: "100.64.12.40", term: "Hughes HL1120", ll: "44.7311, 66.7052" },
  { id: 114, name: "KRK-002", town: "Каркаралинск", client: "ФАП № 2", st: "work", traffic: "31,7 ГБ", down: "1 ч", imei: "35 881231 011823 9", serial: "OW50L-11823", ip: "100.64.18.2", term: "Intellian OW50L", ll: "49.4071, 75.4721" },
  { id: 115, name: "AKS-019", town: "Аксуат", client: "Школа № 3", st: "never", traffic: "0", down: "—", imei: "35 881231 090011 4", serial: "HL1120-90011", ip: "100.64.18.90", term: "Hughes HL1120", ll: "47.7601, 82.8102" },
]

const REPORTS = ["Отчёт по трафику", "Отчёт по пакетам", "Отчёт по простоям", "Отчёт по простоям (по типу терминала)"]
/** Трафик по дням (ТБ): вниз, вверх. */
const DAYS: [number, number, number][] = [
  [1, 4.2, 1.2],
  [5, 3.3, 1.3],
  [9, 6.8, 0.7],
  [13, 3.1, 0.5],
  [17, 2.4, 1.3],
  [21, 7.2, 1.0],
  [25, 2.8, 0.9],
  [29, 7.0, 1.6],
]
const DOWN: [string, number, string][] = [
  ["Hughes HL1120", 41, "#ffc24a"],
  ["Intellian OW50L", 14, "#ffc24a"],
  ["Kymeta Hawk u8", 96, "#ff5257"],
]
const KPI: [string, string, string, number][] = [
  ["Работает", "1 104", "#2bd463", 92],
  ["Простой", "62", "#ffc24a", 5],
  ["Не запускалась ни разу", "38", "#ff5257", 3],
]

function OnewebMonitoringPageContent() {
  const [report, setReport] = useState(0)
  const [open, setOpen] = useState<Station | null>(null)
  const max = Math.max(...DAYS.map((d) => d[1] + d[2]))
  return (
    <div className="px-(--page-gutter) pb-10">
      <section className="flex flex-wrap items-end gap-5 pt-8 pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Аналитика</p>
          <h1 className="mt-1.5 text-[52px] leading-[1.05] font-semibold tracking-[-1.4px] max-sm:text-[32px]">
            Мониторинг OneWeb <em className="text-[32px] font-normal text-muted-foreground not-italic">1 204 станции</em>
          </h1>
          <p className="mt-2 text-[15px] text-[var(--nav-text)]">Трафик, пакеты и простои абонентских терминалов · доступ: admin</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2.5">
          <button type="button" className={btn()} onClick={() => toast("Выбор периода — после подключения API")}>
            <CalendarDays />
            Октябрь 2026
          </button>
          <Link href="/oneweb-form" className={btn()}>
            <Table2 />
            Форма учёта OneWeb
          </Link>
          <button type="button" className={btn({ primary: true })} onClick={() => toast(`${REPORTS[report]} — выгрузка после подключения API`)}>
            <Download />
            Скачать отчёт
          </button>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3.5 max-sm:grid-cols-1">
        {KPI.map(([t, v, c, p]) => (
          <div key={t} className={cn(glass, "px-5 py-[18px]")}>
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <i className="size-[7px] rounded-full" style={{ background: c }} />
              {t}
            </span>
            <b className="mt-2 block text-[30px] font-medium tabular-nums">{v}</b>
            <span className="mt-3 block h-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
              <i className="block h-full rounded-full" style={{ width: `${p}%`, background: c }} />
            </span>
          </div>
        ))}
      </div>

      <div className="my-[18px] flex flex-wrap gap-2">
        {REPORTS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setReport(i)}
            className={cn(
              "h-9 rounded-full border border-border px-4 text-[13px] transition-colors",
              report === i ? "border-[#085eff] bg-[rgba(8,94,255,0.18)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_460px] items-start gap-[18px] max-[1279px]:grid-cols-1">
        <section className={cn(glass, "p-4")}>
          <header className="mb-4 flex items-center gap-3">
            <Icon icon={Activity} />
            <b className="text-[15px] font-semibold">Трафик по дням, ТБ</b>
            <span className="ml-auto flex gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="size-1.5 rounded-full bg-[#085eff]" />
                Вниз
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-1.5 rounded-full bg-[#a78bfa]" />
                Вверх
              </span>
            </span>
          </header>
          <div className="flex h-[240px] items-end gap-2.5 border-b border-border">
            {DAYS.map(([d, a, b]) => (
              <span key={d} className="flex h-full flex-1 flex-col justify-end gap-0.5" title={`${d} октября: ${a} / ${b} ТБ`}>
                <i className="rounded-t-md bg-[linear-gradient(180deg,#3d8bff,#085eff)]" style={{ height: `${(a / max) * 100}%` }} />
                <i className="bg-[linear-gradient(180deg,#a78bfa,#7c4dff)]" style={{ height: `${(b / max) * 100}%` }} />
              </span>
            ))}
          </div>
          <div className="mt-1 flex gap-2.5">
            {DAYS.map(([d]) => (
              <span key={d} className="flex-1 text-center text-[11px] text-muted-foreground">
                {d}
              </span>
            ))}
          </div>
        </section>
        <section className={cn(glass, "p-4")}>
          <header className="mb-4 flex items-center gap-3">
            <Icon icon={Clock} />
            <b className="text-[15px] font-semibold">Простои по типу терминала</b>
          </header>
          {DOWN.map(([t, h, c]) => (
            <div key={t} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 py-1.5 text-[12.5px]">
              {t}
              <span className="h-1.5 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                <i className="block h-full rounded-full" style={{ width: `${(h / 140) * 100}%`, background: c }} />
              </span>
              <b className="text-right font-semibold">{h} ч</b>
            </div>
          ))}
        </section>
      </div>

      <section className={cn(glass, "mt-[18px] p-4")}>
        <header className="mb-3 flex items-center gap-3">
          <Icon icon={SatelliteDish} />
          <b className="text-[15px] font-semibold">
            Станции <span className="font-normal text-muted-foreground">1 204</span>
          </b>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-y-1.5 text-[13.5px]">
            <thead>
              <tr className="text-left text-[12.5px] text-muted-foreground">
                {["Станция", "Населённый пункт", "Клиент", "Статус", "Трафик за месяц", "Простой", ""].map((h) => (
                  <th key={h} className="px-3.5 py-1 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATIONS.map((x) => (
                <tr key={x.id} className="cursor-pointer [&>td]:bg-[var(--chip-bg)] [&>td]:px-3.5 [&>td]:py-3" onClick={() => setOpen(x)}>
                  <td className="rounded-l-xl font-semibold">{x.name}</td>
                  <td>{x.town}</td>
                  <td>{x.client}</td>
                  <td>
                    <Pill tone={ST[x.st][1]}>{ST[x.st][0]}</Pill>
                  </td>
                  <td className="tabular-nums">{x.traffic}</td>
                  <td>{x.down}</td>
                  <td className="rounded-r-xl text-right">
                    <span className={circ}>
                      <ArrowUpRight />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open && <StationDrawer x={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

/** ow-02: карточка станции с простоями. */
function StationDrawer({ x, onClose }: { x: Station; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Номер записи", String(x.id)],
    ["IMEI", x.imei],
    ["Серийный номер", x.serial],
    ["IP-адрес", x.ip],
    ["Тип терминала", x.term],
    ["Категория", "Fixed"],
    ["Скорость вниз/вверх", "100 / 20 Мбит/с"],
    ["Клиент", x.client],
    ["Владелец", "QMobile"],
    ["Филиал", "ЮФ"],
    ["Адрес установки", `${x.town}, ул. Абая, 14`],
    ["Дата установки", "03.06.2025"],
    ["Статус станции", ST[x.st][0]],
    ["Связность", x.st === "work" ? "Online 99,6%" : "Offline"],
    ["Тариф связности", "Business 100"],
    ["Координаты", x.ll],
  ]
  const downs: [string, string, string][] =
    x.st === "never"
      ? []
      : [
          ["04.10 02:14", "04.10 02:40", "26 мин"],
          ["28.09 18:02", "28.09 19:10", "1 ч 08 мин"],
        ]
  return (
    <Modal side title={`${x.name} · ${x.town}`} sub={`${x.term} · ${ST[x.st][0]}`} icon={SatelliteDish} width={600} onClose={onClose}>
      <div className="flex-1 overflow-y-auto px-7 py-4">
        <dl className="text-[13.5px]">
          {rows.map(([t, v]) => (
            <div key={t} className="flex justify-between gap-4 border-b border-border py-3">
              <dt className="text-muted-foreground">{t}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase after:h-px after:flex-1 after:bg-border">
          Простои
        </p>
        <div className={cn(glass, "p-4")}>
          <b className="mb-2 block text-sm font-semibold">
            Простои <span className="font-normal text-muted-foreground">{downs.length}</span>
          </b>
          {downs.length ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[12px] text-muted-foreground">
                  <th className="py-1.5 font-medium">Начало</th>
                  <th className="py-1.5 font-medium">Восстановлена</th>
                  <th className="py-1.5 font-medium">Длительность</th>
                </tr>
              </thead>
              <tbody>
                {downs.map(([a, b, d]) => (
                  <tr key={a} className="border-t border-border">
                    <td className="py-2">{a}</td>
                    <td className="py-2">{b}</td>
                    <td className="py-2">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[13px] text-muted-foreground">Станция ещё не запускалась</p>
          )}
        </div>
      </div>
      <footer className="flex justify-between gap-3 border-t border-[var(--dd-line)] px-7 py-4">
        <Link href="/oneweb-form" className={btn()}>
          <Table2 />
          Форма учёта
        </Link>
        <button type="button" className={btn({ primary: true })} onClick={() => toast("Отчёт по станции — после подключения API")}>
          <Download />
          Отчёт по станции
        </button>
      </footer>
    </Modal>
  )
}

function Icon({ icon: I }: { icon: typeof Activity }) {
  return (
    <span className="grid size-8 place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
      <I className="size-4" />
    </span>
  )
}

export default function OnewebMonitoringPage() {
  usePageTitle("Мониторинг OneWeb")
  return (
    <RoleGate section="Мониторинг OneWeb" roles={["admin"]}>
      <OnewebMonitoringPageContent />
    </RoleGate>
  )
}
