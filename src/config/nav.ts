import type { LucideIcon } from "lucide-react"
import {
  AudioWaveform,
  BatteryCharging,
  Box,
  Cable,
  ChartPie,
  ClipboardList,
  DatabaseBackup,
  FileChartColumn,
  FileUp,
  Fuel,
  GitBranch,
  Globe,
  Hash,
  HousePlus,
  LandPlot,
  Link,
  Map as MapIcon,
  Monitor,
  Network,
  Package,
  Phone,
  Radio,
  RadioTower,
  Router,
  Rows3,
  Satellite,
  SatelliteDish,
  ScanSearch,
  Server,
  Share2,
  SignalHigh,
  Spline,
  SquareUserRound,
  Table2,
  Trash2,
  Users,
  Wifi,
} from "lucide-react"

/**
 * Меню ЕСТУ — как в макете 01 (6 групп из menuConfigs.js).
 * Номер раздела = номер файла макета в архиве QMobile-ЕСТУ-дизайн. Счётчики и цифры карточек — TODO: из API.
 */
export type Section = { slug: string; num: string; title: string }

/** Пункт меню: раздел (есть `section`) или быстрое действие / ссылка. */
export type MenuItem = {
  title: string
  href: string
  icon: LucideIcon
  hint?: string
  count?: string
  /** Раздел виден только этим ролям — в меню плашка с замком. */
  roles?: string
  section?: Section
}

/** Колонка мега-меню: один или несколько блоков с заголовком. */
export type MenuBlock = { title: string; items: MenuItem[] }

export type Feature =
  | { kind: "photo"; src: string; title: string; text: string; href: string }
  | { kind: "funnel"; title: string; rows: { label: string; value: string; pct: number; color: string }[] }
  | { kind: "stats"; title: string; rows: { label: string; value: string; tone?: "ok" | "bad" }[] }
  | { kind: "bars"; title: string; text: string; bars: number[] }

export type NavGroup = {
  key: string
  title: string
  icon: LucideIcon
  columns: MenuBlock[][]
  feature: Feature
  /** Недавно открытые записи под карточкой (Оборудование). TODO: из истории пользователя. */
  recent?: MenuItem[]
  /** Подсказка внизу мега-меню. */
  footer: string
  /** Ширина мега-меню на десктопе, px. */
  width: number
}

