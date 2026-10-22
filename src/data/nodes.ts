/*
 * Узлы связи — пример данных по полям таблицы `nodes` (старый фронт: /api/nodes/filter).
 * Первые 10 строк — из макета 02, остальные сгенерированы до 1 387 с теми же пропорциями.
 * TODO: API — GET /api/nodes/filter, /api/nodes/filter-params.
 */

export type NodeStatus = "work" | "rebuild" | "off"

export type NodeRow = {
  id: number
  /** nodes_name_id */
  code: string
  /** object_name или адрес, если объекта нет */
  object: string
  address: string
  /** filial.short_name */
  branch: string
  /** ys_jm_locality */
  city: string
  network: "ГМС" | "ГРС" | "ГАС" | "МС"
  ownership: "own" | "rent"
  tech: string[]
  /** Занято / всего волокон; null — узел без ВОЛС (РРЛ) */
  fibers: [number, number] | null
  status: NodeStatus
  /** Группа эксплуатации и расстояние до неё */
  ops: string
  equipment: number
  idChannels: number
  clients: number
  onMap: boolean
  hasDocs: boolean
  /** Координаты [широта, долгота]. */
  ll: [number, number]
}

export const BRANCHES: { v: string; label: string; latin: string; cities: [string, string][] }[] = [
  { v: "АС", label: "Астана (АС)", latin: "AS", cities: [["Астана", "ast"]] },
  {
    v: "АФ",
    label: "Актобе (АФ)",
    latin: "AF",
    cities: [
      ["Актобе", "akb"],
      ["Кобда", "kbd"],
      ["Хромтау", "hrm"],
    ],
  },
  {
    v: "ВФ",
    label: "Павлодар (ВФ)",
    latin: "VF",
    cities: [
      ["Павлодар", "pvl"],
      ["Экибастуз", "ekb"],
    ],
  },
  {
    v: "ЗФ",
    label: "Атырау (ЗФ)",
    latin: "ZF",
    cities: [
      ["Атырау", "atr"],
      ["Кульсары", "kul"],
    ],
  },
  {
    v: "МФ",
    label: "Актау (МФ)",
    latin: "MF",
    cities: [
      ["Актау", "akt"],
      ["Жанаозен", "zhn"],
    ],
  },
  {
    v: "УФ",
    label: "Уральск (УФ)",
    latin: "UF",
    cities: [
      ["Уральск", "url"],
      ["Аксай", "aks"],
    ],
  },
  {
    v: "ЮФ",
    label: "Алматы (ЮФ)",
    latin: "YF",
    cities: [
      ["Алматы", "alm"],
      ["Талдыкорган", "tld"],
      ["Конаев", "kon"],
    ],
  },
  {
    v: "ШФ",
    label: "Шымкент (ШФ)",
    latin: "SF",
    cities: [
      ["Шымкент", "shm"],
      ["Туркестан", "trk"],
    ],
  },
  {
    v: "КФ",
    label: "Караганда (КФ)",
    latin: "KF",
    cities: [
      ["Караганда", "krg"],
      ["Темиртау", "tmr"],
    ],
  },
]

export const STATUS_LABEL: Record<NodeStatus, string> = { work: "В работе", rebuild: "Реконструкция", off: "Выведен" }

