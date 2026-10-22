"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Bookmark,
  Cable,
  Camera,
  ChartColumn,
  CircleAlert,
  ClipboardList,
  DatabaseBackup,
  FileChartColumn,
  FileText,
  Globe,
  History,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Network,
  Phone,
  Plus,
  RadioTower,
  Router,
  Server,
  Shield,
  SquareCheck,
  Sun,
  Upload,
  UserCog,
  Users,
  VideoOff,
  type LucideIcon,
} from "lucide-react"
import { btn, circ, Pill } from "@/components/list/ui"
import { Avatar, Card, glass } from "@/components/passport/ui"
import { BRANCHES, nodeRows } from "@/data/nodes"
import { spdRows } from "@/data/spd"
import { CURRENT_USER } from "@/lib/current-user"
import { fmt } from "@/lib/list/query"
import { cn } from "@/lib/utils"

/*
 * Главная (макет 06, home-01): сводка по сети для пользователя.
 * Узлы и СПД считаются по примеру данных; остальные цифры — из макета. TODO: API сводки (/api/dashboard).
 */

const greet = (h: number) => (h < 6 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер")
/** Время берём только в браузере (на сервере другой часовой пояс) — до гидрации пусто. */
const useNow = () =>
  useSyncExternalStore(
    () => () => {},
    () => Math.floor(Date.now() / 60000),
    () => 0,
  )

/** Ряд значений для спарклайна: плавный рост с шумом. */
const series = (from: number, to: number, seed: number) =>
  Array.from({ length: 12 }, (_, i) => from + ((to - from) * i) / 11 + Math.sin(i * 1.7 + seed) * (to - from) * 0.04)

function Spark({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pts = data.map((v, i) => [(i / (data.length - 1)) * 200, 40 - ((v - min) / (max - min || 1)) * 34 - 3])
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
  return (
    <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="mt-3 block h-10 w-full" aria-hidden>
      <path d={`${d} L200 40 L0 40Z`} fill={color} opacity={0.14} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

const SECTIONS: [string, string, LucideIcon, string][] = [
  ["Узлы связи", "/nodes", RadioTower, "1 387"],
  ["Карта сети", "/map", MapIcon, "41 820 км"],
  ["Коммутаторы", "/switches", Network, "1 324"],
  ["Маршрутизаторы", "/routers", Router, "78"],
  ["АТС", "/pbx", Phone, "222"],
  ["ВОЛС", "/fiber-lines", Cable, "1 693"],
  ["КЛС", "/cable-lines", Cable, "119"],
  ["КК", "/cable-ducts", Activity, "116"],
  ["ODF", "/odf", Server, "779"],
  ["АМС", "/masts", RadioTower, "38"],
  ["Потенц. клиенты", "/prospects", Users, "43 080"],
  ["Единый IP-план", "/ip-plan", Globe, "14 703"],
]

/** Задачи пользователя. TODO: из API уведомлений и назначений. */
const TASKS: { icon: LucideIcon; color: string; t: string; s: string; action: React.ReactNode; href: string }[] = [
  {
    icon: AtSign,
    color: "#4f8dff",
    t: "Вас упомянули · url002.01.UF",
    s: "«подготовь скан нового договора…» · 10 мин назад",
    action: "Ответить",
    href: "/nodes/1",
  },
  {
    icon: ClipboardList,
    color: "#ffc24a",
    t: "Заявка № 2026-1184 на подключение",
    s: "рядом с ast011.02.AS · 1,9 км · ждёт решения",
    action: <Pill tone="warn">Новая</Pill>,
    href: "/requests",
  },
  {
    icon: CircleAlert,
    color: "#ff5257",
    t: "Импорт Excel: 3 строки с ошибками",
    s: "Узлы связи · ЮФ · сегодня 15:12",
    action: "Отчёт",
    href: "/excel-import",
  },
  {
    icon: Shield,
    color: "#ffc24a",
    t: "SmartNET истекает: 4 устройства",
    s: "вы ответственный · до 31.12.2026",
    action: <span className="rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-xs">84 дня</span>,
    href: "/switches",
  },
  { icon: UserCog, color: "#2bd463", t: "Назначьте МОЛ: 12 устройств", s: "ваши узлы · АС", action: "Назначить", href: "/switches" },
]

const REQUESTS: [string, string, string, "warn" | "info" | "ok" | "muted"][] = [
  ["№ 2026-1184 · ТОО «Нуран Групп»", "FTTB · рядом с ast011.02.AS · 1,9 км", "Новая", "warn"],
  ["№ 2026-1179 · ИП «Сапарова А.»", "FTTH · url002.01.UF · 64 м", "В работе", "info"],
  ["№ 2026-1171 · ТОО «Бота-2017»", "FTTB · УС «РТПЦ» · 71 м", "Подключено", "ok"],
  ["№ 2026-1166 · ТОО «A&Meirim»", "FTTH · ast004.01.AS · 246 м", "Отказ", "muted"],
]

export function Dashboard() {
  const nodes = nodeRows()
  const sw = spdRows("switch")
  const rt = spdRows("router")
  const work = nodes.filter((n) => n.status === "work").length
  const rebuild = nodes.filter((n) => n.status === "rebuild").length
  const off = nodes.length - work - rebuild
  const hot = sw.filter((x) => x.portsUsed / x.portsTotal > 0.9).length
  const noMap = nodes.filter((n) => !n.onMap).length
  const [growth, setGrowth] = useState<"nodes" | "eq" | "vols">("nodes")
  const months = ["ноя", "дек", "янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт"]
  const total = nodes.length
  const growthData = growth === "nodes" ? series(1180, total, 1) : growth === "eq" ? series(5600, 6214, 2) : series(38900, 41820, 3)
  const branches = BRANCHES.map((b) => {
    const list = nodes.filter((n) => n.branch === b.v)
    return {
      ...b,
      n: list.length,
      work: list.length ? Math.round((list.filter((n) => n.status === "work").length / list.length) * 100) : 0,
      cams: (b.v.charCodeAt(0) % 9) * 4 + 3,
    }
  })
  const pct = Math.round((work / nodes.length) * 100)
  const minute = useNow()
  const now = minute ? new Date(minute * 60000) : null
  const today = now?.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }) ?? ""
  const time = now?.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) ?? ""

  const kpis: [LucideIcon, string, string, string, string, number[]][] = [
    [RadioTower, "Узлы связи", fmt(nodes.length), "+9 за месяц", "#4f8dff", series(1300, nodes.length, 1)],
    [Server, "Оборудование", fmt(6214), "+48 за месяц", "#22d3ee", series(5900, 6214, 2)],
    [Cable, "ВОЛС", "41 820 км", "+120 км", "#a78bfa", series(39000, 41820, 3)],
    [Users, "Потенц. клиенты", "43 080", "662 подключено", "#2bd463", series(39000, 43080, 4)],
    [CircleAlert, "Требуют внимания", "74", "−12 за неделю", "#ff5257", series(98, 74, 5)],
  ]

  return (
    <div className="relative isolate">
      <section className="relative -mt-[96px] overflow-hidden px-(--page-gutter) pt-[150px] pb-10">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-[position:70%_40%] opacity-90 [mask-image:linear-gradient(90deg,transparent_25%,#000_65%)]"
          style={{ backgroundImage: "url(/home/hero.jpg)" }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(180deg,transparent,var(--background))]" />
        <p className="flex items-center gap-2 text-sm text-[var(--link)] first-letter:uppercase">
          <Sun className="size-4" />
          {now ? `${today} · Астана ${time}` : "\u00a0"}
        </p>
        <h1 className="mt-2 text-[56px] leading-[1.05] font-semibold tracking-[-1.4px] max-sm:text-[34px]">
          {now ? greet(now.getHours()) : "Здравствуйте"}, {CURRENT_USER.name.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-[640px] text-[15px] text-[var(--nav-text)]">
          За сутки: 2 новых узла, 3 заявки на подключение и 1 ошибка импорта. В сети {fmt(work)} узлов работают штатно.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {/* TODO: ⌘N — создание узла из любой страницы */}
          <Link href="/nodes?create=1" className={btn({ primary: true })}>
            <Plus />
            Создать узел
          </Link>
          <Link href="/map" className={btn()}>
            <MapIcon />
            Карта сети
          </Link>
          <Link href="/excel-import" className={btn()}>
            <Upload />
            Импорт Excel
          </Link>
          <Link href="/summary-files" className={btn()}>
            <ChartColumn />
            Сводный отчёт
          </Link>
        </div>
      </section>

      <div className="flex flex-col gap-[18px] px-(--page-gutter)">
        <div className="grid grid-cols-5 gap-[18px] max-[1500px]:grid-cols-3 max-sm:grid-cols-2">
          {kpis.map(([I, t, v, d, c, data]) => (
            <div key={t} className={cn(glass, "px-5 pt-[18px] pb-3")}>
              <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <I className="size-4" />
                {t}
              </span>
              <b
                className={cn(
                  "mt-2 block text-[34px] leading-none font-medium tracking-[-0.02em] tabular-nums",
                  c === "#ff5257" && "text-[#ff5257]",
                )}
              >
                {v}
              </b>
              <span className="mt-1.5 block text-xs" style={{ color: c === "#ff5257" ? "#ff5257" : "var(--status-ok)" }}>
                {d}
              </span>
              <Spark data={data} color={c} />
            </div>
          ))}
        </div>

        <Card
          icon={LayoutGrid}
          title="Разделы"
          action={
            <Link href="/nodes" className={btn({ sm: true })}>
              <ArrowRight />
              Все разделы
            </Link>
          }
        >
          <div className="grid grid-cols-6 gap-3 max-[1500px]:grid-cols-4 max-sm:grid-cols-2">
            {SECTIONS.map(([t, href, I, n]) => (
              <Link
                key={t}
                href={href}
                className="group rounded-2xl border border-border bg-[var(--chip-bg)] p-4 transition-colors hover:border-[#085eff]"
              >
                <I className="size-5 text-[var(--link)]" />
                <b className="mt-6 block text-sm font-semibold">{t}</b>
                <span className="text-xs text-muted-foreground">{n}</span>
              </Link>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-[1fr_1fr_0.8fr] gap-[18px] max-[1279px]:grid-cols-1">
          <Card
            icon={SquareCheck}
            title="Мои задачи"
            count={TASKS.length}
            action={
              <Link href="/notifications" className={btn({ sm: true })}>
                <ArrowRight />
                Все
              </Link>
            }
          >
            <div className="flex flex-col gap-2">
              {TASKS.map((x) => (
                <Link
                  key={x.t}
                  href={x.href}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-[var(--chip-bg)] px-3.5 py-3 hover:border-[#085eff]"
                >
                  <span
                    className="grid size-9 flex-none place-items-center rounded-xl"
                    style={{ color: x.color, background: `color-mix(in srgb, ${x.color} 14%, transparent)` }}
                  >
                    <x.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[13.5px] font-semibold">{x.t}</b>
                    <span className="block truncate text-xs text-muted-foreground">{x.s}</span>
                  </span>
                  {typeof x.action === "string" ? <span className={btn({ sm: true })}>{x.action}</span> : x.action}
                </Link>
              ))}
            </div>
          </Card>
          <Card icon={CircleAlert} title="Требуют внимания" count={74}>
            {(
              [
                [Server, "Загрузка портов > 90%", "коммутаторы · 9 филиалов", hot, "/switches"],
                [VideoOff, "Камеры offline", "нет сигнала > 1 ч", 22, "/map"],
                [DatabaseBackup, "Бэкап конфига с ошибкой", "сегодня 03:00", 16, "/backups"],
                [FileText, "Узлы без документов", "ни одного файла", nodes.filter((n) => !n.hasDocs).length, "/nodes"],
                [MapPin, "Не нанесены на карту", "нет координат", noMap, "/nodes"],
              ] as const
            ).map(([I, t, s, n, href]) => (
              <Link key={t} href={href} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                <span className="grid size-9 place-items-center rounded-xl bg-[var(--chip-bg)] text-[var(--link)]">
                  <I className="size-4" />
                </span>
                <span className="flex-1">
                  <b className="block text-[13.5px] font-semibold">{t}</b>
                  <span className="text-xs text-muted-foreground">{s}</span>
                </span>
                <b className="text-lg font-medium tabular-nums">{fmt(n)}</b>
                <span className={cn(circ, "size-8")}>
                  <ArrowUpRight />
                </span>
              </Link>
            ))}
          </Card>
          <Card icon={Activity} title="Статус узлов">
            <div className="flex flex-col items-center py-4">
              <div
                className="relative size-[170px] rounded-full"
                style={{
                  background: `conic-gradient(var(--status-ok) 0 ${pct}%, #ffc24a ${pct}% ${pct + (rebuild / nodes.length) * 100}%, #ff5257 0 100%)`,
                }}
              >
                <div className="absolute inset-[18px] grid place-items-center rounded-full bg-[var(--glass-card-solid)] text-center">
                  <span>
                    <b className="block text-[34px] leading-none font-medium">{pct}%</b>
                    <span className="text-xs text-muted-foreground">в работе</span>
                  </span>
                </div>
              </div>
              <span className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>● В работе {fmt(work)}</span>
                <span>● Реконстр. {rebuild}</span>
                <span>● Выведены {off}</span>
              </span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-[18px] max-[1279px]:grid-cols-1">
          <Card
            icon={Activity}
            title="Рост сети за 12 месяцев"
            action={
              <span className="flex gap-1 rounded-full border border-border bg-[var(--chip-bg)] p-1">
                {(
                  [
                    ["nodes", "Узлы"],
                    ["eq", "Оборудование"],
                    ["vols", "ВОЛС"],
                  ] as const
                ).map(([k, t]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setGrowth(k)}
                    className={cn(
                      "h-8 rounded-full px-3 text-[13px] text-[var(--nav-text)]",
                      growth === k && "bg-[#085eff] font-semibold text-white",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </span>
            }
          >
            <LineChart data={growthData} labels={months} unit={growth === "nodes" ? "узлов" : growth === "eq" ? "устройств" : "км"} />
          </Card>
          <Card
            icon={ChartColumn}
            title="Заполненность данных"
            action={
              <Link href="/analytics" className={btn({ sm: true })}>
                <ArrowRight />
                Аналитика
              </Link>
            }
          >
            {(
              [
                ["Узлы связи", 99, "#2bd463"],
                ["СПД коммутаторы", 87, "#4f8dff"],
                ["СПД маршрутизаторы", 91, "#2bd463"],
                ["ВОЛС", 76, "#4f8dff"],
                ["АТС", 68, "#ffc24a"],
                ["АМС", 82, "#4f8dff"],
                ["ИБП", 54, "#ffc24a"],
              ] as const
            ).map(([t, v, c]) => (
              <div key={t} className="flex items-center gap-4 py-1.5 text-[13px]">
                <span className="w-[150px] text-muted-foreground">{t}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                  <i className="block h-full rounded-full" style={{ width: `${v}%`, background: c }} />
                </span>
                <b className="w-10 text-right font-medium tabular-nums">{v}%</b>
              </div>
            ))}
          </Card>
        </div>

        <div className="grid grid-cols-[1.3fr_1fr] gap-[18px] max-[1279px]:grid-cols-1">
          <Card
            icon={FileChartColumn}
            title="Филиалы"
            count={BRANCHES.length}
            action={
              <Link href="/map" className={btn({ sm: true })}>
                <MapIcon />
                На карте
              </Link>
            }
          >
            <table className="w-full border-separate border-spacing-y-1.5 text-[13.5px]">
              <thead>
                <tr className="text-left text-[12.5px] text-muted-foreground">
                  {["Филиал", "Город", "Узлов", "В работе", "Камер", ""].map((h) => (
                    <th key={h} className="px-3 py-1 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.v}>
                    {[
                      <b key="b">{b.v}</b>,
                      b.cities[0][0],
                      b.n,
                      <span key="w" className="flex items-center gap-2">
                        <span className="h-1 w-16 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                          <i className="block h-full bg-[var(--status-ok)]" style={{ width: `${b.work}%` }} />
                        </span>
                        {b.work}%
                      </span>,
                      b.cams,
                      <Link key="l" href={`/nodes?branch=${b.v}`} className={cn(circ, "size-8")} aria-label={`Узлы ${b.v}`}>
                        <ArrowUpRight />
                      </Link>,
                    ].map((c, i) => (
                      <td
                        key={i}
                        className="bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-3 py-2.5 first:rounded-l-xl last:rounded-r-xl"
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="flex flex-col gap-[18px]">
            <Card icon={Bookmark} title="Избранное" count={8}>
              {/* TODO: избранное пользователя — API профиля */}
              <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
                {(
                  [
                    [RadioTower, "url002.01.UF", "УС «Уральск Центральный»", "/nodes/1"],
                    [Network, sw[0].host, sw[0].model, `/switches/${sw[0].id}`],
                    [Router, rt[0].host, rt[0].model, `/routers/${rt[0].id}`],
                    [Cable, "ВОЛС №49", "→ УС «РТПЦ»", "/fiber-lines"],
                    [RadioTower, "alm001.01.YF", "ул. Маметовой 67Б", "/nodes/2"],
                    [Camera, "CAM-01", "Вход КСО", "/map"],
                    [Globe, "IP-план АС", "10.40.0.0/16", "/ip-plan"],
                    [ChartColumn, "Сводный отчёт", "октябрь", "/summary-files"],
                  ] as const
                ).map(([I, t, s, href]) => (
                  <Link
                    key={t}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-border bg-[var(--chip-bg)] px-3 py-2.5 hover:border-[#085eff]"
                  >
                    <I className="size-4 flex-none text-[var(--link)]" />
                    <span className="min-w-0">
                      <b className="block truncate text-[13px] font-semibold">{t}</b>
                      <span className="block truncate text-[11.5px] text-muted-foreground">{s}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
            <Card icon={History} title="Недавние изменения">
              <ol className="relative ml-1.5 border-l border-border pl-5">
                {[
                  ["Создан узел ast021.01.AS", "Борис Б. Дегтярь · 2 часа назад", "#4f8dff"],
                  ["Привязана ВОЛС №52", "Нурдаулет С. Осербай · 4 часа назад", "#2bd463"],
                  ["Изменён тип сети у url002.01.UF", "Вы · вчера", "#4f8dff"],
                ].map(([t, s, c]) => (
                  <li key={t} className="relative pb-3.5 last:pb-0">
                    <i
                      className="absolute top-1 -left-[27px] size-3 rounded-full border-2 bg-[var(--glass-card-solid)]"
                      style={{ borderColor: c }}
                    />
                    <b className="block text-[13.5px] font-semibold">{t}</b>
                    <span className="text-xs text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-[18px] max-[1279px]:grid-cols-1">
          <Card
            icon={MapIcon}
            title="Мой филиал · АС"
            action={
              <Link href="/map" className={btn({ sm: true })}>
                <ArrowRight />
                Открыть карту
              </Link>
            }
          >
            <Link
              href="/map"
              className="relative block h-[260px] overflow-hidden rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: "url(/home/branch-map.jpg)" }}
            >
              <span className="absolute bottom-3 left-3 rounded-xl bg-[rgba(10,11,14,0.75)] px-3 py-2 text-white backdrop-blur">
                <span className="block text-[11px] opacity-70">Филиал Астана</span>
                <b className="text-sm">{branches.find((b) => b.v === "АС")?.n} узлов · 32 камеры</b>
              </span>
            </Link>
          </Card>
          <Card
            icon={ClipboardList}
            title="Заявки"
            count={12}
            action={
              <Link href="/requests" className={btn({ sm: true })}>
                <ArrowRight />
                Реестр
              </Link>
            }
          >
            {REQUESTS.map(([t, s, st, tone]) => (
              <Link key={t} href="/requests" className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                <ClipboardList className="size-4 flex-none text-[var(--link)]" />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13px] font-semibold">{t}</b>
                  <span className="block truncate text-xs text-muted-foreground">{s}</span>
                </span>
                <Pill tone={tone} className="[&>i]:hidden">
                  {st}
                </Pill>
              </Link>
            ))}
          </Card>
          <Card icon={Users} title="Сейчас в системе" count={14}>
            {/* TODO: присутствие пользователей — websocket */}
            <div className="flex">
              {[
                ["БД", "#0ea5e9"],
                ["НО", "#a855f7"],
                ["ЕС", "#22c55e"],
                ["АГ", "#085eff"],
                ["МК", "#ec4899"],
                ["ДТ", "#f59e0b"],
              ].map(([i, c]) => (
                <Avatar
                  key={i}
                  initials={i}
                  color={c}
                  className="-ml-1.5 size-8 text-[11px] ring-2 ring-[var(--glass-card-solid)] first:ml-0"
                />
              ))}
              <span className="-ml-1.5 grid size-8 place-items-center rounded-full bg-[var(--chip-bg)] text-[11px] ring-2 ring-[var(--glass-card-solid)]">
                +8
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3 text-[13px]">
              <span>
                <b className="block">Борис Д. редактирует</b>
                <span className="text-xs text-muted-foreground">ast021.01.AS · сейчас</span>
              </span>
              <span>
                <b className="block">Нурдаулет О. на карте</b>
                <span className="text-xs text-muted-foreground">ВОЛС №52 · 3 мин</span>
              </span>
            </div>
          </Card>
        </div>

        <Card
          icon={Camera}
          title={
            <>
              Камеры <em className="font-normal text-muted-foreground not-italic">164 online</em>
            </>
          }
          action={
            // TODO: видеостена и потоки камер (cam-03) — источник видео
            <Link href="/map?layer=cameras" className={btn({ sm: true })}>
              <LayoutGrid />
              Видеостена
            </Link>
          }
        >
          <div className="grid grid-cols-6 gap-3 max-[1279px]:grid-cols-3 max-sm:grid-cols-2">
            {[
              ["CAM-01 · ast009", "/nodes/g-1.jpg"],
              ["CAM-03 · ast009", "/nodes/g-4.jpg"],
              ["CAM-05 · ast009", "/nodes/g-2.jpg"],
              ["CAM-02 · УС-8", "/nodes/g-5.jpg"],
              ["CAM-11 · КСО-14", "/nodes/g-6.jpg"],
              ["CAM-04 · ast011", "/nodes/g-3.jpg"],
            ].map(([t, src]) => (
              <span
                key={t}
                className="relative h-[150px] overflow-hidden rounded-2xl bg-cover bg-center"
                style={{ backgroundImage: `url(${src})` }}
              >
                <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,0.75))]" />
                <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-[#ff3b30] px-2 py-0.5 text-[10px] font-bold text-white">
                  ● LIVE
                </span>
                <b className="absolute bottom-2.5 left-3 text-[13px] text-white">{t}</b>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function LineChart({ data, labels, unit }: { data: number[]; labels: string[]; unit: string }) {
  const W = 600
  const H = 200
  const min = Math.min(...data) * 0.98
  const max = Math.max(...data) * 1.01
  const pts = data.map((v, i) => [24 + (i / (data.length - 1)) * (W - 48), H - 24 - ((v - min) / (max - min)) * (H - 56)])
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
  const last = pts[pts.length - 1]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-[220px] w-full"
      aria-label={`Рост: ${fmt(Math.round(data[data.length - 1]))} ${unit}`}
    >
      <defs>
        <linearGradient id="home-growth" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#085eff" stopOpacity={0.35} />
          <stop offset="1" stopColor="#085eff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d} L${last[0]} ${H - 24} L${pts[0][0]} ${H - 24}Z`} fill="url(#home-growth)" />
      <path d={d} fill="none" stroke="#4f8dff" strokeWidth={2.5} />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill="#0b0c10" stroke="#4f8dff" strokeWidth={2} />
      ))}
      <g transform={`translate(${last[0] - 70} ${last[1] - 34})`}>
        <rect width={84} height={22} rx={8} fill="var(--glass-card-solid)" stroke="var(--border)" />
        <text x={42} y={15} textAnchor="middle" fontSize={11} fill="currentColor">
          {fmt(Math.round(data[data.length - 1]))} {unit}
        </text>
      </g>
      {labels.map((l, i) => (
        <text key={l} x={pts[i][0]} y={H - 4} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
          {l}
        </text>
      ))}
    </svg>
  )
}
