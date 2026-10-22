import type { NodeRow } from "./nodes"

/*
 * Содержимое паспорта узла (макет 02, экраны p01…t08) — пример данных по таблицам БД ЕСТУ:
 * bols (ВОЛС), spd_equipments / spd_equipment_ports, id-каналы, клиенты рядом, ответственные, документы, комментарии, история.
 * Для url002.01.UF — как в макете, для остальных — сгенерировано от id.
 * TODO: API — GET /api/nodes/pasport?node_id=… и вкладки.
 */

export type Person = { initials: string; name: string; role: string; color: string; synced?: boolean; phone?: string; email?: string }
export type FiberLine = { id: number; num: string; to: string; km: number; used: number; total: number; type: string; status: "work" | "plan" }
export type Equipment = { id: number; kind: string; host: string; model: string; ip: string; ports: { up: number; down: number; free: number }; status: "ok" | "warn" }
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
          { id: 49, num: "ВОЛС №49", to: "УС «РТПЦ»", km: 1.4, used, total, type: "ОКЛ-01-6-32", status: "work" },
          ...(r(1) > 0.5 ? [{ id: 52, num: "ВОЛС №52", to: "ast011.02.AS", km: 1.9, used: 4, total: 16, type: "ОКЛ-01-6-16", status: "plan" as const }] : []),
        ]
      : [],
    equipment: [
      { id: 1, kind: "Коммутатор", host: `sw1.${x.code.split(".")[0]}`, model: "X440-24t-10G", ip: "10.13.93.x", ports: { up: 18, down: 2, free: 5 }, status: "ok" },
      ...(x.equipment > 1
        ? [{ id: 2, kind: "Маршрутизатор", host: `bb1.${x.code.slice(0, 4)}`, model: "CISCO3845", ip: "10.13.90.x", ports: { up: 6, down: 0, free: 2 }, status: "ok" as const }]
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
