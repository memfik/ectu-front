import { ChartColumn, Download, Plus, RadioTower, Upload } from "lucide-react"
import { Bar, Pill, Tag } from "@/components/list/ui"
import { BRANCHES, nodeRows, opsLabel, OBJECT_TYPES, REGION, STATUS_LABEL, type NodeRow } from "@/data/nodes"
import { fmt, plural } from "@/lib/list/query"
import type { ListConfig, Tone } from "@/lib/list/types"

const TECH = ["FTTH", "FTTB", "GPON", "xDSL", "Ethernet", "РРЛ", "Wi-Fi", "LTE"].map((v) => ({ v, label: v }))
const TONE: Record<NodeRow["status"], Tone> = { work: "ok", rebuild: "warn", off: "bad" }
const OWN = { own: "Собственный", rent: "Аренда" }
const pct = (a: number, b: number) => (b ? Math.floor((a / b) * 100) : 0)

/** Узлы связи (макет 02). */
export const nodesList: ListConfig<NodeRow> = {
  key: "nodes",
  title: "Узлы связи",
  crumb: "Сеть",
  sub: "Все узлы связи QMobile по филиалам · обновлено сегодня в 06:30",
  hero: "/nodes/hero.jpg",
  icon: RadioTower,
  search: "Поиск по ID, адресу, объекту…",
  buttons: [
    { icon: ChartColumn, label: "Сводный отчёт", href: "/summary-files?section=nodes" },
    { icon: Download, label: "Отчёт", onClick: "export" },
    { icon: Upload, label: "Импорт Excel", onClick: "import" },
    { icon: Plus, label: "Создать узел", primary: true, onClick: "create" },
  ],
  rows: nodeRows,
  text: (x) => `${x.code} ${x.object} ${x.address} ${x.city}`,
  name: (x) => x.code,
  kpis: (rows) => {
    const n = rows.length
    const by = (s: NodeRow["status"]) => rows.filter((x) => x.status === s).length
    // TODO: портовая ёмкость (spd_equipment_ports) и ёмкость волокон (трассы ВОЛС) — из API; сейчас цифры макета
    const noDocs = rows.filter((x) => !x.hasDocs).length
    return [
      { t: "В работе", color: "var(--status-ok)", value: fmt(by("work")), note: `${pct(by("work"), n)}%`, pct: pct(by("work"), n) },
      {
        t: "На реконструкции",
        color: "var(--status-nolink)",
        value: fmt(by("rebuild")),
        note: `${pct(by("rebuild"), n)}%`,
        pct: pct(by("rebuild"), n),
      },
      { t: "Выведены", color: "var(--status-alarm)", value: fmt(by("off")), note: `${pct(by("off"), n)}%`, pct: pct(by("off"), n) },
      { t: "Портовая ёмкость", color: "#a78bfa", value: "100%", note: "568 / 569", pct: 100 },
      { t: "Ёмкость волокон", color: "#22d3ee", value: "98%", note: "370 / 379", pct: 98 },
      { t: "Без документов", color: "#085eff", value: fmt(noDocs), note: `${pct(noDocs, n)}%`, pct: pct(noDocs, n) },
    ]
  },
  unit: ["узел", "узла", "узлов"],
  noun: ["узел связи", "узла связи", "узлов связи"],
  remove: {
    warning: "Связанные ВОЛС, оборудование и ID-каналы останутся, но потеряют привязку к узлу.",
    reasons: ["Демонтаж", "Дубликат записи", "Ошибка ввода", "Передано другому филиалу", "Списание"],
  },
  // TODO: адрес короткой ссылки — от бэкенда
  qr: (x) => ({ title: x.code, sub: `${x.object} · ${x.address}`, url: `https://estu.qmobile.kz/q/${x.code}` }),
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
    {
      k: "region",
      t: "Регион",
      any: "Все регионы",
      more: true,
      get: (x) => x.region,
      opts: [...new Set(Object.values(REGION))].sort().map((v) => ({ v, label: v })),
    },
    { k: "objectType", t: "Объект", any: "Все объекты", more: true, get: (x) => x.objectType, opts: OBJECT_TYPES.map((v) => ({ v, label: v })) },
    { k: "network", t: "Тип сети", any: "Любой", get: (x) => x.network, opts: ["ГМС", "ГРС", "ГАС", "МС"].map((v) => ({ v, label: v })) },
    {
      k: "ownership",
      t: "Форма владения",
      any: "Любая",
      get: (x) => x.ownership,
      opts: [
        { v: "own", label: "Собственный" },
        { v: "rent", label: "Аренда" },
      ],
    },
    {
      k: "status",
      t: "Статус",
      any: "Любой",
      get: (x) => x.status,
      opts: (["work", "rebuild", "off"] as const).map((v) => ({ v, label: STATUS_LABEL[v] })),
    },
    { k: "tech", t: "Технология", any: "Любая", more: true, get: (x) => x.tech, opts: ["FTTH", "FTTB", "xDSL", "РРЛ"].map((v) => ({ v, label: v })) },
    { k: "onMap", t: "Занесена на карту", ui: "flag", more: true, get: (x) => (x.onMap ? "1" : "0"), opts: [{ v: "1", label: "Да" }] },
    { k: "noDocs", t: "Без документов", ui: "flag", more: true, get: (x) => (x.hasDocs ? "0" : "1"), opts: [{ v: "1", label: "Да" }] },
  ],
  sort: ["", 1],
  cols: [
    {
      k: "code",
      t: "Узел",
      value: (x) => x.code,
      render: (x) => (
        <span className="flex items-center gap-3">
          <span className="grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)]">
            <RadioTower className="size-[17px]" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <b className="block font-semibold">{x.code}</b>
            <span className="block max-w-[200px] truncate text-xs text-muted-foreground">{x.object}</span>
          </span>
        </span>
      ),
    },
    { k: "branch", t: "Филиал", value: (x) => x.branch, render: (x) => x.branch },
    { k: "city", t: "Населённый пункт", value: (x) => x.city, render: (x) => x.city },
    { k: "network", t: "Тип сети", value: (x) => x.network, render: (x) => x.network },
    { k: "ownership", t: "Владение", value: (x) => OWN[x.ownership], render: (x) => (x.ownership === "own" ? "Собств." : "Аренда") },
    {
      k: "tech",
      t: "Технологии",
      noSort: true,
      value: (x) => x.tech.join(", "),
      render: (x) => (
        <span className="flex gap-1.5">
          {x.tech.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </span>
      ),
    },
    {
      k: "fibers",
      t: "Волокна",
      num: true,
      value: (x) => (x.fibers ? x.fibers[0] / x.fibers[1] : null),
      render: (x) =>
        x.fibers ? (
          <span className="flex items-center gap-2">
            <Bar pct={pct(x.fibers[0], x.fibers[1])} className="h-[5px] w-[70px]" />
            {x.fibers[0]}/{x.fibers[1]}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      k: "status",
      t: "Статус",
      value: (x) => STATUS_LABEL[x.status],
      render: (x) => <Pill tone={TONE[x.status]}>{STATUS_LABEL[x.status]}</Pill>,
    },
  ],
  card: (x) => ({
    photo: `/nodes/photo-${((x.id - 1) % 5) + 1}.jpg`,
    status: { label: STATUS_LABEL[x.status], tone: TONE[x.status] },
    title: x.code,
    sub: `${x.object} · ${x.city}`,
    tags: x.tech,
    bar: { t: "Волокна", v: x.fibers ? `${x.fibers[0]}/${x.fibers[1]}` : "0/—", pct: x.fibers ? pct(x.fibers[0], x.fibers[1]) : 0 },
    open: "Паспорт",
  }),
  report: {
    date: (x) => x.updated,
    cols: [
      { k: "branch", t: "Филиал", value: (x) => x.branch },
      { k: "num", t: "Порядковый №", value: (x) => x.num },
      { k: "code", t: "ID узла связи", value: (x) => x.code },
      { k: "city", t: "Населённый пункт", value: (x) => x.city },
      { k: "address", t: "Адрес", value: (x) => x.address },
      { k: "object", t: "Объект", value: (x) => x.object },
      { k: "network", t: "Тип сети", value: (x) => x.network },
      { k: "ownership", t: "Форма владения", value: (x) => OWN[x.ownership] },
      { k: "opsGroup", t: "Группа эксплуатации", value: (x) => x.opsGroup },
      { k: "opsKm", t: "Удалённость от ГЭ", value: (x) => x.opsKm },
      { k: "tech", t: "Технологии", value: (x) => [...new Set([...x.techNode, ...x.tech])].join(", "), off: true },
      { k: "comment", t: "Комментарий", value: (x) => x.comment, off: true },
    ],
  },
  form: {
    create: {
      title: "Новый узел связи",
      sub: "Поля со * обязательны · координаты укажете на карте после создания",
      submit: "Создать узел",
    },
    updated: (x) => x.updated,
    touch: (x) => ({ ...x, updated: new Date().toLocaleDateString("ru-RU") }),
    blank: (id) => ({
      id,
      code: "",
      object: "",
      address: "",
      branch: "",
      city: "",
      // пустые — в форме «Выберите тип сети / статус»
      network: "" as NodeRow["network"],
      ownership: "own",
      tech: [],
      techNode: [],
      fibers: null,
      status: "" as NodeRow["status"],
      num: 0,
      opsGroup: "",
      opsKm: 0,
      opsPlace: "",
      comment: "",
      updated: "",
      equipment: 0,
      idChannels: 0,
      clients: 0,
      onMap: false,
      hasDocs: false,
      ll: [51.1282, 71.4304],
      region: "",
      objectType: OBJECT_TYPES[0],
    }),
    fields: [
      {
        k: "branch",
        t: "Филиал",
        section: "Основное",
        type: "select",
        half: true,
        required: true,
        placeholder: "Выберите филиал",
        opts: BRANCHES.map((b) => ({ v: b.v, label: b.full })),
        get: (x) => x.branch,
        set: (x, v) => ({ ...x, branch: String(v) }),
      },
      {
        k: "num",
        t: "Нумерация",
        section: "Основное",
        type: "number",
        half: true,
        required: true,
        placeholder: "Например: 12",
        get: (x) => (x.num ? String(x.num) : ""),
        set: (x, v) => ({ ...x, num: Number(v) || 0 }),
      },
      {
        k: "code",
        t: "Идентификатор (ID) узла связи",
        section: "Основное",
        type: "text",
        required: true,
        placeholder: "Например: url002.01.UF",
        hint: "формат: город+№.№.филиал",
        check: (v) => (/^[a-z]{2,4}\d{3}\.\d{2}\.[A-Z]{2}$|^sw\d+\.[a-z]{3}\d{3}$/.test(String(v)) ? undefined : "Формат: url002.01.UF"),
        get: (x) => x.code,
        set: (x, v) => ({ ...x, code: String(v).trim() }),
      },
      {
        k: "object",
        t: "Наименование объекта связи",
        section: "Основное",
        type: "text",
        required: true,
        placeholder: "Например: УС «Уральск Центральный»",
        get: (x) => x.object,
        set: (x, v) => ({ ...x, object: String(v) }),
      },
      {
        k: "city",
        t: "Населённый пункт узла связи",
        section: "Основное",
        type: "text",
        half: true,
        required: true,
        placeholder: "Город / село",
        get: (x) => x.city,
        set: (x, v) => ({ ...x, city: String(v), region: REGION[String(v)] ?? x.region }),
      },
      {
        k: "address",
        t: "Адрес",
        section: "Основное",
        type: "text",
        half: true,
        placeholder: "Улица, дом",
        get: (x) => x.address.replace(/^(г\.|с\.) [^,]+, /, ""),
        set: (x, v) => ({ ...x, address: `г. ${x.city}, ${v}` }),
      },
      {
        k: "network",
        t: "Тип сети",
        section: "Основное",
        type: "select",
        half: true,
        required: true,
        placeholder: "Выберите тип сети",
        opts: ["ГМС", "ГРС", "ГАС", "МС"].map((v) => ({ v, label: v })),
        get: (x) => x.network,
        set: (x, v) => ({ ...x, network: v as NodeRow["network"] }),
      },
      {
        k: "ownership",
        t: "Форма владения",
        section: "Основное",
        type: "select",
        half: true,
        placeholder: "Выберите",
        opts: [
          { v: "own", label: "Собственный" },
          { v: "rent", label: "Аренда" },
        ],
        get: (x) => x.ownership,
        set: (x, v) => ({ ...x, ownership: v as NodeRow["ownership"] }),
      },
      {
        k: "status",
        t: "Статус",
        section: "Основное",
        type: "select",
        required: true,
        placeholder: "Выберите статус",
        opts: (["work", "rebuild", "off"] as const).map((v) => ({ v, label: STATUS_LABEL[v] })),
        tone: (v) => TONE[v as NodeRow["status"]],
        get: (x) => x.status,
        set: (x, v) => ({ ...x, status: v as NodeRow["status"] }),
      },
      {
        k: "opsGroup",
        t: "Группа эксплуатации",
        section: "Эксплуатация",
        type: "text",
        half: true,
        placeholder: "Например: ЦТ",
        get: (x) => x.opsGroup,
        set: (x, v) => ({ ...x, opsGroup: String(v) }),
      },
      {
        k: "opsKm",
        t: "Удалённость УС от ГЭ, км",
        section: "Эксплуатация",
        type: "number",
        half: true,
        placeholder: "0,0",
        get: (x) => (x.opsKm || x.opsGroup ? String(x.opsKm).replace(".", ",") : ""),
        set: (x, v) => ({ ...x, opsKm: Number(String(v).replace(",", ".")) || 0 }),
      },
      {
        k: "opsPlace",
        t: "Место расположения ГЭ",
        section: "Эксплуатация",
        type: "text",
        placeholder: "Адрес группы эксплуатации",
        get: (x) => x.opsPlace,
        set: (x, v) => ({ ...x, opsPlace: String(v) }),
      },
      {
        k: "techNode",
        t: "Технологии подключения УС / ТП",
        section: "Технологии",
        type: "tags",
        opts: TECH,
        get: (x) => x.techNode,
        set: (x, v) => ({ ...x, techNode: v as string[] }),
      },
      {
        k: "tech",
        t: "Технологии подключения клиентов в ТП",
        section: "Технологии",
        type: "tags",
        opts: TECH,
        get: (x) => x.tech,
        set: (x, v) => ({ ...x, tech: v as string[] }),
      },
      {
        k: "comment",
        t: "Комментарий",
        section: "Технологии",
        type: "textarea",
        placeholder: "Необязательно",
        get: (x) => x.comment,
        set: (x, v) => ({ ...x, comment: String(v) }),
      },
    ],
  },
  map: (x) =>
    x.onMap
      ? {
          ll: x.ll,
          title: x.code,
          sub: x.object,
          tone: TONE[x.status],
          note: `${x.object}${x.fibers ? ` · ${x.fibers[1]} ${plural(x.fibers[1], ["волокно", "волокна", "волокон"])}` : ""}`,
        }
      : null,
  preview: (x) => ({
    photo: "/nodes/tower.jpg",
    status: { label: STATUS_LABEL[x.status], tone: TONE[x.status] },
    title: x.code,
    sub: x.object === x.address.replace(/^[^,]+, /, "") ? x.address : `${x.object} · ${x.address}`,
    facts: [
      { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.label ?? x.branch },
      { t: "Тип сети", v: x.network },
      { t: "Форма владения", v: OWN[x.ownership] },
      { t: "Группа эксплуатации", v: opsLabel(x) },
    ],
    stats: [
      { t: "Волокон", v: x.fibers?.[1] ?? "—" },
      { t: "Оборуд.", v: x.equipment },
      { t: "ID-кан.", v: x.idChannels },
      { t: "Клиенты", v: x.clients },
    ],
    tags: x.tech,
    more: "Подробнее об узле",
  }),
}
