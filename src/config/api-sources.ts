import type { GenRow } from "@/config/registry/make"
import type { NodeRow } from "@/data/nodes"
import type { SpdRow } from "@/data/spd"
import { filialId, filialShort } from "@/lib/api/session"
import type { ApiSource } from "@/lib/list/types"

/*
 * Источники данных в API техучёта по разделам. Поля и эндпоинты взяты из ../techaccaunt_front:
 * stores/columnConfigs.js (поля строк), services/api/modules/equipmentApi.js (пути), панели Action*Panel.vue (поля форм).
 * Живой API отсюда не проверялся (stage недоступен без VPN) — расхождения записываются в docs/backlog.md «Подключение API».
 */

type Raw = Record<string, unknown>

/** Значение по пути «node.nodes_name_id». */
export const get = (o: Raw, path: string): unknown => path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Raw)[k] : undefined), o)
const s = (o: Raw, path: string, def = "—") => {
  const v = get(o, path)
  return v === null || v === undefined || v === "" ? def : String(v)
}
const n = (o: Raw, path: string) => Number(get(o, path)) || 0
const branchOf = (o: Raw) => s(o, "filial.short_name", "") || filialShort(get(o, "filial_id") as number) || s(o, "filial", "—")

/** Координаты: в API встречаются разные имена — берём первое найденное. TODO(API): уточнить поле. */
function coords(o: Raw): [number, number] | null {
  for (const [a, b] of [
    ["latitude", "longitude"],
    ["lat", "lng"],
    ["lat", "lon"],
    ["node.latitude", "node.longitude"],
  ]) {
    const la = Number(get(o, a))
    const lo = Number(get(o, b))
    if (la && lo) return [la, lo]
  }
  const c = String(get(o, "coordinates") ?? get(o, "ys_jm_coordinates") ?? "").match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/)
  return c ? [Number(c[1]), Number(c[2])] : null
}
const ASTANA: [number, number] = [51.1282, 71.4304]

/* ---------- Узлы связи ---------- */

/** nodeStatusUtils.js: active «В работе», inactive «Расформирован», pending «В ожидании», «Арендуемый». */
const NODE_STATUS: Record<string, NodeRow["status"]> = { active: "work", inactive: "off", pending: "rebuild", Арендуемый: "work" }
const NODE_STATUS_BACK: Record<NodeRow["status"], string> = { work: "active", off: "inactive", rebuild: "pending" }

export const nodesApi: ApiSource<NodeRow> = {
  base: "/api/nodes",
  idParam: "node_id",
  trashKey: "nodes",
  sort: { code: "nodes_name_id", branch: "filial_id", city: "ys_jm_locality", network: "network_type", ownership: "ownership_form", status: "status" },
  filter: { branch: "filial", region: "ys_jm_locality", objectType: "object_name", network: "network_type", ownership: "ownership_form", status: "status" },
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
      status: NODE_STATUS[s(o, "status", "active")] ?? "work",
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
    ys_jm_address: x.address.replace(/^(г\.|с\.) [^,]+, /, ""),
    network_type: x.network,
    ownership_form: x.ownership === "rent" ? "Аренда" : "Собственный",
    operations_group: x.opsGroup,
    operations_group_location: x.opsPlace,
    distance_from_location_operation_group: x.opsKm,
    status: NODE_STATUS_BACK[x.status],
    description: x.comment,
    // TODO(API): technology / client_technology ждут id из /api/nodes/technologies, у нас — названия
  }),
}

/* ---------- СПД: коммутаторы и маршрутизаторы ---------- */

export const spdApi = (kind: SpdRow["kind"]): ApiSource<SpdRow> => ({
  base: "/api/spd-equipments",
  idParam: "equipment_id",
  trashKey: "spd_equipments",
  // TODO(API): как старый фронт отделяет коммутаторы от маршрутизаторов в /filter — предполагаем equipment_type
  fixed: { equipment_type: kind },
  sort: { branch: "filial_id", host: "domain_name", nodeCode: "node_id", city: "city", network: "network_type", ip: "management_ip" },
  filter: { branch: "filial", network: "network_type", model: "model", vendor: "vendor" },
  map: (o) => {
    const ll = coords(o)
    const total = n(o, "total_ports") || n(o, "ports_count") || (kind === "switch" ? 28 : 8)
    return {
      id: n(o, "id"),
      num: n(o, "number"),
      kind,
      host: s(o, "domain_name"),
      vendor: s(o, "vendor", ""),
      model: s(o, "model", s(o, "equipment_model")),
      serial: s(o, "serial_number"),
      os: s(o, "os_type", s(o, "software_version")),
      ip: s(o, "management_ip"),
      branch: branchOf(o),
      nodeId: n(o, "node_id") || n(o, "node.id"),
      nodeCode: s(o, "node.nodes_name_id"),
      city: s(o, "city"),
      address: s(o, "node_address"),
      network: s(o, "network_type", "") as SpdRow["network"],
      status: "work",
      // TODO(API): занятость портов — /api/spd-equipments/{id}/port-capacity, в списке нет
      portsUsed: n(o, "used_ports"),
      portsTotal: total,
      smartnet: null,
      contract: s(o, "contract_number", ""),
      mol: s(o, "mol.name", "") || null,
      backup: false,
      bgp: [0, 0],
      since: s(o, "created_at", "").slice(0, 10).split("-").reverse().join("."),
      ll: ll ?? ASTANA,
    }
  },
  payload: (x) => ({
    filial_id: filialId(x.branch),
    node_id: x.nodeId,
    number: x.num,
    network_type: x.network,
    equipment_type: x.kind,
    domain_name: x.host,
    management_ip: x.ip,
    model: x.model,
    os_type: x.os,
    serial_number: x.serial,
  }),
})

