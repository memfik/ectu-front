/*
 * Ядро сети (макет 43): схема ядра, каналы, аварии и интерфейсы по городам — цифры макета.
 * TODO(API): kticket-back — схема `config/core_map.php`, трафик Orion `/api/monitoring/orion/core/*`,
 * раскладка `core_map_positions` (общая для всех). Сейчас раскладка хранится в localStorage.
 */

export type CoreNode = { id: string; x: number; y: number; kind: "switch" | "router" | "external" }
export type CoreCity = { t: string; x: number; y: number; w: number; h: number; tx: number; ty: number }
export type CoreLink = {
  a: string
  b: string
  /** Ёмкость, Gb; lost — сколько потеряно */
  cap: number
  lost?: number
  /** Загрузка a → b и b → a, % */
  ab: number
  ba: number
  /** Аренда / резерв — пунктир */
  rent?: boolean
  /** Внутри города — тонкая полупрозрачная линия без подписи */
  inner?: boolean
  /** Место подписи (доля пути от a к b), по умолчанию — середина */
  at?: number
  city: [string, string]
}

/** Центры узлов в координатах схемы (viewBox 0 30 1230 680). */
export const NODES: CoreNode[] = [
  { id: "bb10.akt1", x: 100, y: 170, kind: "router" },
  { id: "sw15.akt1", x: 100, y: 330, kind: "switch" },
  { id: "sw16.akt1", x: 100, y: 490, kind: "switch" },
  { id: "sw17.atr1", x: 350, y: 170, kind: "switch" },
  { id: "sw15.atr1", x: 350, y: 330, kind: "switch" },
  { id: "sw16.atr1", x: 350, y: 490, kind: "switch" },
  { id: "sw15.url2", x: 580, y: 190, kind: "switch" },
  { id: "sw16.url2", x: 800, y: 190, kind: "switch" },
  { id: "sw15.akb1", x: 580, y: 400, kind: "switch" },
  { id: "sw16.akb1", x: 800, y: 400, kind: "switch" },
  { id: "sw12.shm4", x: 580, y: 620, kind: "switch" },
  { id: "sw11.shm4", x: 800, y: 620, kind: "switch" },
  { id: "sw2.trz1", x: 850, y: 510, kind: "switch" },
  { id: "sw30.alm1", x: 1030, y: 400, kind: "switch" },
  { id: "bb6.alm1", x: 1030, y: 620, kind: "router" },
  { id: "sw16.alm1", x: 1140, y: 560, kind: "switch" },
  { id: "sw11.ast1", x: 1080, y: 100, kind: "switch" },
  { id: "sw2.krg7", x: 970, y: 260, kind: "external" },
]

export const CITIES: CoreCity[] = [
  { t: "Актау", x: 22, y: 130, w: 156, h: 406, tx: 26, ty: 120 },
  { t: "Атырау", x: 272, y: 130, w: 156, h: 406, tx: 276, ty: 120 },
  { t: "Уральск", x: 502, y: 150, w: 376, h: 86, tx: 506, ty: 140 },
  { t: "Актобе", x: 502, y: 360, w: 376, h: 86, tx: 506, ty: 350 },
  { t: "Шымкент", x: 502, y: 580, w: 376, h: 86, tx: 506, ty: 570 },
  { t: "Тараз", x: 772, y: 470, w: 156, h: 86, tx: 776, ty: 460 },
  { t: "Алматы", x: 952, y: 360, w: 266, h: 306, tx: 956, ty: 350 },
  { t: "Астана", x: 1002, y: 60, w: 156, h: 86, tx: 1006, ty: 50 },
]

