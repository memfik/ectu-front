import { filialId } from "@/lib/api/session"
import type { ApiSource } from "@/lib/list/types"
import { ASTANA, coords, n, s, branchOf } from "@/lib/api/helpers"
import type { SpdRow } from "./data"

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