/* ---------- Разделы из конструктора (07…25) ---------- */

type Gen = {
  base: string
  list?: string
  idParam?: string
  trashKey?: string
  readOnly?: boolean
  sortDir?: string
  /** Поле раздела → путь в записи API */
  fields: Record<string, string | ((o: Raw) => string | number)>
  /** Статус API → ключ статуса раздела */
  status?: (o: Raw) => string
  node?: string
  filter?: Record<string, string>
}

const pairOf = (a: string, b: string) => (o: Raw) => (get(o, b) ? `${s(o, a, "0")} / ${s(o, b)}` : "—")

function genApi(g: Gen): ApiSource<GenRow> {
  return {
    base: g.base,
    list: g.list,
    idParam: g.idParam ?? "equipment_id",
    trashKey: g.trashKey,
    readOnly: g.readOnly,
    sortDir: g.sortDir,
    sort: { branch: "filial_id", ...Object.fromEntries(Object.entries(g.fields).filter(([, v]) => typeof v === "string").map(([k, v]) => [k, (v as string).split(".")[0]])) },
    filter: { branch: "filial", ...g.filter },
    map: (o) => {
      const f: Record<string, string | number> = {}
      for (const [k, p] of Object.entries(g.fields)) f[k] = typeof p === "function" ? p(o) : s(o, p)
      const ll = coords(o)
      return {
        id: n(o, "id"),
        num: s(o, "number", s(o, "num", String(n(o, "id")))),
        branch: branchOf(o),
        nodeId: n(o, "node_id") || n(o, `${g.node ?? "node"}.id`),
        nodeCode: s(o, `${g.node ?? "node"}.nodes_name_id`, s(o, "node_code")),
        city: s(o, `${g.node ?? "node"}.ys_jm_locality`, ""),
        address: s(o, `${g.node ?? "node"}.ys_jm_address`, ""),
        ll: ll ?? ASTANA,
        status: g.status?.(o) ?? "work",
        f,
      }
    },
    // Обратно — те же поля (только простые пути)
    payload: (x) => ({
      filial_id: filialId(x.branch),
      node_id: x.nodeId || undefined,
      ...Object.fromEntries(Object.entries(g.fields).filter(([, p]) => typeof p === "string" && !p.includes(".")).map(([k, p]) => [p as string, x.f[k]])),
    }),
  }
}