export const LINKS: CoreLink[] = [
  { a: "sw15.akt1", b: "sw15.atr1", cap: 200, ab: 32, ba: 31, city: ["Актау", "Атырау"] },
  { a: "sw16.akt1", b: "sw15.atr1", cap: 10, ab: 0, ba: 0, rent: true, city: ["Актау", "Атырау"] },
  { a: "sw17.atr1", b: "bb10.akt1", cap: 10, ab: 0, ba: 0, rent: true, city: ["Атырау", "Актау"] },
  { a: "sw15.akt1", b: "sw16.akt1", cap: 100, ab: 6, ba: 12, inner: true, city: ["Актау", "Актау"] },
  { a: "sw15.atr1", b: "sw16.atr1", cap: 200, ab: 11, ba: 17, inner: true, city: ["Атырау", "Атырау"] },
  { a: "sw15.atr1", b: "sw15.url2", cap: 200, lost: 100, ab: 34, ba: 34, city: ["Атырау", "Уральск"] },
  { a: "sw15.atr1", b: "sw16.url2", cap: 10, ab: 62, ba: 44, city: ["Атырау", "Уральск"] },
  { a: "sw15.url2", b: "sw16.url2", cap: 100, ab: 20, ba: 6, inner: true, city: ["Уральск", "Уральск"] },
  { a: "sw15.url2", b: "sw16.alm1", cap: 20, ab: 36, ba: 52, rent: true, at: 0.4, city: ["Уральск", "Алматы"] },
  { a: "sw16.url2", b: "sw16.akb1", cap: 200, ab: 30, ba: 26, city: ["Уральск", "Актобе"] },
  { a: "sw16.url2", b: "sw12.shm4", cap: 100, ab: 57, ba: 32, at: 0.3, city: ["Уральск", "Шымкент"] },
  { a: "sw16.url2", b: "sw30.alm1", cap: 100, ab: 86, ba: 62, city: ["Уральск", "Алматы"] },
  { a: "sw15.akb1", b: "sw16.akb1", cap: 200, ab: 13, ba: 6, inner: true, city: ["Актобе", "Актобе"] },
  { a: "sw15.akb1", b: "sw15.url2", cap: 100, ab: 22, ba: 33, rent: true, at: 0.35, city: ["Актобе", "Уральск"] },
  { a: "sw15.akb1", b: "sw11.shm4", cap: 100, ab: 46, ba: 42, rent: true, at: 0.3, city: ["Актобе", "Шымкент"] },
  { a: "sw16.akb1", b: "sw12.shm4", cap: 200, ab: 32, ba: 48, at: 0.3, city: ["Актобе", "Шымкент"] },
  { a: "sw16.akb1", b: "sw30.alm1", cap: 100, ab: 71, ba: 52, city: ["Актобе", "Алматы"] },
  { a: "sw11.shm4", b: "sw12.shm4", cap: 200, ab: 9, ba: 14, inner: true, city: ["Шымкент", "Шымкент"] },
  { a: "sw11.shm4", b: "bb6.alm1", cap: 100, ab: 59, ba: 40, city: ["Шымкент", "Алматы"] },
  { a: "sw12.shm4", b: "sw2.trz1", cap: 200, ab: 48, ba: 36, at: 0.65, city: ["Шымкент", "Тараз"] },
  { a: "sw30.alm1", b: "sw2.trz1", cap: 200, ab: 57, ba: 30, city: ["Алматы", "Тараз"] },
  { a: "bb6.alm1", b: "sw30.alm1", cap: 200, ab: 7, ba: 12, inner: true, city: ["Алматы", "Алматы"] },
  { a: "sw11.ast1", b: "sw16.alm1", cap: 10, ab: 51, ba: 21, rent: true, city: ["Астана", "Алматы"] },
  { a: "sw11.ast1", b: "sw2.krg7", cap: 10, ab: 2, ba: 1, rent: true, city: ["Астана", "Караганда"] },
]

/** Цвет загрузки направления, как в легенде. */
export const loadColor = (p: number, idle?: boolean) =>
  idle ? "#94a3b8" : p >= 85 ? "#dc2626" : p >= 70 ? "#f97316" : p >= 50 ? "#eab308" : "#10b981"

export const linkKey = (l: CoreLink) => `${l.a}~${l.b}`
export const linkLabel = (l: CoreLink) =>
  `${l.lost ? `${l.cap - l.lost}G из ${l.cap}G` : `${l.cap}G`} · ${Math.max(l.ab, l.ba)}%`

