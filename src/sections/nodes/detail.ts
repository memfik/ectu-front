import type { NodeRow } from "./data"

/*
 * Содержимое паспорта узла (макет 02, экраны p01…t08) — пример данных по таблицам БД ЕСТУ:
 * bols (ВОЛС), spd_equipments / spd_equipment_ports, id-каналы, клиенты рядом, ответственные, документы, комментарии, история.
 * Для url002.01.UF — как в макете, для остальных — сгенерировано от id.
 * TODO: API — GET /api/nodes/pasport?node_id=… и вкладки.
 */

export type Person = {
  initials: string
  name: string
  role: string
  color: string
  synced?: boolean
  /** Телефон в макете скрыт: «+7 701 *** 12 45» */
  phone?: string
  email?: string
  dept?: string
  inv?: string
}
export type FiberLine = {
  id: number
  num: string
  /** Конец трассы: название и ID узла */
  to: string
  toCode: string
  km: number
  /** Способ прокладки */
  way: string
  used: number
  reserve: number
  total: number
  cable: string
  odf: string
  status: "work" | "plan"
  /** Чем заняты волокна: «1–2 · sw1.ast009» */
  usage: { range: string; title: string; sub: string; kind: "equipment" | "id" }[]
}
export type PortState = "up" | "down" | "sfp" | "free"
export type Equipment = {
  id: number
  /** Группа во вкладке: СПД, АТС, Электропитание, Беспроводное, Спутниковое, ЗИП */
  group: "spd" | "pbx" | "power" | "wireless" | "sat" | "spare"
  kind: string
  host: string
  model: string
  vendor: string
  serial: string
  os: string
  ip: string
  photo: string
  ports: { up: number; down: number; free: number }
  /** Порты по порядку: 1…24, затем X1…X4 (SFP) */
  portList: { n: string; state: PortState }[]
  module: { slot: string; port: string; type: string; serial: string }
  status: "ok" | "warn"
}
export type Doc = { id: number; name: string; kind: string; size: string; date: string; ext: "pdf" | "xlsx" | "docx" | "dwg" }
export type Comment = {
  id: number
  author: Person
  /** Коротко для «Обзора» («06.10») и полностью для вкладки */
  when: string
  at: string
  text: string
  pinned?: boolean
  /** Ответ на комментарий id */
  reply?: number
  reactions?: number
}
export type HistoryItem = {
  id: number
  what: string
  who: string
  /** ДД.ММ.ГГГГ и ЧЧ:ММ */
  when: string
  time: string
  kind: "edit" | "file" | "link" | "people" | "delete" | "create"
  /** Было → стало */
  from?: string
  to?: string
  note?: string
}
export type Media = {
  src: string
  /** Длительность видео «0:42»; без неё — фото */
  video?: string
  title: string
  date: string
  /** «4032×3024 · 3.1 МБ» или «1080p» */
  info: string
  author: string
  geo: string
  tags: string[]
  text: string
}

/** Покрытие АМС / БС: секторы антенн. */
export type Coverage = { sectors: number; width: number; km: number; azimuths: number[] }

/** Сотрудник из HR-справочника (поиск при назначении). */
export const STAFF: Person[] = [
  { initials: "БД", name: "Борис Б. Дегтярь", role: "Инженер ЦТ", color: "linear-gradient(135deg,#0ea5e9,#0369a1)", synced: true },
  {
    initials: "НО",
    name: "Нурдаулет С. Осербай",
    role: "Ведущий инженер ГЭ",
    color: "linear-gradient(135deg,#a855f7,#6d28d9)",
    synced: true,
  },
  {
    initials: "АК",
    name: "Айгерим Т. Кенжебаева",
    role: "Кладовщик ЦТ",
    color: "linear-gradient(135deg,#f59e0b,#b45309)",
    synced: true,
    inv: "INV-004812",
  },
  {
    initials: "ЕС",
    name: "Ербол М. Садыков",
    role: "Начальник ГЭ",
    color: "linear-gradient(135deg,#22c55e,#15803d)",
    synced: true,
    inv: "INV-003305",
  },
  {
    initials: "ДЖ",
    name: "Дана Р. Жумабаева",
    role: "Инженер СПД",
    color: "linear-gradient(135deg,#ec4899,#be185d)",
    synced: true,
    inv: "INV-005561",
  },
]

