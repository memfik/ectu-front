"use client"

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { useTheme } from "next-themes"
import type { GeoJSONSource, Map as MlMap, MapLayerMouseEvent } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { Tone } from "@/components/list/ui"

/** Точка на карте: узел, клиент, опора… */
export type MapPoint = { id: number; ll: [number, number]; title: string; sub: string; tone: Tone }

/** Видимые точки с расстоянием от центра карты, км. */
export type Visible = { total: number; near: (MapPoint & { km: number })[] }

/*
 * Подложка CARTO (векторная, без ключа): тёмная — dark-matter, светлая — positron.
 * TODO: спутник и 3D-здания — на «Карте сети» (макет 05); выбор подложки — в «Слоях».
 */
const STYLE = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
}
const COLOR: Record<Tone, string> = { ok: "#2bd463", warn: "#ff9f1a", bad: "#ff3b3b", info: "#4f8dff", muted: "#8c919b" }

const km = (a: [number, number], b: [number, number]) => {
  const r = Math.PI / 180
  const x = (b[1] - a[1]) * r * Math.cos(((a[0] + b[0]) / 2) * r)
  const y = (b[0] - a[0]) * r
  return Math.sqrt(x * x + y * y) * 6371
}

type Latest = {
  ring?: { ll: [number, number]; m: number }
  noCluster?: boolean
  points: MapPoint[]
  selected: number | null
  onSelect: (id: number) => void
  onVisible?: (v: Visible) => void
}

/** Карта точек с кластерами (MapLibre GL). Клик по точке — выбор, по кластеру — приближение. */
export function PointsMap({
  points,
  selected,
  onSelect,
  onVisible,
  mini,
  ring,
  noCluster,
  className,
}: {
  points: MapPoint[]
  selected: number | null
  onSelect: (id: number) => void
  onVisible?: (v: Visible) => void
  /** Маленькая карта в карточке: без подписи источника, кнопки масштаба сверху справа. */
  mini?: boolean
  /** Круг охвата вокруг точки: центр и радиус, м (клиенты рядом с узлом). Карта подстраивается под круг. */
  ring?: { ll: [number, number]; m: number }
  /** Не собирать точки в кластеры и не подписывать (много мелких точек рядом). */
  noCluster?: boolean
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<MlMap | null>(null)
  const latest = useRef<Latest>({ points, selected, onSelect, onVisible, ring, noCluster })
  useLayoutEffect(() => {
    latest.current = { points, selected, onSelect, onVisible, ring, noCluster }
  })
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === "light" ? "light" : "dark"
  const [ready, setReady] = useState(false)

  // Карта создаётся один раз; maplibre грузится только в браузере
  useEffect(() => {
    let alive = true
    let m: MlMap | undefined
    import("maplibre-gl").then(({ default: ml }) => {
      if (!alive || !box.current) return
      const first = latest.current.points.find((p) => p.id === latest.current.selected) ?? latest.current.points[0]
      m = new ml.Map({
        container: box.current,
        style: STYLE[theme],
        center: ring ? [ring.ll[1], ring.ll[0]] : first ? [first.ll[1], first.ll[0]] : [71.43, 51.13],
        zoom: ring ? 15.5 : 12,
        attributionControl: mini ? false : { compact: true },
      })
      m.addControl(new ml.NavigationControl({ showCompass: false }), mini ? "top-right" : "bottom-right")
      m.on("style.load", () => {
        addLayers(m!, latest)
        setReady(true)
      })
      m.on("moveend", () => report(m!, latest))
      m.on("click", "nodes-cluster", (e: MapLayerMouseEvent) => {
        const f = e.features?.[0]
        if (!f) return
        const src = m!.getSource("nodes") as GeoJSONSource
        src.getClusterExpansionZoom(f.properties.cluster_id).then((zoom) => {
          m!.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom })
        })
      })
      m.on("click", "nodes-point", (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties.id
        if (id !== undefined) latest.current.onSelect(Number(id))
      })
      for (const l of ["nodes-cluster", "nodes-point"]) {
        m.on("mouseenter", l, () => (m!.getCanvas().style.cursor = "pointer"))
        m.on("mouseleave", l, () => (m!.getCanvas().style.cursor = ""))
      }
      map.current = m
    })
    return () => {
      alive = false
      m?.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- тема меняется через setStyle ниже
  }, [])

  // Смена темы — другая подложка; слои добавятся заново в style.load
  useEffect(() => {
    map.current?.setStyle(STYLE[theme])
  }, [theme])

  // Данные и выбранная точка
  useEffect(() => {
    const m = map.current
    if (!m || !ready || !m.getSource("nodes")) return
    ;(m.getSource("nodes") as GeoJSONSource).setData(toGeo(points))
    m.setFilter("nodes-selected", ["==", ["get", "id"], selected ?? -1])
    if (latest.current.noCluster) m.setFilter("nodes-label", ["==", ["get", "id"], selected ?? -1])
    report(m, latest)
  }, [points, selected, ready])

  // Выбор из списка — карта летит к точке
  useEffect(() => {
    const m = map.current
    const p = points.find((x) => x.id === selected)
    if (m && ready && p && !m.getBounds().contains([p.ll[1], p.ll[0]]))
      m.flyTo({ center: [p.ll[1], p.ll[0]], zoom: Math.max(m.getZoom(), 13) })
  }, [selected, points, ready])

  // maplibre ставит контейнеру position: relative — размеры задаёт обёртка
  return (
    <div className={className}>
      <div ref={box} className="size-full" />
    </div>
  )
}