export const KPIS: [string, string, string, string, number][] = [
  ["Суммарный IN", "623 Gb", "", "#4f8dff", 41],
  ["Суммарный OUT", "642 Gb", "", "#10b981", 43],
  ["Ёмкость ядра", "1510 Gb", "из 1610 Gb", "#a78bfa", 94],
  ["Загрузка", "42.5%", "от доступной", "#10b981", 43],
  ["Каналы", "18", "1 с потерей ёмкости", "#f97316", 100],
]

export const ALARMS: { t: string; sub: string; at: string }[] = [
  { t: "Линк упал: ROSTELECOM (Atyrau) / sw15.atr1:1:41", sub: "Восстановлено за 3 ч 16 мин · заявка №206210", at: "07.10 15:56" },
  { t: "Линк упал: ROSTELECOM (Atyrau) / sw15.atr1:1:42", sub: "Восстановлено за 6 мин · заявка №205841", at: "05.10 10:05" },
  { t: "Линк упал: Уральск-Кордай / sw0.krd1:1:24 ↔ sw15.url2:1:73", sub: "Восстановлено за < 1 мин · заявка №204992", at: "28.09 17:34" },
  { t: "Линк упал: Уральск-Кордай / sw0.krd1:1:20 ↔ sw15.url2:1:74", sub: "Восстановлено за < 1 мин · заявка №204993", at: "28.09 17:34" },
  { t: "Линк упал: Уральск-Кордай / sw0.krd1:1:21 ↔ sw15.url2:1:76", sub: "Восстановлено за < 1 мин · заявка №204991", at: "28.09 17:34" },
  { t: "Порт упал: X870-32c Port 82 · sw16.alm1_port_42_DWDM", sub: "Восстановлено за 5 ч 44 мин · заявка №204850", at: "28.09 11:48" },
  { t: "Порт упал: X670G2-48x-4q Port 41 · sw15.url2_port_81_DWDM", sub: "Восстановлено за 5 ч 44 мин · заявка №204841", at: "28.09 11:48" },
]

/** Интерфейс: узел · порт → куда, IN Gb, IN %, OUT Gb, OUT %. */
export type CoreIface = [string, string, string, number, string, number]
export type CityCard = { t: string; cap: string; lost?: string; nodes: string; channels: number; inGb: string; outGb: string; inPct: number; outPct: number; rows: CoreIface[]; note?: string }

