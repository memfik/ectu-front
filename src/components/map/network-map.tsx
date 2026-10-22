"use client"

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { useTheme } from "next-themes"
import type { GeoJSONSource, Map as MlMap, MapLayerMouseEvent, StyleSpecification } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

/*
 * Карта сети (макет 05): точки по слоям, линии ВОЛС, подложки «3D глобус / Казахстан 2D / Город / Город 3D / Спутник».
 * Векторная подложка CARTO, спутник — Esri World Imagery (растровые тайлы).
 */

export type Basemap = "globe" | "kz" | "city" | "city3d" | "sat"
export type NetPoint = { id: string; ll: [number, number]; layer: string; color: string; title: string }
export type NetLine = { id: string; coords: [number, number][]; layer: string; color: string; width: number }
type Latest = {
  points: NetPoint[]
  lines: NetLine[]
  onSelect: (id: string | null) => void
  onView: (v: View) => void
  onMapClick?: (ll: [number, number]) => void
  selected: string | null
}
export type View = { lat: number; lng: number; zoom: number; inView: Record<string, number> }

const VECTOR = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
}
const SATELLITE: StyleSpecification = {
  version: 8,
  glyphs: "https://basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf",
  sources: {
    sat: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri",
    },
  },
  layers: [{ id: "sat", type: "raster", source: "sat" }],
}
/** Центр Казахстана и масштаб «вся страна». */
const KZ: [number, number] = [67.5, 48.2]