export type NodeDetail = {
  coords: string
  coverage: Coverage
  /** Трассы рядом, которые можно привязать к узлу */
  fiberCandidates: { id: number; num: string; to: string; km: number; way: string; total: number }[]
  /** Материально ответственное лицо */
  mol: Person | null
  scene: { label: string; title: string; x: number; y: number; bar?: number }[]
  capacity: { ports: [number, number]; fibers: [number, number] }
  fibers: FiberLine[]
  equipment: Equipment[]
  idChannels: { id: number; num: string; client: string; speed: string; status: "ok" | "off" }[]
  clients: { total: number; client: number; processed: number; none: number; radius: number }
  /** Потенциальные клиенты рядом (B2B, таблица potential_clients) */
  clientList: {
    id: number
    bin: string
    name: string
    size: string
    m: number
    status: "client" | "processed" | "none"
    ll: [number, number]
  }[]
  /** ID-каналы на соседних узлах — можно привязать к этому */
  nearChannels: { id: string; node: string; kind: string; km: number }[]
  people: Person[]
  /** История назначений ответственных */
  assignments: { name: string; role: string; date: string; by: string; source: "hr" | "import" | "manual" }[]
  /** Разделы документации и отметка «есть на бумаге» */
  docGroups: { kind: string; paper: boolean }[]
  docs: Doc[]
  comments: Comment[]
  history: HistoryItem[]
  media: Media[]
}

const P = {
  bd: {
    initials: "БД",
    name: "Борис Б. Дегтярь",
    role: "Инженер ЦТ",
    color: "linear-gradient(135deg,#0ea5e9,#0369a1)",
    synced: true,
    phone: "+7 701 *** 12 45",
    email: "b.degtyar@qmobile.kz",
    dept: "ЦТ, г. Астана",
    inv: "INV-004471",
  },
  no: {
    initials: "НО",
    name: "Нурдаулет С. Осербай",
    role: "Ведущий инженер ГЭ",
    color: "linear-gradient(135deg,#a855f7,#6d28d9)",
    synced: true,
    phone: "+7 702 *** 88 10",
    email: "n.oserbay@qmobile.kz",
    dept: "ГЭ ЦТ",
    inv: "INV-005120",
  },
  ag: { initials: "АГ", name: "Артем С. Галустьян", role: "ApiServDE", color: "linear-gradient(135deg,#085eff,#001a9f)" },
} satisfies Record<string, Person>

const m = (src: string, title: string, date: string, author: string, tags: string[], text: string, extra: Partial<Media> = {}): Media => ({
  src,
  title,
  date,
  author,
  tags,
  text,
  info: "4032×3024 · 3.1 МБ",
  geo: "51.1669, 71.4361",
  ...extra,
})

