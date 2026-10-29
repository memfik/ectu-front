import { DatabaseBackup } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, s } from "@/lib/api/helpers"
import { num, pick } from "@/sections/spec-helpers"

/** Резервные копии (макет 18): описание раздела и источник в API. */
export const spec: Spec = {
  key: "backups",
  num: "18",
  title: "Резервные копии",
  crumb: "Сервисы",
  sub: "Конфигурации сетевых устройств · ночной бэкап в 03:00",
  icon: DatabaseBackup,
  hero: "/equipment/switch-hero.jpg",
  total: 1300,
  unit: ["устройство", "устройства", "устройств"],
  search: "Поиск по IP или имени…",
  readOnly: true,
  noMap: true,
  kpis: [
    { t: "Ошибка", color: "#ff5257", value: "16", note: "", pct: 1 },
    { t: "Ожидание", color: "#8c919b", value: "0", note: "", pct: 0 },
    { t: "Изменились конфиги", color: "var(--status-nolink)", value: "23", note: "за сутки", pct: 2 },
    { t: "Хранение", color: "#a78bfa", value: "90 дней", note: "" },
  ],
  statuses: { ok: ["Успешно", "ok"], changed: ["Изменён", "info"], error: ["Ошибка", "bad"] },
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "ip", t: "IP адрес" },
    { k: "host", t: "Имя устройства", show: "bold" },
    { k: "os", t: "Тип ОС", filter: "Тип ОС" },
    { k: "st", t: "Статус", show: "status" },
    { k: "date", t: "Дата" },
    { k: "by", t: "Запустил", show: "muted" },
  ],
  seed: [
    { branch: "АС", ip: "10.13.93.x", host: "sw1.ast009", os: "ExtremeXOS", status: "ok", date: "07.10 03:00", by: "Система" },
    { branch: "ЮФ", ip: "217.196.19.x", host: "rt1.alm1", os: "IOS-XE", status: "ok", date: "07.10 03:00", by: "Система" },
    { branch: "ЮФ", ip: "10.13.93.x", host: "sw1.alm1", os: "IOS", status: "changed", date: "07.10 03:00", by: "Система" },
    { branch: "ВФ", ip: "192.168.78.152", host: "sw1.pvl53", os: "IOS", status: "error", date: "07.10 03:00", by: "Система" },
    { branch: "АС", ip: "192.168.26.1", host: "rt1.ast1", os: "IOS-XE", status: "ok", date: "07.10 11:40", by: "А. Галустьян" },
  ],
  gen: (i, r, n) => ({
    ip: `10.${num(r, 12, 13)}.${num(r, 1, 250)}.${num(r, 1, 250)}`,
    host: `sw${num(r, 0, 9)}.${n.code.slice(0, 3)}${num(r, 1, 60)}`,
    os: pick(r, ["ExtremeXOS", "IOS", "IOS-XE", "DGS"]),
    status: r() > 0.03 ? (r() > 0.97 ? "changed" : "ok") : "error",
    date: "07.10 03:00",
    by: "Система",
  }),
  name: (x) => String(x.f.host),
  sub2: (x) => `${x.f.ip} · ${x.f.os} · ${x.f.date}`,
  api: genApi({
    base: "/api/network-backups",
    list: "/devices",
    idParam: "id",
    readOnly: true,
    fields: { ip: "ip", host: "network_name", os: "os_type.name", date: "created_at", by: "created_by" },
    status: (o) => (/err|ошиб/i.test(s(o, "status", "")) ? "error" : /chang|измен/i.test(s(o, "status", "")) ? "changed" : "ok"),
  }),
}

export const list = makeList(spec)