const s = (num: string, slug: string, title: string, icon: LucideIcon, extra: Partial<MenuItem> = {}): MenuItem => ({
  title,
  href: `/${slug}`,
  icon,
  section: { num, slug, title },
  ...extra,
})
const a = (title: string, href: string, icon: LucideIcon, hint?: string): MenuItem => ({ title, href, icon, hint })

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "network",
    title: "Сеть",
    icon: RadioTower,
    width: 900,
    columns: [
      [
        {
          title: "Сеть",
          items: [
            s("02", "nodes", "Узлы связи", RadioTower, { hint: "Паспорта УС · сводный файл", count: "1 387" }),
            s("05", "map", "Карта сети", MapIcon, { hint: "Узлы, ВОЛС и клиенты на карте" }),
            s("43", "core", "Ядро сети", Share2, { hint: "Мониторинг магистрали · Orion", count: "8 городов" }),
            s("37", "land-plots", "Земельные участки", LandPlot, { hint: "Реестр и паспорта участков", count: "374" }),
          ],
        },
      ],
      [
        {
          title: "Быстрые действия",
          items: [
            a("Создать узел связи", "/nodes/new", HousePlus, "Мастер создания"),
            a("Импорт узлов из Excel", "/excel-import", FileUp),
            a("Сводный файл по узлам", "/summary-files?section=nodes", FileChartColumn, "Выгрузка .xlsx"),
          ],
        },
      ],
    ],
    feature: {
      kind: "photo",
      src: "/menu/network-map.jpg",
      title: "Карта сети",
      text: "1 387 узлов · 379 ВОЛС трасс · 43 080 потенциальных клиентов",
      href: "/map",
    },
    footer: "Поиск по узлам, адресам и ID",
  },
  {
    key: "equipment",
    title: "Оборудование",
    icon: Network,
    width: 1300,
    columns: [
      [
        {
          title: "Системы передачи данных",
          items: [
            s("03", "switches", "Коммутаторы", Network, { hint: "РФ-ДППП-20", count: "1 324" }),
            s("04", "routers", "Маршрутизаторы", Router, { hint: "РФ-ДППП-21", count: "78" }),
          ],
        },
        {
          title: "Автоматическая электросвязь",
          items: [s("20", "pbx", "АТС", Phone, { hint: "РФ-ДППП-03", count: "222" }), s("21", "number-capacity", "Номерная ёмкость", Hash)],
        },
      ],
      [
        {
          title: "Проводные технологии",
          items: [s("22", "pdh", "PDH", GitBranch), s("23", "sdh", "SDH", Spline), s("24", "dwdm", "DWDM", Rows3)],
        },
        {
          title: "Электропитание",
          items: [s("33", "ups", "ИБП", BatteryCharging), s("34", "gen", "ГЭУ", Fuel)],
        },
      ],
      [
        {
          title: "Беспроводные технологии",
          items: [
            s("25", "rrl", "РРЛ", Radio),
            s("26", "radio-bridges", "Радиомосты", AudioWaveform),
            s("27", "bwa-wimax", "БШД WiMAX", Wifi),
            s("28", "bwa-lte", "БШД Telrad LTE", SignalHigh),
            s("29", "bwa-wll", "БШД WLL", Wifi),
            s("30", "trunk-bs", "БС Транк", RadioTower),
          ],
        },
      ],
      [
        {
          title: "Спутниковые технологии",
          items: [s("31", "vsat", "ЗССС SkyEdge II GEO", SatelliteDish), s("32", "oneweb", "OneWeb LEO", Satellite)],
        },
        {
          title: "Мониторинг OneWeb",
          items: [s("42", "oneweb-form", "Форма учёта OneWeb", Monitor, { hint: "1 204 станции" })],
        },
        { title: "Склад", items: [s("35", "spare-parts", "ЗИП", Package, { hint: "Запасные части" })] },
        { title: "3D", items: [a("3D-каталог оборудования", "/equipment-3d", Box, "Модели по типу корпуса")] },
      ],
    ],
    feature: {
      kind: "photo",
      src: "/menu/equipment.jpg",
      title: "Паспорт оборудования",
      text: "Порты, комплектация, МОЛ и ответственные — в одном месте",
      href: "/switches",
    },
    recent: [a("sw1.alm1", "/switches", Network, "X440-24t"), a("АТС kul050.02.ZF", "/pbx", Phone, "Iskratel SI 2000")],
    footer: "14 типов оборудования · быстрый поиск по hostname, S/N и IP",
  },
  {
    key: "lines",
    title: "Линии и сооружения",
    icon: Cable,
    width: 860,
    columns: [
      [
        {
          title: "Линии связи",
          items: [
            s("07", "fiber-lines", "ВОЛС", Cable, { hint: "Волоконно-оптические линии", count: "1 693" }),
            s("08", "cable-lines", "КЛС", Cable, { hint: "Кабельные линии связи" }),
            s("09", "cable-ducts", "КК", Spline, { hint: "Кабельная канализация" }),
          ],
        },
      ],
      [
        {
          title: "Сооружения",
          items: [
            s("10", "odf", "ODF", Server, { hint: "Оптические кроссы" }),
            s("11", "masts", "АМС", RadioTower, { hint: "Антенно-мачтовые сооружения" }),
            a("Сводный файл ВОЛС", "/summary-files?section=fiber-lines", FileChartColumn, "Выгрузка .xlsx"),
          ],
        },
      ],
    ],
    feature: {
      kind: "photo",
      src: "/menu/network-map.jpg",
      title: "Ёмкость волокон — 98%",
      text: "370 из 379 трасс заполнены. Открыть аналитику ВОЛС →",
      href: "/analytics?section=fiber-lines",
    },
    footer: "Поиск по номеру трассы, началу и концу",
  },
  {
    key: "clients",
    title: "Клиенты",
    icon: Users,
    width: 860,
    columns: [
      [
        {
          title: "Клиенты",
          items: [
            s("12", "prospects", "Потенциальные клиенты", Users, { hint: "B2B рядом с узлами", count: "43 080" }),
            s("13", "onyma", "Клиенты Onyma", SquareUserRound, {
              hint: "Биллинг · синхронизация 06:30",
              count: "5 698",
              roles: "admin, ip",
            }),
            s("14", "channel-ids", "ID-каналы", Link, { hint: "Реестр каналов" }),
          ],
        },
      ],
      [
        {
          title: "Быстрые действия",
          items: [
            a("Сводный файл по клиентам", "/summary-files?section=prospects", FileChartColumn),
            a("Найти клиента по БИН", "/prospects?search=bin", ScanSearch),
            a("Клиенты на карте", "/map?layer=clients", MapIcon),
          ],
        },
      ],
    ],
    feature: {
      kind: "funnel",
      title: "Воронка за октябрь",
      rows: [
        { label: "Не обработан", value: "38 912", pct: 90, color: "#8c919b" },
        { label: "Обработан", value: "3 506", pct: 30, color: "#ffc24a" },
        { label: "Клиент", value: "662", pct: 8, color: "#2bd463" },
      ],
    },
    footer: "Поиск по БИН, названию и узлу",
  },
  {
    key: "services",
    title: "Сервисы",
    icon: Globe,
    width: 900,
    columns: [
      [
        {
          title: "IP и заявки",
          items: [
            s("15", "ip-plan", "Единый IP-план", Globe, { hint: "Адресное пространство", roles: "admin, ip" }),
            s("16", "requests", "Реестр заявок", ClipboardList, { hint: "Заявки на подключение", count: "1 407" }),
            s("17", "excel-import", "Импорт Excel", FileUp, { hint: "Загрузка реестров" }),
          ],
        },
      ],
      [
        {
          title: "Данные",
          items: [
            s("18", "backups", "Резервные копии", DatabaseBackup, { hint: "Конфигурации устройств" }),
            s("18", "backup-devices", "Список устройств", Server, { hint: "Для резервного копирования" }),
            s("19", "trash", "Корзина", Trash2, { hint: "Удалённые записи", count: "37" }),
          ],
        },
      ],
    ],
    feature: {
      kind: "stats",
      title: "Последний бэкап",
      rows: [
        { label: "Успешно", value: "1 284", tone: "ok" },
        { label: "С ошибкой", value: "16", tone: "bad" },
        { label: "Время", value: "сегодня, 03:00" },
      ],
    },
    footer: "Разделы с замком видны только ролям admin / ip_manager",
  },
  {
    key: "analytics",
    title: "Аналитика",
    icon: ChartPie,
    width: 860,
    columns: [
      [
        {
          title: "Отчёты",
          items: [
            s("38", "analytics", "Аналитика", ChartPie, { hint: "Заполненность данных" }),
            s("36", "summary-files", "Общий сводный отчёт", FileChartColumn, { hint: "По всем разделам" }),
          ],
        },
      ],
      [
        {
          title: "OneWeb",
          items: [
            s("32", "oneweb-monitoring", "Мониторинг OneWeb", Monitor, { hint: "Состояние терминалов", roles: "admin" }),
            s("42", "oneweb-form", "Форма учёта OneWeb", Table2),
          ],
        },
      ],
    ],
    feature: {
      kind: "bars",
      title: "Заполненность — 99%",
      text: "Узлы связи · 11 полей. Не хватает: описание (1%)",
      bars: [40, 62, 48, 80, 70, 30, 92],
    },
    footer: "Скачать отчёт можно из любого раздела",
  },
]

export const groupItems = (g: NavGroup) => g.columns.flat().flatMap((b) => b.items)

/** Все разделы без повторов (один раздел может стоять в двух группах). */
export const ALL_SECTIONS: Section[] = [
  ...new Map(
    NAV_GROUPS.flatMap(groupItems)
      .flatMap((x) => (x.section ? [x.section] : []))
      .map((x) => [x.slug, x] as const),
  ).values(),
]

export function findSection(slug: string) {
  return ALL_SECTIONS.find((x) => x.slug === slug)
}

/** Группа, к которой относится раздел (первая по порядку меню). */
export function groupOf(slug: string) {
  return NAV_GROUPS.find((g) => groupItems(g).some((x) => x.section?.slug === slug))
}