/** Галерея узла: 12 фото и 2 видео (как в макете g01, g02). */
const MEDIA: Media[] = [
  m(
    "/nodes/g-1.jpg",
    "АМС — вид снизу",
    "06.10.2026, 11:32",
    "Нурдаулет С. Осербай",
    ["АМС", "Мачта"],
    "Опоры и РРЛ-антенны с южной стороны.",
  ),
  m(
    "/nodes/g-2.jpg",
    "АМС ast009 — общий вид",
    "06.10.2026, 11:40",
    "Нурдаулет С. Осербай",
    ["АМС", "Мачта", "Фасад"],
    "Общий вид антенно-мачтового сооружения с северной стороны. 4 сектора, РРЛ-антенна на 30 м.",
  ),
  m("/nodes/g-3.jpg", "Кросс ODF.mp4", "14.01.2026, 10:05", "Борис Б. Дегтярь", ["ODF", "Кросс"], "Перекоммутация патч-кордов на ODF-1.", {
    video: "1:15",
    info: "1080p",
  }),
  m("/nodes/g-5.jpg", "АМС на закате", "14.01.2026, 17:48", "Борис Б. Дегтярь", ["АМС"], "Вид на мачту с подъездной дороги."),
  m(
    "/nodes/g-4.jpg",
    "Обход стойки СПД.mp4",
    "14.01.2026, 10:12",
    "Борис Б. Дегтярь",
    ["Оборудование", "СПД", "Стойка"],
    "Видеообход стойки после замены SFP-модуля на порту 0/25.",
    { video: "0:42", info: "1080p" },
  ),
  m(
    "/nodes/g-6.jpg",
    "Светоограждение ночью",
    "03.12.2025, 21:15",
    "Нурдаулет С. Осербай",
    ["АМС", "Светоограждение"],
    "Проверка заградительных огней.",
  ),
  ...[1, 2, 3, 5, 6, 1, 2, 5].map((n, i) =>
    m(
      `/nodes/g-${n}.jpg`,
      `Фото объекта ${i + 7}`,
      "03.12.2025, 12:00",
      i % 2 ? "Борис Б. Дегтярь" : "Нурдаулет С. Осербай",
      ["Объект"],
      "Фото с обхода узла.",
    ),
  ),
]

