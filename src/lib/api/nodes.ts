"use client"

import type { Tone } from "@/components/list/ui"
import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { filialId } from "@/lib/api/session"
import { BRANCHES, nodeRows, OBJECT_TYPES, opsLabel, REGION, STATUS_LABEL, type NodeRow, type NodeStatus } from "@/sections/nodes/data"
import { ASTANA, branchOf, coords, get, n, s, type Raw } from "./helpers"
import type { RemoteSource } from "./remote"
import { createSource } from "./source"

/*
 * 02 Узлы связи — данные раздела. Без API — примеры в памяти вкладки (nodeRows(): 10 из макета + сгенерированные до 1 387).
 * API техучёта: /api/nodes (/filter, /pasport?node_id=, /create, /update, /filter-params), удаление — /api/trash/soft-delete/nodes.
 * Справочники и генератор примеров пока в sections/nodes/data.ts — их читают другие разделы.
 */

export type { NodeRow, NodeStatus }
export { BRANCHES, opsLabel, STATUS_LABEL }

export const NODE_TONE: Record<NodeStatus, Tone> = { work: "ok", rebuild: "warn", off: "bad" }
export const nodeStatus = (x: NodeRow): [string, Tone] => [STATUS_LABEL[x.status] ?? "—", NODE_TONE[x.status] ?? "muted"]

export const NODE_STATUSES: NodeStatus[] = ["work", "rebuild", "off"]
export const NETWORKS: NodeRow["network"][] = ["ГМС", "ГРС", "ГАС", "МС"]
export const OWNERSHIP: Record<NodeRow["ownership"], string> = { own: "Собственный", rent: "Аренда" }
/** Технологии подключения — варианты в форме. */
export const TECH = ["FTTH", "FTTB", "GPON", "xDSL", "Ethernet", "РРЛ", "Wi-Fi", "LTE"]
/** Технологии — варианты фильтра списка. */
export const TECH_FILTER = ["FTTH", "FTTB", "xDSL", "РРЛ"]
export const REGIONS = [...new Set(Object.values(REGION))].sort()
export { OBJECT_TYPES }

export const nodeName = (x: NodeRow) => x.code
/** Адрес без «г. Город, ». */
export const street = (address: string) => address.replace(/^(г\.|с\.) [^,]+, /, "")

/* ---------- API ---------- */

/** nodeStatusUtils.js: active «В работе», inactive «Расформирован», pending «В ожидании», «Арендуемый». */
const STATUS_IN: Record<string, NodeStatus> = { active: "work", inactive: "off", pending: "rebuild", Арендуемый: "work" }
const STATUS_OUT: Record<NodeStatus, string> = { work: "active", off: "inactive", rebuild: "pending" }

