import { Download, FileSpreadsheet, Network, Plus, Router, Upload } from "lucide-react"
import { Bar } from "@/components/list/ui"
import { BRANCHES, nodeRows } from "@/data/nodes"
import { branchFull, portList, spdRows, type SpdRow } from "@/data/spd"
import { fmt } from "@/lib/list/query"
import type { LucideIcon } from "lucide-react"
import type { Column, Field, ListConfig, Tone } from "@/lib/list/types"
import { cn } from "@/lib/utils"

/*
 * Оборудование СПД: коммутаторы (макет 03) и маршрутизаторы (макет 04) — один конфиг на оба вида.
 * Формы — по полям `spd_equipments` (РФ-ДППП-20 / 21).
 */

const STATUS: Record<SpdRow["status"], [string, Tone]> = { work: ["В работе", "ok"], repair: ["Ремонт", "warn"], off: ["Выведен", "bad"] }
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
const loadColor = (p: number) => (p > 90 ? "#ff5257" : p > 75 ? "#ffc24a" : "#085eff")

const text = (k: keyof SpdRow, t: string, section: string, extra: Partial<Field<SpdRow>> = {}): Field<SpdRow> => ({
  k,
  t,
  section,
  type: "text",
  half: true,
  get: (x) => String(x[k] ?? ""),
  set: (x, v) => ({ ...x, [k]: String(v) }),
  ...extra,
})

function fields(kind: SpdRow["kind"]): Field<SpdRow>[] {
  const nodes = nodeRows()
  return [
    {
      k: "branch",
      t: "Филиал",
      section: "Размещение",
      type: "select",
      half: true,
      required: true,
      placeholder: "Выберите филиал",
      opts: BRANCHES.map((b) => ({ v: b.v, label: b.full })),
      get: (x) => x.branch,
      set: (x, v) => ({ ...x, branch: String(v) }),
    },
    {
      k: "nodeId",
      t: "Узел связи",
      section: "Размещение",
      type: "select",
      half: true,
      required: true,
      placeholder: "Начните вводить ID…",
      opts: nodes.map((n) => ({ v: String(n.id), label: `${n.code} · ${n.object}` })),
      get: (x) => (x.nodeId ? String(x.nodeId) : ""),
      set: (x, v) => {
        const n = nodes.find((o) => o.id === Number(v))
        return n ? { ...x, nodeId: n.id, nodeCode: n.code, city: `г. ${n.city}`, address: n.address.replace(/^(г\.|с\.) [^,]+, /, "") } : x
      },
    },
    text("num", "Нумерация", "Размещение", {
      required: true,
      placeholder: "Например: 1",
      type: "number",
      get: (x) => (x.num ? String(x.num) : ""),
      set: (x, v) => ({ ...x, num: Number(v) || 0 }),
    }),
    {
      k: "network",
      t: "Тип сети",
      section: "Размещение",
      type: "select",
      half: true,
      required: true,
      placeholder: "Выберите тип сети",
      opts: ["ГМС", "ГРС", "ГАС", "МС"].map((v) => ({ v, label: v })),
      get: (x) => x.network,
      set: (x, v) => ({ ...x, network: v as SpdRow["network"] }),
    },
    {
      k: "kind",
      t: "Тип оборудования",
      section: "Устройство",
      type: "select",
      half: true,
      required: true,
      opts: [
        { v: "switch", label: "switch" },
        { v: "router", label: "router" },
      ],
      get: (x) => x.kind,
      set: (x, v) => ({ ...x, kind: v as SpdRow["kind"] }),
    },
    text("host", "Hostname", "Устройство", { required: true, placeholder: `Например: ${kind === "switch" ? "sw2.atr2" : "bb1.url2"}` }),
    text("ip", "IP-адрес управления (X.X.X.X/Y)", "Устройство", {
      required: true,
      check: (v) =>
        /^(\d{1,3}\.){3}(\d{1,3}|x)(\/\d{1,2})?$/.test(String(v).trim())
          ? undefined
          : "Неверный формат: нужна маска, например 192.168.1.10/24",
    }),
    text("model", "Модель оборудования", "Устройство", {
      required: true,
      placeholder: `Например: ${kind === "switch" ? "X440-24t" : "CISCO3845"}`,
    }),
    text("os", "Тип ОС / версия прошивки", "Устройство", { placeholder: "Например: IOS-XE 16.9" }),
    text("serial", "Серийный номер S/N", "Устройство", { placeholder: "S/N с шильдика" }),
    ...(
      [
        ["slot", "№ слота"],
        ["board", "Модель платы"],
        ["boardSn", "S/N платы"],
        ["port", "№ порта"],
        ["module", "Тип модуля"],
        ["moduleSn", "S/N модуля"],
      ] as const
    ).map(([k, t]): Field<SpdRow> => ({
      k,
      t,
      section: "Комплектация",
      type: "text",
      third: true,
      placeholder: "—",
      // TODO: комплектация — отдельная таблица в API; пока хранится только в форме
      get: (x) => String((x as unknown as Record<string, string>)[k] ?? ""),
      set: (x, v) => ({ ...x, [k]: String(v) }),
    })),
    text("act" as keyof SpdRow, "Номер и дата Акта о вводе в эксплуатацию", "Ввод и сервис", {
      half: false,
      placeholder: "Например: № 154 от 12.03.2019",
    }),
    text("contract", "Contract Number (SmartNET)", "Ввод и сервис", { placeholder: "Номер контракта" }),
    text("contractEnd" as keyof SpdRow, "Дата завершения", "Ввод и сервис", {
      type: "date",
      placeholder: "Выберите дату",
      check: (v) => (/^\d{2}\.\d{2}\.\d{4}$/.test(String(v)) ? undefined : "Формат дд.мм.гггг"),
    }),
    {
      k: "note",
      t: "Примечание",
      section: "Ввод и сервис",
      type: "text",
      placeholder: "Необязательно",
      get: (x) => String((x as unknown as Record<string, string>).note ?? ""),
      set: (x, v) => ({ ...x, note: String(v) }),
    },
  ]
}