export const GEN_SOURCES: Record<string, ApiSource<GenRow>> = {
  "fiber-lines": genApi({
    base: "/api/bols",
    idParam: "vols_id",
    trashKey: "bols",
    fields: {
      name: "route_name",
      route: (o) => `${s(o, "start_point")} → ${s(o, "end_point")}`,
      len: "route_length",
      total: "total_cable_length",
      cable: "cable_type",
      network: "network_type",
      // TODO(API): занятость волокон — нет в /filter (есть /api/bols/children)
      fibers: pairOf("used_fibers", "fiber_count"),
      owner: "cable_owner",
    },
    filter: { network: "network_type", owner: "cable_owner", cable: "cable_type" },
  }),
  "cable-lines": genApi({ base: "/api/kls", trashKey: "kls", fields: { name: "track_name", route: (o) => `${s(o, "start_point")} → ${s(o, "end_point")}`, len: "track_length", pairs: "total_copper_pairs", owner: "cable_owner" } }),
  "cable-ducts": genApi({ base: "/api/kk", trashKey: "kk", fields: { name: "section_name", wells: "well_count", len: "length", channels: "channel_count", puncture: "puncture", desc: "description" } }),
  odf: genApi({
    base: "/api/odf",
    trashKey: "odf",
    node: "node_a",
    fields: { nodeB: "node_b.nodes_name_id", mount: "mounting_type", ports: pairOf("used_ports", "total_ports"), conn: "connector_type" },
    filter: { mount: "mounting_type", conn: "connector_type" },
  }),
  masts: genApi({
    base: "/api/ams",
    trashKey: "ams",
    fields: { town: "node.ys_jm_locality", type: "ams_type", height: "height", owner: "platform_owner", place: "installation_address" },
    filter: { type: "ams_type", owner: "platform_owner" },
  }),
  prospects: genApi({
    base: "/api/potential-clients",
    idParam: "id",
    trashKey: "potential_clients",
    fields: { bin: "bin", company: "name", kind: "client_type", size: "size_category", dist: "distance_to_node" },
    status: (o) => {
      const v = s(o, "status", "").toLowerCase()
      return /клиент|client/.test(v) ? "client" : /обработ|processed/.test(v) && !/не /.test(v) ? "processed" : "none"
    },
    filter: { kind: "client_type", status: "status" },
  }),
  onyma: genApi({
    base: "/api/onyma-clients",
    list: "",
    idParam: "id",
    readOnly: true,
    sortDir: "sort_dir",
    fields: { company: "customer_name", account: "account_number", contract: "contract_number", segment: "segment", ip: "static_ip", speed: "speed" },
    status: (o) => (/закр|clos/i.test(s(o, "status", "")) ? "closed" : "active"),
    filter: { segment: "segment", status: "status" },
  }),
  "channel-ids": genApi({
    base: "/api/channels",
    idParam: "id",
    trashKey: "channels",
    fields: { cid: "channel_id", client: "client_provider_name", type: "channel_type.name", speed: "bandwidth", iface: "router", vlan: "vlan", traffic: "traffic_type.name" },
    status: (o) => (/авар|alarm/i.test(s(o, "status", "")) ? "alarm" : /резерв|reserve/i.test(s(o, "status", "")) ? "reserve" : "active"),
    filter: { type: "channel_type_id", traffic: "traffic_type_id" },
  }),
  "ip-plan": genApi({
    base: "/api/ip-address-plan",
    list: "/list",
    idParam: "id",
    trashKey: "ip_address_plans",
    fields: { ip: "ip_address", prefix: "prefix", client: "client_name", place: "location", speed: "speed", kcrm: "kcrm_request", eng: "manager_name" },
    status: (o) => (/тест|test/i.test(s(o, "status", "")) ? "test" : /своб|free/i.test(s(o, "status", "")) ? "free" : "active"),
  }),
  backups: genApi({
    base: "/api/network-backups",
    list: "",
    idParam: "id",
    readOnly: true,
    fields: { ip: "ip", host: "network_name", os: "os_type.name", date: "created_at", by: "created_by" },
    status: (o) => (/err|ошиб/i.test(s(o, "status", "")) ? "error" : /chang|измен/i.test(s(o, "status", "")) ? "changed" : "ok"),
  }),
  pbx: genApi({
    base: "/api/phone_station",
    trashKey: "phone_stations",
    fields: { object: "object_name", model: "station_model", capacity: pairOf("used_capacity", "mounted_capacity"), ota: "ota_count", network: "network_type" },
    filter: { network: "network_type", model: "station_model" },
  }),
  "number-capacity": genApi({
    base: "/api/phone_number_capacities",
    idParam: "phone_id",
    trashKey: "phone_capacities",
    fields: {
      code: (o) => `${s(o, "allocated_code")} · ${s(o, "allocated_start")}–${s(o, "allocated_end")}`,
      town: "city_or_region",
      mounted: pairOf("mounted_resource", "allocated_resource"),
      used: "used_resource",
      tu: "regulator_order_number_date_issuer",
    },
  }),
  pdh: genApi({ base: "/api/pdh-equipments", trashKey: "pdh_equipments", node: "node1", fields: { model: "model", e1: pairOf("e1_used", "e1_total"), client: "client", vendor: "vendor", serial: "serial_number" } }),
  sdh: genApi({ base: "/api/sdh-equipments", trashKey: "sdh_equipments", fields: { model: "sdh_multiplexer_model", stm: pairOf("stm_used", "stm_total"), vc: pairOf("vc12_used", "vc12_total"), vendor: "vendor" } }),
  dwdm: genApi({ base: "/api/dwdm-equipments", trashKey: "dwdm_equipments", fields: { model: "model", lambda: pairOf("lambda_used", "lambda_total"), dir: "direction" } }),
  rrl: genApi({
    base: "/api/rrl-equipments",
    trashKey: "rrl_equipments",
    fields: { route: (o) => `${s(o, "install_point_1")} — ${s(o, "install_point_2")}`, model: "model", bw: "throughput_mbps", len: "route_length_km", vendor: "vendor", freq: "frequency" },
    filter: { vendor: "vendor", model: "model" },
  }),
}
