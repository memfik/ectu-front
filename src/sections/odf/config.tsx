import { Server } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf } from "@/sections/api-helpers"
import { LINES, num, pick, used } from "@/sections/spec-helpers"

/** ODF (макет 10): описание раздела и источник в API. */
export const spec: Spec = {
  key: "odf",
  num: "10",
  title: "ODF",
  crumb: LINES,
  sub: "Форма учёта оптических кроссов (ODF)",
  icon: Server,
  hero: "/nodes/g-3.jpg",
  total: 779,
  unit: ["кросс", "кросса", "кроссов"],
  search: "Узел А, узел Б…",
  kpis: [
    { t: "Портов", color: "#a78bfa", value: "38 400", note: "" },
    { t: "Задействовано", color: "#22d3ee", value: "71%", note: "27 260", pct: 71 },
    { t: "Заполнены > 90%", color: "#ff5257", value: "112", note: "кроссов", pct: 14 },
    { t: "Без схемы", color: "var(--status-nolink)", value: "380", note: "37%", pct: 37 },
    { t: "На карте", color: "var(--status-ok)", value: "1 002", note: "96%", pct: 96 },
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "nodeCode", t: "Узел А", show: "bold" },
    { k: "nodeB", t: "Узел Б" },
    { k: "mount", t: "Монтаж", opts: ['Стоечный, 19"', "Настенный"], filter: "Тип монтажа" },
    { k: "ports", t: "Порты", show: "pair" },
    { k: "conn", t: "Коннектор", opts: ["SC/UPC", "SC/APC", "LC/UPC", "FC/UPC"], filter: "Тип коннектора" },
  ],
  gen: (i, r, n) => {
    const t = pick(r, [4, 8, 16, 32, 48])
    return {
      num: i + 1,
      nodeB: `${n.code.slice(0, 3)}${String(num(r, 1, 99)).padStart(3, "0")}.0${num(r, 1, 3)}.${n.code.split(".")[2] ?? "AS"}`,
      mount: r() > 0.2 ? 'Стоечный, 19"' : "Настенный",
      ports: used(r, t, 0.8),
      conn: pick(r, ["SC/UPC", "SC/UPC", "SC/APC", "LC/UPC"]),
    }
  },
  name: (x) => `ODF · ${x.nodeCode}`,
  sub2: (x) => `${x.nodeCode} → ${x.f.nodeB} · ${x.f.mount}`,
  bar: (x) => {
    const m = String(x.f.ports).match(/(\d+) \/ (\d+)/)
    return m ? ["Порты", +m[1], +m[2]] : null
  },
  api: genApi({
    base: "/api/odf",
    trashKey: "odf",
    node: "node_a",
    fields: { nodeB: "node_b.nodes_name_id", mount: "mounting_type", ports: pairOf("used_ports", "total_ports"), conn: "connector_type" },
    filter: { mount: "mounting_type", conn: "connector_type" },
  }),
}

export const list = makeList(spec)