export function nodeDetail(x: NodeRow): NodeDetail {
  const r = (k: number) => ((x.id * 9301 + k * 49297) % 233280) / 233280
  const total = x.fibers?.[1] ?? 0
  const used = x.fibers?.[0] ?? 0
  const media = MEDIA
  return {
    coords: `${x.ll[0].toFixed(6)}, ${x.ll[1].toFixed(6)}`,
    coverage: { sectors: 3, width: 65, km: 2.5, azimuths: [0, 120, 240] },
    fiberCandidates: [
      { id: 52, num: "52", to: "ast011.02.AS", km: 1.9, way: "подвес на опорах", total: 24 },
      { id: 61, num: "61", to: "КСО АТС-14", km: 2.8, way: "кабельная канализация", total: 48 },
      { id: 49, num: "49", to: "УС «РТПЦ»", km: 1.4, way: "кабельная канализация", total: 32 },
    ],
    mol: null,
    scene: [
      { label: "Антенно-мачтовое сооружение", title: "АМС · 40 м · МАР-40", x: 64, y: 12 },
      { label: "Контейнер связи", title: `${x.object} · ${x.ownership === "own" ? "Собственный" : "Аренда"}`, x: 6, y: 40 },
      { label: "Маршрутизатор · bb1.url2", title: "CISCO3845", x: 55, y: 69, bar: 72 },
      { label: "Электропитание", title: "ИБП Delta 60kVa · 40 АБ", x: 14, y: 80 },
      { label: "ВОЛС №8 → УС «РТПЦ»", title: `${used} / ${total || "—"} волокон`, x: 66, y: 76, bar: total ? (used / total) * 100 : 0 },
    ],
    capacity: { ports: [18, 25], fibers: [used, total] },
    fibers: total
      ? [
          {
            id: 49,
            num: "49",
            to: "УС «РТПЦ»",
            toCode: "url001.02.UF",
            km: 1.4,
            way: "кабельная канализация",
            used,
            reserve: 1,
            total,
            cable: `ОКЛ-0,22-${total}`,
            odf: `ODF-1 · порты 1–${total}`,
            status: "work",
            usage: [
              {
                range: used > 2 ? `1–${used - 1}` : "1",
                title: `sw1.${x.code.split(".")[0]}`,
                sub: "Uplink X440-24t-10G",
                kind: "equipment",
              },
              { range: String(used), title: "ID-канал (в процессе)", sub: "FTTB клиент", kind: "id" },
            ],
          },
          ...(r(1) > 0.5
            ? [
                {
                  id: 52,
                  num: "52",
                  to: "УС «Сыганак»",
                  toCode: "ast011.02.AS",
                  km: 1.9,
                  way: "подвес на опорах",
                  used: 4,
                  reserve: 0,
                  total: 16,
                  cable: "ОКЛ-0,22-16",
                  odf: "ODF-2 · порты 1–16",
                  status: "plan" as const,
                  usage: [{ range: "1–4", title: `bb1.${x.code.slice(0, 4)}`, sub: "Магистраль CISCO3845", kind: "equipment" as const }],
                },
              ]
            : []),
        ]
      : [],
    equipment: [
      {
        id: 1,
        group: "spd",
        kind: "Коммутатор",
        host: `sw1.${x.code.split(".")[0]}`,
        model: "X440-24t-10G",
        vendor: "Extreme",
        serial: "1317N-42395",
        os: "EXOS 22.6.1.4",
        ip: "10.13.93.x",
        photo: "/nodes/g-3.jpg",
        ports: { up: 18, down: 2, free: 5 },
        portList: [
          ...Array.from({ length: 24 }, (_, i): { n: string; state: PortState } => ({
            n: String(i + 1),
            state: i === 6 || i === 11 ? "down" : i < 18 ? "up" : "free",
          })),
          ...["X1", "X2", "X3", "X4"].map((n, i): { n: string; state: PortState } => ({ n, state: i < 2 ? "sfp" : "free" })),
        ],
        module: { slot: "—", port: "0/25", type: "1000BaseLX SFP", serial: "AGC1435U4PJ" },
        status: "ok",
      },
      ...(x.equipment > 1
        ? [
            {
              id: 2,
              group: "power" as const,
              kind: "ИБП",
              host: "ИБП Delta 60kVa",
              model: "Delta Ultron DPH 60",
              vendor: "Delta",
              serial: "DPH60-88213",
              os: "—",
              ip: "10.13.95.x",
              photo: "/nodes/g-4.jpg",
              ports: { up: 0, down: 0, free: 0 },
              portList: [],
              module: { slot: "—", port: "—", type: "40 АБ 12 В", serial: "—" },
              status: "ok" as const,
            },
          ]
        : []),
    ],
    idChannels: Array.from({ length: x.idChannels }, (_, i) => ({
      id: i + 1,
      num: `ID-${4100 + x.id * 3 + i}`,
      client: ["ТОО «Каспий Инвест»", "АО «КазМунайГаз»", "ИП Ахметов", "Акимат"][i % 4],
      speed: ["100 Мбит/с", "1 Гбит/с", "50 Мбит/с"][i % 3],
      status: i === 2 ? "off" : "ok",
    })),
    clients: {
      total: x.clients,
      client: Math.round(x.clients * 0.12),
      processed: Math.round(x.clients * 0.2),
      none: x.clients - Math.round(x.clients * 0.12) - Math.round(x.clients * 0.2),
      radius: 250,
    },
    clientList: clientList(x),
    nearChannels: [
      { id: "ID-00412", node: "ast011.02.AS", kind: "L2 · 100M", km: 1.9 },
      { id: "ID-00398", node: "УС «РТПЦ»", kind: "L3 · 1G", km: 1.4 },
      { id: "ID-00377", node: "ast004.01.AS", kind: "L2 · 50M", km: 2.3 },
      { id: "ID-00351", node: "КСО АТС-14", kind: "L3 · 200M", km: 2.8 },
    ],
    people: [P.bd, P.no],
    assignments: [
      { name: P.no.name, role: "Ответственный №2", date: "03.12.2025", by: "Артем С. Галустьян", source: "hr" },
      { name: P.bd.name, role: "Ответственный №1", date: "12.05.2024", by: "Импорт Excel", source: "import" },
    ],
    docGroups: [
      { kind: "Оперативно-техническая", paper: true },
      { kind: "Техническая", paper: false },
      { kind: "Приёмо-сдаточная", paper: false },
    ],
    docs: [
      { id: 1, name: "График ежедн. ОПР — апрель 2026", kind: "Оперативно-техническая", size: "1.2 МБ", date: "02.04.2026", ext: "pdf" },
      { id: 2, name: "График ежедн. ОПР — март 2026", kind: "Оперативно-техническая", size: "1.1 МБ", date: "01.03.2026", ext: "pdf" },
      { id: 3, name: "График ежедн. ОПР — февраль 2026", kind: "Оперативно-техническая", size: "1.1 МБ", date: "02.02.2026", ext: "pdf" },
      { id: 4, name: "Журнал ТО ИБП 2025", kind: "Оперативно-техническая", size: "640 КБ", date: "15.01.2026", ext: "pdf" },
      { id: 5, name: "ТД Ренко.pdf", kind: "Техническая", size: "4.8 МБ", date: "14.01.2026", ext: "pdf" },
      { id: 6, name: "Филиал г. Астана (18).xlsx", kind: "Приёмо-сдаточная", size: "86 КБ", date: "20.12.2025", ext: "xlsx" },
    ],
    comments: [
      {
        id: 1,
        author: P.ag,
        when: "06.10",
        at: "06.10.2026, 14:30",
        text: "С 01.11 меняется арендодатель площадки. @Борис Дегтярь, подготовь, пожалуйста, скан нового договора и приложи в «Приёмо-сдаточную».",
        pinned: true,
        reactions: 2,
      },
      {
        id: 2,
        author: P.bd,
        when: "вчера",
        at: "07.10.2026, 09:12",
        text: "Принял. Договор будет на этой неделе, загружу сразу после подписания.",
        reply: 1,
      },
      {
        id: 3,
        author: P.no,
        when: "02.10",
        at: "02.10.2026, 17:48",
        text: "На ВОЛС №49 освободили волокно 4 — его можно отдавать под новый ID-канал.",
        reactions: 1,
      },
    ],
    history: [
      {
        id: 1,
        what: "Изменено поле «Удалённость от ГЭ»",
        from: "5,1 км",
        to: "4,8 км",
        who: "Артем С. Галустьян",
        note: "ручное изменение",
        when: "07.10.2026",
        time: "11:04",
        kind: "edit",
      },
      {
        id: 2,
        what: "Изменён тип сети",
        from: "ГРС",
        to: "ГМС",
        who: "Артем С. Галустьян",
        note: "ручное изменение",
        when: "06.10.2026",
        time: "14:22",
        kind: "edit",
      },
      {
        id: 3,
        what: "Синхронизированы ответственные",
        who: "Система",
        note: "HR-синхронизация · автоматически",
        when: "06.10.2026",
        time: "06:30",
        kind: "people",
      },
      {
        id: 4,
        what: "Загружен «ТД Ренко.pdf»",
        who: "Борис Б. Дегтярь",
        note: "Техническая документация",
        when: "14.01.2026",
        time: "10:05",
        kind: "file",
      },
      {
        id: 5,
        what: "Привязана ВОЛС трасса №49 → УС «РТПЦ»",
        who: "Нурдаулет С. Осербай",
        when: "03.12.2025",
        time: "17:40",
        kind: "link",
      },
      {
        id: 6,
        what: "Удалён документ «Акт осмотра 2024.pdf»",
        who: "Нурдаулет С. Осербай",
        note: "перемещён в Корзину",
        when: "03.12.2025",
        time: "17:32",
        kind: "delete",
      },
      {
        id: 7,
        what: "Изменён статус",
        from: "Реконструкция",
        to: "В работе",
        who: "Артем С. Галустьян",
        note: "ручное изменение",
        when: "02.09.2025",
        time: "12:10",
        kind: "edit",
      },
      {
        id: 8,
        what: "Загружен «Акт ввода в эксплуатацию.pdf»",
        who: "Борис Б. Дегтярь",
        note: "Приёмо-сдаточная документация",
        when: "18.06.2025",
        time: "16:44",
        kind: "file",
      },
      {
        id: 9,
        what: "Изменено поле «Адрес»",
        from: "промзона, 7",
        to: "промзона Желаево, 7",
        who: "Борис Б. Дегтярь",
        note: "ручное изменение",
        when: "18.06.2025",
        time: "16:20",
        kind: "edit",
      },
      {
        id: 10,
        what: "Загружен «Схема размещения оборудования.dwg»",
        who: "Нурдаулет С. Осербай",
        note: "Техническая документация",
        when: "18.06.2025",
        time: "15:02",
        kind: "file",
      },
      {
        id: 11,
        what: "Изменено поле «Группа эксплуатации»",
        from: "—",
        to: "ЦТ",
        who: "Артем С. Галустьян",
        note: "ручное изменение",
        when: "18.06.2025",
        time: "11:30",
        kind: "edit",
      },
      { id: 12, what: "Узел создан", who: "Артем С. Галустьян", note: "Импорт Excel", when: "18.06.2025", time: "11:12", kind: "create" },
    ],
    media,
  }
}

