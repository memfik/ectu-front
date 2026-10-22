import { filialId } from "@/lib/api/session"
import type { ApiSource } from "@/lib/list/types"
import { ASTANA, branchOf, coords, get, n, s, type Raw } from "@/sections/api-helpers"
import type { NodeRow } from "./data"

/* ---------- Узлы связи ---------- */

/** nodeStatusUtils.js: active «В работе», inactive «Расформирован», pending «В ожидании», «Арендуемый». */
const NODE_STATUS: Record<string, NodeRow["status"]> = { active: "work", inactive: "off", pending: "rebuild", Арендуемый: "work" }
const NODE_STATUS_BACK: Record<NodeRow["status"], string> = { work: "active", off: "inactive", rebuild: "pending" }

export const nodesApi: ApiSource<NodeRow> = {
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