export const nodesRemote: RemoteSource<NodeRow> = {
  base: "/api/nodes",
  idParam: "node_id",
  trashKey: "nodes",
  sort: {
    code: "nodes_name_id",
    branch: "filial_id",
    city: "ys_jm_locality",
    network: "network_type",
    ownership: "ownership_form",
    status: "status",
  },
  filter: {
    branch: "filial",
    region: "ys_jm_locality",
    objectType: "object_name",
    network: "network_type",
    ownership: "ownership_form",
    status: "status",
  },
  map: (o) => {
    const ll = coords(o)
    const tech = (get(o, "connection_technologies") as Raw[] | undefined)?.map((t) => s(t, "technology")) ?? []
    const techC = (get(o, "connection_technology_clients") as Raw[] | undefined)?.map((t) => s(t, "client_technology")) ?? []
    const own = s(o, "ownership_form", "")
    const city = s(o, "ys_jm_locality", "")
    return {
      id: n(o, "id"),
      code: s(o, "nodes_name_id"),
      object: s(o, "object_name"),
      address: [city && `г. ${city}`, s(o, "ys_jm_address", "")].filter(Boolean).join(", "),
      branch: branchOf(o),
      city,
      network: s(o, "network_type", "") as NodeRow["network"],
      ownership: /аренд/i.test(own) || s(o, "status", "") === "Арендуемый" ? "rent" : "own",
      tech: techC,
      techNode: tech,
      // TODO(API): волокна по узлу — нет в /filter; считать по ВОЛС узла
      fibers: null,
      status: STATUS_IN[s(o, "status", "active")] ?? "work",
      num: n(o, "num"),
      opsGroup: s(o, "operations_group", ""),
      opsKm: Number(String(get(o, "distance_from_location_operation_group") ?? "0").replace(",", ".")) || 0,
      opsPlace: s(o, "operations_group_location", ""),
      comment: s(o, "description", ""),
      updated: s(o, "updated_at", "").slice(0, 10).split("-").reverse().join("."),
      equipment: n(o, "equipments_count"),
      idChannels: n(o, "channels_count"),
      clients: n(o, "clients_count"),
      onMap: !!ll,
      hasDocs: n(o, "files_count") > 0,
      ll: ll ?? ASTANA,
      region: city,
      objectType: s(o, "object_name"),
    }
  },
  // Поля как в ActionNodePanel.vue (submitForm → /api/nodes/create|update)
  payload: (x) => ({
    filial_id: filialId(x.branch),
    num: x.num,
    nodes_name_id: x.code,
    object_name: x.object,
    ys_jm_locality: x.city,
    ys_jm_address: street(x.address),
    network_type: x.network,
    ownership_form: x.ownership === "rent" ? "Аренда" : "Собственный",
    operations_group: x.opsGroup,
    operations_group_location: x.opsPlace,
    distance_from_location_operation_group: x.opsKm,
    status: STATUS_OUT[x.status],
    description: x.comment,
    // TODO(API): technology / client_technology ждут id из /api/nodes/technologies, у нас — названия
  }),
}

export const nodes = createSource<NodeRow>({
  key: "nodes",
  title: "Узлы связи",
  name: nodeName,
  seed: nodeRows,
  remote: nodesRemote,
})

export const useNodes = nodes.useAll
export const useNode = nodes.useRecord

/** Пустой узел для «Создать»: тип сети и статус пустые — в форме «Выберите…». */
export const blankNode = (id = 0): NodeRow => ({
  id,
  code: "",
  object: "",
  address: "",
  branch: "",
  city: "",
  network: "" as NodeRow["network"],
  ownership: "own",
  tech: [],
  techNode: [],
  fibers: null,
  status: "" as NodeStatus,
  num: 0,
  opsGroup: "",
  opsKm: 0,
  opsPlace: "",
  comment: "",
  updated: "",
  equipment: 0,
  idChannels: 0,
  clients: 0,
  onMap: false,
  hasDocs: false,
  ll: [51.1282, 71.4304],
  region: "",
  objectType: OBJECT_TYPES[0],
})

/* ---------- значения формы (форма и импорт) ---------- */

/** Поля формы — строками (теги — списками), как в инпутах. */
export type NodeValues = {
  branch: string
  num: string
  code: string
  object: string
  city: string
  address: string
  network: string
  ownership: string
  status: string
  opsGroup: string
  opsKm: string
  opsPlace: string
  techNode: string[]
  tech: string[]
  comment: string
}

export const nodeValues = (x: NodeRow): NodeValues => ({
  branch: x.branch,
  num: x.num ? String(x.num) : "",
  code: x.code,
  object: x.object,
  city: x.city,
  address: street(x.address),
  network: x.network,
  ownership: x.ownership,
  status: x.status,
  opsGroup: x.opsGroup,
  opsKm: x.opsKm || x.opsGroup ? String(x.opsKm).replace(".", ",") : "",
  opsPlace: x.opsPlace,
  techNode: x.techNode,
  tech: x.tech,
  comment: x.comment,
})

/** Значения формы → запись; дата изменения — сегодня. */
export const applyNodeValues = (x: NodeRow, v: NodeValues): NodeRow => ({
  ...x,
  branch: v.branch,
  num: Number(v.num) || 0,
  code: v.code.trim(),
  object: v.object,
  city: v.city,
  region: REGION[v.city] ?? x.region,
  address: `г. ${v.city}, ${v.address}`,
  network: v.network as NodeRow["network"],
  ownership: v.ownership as NodeRow["ownership"],
  status: v.status as NodeStatus,
  opsGroup: v.opsGroup,
  opsKm: Number(v.opsKm.replace(",", ".")) || 0,
  opsPlace: v.opsPlace,
  techNode: v.techNode,
  tech: v.tech,
  comment: v.comment,
  updated: new Date().toLocaleDateString("ru-RU"),
})