const COMPANIES: [string, string, string][] = [
  ["000440005502", "ТОО «Авиакомпания Орлан-2000»", "Малые (41–50)"],
  ["070540014109", "ТОО «Асыл-Ана компаниясы»", "Малые (≤ 5)"],
  ["100440017386", "ТОО «СП Универсал Сервис»", "Малые (≤ 5)"],
  ["170640008446", "ТОО «Бота-2017»", "Малые (6–10)"],
  ["190840025982", "ТОО «A&Meirim»", "Малые (≤ 5)"],
  ["200940036391", "ТОО «Нуран Групп»", "Малые (≤ 5)"],
  ["210140011204", "ИП «Сапарова А.»", "Микро (1)"],
  ["150340021877", "ТОО «Жайык Строй»", "Средние (51–100)"],
  ["160640005512", "ТОО «Батыс Агро»", "Малые (11–20)"],
  ["180240013390", "ИП «Ермеков Д.»", "Микро (1)"],
  ["120840007741", "ТОО «Орал Логистик»", "Малые (21–40)"],
  ["190140029936", "ТОО «Медцентр Шипагер»", "Малые (6–10)"],
]

/** Клиенты в радиусе 250 м: первые 7 — из макета, статусы по пропорциям карточки «Клиенты рядом». */
function clientList(x: NodeRow): NodeDetail["clientList"] {
  const n = x.clients
  const client = Math.round(n * 0.12)
  const processed = Math.round(n * 0.2)
  const order: ("client" | "processed" | "none")[] = ["client", "processed", "none", "none", "processed", "none", "client"]
  const statuses = [
    ...Array(client).fill("client"),
    ...Array(processed).fill("processed"),
    ...Array(n - client - processed).fill("none"),
  ] as ("client" | "processed" | "none")[]
  // первые строки — в порядке макета, если хватает статусов
  const head = order.filter((st) => {
    const i = statuses.indexOf(st)
    if (i < 0) return false
    statuses.splice(i, 1)
    return true
  })
  const all = [...head, ...statuses].slice(0, n)
  const DIST = [115, 229, 115, 71, 246, 219, 64]
  return all.map((status, i) => {
    const [bin, name, size] = COMPANIES[i % COMPANIES.length]
    const m = DIST[i] ?? 40 + ((i * 37 + x.id * 11) % 210)
    const a = ((i * 137.5 + x.id * 13) % 360) * (Math.PI / 180)
    const k = m / 111000
    return {
      id: i + 1,
      bin: i < COMPANIES.length ? bin : String(Number(bin) + i),
      name: i < COMPANIES.length ? name : `${name} (${Math.floor(i / COMPANIES.length) + 1})`,
      size,
      m,
      status,
      ll: [x.ll[0] + Math.sin(a) * k, x.ll[1] + (Math.cos(a) * k) / Math.cos((x.ll[0] * Math.PI) / 180)] as [number, number],
    }
  })
}