/** Колонки после «Филиала»: у коммутаторов — адрес и порты, у маршрутизаторов — ОС, интерфейсы и BGP (макеты 03, 04). */
function hostCols(Icon: LucideIcon, sw: boolean): Column<SpdRow>[] {
  const all: Column<SpdRow>[] = [
    {
      k: "host",
      t: "Hostname",
      value: (x) => x.host,
      render: (x) => (
        <span className="flex items-center gap-3">
          <span className="grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
            <Icon className="size-[17px]" strokeWidth={1.75} />
          </span>
          <span>
            <b className="block font-semibold text-[var(--link)]">{x.host}</b>
            <span className="block text-xs text-muted-foreground">{x.model}</span>
          </span>
        </span>
      ),
    },
    { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode, render: (x) => x.nodeCode },
    { k: "city", t: "Населённый пункт", value: (x) => x.city, render: (x) => x.city },
    {
      k: "address",
      t: "Адрес узла связи",
      value: (x) => x.address,
      render: (x) => <span className="text-muted-foreground">{x.address}</span>,
    },
    { k: "network", t: "Тип сети", value: (x) => x.network, render: (x) => x.network },
    { k: "ip", t: "IP-адрес", value: (x) => x.ip, render: (x) => <span className="tabular-nums">{x.ip}</span> },
    {
      k: "ports",
      t: "Порты",
      num: true,
      value: (x) => x.portsUsed / x.portsTotal,
      render: (x) => {
        const p = pct(x.portsUsed, x.portsTotal)
        return (
          <span className="flex items-center gap-2.5">
            <Bar pct={p} color={loadColor(p)} className="h-1 w-[60px]" />
            {x.portsUsed}/{x.portsTotal}
          </span>
        )
      },
    },
  ]
  const bgp: Column<SpdRow> = {
    k: "bgp",
    t: "BGP",
    value: (x) => x.bgp[0] / x.bgp[1],
    render: (x) => (
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
          x.bgp[0] < x.bgp[1]
            ? "bg-[rgba(255,159,26,0.14)] text-[var(--status-nolink)]"
            : "bg-[rgba(43,212,99,0.14)] text-[var(--status-ok)]",
        )}
      >
        BGP {x.bgp[0]}/{x.bgp[1]}
      </span>
    ),
  }
  const os: Column<SpdRow> = { k: "os", t: "ОС", value: (x) => x.os, render: (x) => x.os }
  if (sw) return all
  return [
    ...all.filter((c) => ["host", "nodeCode", "city", "ip"].includes(c.k)),
    os,
    { ...all.find((c) => c.k === "ports")!, t: "Интерфейсы" },
    bgp,
  ]
}