function report(m: MlMap, latest: RefObject<Latest>) {
  const cb = latest.current.onVisible
  if (!cb) return
  const b = m.getBounds()
  const c = m.getCenter()
  const inView = latest.current.points.filter((p) => b.contains([p.ll[1], p.ll[0]]))
  const near = inView
    .map((p) => ({ ...p, km: km([c.lat, c.lng], p.ll) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 8)
  cb({ total: inView.length, near })
}

function addLayers(m: MlMap, latest: RefObject<Latest>) {
  if (m.getSource("nodes")) return
  // Подписи подложки — по-русски, где есть
  for (const l of m.getStyle().layers) {
    if (l.type === "symbol" && m.getLayoutProperty(l.id, "text-field")) {
      m.setLayoutProperty(l.id, "text-field", ["coalesce", ["get", "name:ru"], ["get", "name"]])
    }
  }
  const ring = latest.current.ring
  if (ring) {
    m.addSource("ring", { type: "geojson", data: circle(ring.ll, ring.m) })
    m.addLayer({ id: "ring-fill", type: "fill", source: "ring", paint: { "fill-color": "#085eff", "fill-opacity": 0.1 } })
    m.addLayer({
      id: "ring-line",
      type: "line",
      source: "ring",
      paint: { "line-color": "#4f8dff", "line-width": 1.5, "line-dasharray": [3, 3] },
    })
  }
  m.addSource("nodes", {
    type: "geojson",
    data: toGeo(latest.current.points),
    cluster: !latest.current.noCluster,
    clusterRadius: 48,
    clusterMaxZoom: 13,
  })
  m.addLayer({
    id: "nodes-cluster",
    type: "circle",
    source: "nodes",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#085eff",
      "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 26],
      "circle-stroke-width": 3,
      "circle-stroke-color": "rgba(255,255,255,0.9)",
    },
  })
  m.addLayer({
    id: "nodes-count",
    type: "symbol",
    source: "nodes",
    filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": ["Open Sans Bold", "Noto Sans Bold"] },
    paint: { "text-color": "#ffffff" },
  })
  m.addLayer({
    id: "nodes-selected",
    type: "circle",
    source: "nodes",
    filter: ["==", ["get", "id"], latest.current.selected ?? -1],
    paint: { "circle-radius": 16, "circle-color": "rgba(8,94,255,0.25)", "circle-stroke-width": 2, "circle-stroke-color": "#4f8dff" },
  })
  m.addLayer({
    id: "nodes-point",
    type: "circle",
    source: "nodes",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": 6,
      "circle-color": ["get", "color"],
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(10,11,14,0.85)",
    },
  })
  m.addLayer({
    id: "nodes-label",
    type: "symbol",
    source: "nodes",
    // при noCluster подписываем только выбранную точку
    filter: latest.current.noCluster ? ["==", ["get", "id"], latest.current.selected ?? -1] : ["!", ["has", "point_count"]],
    minzoom: 13,
    layout: {
      "text-field": ["get", "title"],
      "text-size": 12,
      "text-offset": [0, 1.3],
      "text-anchor": "top",
      "text-font": ["Open Sans Regular", "Noto Sans Regular"],
    },
    paint: { "text-color": "#dfe2e7", "text-halo-color": "rgba(10,11,14,0.9)", "text-halo-width": 1.5 },
  })
}

/** Многоугольник-круг радиусом m метров. */
function circle([lat, lng]: [number, number], m: number): GeoJSON.Feature {
  const k = m / 111320
  const ring = Array.from({ length: 65 }, (_, i) => {
    const a = (i / 64) * 2 * Math.PI
    return [lng + (Math.cos(a) * k) / Math.cos((lat * Math.PI) / 180), lat + Math.sin(a) * k]
  })
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: {} }
}

function toGeo(points: MapPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.ll[1], p.ll[0]] },
      properties: { id: p.id, title: p.title, color: COLOR[p.tone] },
    })),
  }
}
