"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import { api, apiOn } from "./client"
import { num, pick, seedEquip, type Equip } from "./equipment"
import { genApi, s } from "./helpers"
import { createSource } from "./source"

/*
 * 18 Резервные копии — данные раздела: устройства с последним бэкапом конфигурации. Без API — примеры в памяти вкладки
 * (первые 5 устройств из макета). API техучёта — /api/network-backups (как networkBackupApi в techaccaunt_front):
 * /devices, /content/{id}, /download/{id}, /fetch-config { device_ids }. Раздел только для чтения.
 */

export type Backup = Equip<{
  ip: string
  /** Имя устройства («sw1.ast009») */
  host: string
  /** Тип ОС */
  os: string
  /** Дата последней копии «07.10 03:00» */
  date: string
  /** Кто запустил */
  by: string
}>

export const BACKUP_STATUS: Record<string, [string, Tone]> = {
  ok: ["Успешно", "ok"],
  changed: ["Изменён", "info"],
  error: ["Ошибка", "bad"],
}
export const backupStatus = (x: Backup) => BACKUP_STATUS[x.status] ?? ["—", "muted" as Tone]

export const backupName = (x: Backup) => String(x.f.host)
export const backupSub = (x: Backup) => `${x.f.ip} · ${x.f.os} · ${x.f.date}`

const SEED = [
  { branch: "АС", ip: "10.13.93.x", host: "sw1.ast009", os: "ExtremeXOS", status: "ok", date: "07.10 03:00", by: "Система" },
  { branch: "ЮФ", ip: "217.196.19.x", host: "rt1.alm1", os: "IOS-XE", status: "ok", date: "07.10 03:00", by: "Система" },
  { branch: "ЮФ", ip: "10.13.93.x", host: "sw1.alm1", os: "IOS", status: "changed", date: "07.10 03:00", by: "Система" },
  { branch: "ВФ", ip: "192.168.78.152", host: "sw1.pvl53", os: "IOS", status: "error", date: "07.10 03:00", by: "Система" },
  { branch: "АС", ip: "192.168.26.1", host: "rt1.ast1", os: "IOS-XE", status: "ok", date: "07.10 11:40", by: "А. Галустьян" },
]

export const backups = createSource<Backup>({
  key: "backups",
  title: "Резервные копии",
  name: backupName,
  seed: () =>
    seedEquip<Backup["f"]>({
      key: "backups",
      total: 1300,
      statuses: Object.keys(BACKUP_STATUS),
      seed: SEED,
      gen: (i, r, n) => {
        // статус — в полях записи (seedEquip берёт его оттуда), как в прежнем описании раздела
        const f = {
          ip: `10.${num(r, 12, 13)}.${num(r, 1, 250)}.${num(r, 1, 250)}`,
          host: `sw${num(r, 0, 9)}.${n.code.slice(0, 3)}${num(r, 1, 60)}`,
          os: pick(r, ["ExtremeXOS", "IOS", "IOS-XE", "DGS"]),
          status: r() > 0.03 ? (r() > 0.97 ? "changed" : "ok") : "error",
          date: "07.10 03:00",
          by: "Система",
        }
        return f
      },
    }),
  remote: genApi<Backup["f"]>({
    base: "/api/network-backups",
    list: "/devices",
    idParam: "id",
    readOnly: true,
    fields: { ip: "ip", host: "network_name", os: "os_type.name", date: "created_at", by: "created_by" },
    status: (o) => (/err|ошиб/i.test(s(o, "status", "")) ? "error" : /chang|измен/i.test(s(o, "status", "")) ? "changed" : "ok"),
  }),
})

export const useBackups = backups.useAll
export const useBackup = backups.useRecord

/** Колонки отчёта и аналитики заполненности. */
export const backupColumns: ReportCol<Backup>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "ip", t: "IP адрес", value: (x) => x.f.ip },
  { k: "host", t: "Имя устройства", value: (x) => x.f.host },
  { k: "os", t: "Тип ОС", value: (x) => x.f.os },
  { k: "st", t: "Статус", value: (x) => backupStatus(x)[0] },
  { k: "date", t: "Дата", value: (x) => x.f.date },
  { k: "by", t: "Запустил", value: (x) => x.f.by },
]

/* ---------- конфиг устройства ---------- */

/** Пример конфига для просмотра: строки с пометкой «-» удалены, «+» добавлены (сравнение с прошлым днём). */
export function backupConfig(x: Backup) {
  return [
    `! ${x.f.host} · 07.10.2026 03:00 · сравнение с 06.10`,
    `hostname ${x.f.host}`,
    "!",
    "interface GigabitEthernet1/0/12",
    " description FTTB Mametovoi 65 ID-00248",
    "- switchport access vlan 120",
    "+ switchport access vlan 124",
    " spanning-tree portfast",
    "!",
    "interface GigabitEthernet1/0/25",
    " description uplink rt1.alm1",
    " switchport mode trunk",
    "+ switchport trunk allowed vlan add 124",
    "!",
    "ip default-gateway 10.13.93.1",
    "end",
  ]
}

/** Содержимое последнего бэкапа из API. TODO(API): id бэкапа устройства (сейчас берётся id строки). */
export const fetchBackupContent = (id: number) =>
  api.get<{ content?: string } | string>(`/api/network-backups/content/${id}`).then((d) => (typeof d === "string" ? d : (d.content ?? "")))

/** Ссылка на файл конфига (только в режиме API). */
export const backupDownloadUrl = (id: number) => (apiOn() ? `${process.env.NEXT_PUBLIC_API_URL}/api/network-backups/download/${id}` : null)

/** Снять конфиг сейчас: в API — /fetch-config, без API — ничего. */
export async function fetchBackups(ids: number[]) {
  if (apiOn()) await api.post("/api/network-backups/fetch-config", { device_ids: ids })
}
