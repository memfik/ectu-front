import { SatelliteDish } from "lucide-react"
import { makeList, type Spec } from "@/sections/make"
import { genApi } from "@/sections/api-helpers"
import { SAT, STD_KPI, num, pick } from "@/sections/spec-helpers"

/** ЗССС SkyEdge II GEO (макет 31): описание раздела и источник в API. */
export const spec: Spec = {
  key: "vsat",
  num: "31",
  title: "ЗССС SkyEdge II GEO",
  crumb: SAT,
  sub: "Форма учёта · ЗССС SkyEdge II GEO",
  icon: SatelliteDish,
  hero: "/nodes/g-2.jpg",
  total: 112,
  unit: ["станция", "станции", "станций"],
  search: "Наименование, клиент, область…",
  kpis: [
    { t: "На месторождениях", color: "#a78bfa", value: "41", note: "" },
    { t: "MESH", color: "#22d3ee", value: "9", note: "" },
    { t: "В работе", color: "var(--status-ok)", value: "98%", note: "", pct: 98 },
    ...STD_KPI("", "", "").slice(1),
  ],
  cols: [
    { k: "branch", t: "Филиал" },
    { k: "name", t: "Наименование", show: "bold" },
    { k: "client", t: "Клиент", filter: "Клиент" },
    { k: "type", t: "Тип", opts: ["SkyEdge II Access", "SkyEdge II Fixed"] },
    { k: "antenna", t: "Антенна, м", show: "num" },
    { k: "topology", t: "Topology" },
  ],
  gen: (i, r, n) => ({
    num: num(r, 1, 20),
    name: `${pick(r, ["Карагандинская", "Мангистауская", "Атырауская", "Актюбинская", "Туркестанская"])} область, ${pick(r, ["НС-", "Сагиз", "Темир", "м/р "])}${num(r, 1, 40)}`,
    client: pick(r, ["ТОО «Мангистаумунайгаз»", "АО «Эмбамунайгаз»", "ТОО «КазМунайГаз»"]),
    type: r() > 0.2 ? "SkyEdge II Access" : "SkyEdge II Fixed",
    antenna: pick(r, ["1,8", "2,4"]),
    topology: String(pick(r, [2022, 2024, 2061, 3102, 3220, 3223])),
    _n: n.id,
  }),
  name: (x) => `VSAT · ${x.f.name}`,
  sub2: (x) => `${x.f.client} · ${x.f.type} · ${x.f.antenna} м`,
  api: genApi({
    base: "/api/triple_s",
    trashKey: "tripleS",
    fields: { name: "name", client: "client", type: "terminal_type", antenna: "antenna_size", topology: "topology" },
    filter: { client: "client" },
  }),
}

export const list = makeList(spec)
