"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { BRANCH_FULL, blankEquip, nodeOptions, num, pair, pick, seedEquip, used, withNode, type Equip } from "./equipment"
import { genApi, pairOf } from "./helpers"
import { createSource } from "./source"
import { lineDetail, usTitle, type LineDetail } from "@/sections/lines/detail"

/*
 * 10 ODF — данные раздела (оптические кроссы). Без API — примеры в памяти вкладки.
 * API техучёта: /api/odf (узел А — node_a), удаление — /api/trash/soft-delete/odf.
 */

export type Odf = Equip<{
  /** Узел Б — направление кабеля */
  nodeB: string
  /** Тип монтажа */
  mount: string
  /** Порты «занято / всего» */
  ports: string
  /** Тип коннектора */
  conn: string
}>

/** Статусы по умолчанию (как у разделов без своих статусов). */
export const ODF_STATUS: Record<string, [string, Tone]> = {
  work: ["В работе", "ok"],
  repair: ["Ремонт", "warn"],
  off: ["Выведен", "bad"],
}
export const odfStatus = (x: Odf) => ODF_STATUS[x.status] ?? ["—", "muted" as Tone]

export const MOUNTS = ['Стоечный, 19"', "Настенный"]
export const CONNECTORS = ["SC/UPC", "SC/APC", "LC/UPC", "FC/UPC"]

export const odfName = (x: Odf) => `ODF · ${x.nodeCode}`
export const odfSub = (x: Odf) => `${x.nodeCode} → ${x.f.nodeB} · ${x.f.mount}`

export const odfs = createSource<Odf>({
  key: "odf",
  title: "ODF",
  name: odfName,
  seed: () =>
    seedEquip({
      key: "odf",
      total: 779,
      statuses: Object.keys(ODF_STATUS),
      gen: (i, r, n) => {
        const t = pick(r, [4, 8, 16, 32, 48])
        return {
          num: String(i + 1),
          nodeB: `${n.code.slice(0, 3)}${String(num(r, 1, 99)).padStart(3, "0")}.0${num(r, 1, 3)}.${n.code.split(".")[2] ?? "AS"}`,
          mount: r() > 0.2 ? 'Стоечный, 19"' : "Настенный",
          ports: used(r, t, 0.8),
          conn: pick(r, ["SC/UPC", "SC/UPC", "SC/APC", "LC/UPC"]),
        }
      },
    }),
  remote: genApi<Odf["f"]>({
    base: "/api/odf",
    trashKey: "odf",
    node: "node_a",
    fields: { nodeB: "node_b.nodes_name_id", mount: "mounting_type", ports: pairOf("used_ports", "total_ports"), conn: "connector_type" },
    filter: { mount: "mounting_type", conn: "connector_type" },
  }),
})

export const useOdfs = odfs.useAll
export const useOdf = odfs.useRecord

export const blankOdf = (): Odf => blankEquip("work", { nodeB: "", mount: "", ports: "", conn: "" })

/** «8 / 24» или «—» — иначе ошибка формата. */
export const checkPorts = (v: string) => (pair(v) || v === "—" ? undefined : "Формат: 8 / 24")

/** Колонки отчёта и аналитики заполненности — все поля кросса. */
export const odfColumns: ReportCol<Odf>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "nodeCode", t: "Идентификатор УС", value: (x) => x.nodeCode },
  { k: "nodeB", t: "Узел Б", value: (x) => x.f.nodeB },
  { k: "mount", t: "Монтаж", value: (x) => x.f.mount },
  { k: "ports", t: "Порты", value: (x) => x.f.ports },
  { k: "conn", t: "Коннектор", value: (x) => x.f.conn },
]

/** Импорт Excel: поля — как в форме. */
export const odfImport: ImportSpec<Odf> = {
  key: "odf",
  title: "ODF",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCH_FULL },
    { k: "nodeId", t: "Узел связи", required: true, opts: nodeOptions() },
    { k: "nodeB", t: "Узел Б" },
    { k: "mount", t: "Монтаж", opts: MOUNTS.map((v) => ({ v, label: v })) },
    { k: "ports", t: "Порты", check: checkPorts },
    { k: "conn", t: "Коннектор", opts: CONNECTORS.map((v) => ({ v, label: v })) },
    { k: "status", t: "Статус", required: true, opts: Object.entries(ODF_STATUS).map(([v, [label]]) => ({ v, label })) },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? { ...blankOdf(), num: String(id) }
    const str = (k: string) => String(v[k] ?? "")
    return withNode(
      {
        ...x,
        branch: str("branch"),
        status: str("status") || x.status,
        f: { ...x.f, nodeB: str("nodeB"), mount: str("mount"), ports: str("ports"), conn: str("conn") },
      },
      Number(v.nodeId),
    )
  },
  name: odfName,
  all: odfs.all,
  nextId: odfs.nextId,
  save: odfs.save,
}

/* ---------- паспорт ---------- */

/** Порты из записи: всего, занято (a), резерв (b — два, если помещаются). */
export function odfCount(x: Odf) {
  const m = String(x.f.ports).match(/(\d+) \/ (\d+)/)
  const total = m ? +m[2] : 8
  const a = m ? Math.min(+m[1], total) : 0
  return { total, a, b: a + 2 <= total ? 2 : 0 }
}

/**
 * Порты, направление, документы, история кросса. TODO(API): кроссировка портов — нет в /api/odf;
 * документы и история — пока примеры по номеру записи.
 */
export const odfDetail = (x: Odf): LineDetail =>
  lineDetail(x, {
    section: "odf",
    point: (i) => `Муфта М-${i + 1}`,
    count: (r) => odfCount(r as Odf),
    ends: (r, a, b) => [
      { code: r.nodeCode, title: a ? usTitle(a) : r.nodeCode, nodeId: a?.id },
      { code: String(r.f.nodeB ?? "—"), title: b ? usTitle(b) : "УС «РТПЦ»", nodeId: b?.id },
    ],
    inputDocs: [
      { t: "Форма учёта ODF", n: "XLSX" },
      { t: "Схема кросса", n: "PDF" },
      { t: "Фото", n: "3" },
    ],
    docs: [
      { name: "Форма учёта оптических кроссов (ODF)", req: "XLSX · 06.10.2026", uploaded: true },
      { name: "Схема кроссировки", req: "PDF", uploaded: true },
      { name: "Паспорт оборудования", req: "—", uploaded: false },
    ],
    lastEdit: (c) => ["Изменено «Задействовано портов»", String(Math.max(0, c.a - 1)), String(c.a)],
  })
