import { Monitor } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { STD_KPI, num, pick } from "@/sections/spec-helpers"

/**
 * Форма учёта OneWeb (макет 42): станции из мониторинга OneWeb (в старом фронте — `oneweb-monitor`, РФ-ДИППП-08).
 * TODO(API): эндпоинт списка станций мониторинга не найден в techaccaunt_front — пока примерные данные.
 */
export const spec: Spec = {
  key: "oneweb-form",
  num: "42",
  title: "Форма учёта OneWeb",
  crumb: "Оборудование / Мониторинг OneWeb",
  sub: "Форма учёта · Станции OneWeb",
  icon: Monitor,
  hero: "/nodes/g-2.jpg",
  total: 442,
  unit: ["станция", "станции", "станций"],
  search: "Поиск по названию, S/N, IMEI, IP…",
  kpis: [
    { t: "Работает", color: "var(--status-ok)", value: "362", note: "82%", pct: 82 },
    { t: "Простой", color: "var(--status-nolink)", value: "62", note: "" },
    { t: "Не запускалась", color: "#8c919b", value: "38", note: "" },
    ...STD_KPI("", "", "").slice(1),
  ],
  statuses: { work: ["В работе", "ok"], idle: ["Простой", "warn"], never: ["Не запускалась", "muted"] },
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "station", t: "Название станции", show: "bold", required: true },
    { k: "serial", t: "Серийный номер", required: true },
    { k: "ip", t: "IP-адрес", show: "muted" },
    { k: "coords", t: "Широта, долгота", show: "muted" },
    { k: "imei", t: "IMEI", hidden: true, required: true },
  ],
  seed: [
    { branch: "ЮФ", station: "SHI-012", serial: "HL1120-88231", imei: "35 881231 004412 7", ip: "100.64.12.18", coords: "44.1712, 66.7412", status: "work" },
    { branch: "ЮФ", station: "ZHN-004", serial: "HL1120-77120", imei: "35 881231 007120 2", ip: "100.64.12.40", coords: "44.7311, 66.7052", status: "work" },
    { branch: "ВФ", station: "KRK-002", serial: "OW50L-11823", imei: "35 881231 011823 9", ip: "100.64.18.2", coords: "49.4071, 75.4721", status: "work" },
    { branch: "ВФ", station: "AKS-019", serial: "HL1120-90011", imei: "35 881231 090011 4", ip: "100.64.18.90", coords: "47.7601, 82.8102", status: "work" },
  ],
  gen: (i, r, n) => {
    const st = r() > 0.82 ? pick(r, ["idle", "idle", "never"]) : "work"
    return {
      num: i + 1,
      station: `${n.code.slice(0, 3).toUpperCase()}-${String(num(r, 1, 40)).padStart(3, "0")}`,
      serial: `${pick(r, ["HL1120", "HL1120", "OW50L"])}-${num(r, 10000, 99999)}`,
      imei: `35 881231 ${num(r, 100000, 999999)} ${num(r, 0, 9)}`,
      ip: `100.64.${num(r, 10, 30)}.${num(r, 2, 250)}`,
      coords: `${n.ll[0].toFixed(4)}, ${n.ll[1].toFixed(4)}`,
      status: st,
    }
  },
  name: (x) => String(x.f.station),
  sub2: (x) => `${x.f.serial} · ${x.f.ip}`,
}

export const list = makeList(spec)
