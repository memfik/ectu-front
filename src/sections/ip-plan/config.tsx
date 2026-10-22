import { Globe } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, s } from "@/sections/api-helpers"
import { num, pick } from "@/sections/spec-helpers"

/** Единый IP-план (макет 15): описание раздела и источник в API. */
export const spec: Spec = {
  key: "ip-plan",
  num: "15",
  title: "Единый IP-план",
  crumb: "Сервисы",
  sub: "Адресное пространство QMobile · доступ: admin, ip_manager",
  icon: Globe,
  hero: "/equipment/switch-hero.jpg",
  total: 14703,
  unit: ["запись", "записи", "записей"],
  search: "Поиск по IP, клиенту, локации…",
  noMap: true,
  kpis: [
    { t: "Адресов IPv4", color: "#a78bfa", value: "1,2 млн", note: "" },
    { t: "Занято", color: "#22d3ee", value: "61%", note: "", pct: 61 },
    { t: "Тестовый доступ", color: "var(--status-nolink)", value: "38", note: "истекает 9", pct: 20 },
    { t: "Не совпадает с Onyma", color: "#ff5257", value: "142", note: "", pct: 1 },
  ],
  statuses: { active: ["Активен", "ok"], test: ["Тест", "warn"], free: ["Свободен", "muted"] },
  cols: [
    { k: "ip", t: "IP-адрес", show: "bold" },
    { k: "prefix", t: "Префикс", opts: ["/30", "/29", "/28", "/24"], filter: "Префикс" },
    { k: "client", t: "Клиент" },
    { k: "place", t: "Локация", show: "muted" },
    { k: "speed", t: "Скорость" },
    { k: "kcrm", t: "Заявка KCRM" },
    { k: "eng", t: "Менеджер/Инженер" },
    { k: "branch", t: "Филиал" },
    { k: "st", t: "Статус", show: "status" },
  ],
  seed: [
    {
      ip: "185.12.40.1",
      prefix: "/30",
      client: "ТОО «Авиакомпания Орлан-2000»",
      place: "Кенесары 52",
      speed: "100 Мбит/с",
      kcrm: "88412",
      eng: "Д. Темирханова",
      branch: "АС",
      status: "active",
    },
    {
      ip: "185.12.40.5",
      prefix: "/30",
      client: "ТОО «Бота-2017»",
      place: "Кенесары 60",
      speed: "50 Мбит/с",
      kcrm: "88120",
      eng: "Д. Темирханова",
      branch: "АС",
      status: "active",
    },
    {
      ip: "185.12.40.9",
      prefix: "/30",
      client: "ИП «Сапарова А.»",
      place: "Кенесары 44",
      speed: "100 Мбит/с",
      kcrm: "88501",
      eng: "А. Нурланов",
      branch: "АС",
      status: "test",
    },
  ],
  gen: (i, r, n) => {
    const free = r() < 0.3
    return {
      ip: `185.${pick(r, [12, 14])}.${32 + Math.floor(i / 64)}.${(i % 64) * 4 + 1}`,
      prefix: pick(r, ["/30", "/30", "/29", "/28"]),
      client: free ? "—" : `${pick(r, ["ТОО", "ИП", "АО"])} «${pick(r, ["Нур", "Самал", "Каспий"])} ${pick(r, ["Групп", "Сервис"])}»`,
      place: free ? "—" : n.address.replace(/^г\. [^,]+, /, ""),
      speed: free ? "—" : pick(r, ["50 Мбит/с", "100 Мбит/с", "1 Гбит/с"]),
      kcrm: free ? "—" : String(num(r, 80000, 89999)),
      eng: free ? "—" : pick(r, ["Д. Темирханова", "А. Нурланов", "Б. Дегтярь"]),
      status: free ? "free" : r() > 0.03 ? "active" : "test",
    }
  },
  name: (x) => `${x.f.ip}${x.f.prefix}`,
  sub2: (x) => `${x.f.client} · ${x.f.place}`,
  api: genApi({
    base: "/api/ip-address-plan",
    list: "/list",
    idParam: "id",
    trashKey: "ip_address_plans",
    fields: {
      ip: "ip_address",
      prefix: "prefix",
      client: "client_name",
      place: "location",
      speed: "speed",
      kcrm: "kcrm_request",
      eng: "manager_name",
    },
    status: (o) => (/тест|test/i.test(s(o, "status", "")) ? "test" : /своб|free/i.test(s(o, "status", "")) ? "free" : "active"),
  }),
}

export const list = makeList(spec)