/** «url002.01.UF» или «sw12.akb001» — иначе ошибка формата. */
export const checkCode = (v: string) => (/^[a-z]{2,4}\d{3}\.\d{2}\.[A-Z]{2}$|^sw\d+\.[a-z]{3}\d{3}$/.test(v) ? undefined : "Формат: url002.01.UF")

/* ---------- отчёт и импорт ---------- */

/** Колонки отчёта (n-08) и аналитики заполненности. */
export const nodeColumns: ReportCol<NodeRow>[] = [
  { k: "branch", t: "Филиал", value: (x) => x.branch },
  { k: "num", t: "Порядковый №", value: (x) => x.num },
  { k: "code", t: "ID узла связи", value: (x) => x.code },
  { k: "city", t: "Населённый пункт", value: (x) => x.city },
  { k: "address", t: "Адрес", value: (x) => x.address },
  { k: "object", t: "Объект", value: (x) => x.object },
  { k: "network", t: "Тип сети", value: (x) => x.network },
  { k: "ownership", t: "Форма владения", value: (x) => OWNERSHIP[x.ownership] },
  { k: "opsGroup", t: "Группа эксплуатации", value: (x) => x.opsGroup },
  { k: "opsKm", t: "Удалённость от ГЭ", value: (x) => x.opsKm },
  { k: "tech", t: "Технологии", value: (x) => [...new Set([...x.techNode, ...x.tech])].join(", "), off: true },
  { k: "comment", t: "Комментарий", value: (x) => x.comment, off: true },
]

const opts = (list: string[]) => list.map((v) => ({ v, label: v }))

/** Импорт Excel: поля — как в форме. */
export const nodesImport: ImportSpec<NodeRow> = {
  key: "nodes",
  title: "Узлы связи",
  fields: [
    { k: "branch", t: "Филиал", required: true, opts: BRANCHES.map((b) => ({ v: b.v, label: b.full })) },
    { k: "num", t: "Нумерация", required: true },
    { k: "code", t: "Идентификатор (ID) узла связи", required: true, check: checkCode },
    { k: "object", t: "Наименование объекта связи", required: true },
    { k: "city", t: "Населённый пункт узла связи", required: true },
    { k: "address", t: "Адрес" },
    { k: "network", t: "Тип сети", required: true, opts: opts(NETWORKS) },
    { k: "ownership", t: "Форма владения", opts: Object.entries(OWNERSHIP).map(([v, label]) => ({ v, label })) },
    { k: "status", t: "Статус", required: true, opts: NODE_STATUSES.map((v) => ({ v, label: STATUS_LABEL[v] })) },
    { k: "opsGroup", t: "Группа эксплуатации" },
    { k: "opsKm", t: "Удалённость УС от ГЭ, км" },
    { k: "opsPlace", t: "Место расположения ГЭ" },
    { k: "techNode", t: "Технологии подключения УС / ТП", tags: true, opts: opts(TECH) },
    { k: "tech", t: "Технологии подключения клиентов в ТП", tags: true, opts: opts(TECH) },
    { k: "comment", t: "Комментарий" },
  ],
  build: (v, base, id = 0) => {
    const x = base ?? blankNode(id)
    const str = (k: string) => String(v[k] ?? "")
    const list = (k: string) => (Array.isArray(v[k]) ? (v[k] as string[]) : [])
    return applyNodeValues(x, {
      branch: str("branch"),
      num: str("num"),
      code: str("code"),
      object: str("object"),
      city: str("city"),
      address: str("address"),
      network: str("network"),
      ownership: str("ownership") || x.ownership,
      status: str("status"),
      opsGroup: str("opsGroup"),
      opsKm: str("opsKm"),
      opsPlace: str("opsPlace"),
      techNode: list("techNode"),
      tech: list("tech"),
      comment: str("comment"),
    })
  },
  name: nodeName,
  all: nodes.all,
  nextId: nodes.nextId,
  save: nodes.save,
}
