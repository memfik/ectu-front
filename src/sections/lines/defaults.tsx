import { FileText, GitBranch, MapPin, Rows3, Ruler, Waypoints } from "lucide-react"
import { SegBar } from "@/components/passport/ui"
import { kmStr, type LineCtx, type LineStat, type LineSum, type LineTab } from "./detail"
import { RentTab, SegmentsTab, StrandsTab } from "./tabs"

/*
 * Шапка, сводка и вкладки паспорта линии, общие для ВОЛС и КЛС. Третья цифра — муфты (ВОЛС) или участки (КЛС).
 */

/** «Занято» → «занято», аббревиатуры («JM») — как есть. */
export const low = (t: string) => (t === t.toUpperCase() ? t : t[0].toLowerCase() + t.slice(1))

const km1 = (v: number) => kmStr(Math.round(v * 10) / 10)

export const lineStats = (c: LineCtx, third: "points" | "segments"): LineStat[] => [
  { icon: Ruler, t: "Протяжённость", v: km1(c.len), em: "км" },
  { icon: Rows3, t: c.k.strand.stat, v: c.d.strands.length, em: `${c.busy} занято` },
  third === "points" ? { icon: MapPin, t: "Муфт", v: c.points } : { icon: MapPin, t: "Участков", v: c.d.segments.length },
]

/** Полоса жил a / b / свободно. */
export const strandBar = (c: LineCtx) => (
  <SegBar
    parts={[
      { v: c.a, color: c.k.strand.a[1] },
      { v: c.b, color: c.k.strand.b[1] },
      { v: c.d.strands.length - c.a - c.b, color: "var(--chip-bg)" },
    ]}
  />
)

export const docsSum = (c: LineCtx): LineSum => ({
  icon: FileText,
  title: "Документы",
  tab: "docs",
  v: (
    <>
      {c.docsUp} / {c.d.docs.length} <em>загружено</em>
    </>
  ),
  bar: (
    <SegBar
      parts={[
        { v: c.docsUp, color: "var(--status-ok)" },
        { v: c.d.docs.length - c.docsUp, color: "var(--chip-bg)" },
      ]}
    />
  ),
})

export const lineSummary = (c: LineCtx, third: "points" | "segments"): LineSum[] => [
  {
    icon: Ruler,
    title: "Протяжённость",
    tab: "segments",
    v: (
      <>
        {km1(c.len)} <em>{third === "points" ? `км · кабель ${kmStr(c.cable)} км` : "км"}</em>
      </>
    ),
  },
  {
    icon: Rows3,
    title: c.k.strand.tab,
    tab: "strands",
    v: (
      <>
        {c.busy} / {c.d.strands.length} <em>занято</em>
      </>
    ),
    bar: strandBar(c),
  },
  third === "points"
    ? {
        icon: MapPin,
        title: "Муфты",
        tab: "segments",
        v: (
          <>
            {c.points} <em>на трассе</em>
          </>
        ),
      }
    : { icon: GitBranch, title: "Участки", tab: "segments", v: c.d.segments.length },
  docsSum(c),
]

export const lineTabs = (c: LineCtx, rent?: boolean): LineTab[] => [
  { k: "segments", t: "Участки", icon: GitBranch, n: c.d.segments.length, node: <SegmentsTab d={c.d} k={c.k} onChange={c.setSegments} /> },
  { k: "strands", t: c.k.strand.tab, icon: Rows3, n: c.d.strands.length, node: <StrandsTab x={c.x} d={c.d} k={c.k} /> },
  ...(rent ? [{ k: "rent", t: "Аренда КК", icon: Waypoints, node: <RentTab d={c.d} /> }] : []),
]
