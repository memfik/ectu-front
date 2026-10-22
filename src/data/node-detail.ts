import type { NodeRow } from "./nodes"

/*
 * Содержимое паспорта узла (макет 02, экраны p01…t08) — пример данных по таблицам БД ЕСТУ:
 * bols (ВОЛС), spd_equipments / spd_equipment_ports, id-каналы, клиенты рядом, ответственные, документы, комментарии, история.
 * Для url002.01.UF — как в макете, для остальных — сгенерировано от id.
 * TODO: API — GET /api/nodes/pasport?node_id=… и вкладки.
 */

export type Person = { initials: string; name: string; role: string; color: string; synced?: boolean; phone?: string; email?: string }
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
export type Comment = { id: number; author: Person; when: string; text: string; pinned?: boolean }
export type HistoryItem = { id: number; what: string; who: string; when: string; kind: "edit" | "file" | "link" | "create" }
export type Media = { src: string; video?: string; title: string; date: string }

export type NodeDetail = {
  coords: string
  scene: { label: string; title: string; x: number; y: number; bar?: number }[]
  capacity: { ports: [number, number]; fibers: [number, number] }
  fibers: FiberLine[]
  equipment: Equipment[]
  idChannels: { id: number; num: string; client: string; speed: string; status: "ok" | "off" }[]
  clients: { total: number; client: number; processed: number; none: number; radius: number }
  /** Потенциальные клиенты рядом (B2B, таблица potential_clients) */
  clientList: { id: number; bin: string; name: string; size: string; m: number; status: "client" | "processed" | "none"; ll: [number, number] }[]
  /** ID-каналы на соседних узлах — можно привязать к этому */
  nearChannels: { id: string; node: string; kind: string; km: number }[]
  people: Person[]
  docs: Doc[]
  comments: Comment[]
  history: HistoryItem[]
  media: Media[]
}

const P = {
  bd: { initials: "БД", name: "Борис Б. Дегтярь", role: "Инженер ЦТ", color: "linear-gradient(135deg,#0ea5e9,#0369a1)", synced: true, phone: "+7 701 000 00 00", email: "b.degtyar@qmobile.kz" },
  no: { initials: "НО", name: "Нурдаулет С. Осербай", role: "Ведущий инженер ГЭ", color: "linear-gradient(135deg,#a855f7,#6d28d9)", synced: true, phone: "+7 702 000 00 00", email: "n.oserbay@qmobile.kz" },
  ag: { initials: "АГ", name: "Артем Г.", role: "ApiServDE", color: "linear-gradient(135deg,#085eff,#001a9f)" },
} satisfies Record<string, Person>

const MEDIA: Media[] = [
  { src: "/nodes/g-1.jpg", title: "АМС, вид снизу", date: "06.10.2026" },
  { src: "/nodes/g-2.jpg", title: "Антенны БС", date: "06.10.2026" },
  { src: "/nodes/g-3.jpg", title: "Кросс ODF", date: "14.01.2026" },
  { src: "/nodes/g-5.jpg", title: "АМС на закате", date: "14.01.2026" },
  { src: "/nodes/g-4.jpg", video: "0:42", title: "Обход стойки", date: "03.12.2025" },
  { src: "/nodes/g-6.jpg", title: "АМС ночью", date: "03.12.2025" },
]

export function nodeDetail(x: NodeRow): NodeDetail {
  const r = (k: number) => ((x.id * 9301 + k * 49297) % 233280) / 233280
  const total = x.fibers?.[1] ?? 0
  const used = x.fibers?.[0] ?? 0
  const media = Array.from({ length: 14 }, (_, i) => MEDIA[i % MEDIA.length])
  return {
    coords: `${x.ll[0].toFixed(6)}, ${x.ll[1].toFixed(6)}`,
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
              { range: used > 2 ? `1–${used - 1}` : "1", title: `sw1.${x.code.split(".")[0]}`, sub: "Uplink X440-24t-10G", kind: "equipment" },
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
    clients: { total: x.clients, client: Math.round(x.clients * 0.12), processed: Math.round(x.clients * 0.2), none: x.clients - Math.round(x.clients * 0.12) - Math.round(x.clients * 0.2), radius: 250 },
    clientList: clientList(x),
    nearChannels: [
      { id: "ID-00412", node: "ast011.02.AS", kind: "L2 · 100M", km: 1.9 },
      { id: "ID-00398", node: "УС «РТПЦ»", kind: "L3 · 1G", km: 1.4 },
      { id: "ID-00377", node: "ast004.01.AS", kind: "L2 · 50M", km: 2.3 },
      { id: "ID-00351", node: "КСО АТС-14", kind: "L3 · 200M", km: 2.8 },
    ],
    people: [P.bd, P.no],
    docs: [
      { id: 1, name: "КТС-РФ-ДЭ-83 График ежедн. ОПР — апрель 2026", kind: "Оперативно-техническая", size: "1.2 МБ", date: "02.04.2026", ext: "pdf" },
      { id: 2, name: "ТД Ренко.pdf", kind: "Техническая", size: "4.8 МБ", date: "14.01.2026", ext: "pdf" },
      { id: 3, name: "Филиал г. Астана (18).xlsx", kind: "Приёмо-сдаточная", size: "86 КБ", date: "20.12.2025", ext: "xlsx" },
      { id: 4, name: "Договор аренды площадки.docx", kind: "Правоустанавливающая", size: "312 КБ", date: "11.11.2025", ext: "docx" },
      { id: 5, name: "Схема размещения оборудования.dwg", kind: "Техническая", size: "2.1 МБ", date: "03.10.2025", ext: "dwg" },
      { id: 6, name: "Акт ввода в эксплуатацию.pdf", kind: "Приёмо-сдаточная", size: "640 КБ", date: "18.06.2025", ext: "pdf" },
    ],
    comments: [
      { id: 1, author: P.ag, when: "06.10", text: "Арендодатель меняется с 01.11 — нужен новый договор.", pinned: true },
      { id: 2, author: P.bd, when: "вчера", text: "Ок, скан приложу в документацию." },
      { id: 3, author: P.no, when: "сегодня", text: "Проверил ИБП, батареи в норме." },
    ],
    history: [
      { id: 1, what: "Тип сети: ГРС → ГМС", who: "Артем С. Галустьян", when: "06.10.2026", kind: "edit" },
      { id: 2, what: "Загружен «ТД Ренко.pdf»", who: "Борис Б. Дегтярь", when: "14.01.2026", kind: "file" },
      { id: 3, what: "Привязана ВОЛС №49", who: "Нурдаулет С. Осербай", when: "03.12.2025", kind: "link" },
      { id: 4, what: "Ответственный: Борис Б. Дегтярь", who: "HR-синхронизация", when: "20.11.2025", kind: "edit" },
      { id: 5, what: "Статус: Реконструкция → В работе", who: "Артем С. Галустьян", when: "02.09.2025", kind: "edit" },
      { id: 6, what: "Узел создан", who: "Импорт Excel", when: "18.06.2025", kind: "create" },
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
  const statuses = [...Array(client).fill("client"), ...Array(processed).fill("processed"), ...Array(n - client - processed).fill("none")] as ("client" | "processed" | "none")[]
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