export const CITY_CARDS: CityCard[] = [
  {
    t: "Актау", cap: "310 Gb", nodes: "bb10.akt1, sw15.akt1, sw16.akt1", channels: 3, inGb: "65 Gb", outGb: "62 Gb", inPct: 21, outPct: 20,
    rows: [
      ["sw15.akt1 · 1:55", "Атырау", "32 Gb", 32, "31 Gb", 31],
      ["sw15.akt1 · 1:56", "Атырау", "32 Gb", 32, "31 Gb", 31],
      ["sw16.akt1 · 1:1", "Атырау", "0,0 Gb", 0, "0,0 Gb", 0],
      ["sw15.akt1 · 1:50", "внутри", "11 Gb", 6, "23 Gb", 12],
    ],
  },
  {
    t: "Атырау", cap: "420 Gb", lost: "520 Gb", nodes: "sw15.atr1, sw16.atr1, sw17.atr1", channels: 5, inGb: "91 Gb", outGb: "104 Gb", inPct: 22, outPct: 25,
    rows: [
      ["sw17.atr1 · port-channel85", "Актау", "0,0 Gb", 0, "0,0 Gb", 0],
      ["sw15.atr1 · 1:93", "внутри", "23 Gb", 11, "35 Gb", 17],
      ["sw15.atr1 · 1:125", "Уральск", "8,2 Gb", 25, "11 Gb", 34],
      ["sw15.atr1 · 1:77", "Уральск", "8,2 Gb", 25, "11 Gb", 34],
      ["sw15.atr1 · 1:89", "Уральск", "8,2 Gb", 25, "11 Gb", 34],
      ["sw15.atr1 · 1:121", "Уральск", "4,4 Gb", 44, "6,2 Gb", 62],
    ],
  },
  {
    t: "Уральск", cap: "630 Gb", lost: "730 Gb", nodes: "sw15.url2, sw16.url2", channels: 7, inGb: "228 Gb", outGb: "261 Gb", inPct: 36, outPct: 41,
    rows: [
      ["sw15.url2 · 1:21", "внутри", "20 Gb", 20, "5,7 Gb", 6],
      ["sw15.url2 · 1:25", "внутри", "20 Gb", 20, "5,7 Gb", 6],
      ["sw15.url2 · 1:61", "Алматы", "5,2 Gb", 52, "3,6 Gb", 36],
      ["sw15.url2 · 1:62", "Алматы", "5,2 Gb", 52, "3,6 Gb", 36],
      ["sw16.url2 · Eth-Trunk400", "Актобе", "51 Gb", 26, "59 Gb", 30],
      ["sw16.url2 · Eth-Trunk20", "Шымкент", "32 Gb", 32, "57 Gb", 57],
      ["sw16.url2 · Eth-Trunk70", "Алматы", "62 Gb", 62, "86 Gb", 86],
    ],
  },
  {
    t: "Актобе", cap: "700 Gb", nodes: "sw15.akb1, sw16.akb1", channels: 5, inGb: "262 Gb", outGb: "273 Gb", inPct: 37, outPct: 39,
    rows: [
      ["sw15.akb1 · Eth-Trunk100", "внутри", "26 Gb", 13, "12 Gb", 6],
      ["sw15.akb1 · Eth-Trunk7", "Уральск", "22 Gb", 22, "33 Gb", 33],
      ["sw15.akb1 · Eth-Trunk2", "Шымкент", "46 Gb", 46, "42 Gb", 42],
      ["sw16.akb1 · Eth-Trunk300", "Шымкент", "64 Gb", 32, "96 Gb", 48],
      ["sw16.akb1 · Eth-Trunk60", "Алматы", "71 Gb", 71, "52 Gb", 52],
    ],
  },
  {
    t: "Шымкент", cap: "700 Gb", nodes: "sw11.shm4, sw12.shm4", channels: 5, inGb: "330 Gb", outGb: "273 Gb", inPct: 47, outPct: 39,
    rows: [
      ["sw11.shm4 · Eth-Trunk100", "внутри", "17 Gb", 9, "27 Gb", 14],
      ["sw11.shm4 · Eth-Trunk3", "Алматы", "40 Gb", 40, "59 Gb", 59],
      ["sw12.shm4 · Eth-Trunk400", "Тараз", "95 Gb", 48, "72 Gb", 36],
    ],
  },
  { t: "Тараз", cap: "400 Gb", nodes: "sw2.trz1", channels: 2, inGb: "132 Gb", outGb: "210 Gb", inPct: 33, outPct: 53, rows: [], note: "Порты на стороне соседних городов" },
  {
    t: "Алматы", cap: "530 Gb", nodes: "bb6.alm1, sw16.alm1, sw30.alm1", channels: 6, inGb: "324 Gb", outGb: "245 Gb", inPct: 61, outPct: 46,
    rows: [
      ["sw30.alm1 · Eth-Trunk300", "Тараз", "114 Gb", 57, "59 Gb", 30],
      ["bb6.alm1 · ae100", "внутри", "15 Gb", 7, "25 Gb", 12],
    ],
  },
  {
    t: "Астана", cap: "20 Gb", nodes: "sw11.ast1", channels: 2, inGb: "2,2 Gb", outGb: "5,3 Gb", inPct: 11, outPct: 27,
    rows: [
      ["sw11.ast1 · 1:30", "Алматы", "2,1 Gb", 21, "5,1 Gb", 51],
      ["sw11.ast1 · 1:31", "Караганда", "0,1 Gb", 1, "0,2 Gb", 2],
    ],
  },
]

/** Суточная кривая трафика (Gb/s), 96 точек по 15 минут: ночной провал, вечерний пик. */
export function dayCurve(peak: number, shift = 0, seed = 1) {
  return Array.from({ length: 97 }, (_, i) => {
    const h = i / 4
    const base = 0.62 + 0.38 * Math.cos(((h - 21 + shift) / 24) * Math.PI * 2)
    const noise = Math.sin(i * 1.7 + seed) * 0.02 + Math.sin(i * 0.53 + seed * 3) * 0.015
    return Math.max(0, peak * (base + noise))
  })
}
