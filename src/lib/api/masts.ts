"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, pick, seedEquip, withNode, type Equip, type Val } from "./equipment"
import { genApi } from "./helpers"
import { createSource } from "./source"
import { lineDetail, type LineDetail } from "@/sections/lines/detail"

/*
 * 11 АМС — данные раздела (антенно-мачтовые сооружения). Без API — примеры в памяти вкладки.
 * API техучёта: /api/ams, удаление — /api/trash/soft-delete/ams.
 */

export type Mast = Equip<{
  /** Населённый пункт */
  town: string
  /** Тип АМС */
  type: string
  /** Высота, м */
  height: Val
  /** Собственник площадки */
  owner: string
  /** Адрес установки */
  place: string
}>

/** Статусы по умолчанию (как у разделов без своих статусов). */
export const MAST_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const mastStatus = (x: Mast) => MAST_STATUS[x.status] ?? ["—", "muted" as Tone]

export const MAST_TYPES = ["Мачта", "Башня", "Труба", "Кровельная стойка"]

export const mastName = (x: Mast) => `АМС ${x.nodeCode}`
export const mastSub = (x: Mast) => `${x.f.type} · ${x.f.height} м · ${x.f.town}`

export const masts = createSource<Mast>({
  key: "masts",
  title: "АМС",
  name: mastName,
  seed: () =>
    seedEquip({
      key: "masts",
      total: 38,
      statuses: Object.keys(MAST_STATUS),
      gen: (i, r, n) => ({
        num: String(i + 1),
        town: `г. ${n.city}`,
        type: r() > 0.16 ? "Мачта" : "Башня",
        height: pick(r, [20, 25, 30, 35, 40, 50, 60, 72]) as Val,
        owner: r() > 0.33 ? "АО «QMobile»" : pick(r, ["КТО", "ТОО «Казахтелеком»", "Частная"]),
        place: `${n.address.replace(/^г\. [^,]+, /, "")}, кровля`,
      }),
    }),
  remote: genApi<Mast["f"]>({
    base: "/api/ams",
    trashKey: "ams",
    fields: { town: "node.ys_jm_locality", type: "ams_type", height: "height", owner: "platform_owner", place: "installation_address" },
    filter: { type: "ams_type", owner: "platform_owner" },
  }),
})

export const useMasts = masts.useAll
export const useMast = masts.useRecord

export const blankMast = (): Mast => blankEquip("work", { town: "", type: "", height: "", owner: "", place: "" })

/** Колонки отчёта и аналитики заполненности — все поля АМС. */
export const mastColumns: ReportCol<Mast>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "town", t: "Населённый пункт", value: (x) => x.f.town },
  { k: "type", t: "Тип", value: (x) => x.f.type },
  { k: "height", t: "Высота, м", value: (x) => x.f.height },
  { k: "owner", t: "Собственник площадки", value: (x) => x.f.owner },
  { k: "place", t: "Адрес установки", value: (x) => x.f.place },
]

/** Импорт Excel: поля — как в форме. */
export const mastsImport: ImportSpec<Mast> = {
  key: "masts",
  title: "АМС",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "town", t: "Населённый пункт" },
    { k: "type", t: "Тип", opts: MAST_TYPES.map((v) => ({ v, label: v })) },
    { k: "height", t: "Высота, м" },
    { k: "owner", t: "Собственник площадки" },
    { k: "place", t: "Адрес установки" },
    { k: "status", t: "Статус", required: true, opts: Object.entries(MAST_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankMast(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, town: str("town"), type: str("type"), height: str("height"), owner: str("owner"), place: str("place") },
      },
      Number(v.nodeId),
    )
  },
  name: mastName,
  all: masts.all,
  nextId: masts.nextId,
  save: masts.save,
}

/* ---------- паспорт ---------- */

/**
 * Площадки (жилы паспорта: три, две заняты), документы, история. TODO(API): площадки и нагрузка — нет в /api/ams;
 * документы и история — пока примеры по номеру записи.
 */
export const mastDetail = (x: Mast): LineDetail =>
  lineDetail(x, {
    section: "masts",
    point: (i) => `Опора ${i + 1}`,
    count: () => ({ total: 3, a: 2, b: 0 }),
    ends: (r, a) => [
      { code: r.nodeCode, title: a ? a.object : r.nodeCode, nodeId: a?.id },
      { code: "—", title: "УС «РТПЦ»" },
    ],
    inputDocs: [
      { t: "Право землепользования", n: "есть" },
      { t: "Рабочий проект", n: "есть" },
      { t: "Экспертное заключение", n: "нет" },
    ],
    docs: [
      { name: "Право землепользования с соответствующим целевым назначением", req: "Акт № 4410", uploaded: true },
      { name: "Рабочий проект с расчётами несущей способности фундаментов и металлоконструкции", req: "PDF · 42 МБ", uploaded: true },
      { name: "Экспертное заключение в области строительства на проектную документацию", req: "—", uploaded: false },
      { name: "Исполнительная документация с сертификатами качества", req: "PDF", uploaded: true },
      { name: "Документы по приёмке АМС в эксплуатацию", req: "—", uploaded: false },
    ],
    lastEdit: () => ["Изменено «Существующая нагрузка»", "2 РРЛ", "4 сектора LTE + 2 РРЛ"],
  })