const SEED: Omit<NodeRow, "id" | "ops" | "equipment" | "idChannels" | "clients" | "onMap" | "hasDocs" | "ll">[] = [
  {
    code: "url002.01.UF",
    object: "УС «Уральск Центральный»",
    address: "г. Уральск, промзона Желаево, 7",
    branch: "УФ",
    city: "Уральск",
    network: "МС",
    ownership: "own",
    tech: ["FTTH", "FTTB"],
    fibers: [8, 24],
    status: "work",
  },
  {
    code: "alm001.01.YF",
    object: "ул. Маметовой 67Б",
    address: "г. Алматы, ул. Маметовой 67Б",
    branch: "ЮФ",
    city: "Алматы",
    network: "ГМС",
    ownership: "own",
    tech: ["FTTH"],
    fibers: [12, 48],
    status: "work",
  },
  {
    code: "pvl001.01.VF",
    object: "ул. Ак. Бектурова, 2",
    address: "г. Павлодар, ул. Ак. Бектурова, 2",
    branch: "ВФ",
    city: "Павлодар",
    network: "ГАС",
    ownership: "own",
    tech: ["FTTB"],
    fibers: [20, 24],
    status: "work",
  },
  {
    code: "akb001.01.AF",
    object: "ж/м Коктем, 516Б",
    address: "г. Актобе, ж/м Коктем, 516Б",
    branch: "АФ",
    city: "Актобе",
    network: "ГРС",
    ownership: "rent",
    tech: ["FTTH", "xDSL"],
    fibers: [6, 16],
    status: "rebuild",
  },
  {
    code: "aks001.01.UF",
    object: "Промзона, 158Н",
    address: "г. Аксай, Промзона, 158Н",
    branch: "УФ",
    city: "Аксай",
    network: "ГРС",
    ownership: "own",
    tech: ["FTTH"],
    fibers: [8, 32],
    status: "work",
  },
  {
    code: "akt001.01.MF",
    object: "43.649392, 51.177749",
    address: "г. Актау, 43.649392, 51.177749",
    branch: "МФ",
    city: "Актау",
    network: "МС",
    ownership: "rent",
    tech: ["РРЛ"],
    fibers: null,
    status: "work",
  },
  {
    code: "kbd001.01.AF",
    object: "KAZ10, Кобда",
    address: "с. Кобда, KAZ10",
    branch: "АФ",
    city: "Кобда",
    network: "ГМС",
    ownership: "own",
    tech: ["FTTB"],
    fibers: [4, 8],
    status: "off",
  },
  {
    code: "shm007.03.SF",
    object: "42.312034, 69.525305",
    address: "г. Шымкент, 42.312034, 69.525305",
    branch: "ШФ",
    city: "Шымкент",
    network: "ГРС",
    ownership: "rent",
    tech: ["FTTH", "FTTB"],
    fibers: [30, 64],
    status: "work",
  },
  {
    code: "kul050.02.ZF",
    object: "УС «Кульсары»",
    address: "г. Кульсары, УС «Кульсары»",
    branch: "ЗФ",
    city: "Кульсары",
    network: "ГАС",
    ownership: "own",
    tech: ["xDSL"],
    fibers: [2, 8],
    status: "work",
  },
  {
    code: "sw6.ast001",
    object: "Коргалжынское ш., 4/2",
    address: "г. Астана, Коргалжынское ш., 4/2",
    branch: "АС",
    city: "Астана",
    network: "ГРС",
    ownership: "own",
    tech: ["FTTH"],
    fibers: [16, 24],
    status: "work",
  },
]

/** Центры городов — точки узлов разбрасываются вокруг. */
const CITY_LL: Record<string, [number, number]> = {
  Астана: [51.1282, 71.4304],
  Актобе: [50.2839, 57.167],
  Кобда: [50.1453, 55.6447],
  Хромтау: [50.2503, 58.4347],
  Павлодар: [52.2873, 76.9674],
  Экибастуз: [51.7298, 75.3266],
  Атырау: [47.0945, 51.9238],
  Кульсары: [46.9538, 54.0187],
  Актау: [43.6481, 51.1722],
  Жанаозен: [43.3412, 52.8619],
  Уральск: [51.2333, 51.3667],
  Аксай: [51.1678, 52.995],
  Алматы: [43.2389, 76.8897],
  Талдыкорган: [45.0156, 78.3739],
  Конаев: [43.8667, 77.0667],
  Шымкент: [42.3417, 69.5901],
  Туркестан: [43.2973, 68.2518],
  Караганда: [49.8047, 73.1094],
  Темиртау: [50.0549, 72.9646],
}
const near = (city: string, r: () => number, spread = 0.08): [number, number] => {
  const c = CITY_LL[city] ?? CITY_LL["Астана"]
  return [c[0] + (r() - 0.5) * spread, c[1] + (r() - 0.5) * spread * 1.6]
}