export function NetworkMap({
  points,
  lines,
  basemap,
  selected,
  focus,
  onSelect,
  onView,
  onMapClick,
  className,
}: {
  points: NetPoint[]
  lines: NetLine[]
  basemap: Basemap
  selected: string | null
  /** Перелёт к точке (поиск, «Мой город») */
  focus: { ll: [number, number]; zoom: number; n: number } | null
  onSelect: (id: string | null) => void
  onView: (v: View) => void
  /** Клик по пустому месту карты (линейка) */
  onMapClick?: (ll: [number, number]) => void
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<MlMap | null>(null)
  const latest = useRef<Latest>({ points, lines, onSelect, onView, onMapClick, selected })
  useLayoutEffect(() => {
    latest.current = { points, lines, onSelect, onView, onMapClick, selected }
  })
  const { resolvedTheme } = useTheme()
  const theme: "light" | "dark" = resolvedTheme === "light" ? "light" : "dark"
  const [ready, setReady] = useState(0)
  // addLayers вызывается из style.load — актуальная подложка через ref
  const basemapRef = useRef(basemap)
  const themeRef = useRef(theme)
  useLayoutEffect(() => {
    basemapRef.current = basemap
    themeRef.current = theme
  })

  const styleFor = (b: Basemap) => (b === "sat" ? SATELLITE : VECTOR[theme])

  useEffect(() => {
    let alive = true
    let m: MlMap | undefined
    import("maplibre-gl").then(({ default: ml }) => {
      if (!alive || !box.current) return
      m = new ml.Map({
        container: box.current,
        style: styleFor(basemap),
        center: focus ? [focus.ll[1], focus.ll[0]] : [71.43, 51.16],
        zoom: focus?.zoom ?? 11,
        attributionControl: { compact: true },
      })
      m.on("style.load", () => {
        addLayers(m!, latest, basemapRef.current, themeRef.current)
        setReady((n) => n + 1)
      })
      m.on("moveend", () => report(m!, latest))
      m.on("click", (e) => {
        const hit = m!.queryRenderedFeatures(e.point, { layers: ["net-points", "net-clusters"].filter((l) => m!.getLayer(l)) })
        if (!hit.length) {
          latest.current.onSelect(null)
          latest.current.onMapClick?.([e.lngLat.lat, e.lngLat.lng])
        }
      })
      m.on("click", "net-points", (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties.id
        if (id) latest.current.onSelect(String(id))
      })
      m.on("click", "net-clusters", (e: MapLayerMouseEvent) => {
        const f = e.features?.[0]
        if (!f) return
        ;(m!.getSource("net-points") as GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id).then((zoom) => {
          m!.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom })
        })
      })
      for (const l of ["net-points", "net-clusters"]) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- карта создаётся один раз; подложка меняется ниже
  }, [])

  // Подложка и тема: новый стиль (слои добавятся в style.load), проекция и наклон
  useEffect(() => {
    const m = map.current
    if (!m) return
    m.setStyle(styleFor(basemap))
    if (basemap === "globe") m.easeTo({ center: KZ, zoom: 2.2, pitch: 0 })
    if (basemap === "kz") m.easeTo({ center: KZ, zoom: 4.6, pitch: 0 })
    if (basemap === "city3d") m.easeTo({ pitch: 55, zoom: Math.max(m.getZoom(), 14.5) })
    if (basemap === "city" || basemap === "sat") m.easeTo({ pitch: 0, zoom: Math.max(m.getZoom(), 11) })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- styleFor зависит только от basemap и theme
  }, [basemap, theme])

  useEffect(() => {
    const m = map.current
    if (!m || !ready || !m.getSource("net-points")) return
    ;(m.getSource("net-points") as GeoJSONSource).setData(pointsGeo(points))
    ;(m.getSource("net-lines") as GeoJSONSource).setData(linesGeo(lines))
    m.setFilter("net-selected", ["==", ["get", "id"], selected ?? ""])
    report(m, latest)
  }, [points, lines, selected, ready])

  useEffect(() => {
    if (focus && map.current) map.current.flyTo({ center: [focus.ll[1], focus.ll[0]], zoom: focus.zoom })
  }, [focus])


  return (
    <div className={className}>
      <div ref={box} className="size-full" />
    </div>
  )
}

function report(m: MlMap, latest: RefObject<Latest>) {
  const b = m.getBounds()
  const c = m.getCenter()
  const inView: Record<string, number> = {}
  for (const p of latest.current.points) if (b.contains([p.ll[1], p.ll[0]])) inView[p.layer] = (inView[p.layer] ?? 0) + 1
  for (const l of latest.current.lines)
    if (l.coords.some(([la, lo]) => b.contains([lo, la]))) inView[l.layer] = (inView[l.layer] ?? 0) + 1
  latest.current.onView({ lat: c.lat, lng: c.lng, zoom: m.getZoom(), inView })
}

function addLayers(m: MlMap, latest: RefObject<Latest>, basemap: Basemap, theme: "dark" | "light") {
  if (m.getSource("net-points")) return
  const style = m.getStyle()
  if (basemap === "globe") m.setProjection({ type: "globe" })
  for (const l of style.layers) {
    if (l.type === "symbol" && m.getLayoutProperty(l.id, "text-field"))
      m.setLayoutProperty(l.id, "text-field", ["coalesce", ["get", "name:ru"], ["get", "name"]])
  }
  // Город 3D: здания объёмом (слой building в подложке CARTO)
  if (basemap === "city3d" && style.sources.carto) {
    m.addLayer({
      id: "net-buildings",
      type: "fill-extrusion",
      source: "carto",
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-extrusion-color": theme === "dark" ? "#1d2230" : "#d9dde8",
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 14],
        "fill-extrusion-opacity": 0.85,
      },
    })
  }
  m.addSource("net-lines", { type: "geojson", data: linesGeo(latest.current.lines) })
  m.addLayer({
    id: "net-lines",
    type: "line",
    source: "net-lines",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": ["get", "color"], "line-width": ["get", "width"], "line-opacity": 0.85 },
  })
  m.addSource("net-points", {
    type: "geojson",
    data: pointsGeo(latest.current.points),
    cluster: true,
    clusterRadius: 44,
    clusterMaxZoom: 12,
  })
  m.addLayer({
    id: "net-clusters",
    type: "circle",
    source: "net-points",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "rgba(8,94,255,0.85)",
      "circle-radius": ["step", ["get", "point_count"], 16, 20, 21, 100, 27],
      "circle-stroke-width": 6,
      "circle-stroke-color": "rgba(8,94,255,0.25)",
    },
  })
  m.addLayer({
    id: "net-count",
    type: "symbol",
    source: "net-points",
    filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": ["Open Sans Bold", "Noto Sans Bold"] },
    paint: { "text-color": "#fff" },
  })
  m.addLayer({
    id: "net-selected",
    type: "circle",
    source: "net-points",
    filter: ["==", ["get", "id"], latest.current.selected ?? ""],
    paint: { "circle-radius": 18, "circle-color": "rgba(8,94,255,0.3)", "circle-stroke-width": 2, "circle-stroke-color": "#4f8dff" },
  })
  m.addLayer({
    id: "net-points",
    type: "circle",
    source: "net-points",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 15, 8],
      "circle-color": "#0b0c10",
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 15, 3],
      "circle-stroke-color": ["get", "color"],
    },
  })
  m.addLayer({
    id: "net-labels",
    type: "symbol",
    source: "net-points",
    filter: ["!", ["has", "point_count"]],
    minzoom: 14,
    layout: {
      "text-field": ["get", "title"],
      "text-size": 11.5,
      "text-offset": [0, 1.4],
      "text-anchor": "top",
      "text-font": ["Open Sans Regular", "Noto Sans Regular"],
    },
    paint: {
      "text-color": basemap === "sat" || theme === "dark" ? "#e6e8ec" : "#1c1c1e",
      "text-halo-color": "rgba(0,0,0,0.6)",
      "text-halo-width": 1.2,
    },
  })
}

function pointsGeo(points: NetPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.ll[1], p.ll[0]] },
      properties: { id: p.id, color: p.color, title: p.title },
    })),
  }
}
function linesGeo(lines: NetLine[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: lines.map((l) => ({
      type: "Feature",
      geometry: { type: "LineString", coordinates: l.coords.map(([la, lo]) => [lo, la]) },
      properties: { id: l.id, color: l.color, width: l.width },
    })),
  }
}