export function spdList(kind: SpdRow["kind"]): ListConfig<SpdRow> {
  const sw = kind === "switch"
  const Icon = sw ? Network : Router
  const noun = sw ? "коммутатор" : "маршрутизатор"
  return {
    key: sw ? "switches" : "routers",
    title: sw ? "Коммутаторы" : "Маршрутизаторы",
    crumb: "Оборудование / Системы передачи данных",
    sub: sw ? "РФ-ДППП-20. Форма учёта коммутаторов на сети АО «QMobile»" : "РФ-ДППП-21. Форма учёта маршрутизаторов на сети АО «QMobile»",
    hero: "/equipment/switch-hero.jpg",
    icon: Icon,
    search: sw ? "Hostname, IP, ID УС, S/N…" : "Hostname, IP, подсеть, AS…",
    buttons: [
      { icon: FileSpreadsheet, label: "Сводный файл", href: `/summary-files?section=${sw ? "switches" : "routers"}` },
      { icon: Download, label: "Отчёт", onClick: "export" },
      { icon: Upload, label: "Импорт Excel", onClick: "import" },
      { icon: Plus, label: "Создать", primary: true, onClick: "create" },
    ],
    rows: () => spdRows(kind),
    text: (x) => `${x.host} ${x.ip} ${x.nodeCode} ${x.serial} ${x.model} ${x.city}`,
    name: (x) => x.host,
    unit: sw ? ["коммутатор", "коммутатора", "коммутаторов"] : ["маршрутизатор", "маршрутизатора", "маршрутизаторов"],
    noun: sw ? ["коммутатор", "коммутатора", "коммутаторов"] : ["маршрутизатор", "маршрутизатора", "маршрутизаторов"],
    remove: {
      warning: "Порты, под-оборудование и привязки ID-каналов останутся в истории, но устройство пропадёт из узла связи.",
      reasons: ["Демонтаж", "Замена на новое", "Передано на склад ЗИП", "Дубликат записи", "Ошибка ввода"],
    },
    qr: (x) => ({ title: x.host, sub: `${x.model} · ${x.nodeCode} · ${x.city}`, url: `https://estu.qmobile.kz/q/${x.host}` }),
    kpis: (rows) => {
      const used = rows.reduce((a, x) => a + x.portsUsed, 0)
      const total = rows.reduce((a, x) => a + x.portsTotal, 0)
      const hot = rows.filter((x) => pct(x.portsUsed, x.portsTotal) > 90).length
      const expiring = rows.filter((x) => x.smartnet !== null && x.smartnet <= 90).length
      const noMol = rows.filter((x) => !x.mol).length
      const backup = rows.filter((x) => x.backup).length
      const branches = new Set(rows.map((x) => x.branch)).size
      if (!sw) {
        const bgpDown = rows.filter((x) => x.bgp[0] < x.bgp[1]).length
        return [
          { t: "Всего маршрутизаторов", color: "#085eff", value: fmt(rows.length), note: `в ${branches} филиалах`, pct: 100 },
          {
            t: "Интерфейсы задействованы",
            color: "#a78bfa",
            value: `${pct(used, total)}%`,
            note: `${fmt(used)} / ${fmt(total)}`,
            pct: pct(used, total),
          },
          { t: "BGP не все up", color: "var(--status-alarm)", value: fmt(bgpDown), note: "маршрутизатора", pct: pct(bgpDown, rows.length) },
          {
            t: "SmartNET истекает",
            color: "var(--status-nolink)",
            value: fmt(expiring),
            note: "за 90 дней",
            pct: pct(expiring, rows.length),
          },
          // TODO: подсети из «Единого IP-плана» (15)
          { t: "Подсетей в IP-плане", color: "#22d3ee", value: "5 742", note: "61% занято", pct: 61 },
          {
            t: "С бэкапом конфига",
            color: "var(--status-ok)",
            value: fmt(backup),
            note: `${pct(backup, rows.length)}%`,
            pct: pct(backup, rows.length),
          },
        ]
      }
      return [
        {
          t: `Всего ${sw ? "коммутаторов" : "маршрутизаторов"}`,
          color: "#085eff",
          value: fmt(rows.length),
          note: `в ${branches} филиалах`,
          pct: 100,
        },
        { t: "Портовая ёмкость", color: "#a78bfa", value: `${pct(used, total)}%`, note: `${fmt(total)} портов`, pct: pct(used, total) },
        {
          t: "Загрузка > 90%",
          color: "var(--status-alarm)",
          value: fmt(hot),
          note: noun + (hot % 10 >= 2 && hot % 10 <= 4 ? "а" : "ов"),
          pct: pct(hot, rows.length),
        },
        {
          t: "SmartNET истекает",
          color: "var(--status-nolink)",
          value: fmt(expiring),
          note: "за 90 дней",
          pct: pct(expiring, rows.length),
        },
        { t: "Без МОЛ", color: "#22d3ee", value: fmt(noMol), note: `${pct(noMol, rows.length)}%`, pct: pct(noMol, rows.length) },
        {
          t: "С бэкапом конфига",
          color: "var(--status-ok)",
          value: fmt(backup),
          note: `${pct(backup, rows.length)}%`,
          pct: pct(backup, rows.length),
        },
      ]
    },
    filters: [
      {
        k: "branch",
        t: "Филиал",
        all: "Все филиалы",
        ui: "tags",
        get: (x) => x.branch,
        opts: BRANCHES.map((b) => ({ v: b.v, label: b.label })),
        short: (v) => v,
      },
      { k: "network", t: "Тип сети", any: "Любой", get: (x) => x.network, opts: ["ГМС", "ГРС", "ГАС", "МС"].map((v) => ({ v, label: v })) },
      {
        k: "model",
        t: "Модель",
        any: "Любая",
        get: (x) => x.model,
        opts: [...new Set(spdRows(kind).map((x) => x.model))].sort().map((v) => ({ v, label: v })),
      },
      {
        k: "vendor",
        t: "Производитель",
        any: "Любой",
        more: true,
        get: (x) => x.vendor,
        opts: [...new Set(spdRows(kind).map((x) => x.vendor))].sort().map((v) => ({ v, label: v })),
      },
      {
        k: "status",
        t: "Статус",
        any: "Любой",
        more: true,
        get: (x) => x.status,
        opts: (["work", "repair", "off"] as const).map((v) => ({ v, label: STATUS[v][0] })),
      },
      {
        k: "hot",
        t: "Загрузка портов > 90%",
        ui: "flag",
        more: true,
        get: (x) => (pct(x.portsUsed, x.portsTotal) > 90 ? "1" : "0"),
        opts: [{ v: "1", label: "Да" }],
      },
      {
        k: "smartnet",
        t: "SmartNET истекает за 90 дней",
        ui: "flag",
        more: true,
        get: (x) => (x.smartnet !== null && x.smartnet <= 90 ? "1" : "0"),
        opts: [{ v: "1", label: "Да" }],
      },
      { k: "noMol", t: "Без МОЛ", ui: "flag", more: true, get: (x) => (x.mol ? "0" : "1"), opts: [{ v: "1", label: "Да" }] },
      {
        k: "noBackup",
        t: "Без бэкапа конфига",
        ui: "flag",
        more: true,
        get: (x) => (x.backup ? "0" : "1"),
        opts: [{ v: "1", label: "Да" }],
      },
    ],
    sort: ["", 1],
    cols: [{ k: "branch", t: "Филиал", value: (x) => x.branch, render: (x) => x.branch }, ...hostCols(Icon, sw)],
    card: (x) => ({
      photo: "/equipment/switch.jpg",
      status: { label: STATUS[x.status][0], tone: STATUS[x.status][1] },
      title: x.host,
      sub: `${x.model} · ${x.nodeCode} · ${x.city}`,
      tags: [x.network, x.vendor],
      bar: { t: "Порты", v: `${x.portsUsed}/${x.portsTotal}`, pct: pct(x.portsUsed, x.portsTotal) },
      open: "Паспорт",
    }),
    map: (x) => ({
      ll: x.ll,
      title: x.host,
      sub: `${x.model} · ${x.nodeCode}`,
      tone: STATUS[x.status][1],
      note: `${x.model} · ${x.nodeCode} · ${x.ip}`,
    }),
    preview: (x) => ({
      photo: "/equipment/switch.jpg",
      status: { label: STATUS[x.status][0], tone: STATUS[x.status][1] },
      title: x.host,
      sub: `${x.model} · ${x.ip}`,
      facts: [
        { t: "Филиал", v: branchFull(x.branch).replace(" филиал", "") },
        { t: "Узел связи", v: x.nodeCode },
        { t: "Тип сети", v: x.network },
        { t: "S/N", v: x.serial },
      ],
      stats: [],
      ports: portList(x),
      more: "Паспорт оборудования",
    }),
    form: {
      create: { title: sw ? "Новый коммутатор" : "Новый маршрутизатор", sub: "Поля со * обязательны", submit: "Создать" },
      blank: (id) => ({
        id,
        num: 0,
        kind,
        host: "",
        vendor: "",
        model: "",
        serial: "",
        os: "",
        ip: "",
        branch: "",
        nodeId: 0,
        nodeCode: "",
        city: "",
        address: "",
        ll: [51.1282, 71.4304],
        network: "" as SpdRow["network"],
        status: "work",
        portsUsed: 0,
        portsTotal: sw ? 28 : 8,
        smartnet: null,
        contract: "",
        mol: null,
        backup: false,
        bgp: [0, 0],
        since: new Date().toLocaleDateString("ru-RU"),
      }),
      fields: fields(kind),
    },
    report: {
      date: (x) => x.since,
      cols: [
        { k: "branch", t: "Филиал", value: (x) => x.branch },
        { k: "num", t: "Нумерация", value: (x) => x.num },
        { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
        { k: "city", t: "Населённый пункт", value: (x) => x.city },
        { k: "address", t: "Адрес узла связи", value: (x) => x.address },
        { k: "network", t: "Тип сети", value: (x) => x.network },
        { k: "host", t: "Hostname", value: (x) => x.host },
        { k: "ip", t: "IP-адрес", value: (x) => x.ip },
        { k: "model", t: "Модель", value: (x) => `${x.vendor} ${x.model}` },
        { k: "serial", t: "S/N", value: (x) => x.serial },
        { k: "ports", t: "Порты (занято / всего)", value: (x) => `${x.portsUsed}/${x.portsTotal}` },
        { k: "os", t: "ОС / прошивка", value: (x) => x.os, off: true },
        { k: "smartnet", t: "SmartNET, дней", value: (x) => x.smartnet ?? "—", off: true },
        { k: "mol", t: "МОЛ", value: (x) => x.mol ?? "—", off: true },
      ],
    },
  }
}

export const switchesList = spdList("switch")
export const routersList = spdList("router")