const STREETS = [
  "ул. Абая",
  "пр. Республики",
  "ул. Сыганак",
  "ул. Толе би",
  "пр. Назарбаева",
  "мкр. Самал",
  "ул. Сатпаева",
  "ул. Байтурсынова",
  "Промзона",
  "ул. Кабанбай батыра",
]
const OBJECTS = ["УС «РТПЦ»", "КСО АТС-14", "БС", "Контейнер", "Здание АТС", "Шкаф уличный"]

/** Детерминированный ГСЧ — одинаковые данные на сервере и в браузере. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

let cache: NodeRow[] | null = null

export function nodeRows(): NodeRow[] {
  if (cache) return cache
  const r = rng(7)
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)]
  const rows: NodeRow[] = SEED.map((x, i) => ({
    id: i + 1,
    ...x,
    ops: `ЦТ г. ${x.city} · ${i ? (r() * 9).toFixed(1).replace(".", ",") : "0"} км`,
    equipment: i ? 1 + Math.floor(r() * 6) : 1,
    idChannels: i ? Math.floor(r() * 4) : 0,
    clients: i ? Math.floor(r() * 40) : 24,
    onMap: true,
    hasDocs: false,
    ll: near(x.city, r, 0.03),
  }))

  // Пропорции из KPI макета: 1 312 в работе, 48 на реконструкции, 27 выведено; ГМС 612, ГРС 498, ГАС 201, МС 76
  const statuses: NodeStatus[] = [...Array(1312).fill("work"), ...Array(48).fill("rebuild"), ...Array(27).fill("off")]
  const nets: NodeRow["network"][] = [
    ...Array(612).fill("ГМС"),
    ...Array(498).fill("ГРС"),
    ...Array(201).fill("ГАС"),
    ...Array(76).fill("МС"),
  ]
  for (const x of rows) {
    statuses.splice(statuses.indexOf(x.status), 1)
    nets.splice(nets.indexOf(x.network), 1)
  }
  const seq: Record<string, number> = {}
  for (let i = rows.length; i < 1387; i++) {
    const b = pick(BRANCHES)
    const [city, code] = pick(b.cities)
    seq[code] = (seq[code] ?? 1) + 1
    const network = nets.splice(Math.floor(r() * nets.length), 1)[0]
    const status = statuses.splice(Math.floor(r() * statuses.length), 1)[0]
    const tech = network === "МС" && r() > 0.6 ? ["РРЛ"] : r() > 0.7 ? ["FTTH", "FTTB"] : r() > 0.85 ? ["xDSL"] : [pick(["FTTH", "FTTB"])]
    const total = pick([8, 16, 24, 32, 48, 64])
    const street = `${pick(STREETS)}, ${1 + Math.floor(r() * 180)}`
    const object = r() > 0.6 ? `${pick(OBJECTS)} ${street.split(",")[0].replace(/^(ул\.|пр\.|мкр\.) /, "")}` : street
    rows.push({
      id: i + 1,
      code: `${code}${String(seq[code]).padStart(3, "0")}.0${1 + Math.floor(r() * 3)}.${b.latin}`,
      object,
      address: `г. ${city}, ${street}`,
      branch: b.v,
      city,
      network,
      ownership: r() > 0.3 ? "own" : "rent",
      tech,
      fibers: tech[0] === "РРЛ" ? null : [Math.floor(r() * total * 0.9) + 1, total],
      status,
      ops: `ЦТ г. ${city} · ${(r() * 25).toFixed(1).replace(".", ",")} км`,
      equipment: 1 + Math.floor(r() * 6),
      idChannels: Math.floor(r() * 4),
      clients: Math.floor(r() * 40),
      onMap: r() > 0.07,
      hasDocs: false,
      ll: near(city, r),
    })
  }
  cache = rows
  return rows
}
