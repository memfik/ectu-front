"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { Coverage } from "@/data/node-detail"

const STYLE = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
}
/** Цвета секторов по очереди — как в макете (синий, бирюзовый, фиолетовый). */
const SECTOR = ["#085eff", "#22d3ee", "#a78bfa", "#2bd463", "#ffc24a", "#ff5257"]

/** Сектор антенны: от точки на `km` по азимуту `az` (0° — север, по часовой) шириной `width`°. */
function sector([lat, lng]: [number, number], az: number, width: number, km: number): number[][] {
  const k = km / 111.32
  const cos = Math.cos((lat * Math.PI) / 180)
  const pts: number[][] = [[lng, lat]]
  for (let i = 0; i <= 24; i++) {
    const a = ((az - width / 2 + (width * i) / 24) * Math.PI) / 180
    pts.push([lng + (Math.sin(a) * k) / cos, lat + Math.cos(a) * k])
  }
  pts.push([lng, lat])
  return pts
}

function sectors(ll: [number, number], c: Coverage): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: c.azimuths.slice(0, c.sectors).map((az, i) => ({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [sector(ll, az, c.width, c.km)] },
      properties: { color: SECTOR[i % SECTOR.length] },
    })),
  }
}

/**
 * Карта выбора места (экран np-01): клик по карте или перетаскивание маркера меняет координаты,
 * секторы покрытия рисуются по азимутам, ширине и длине.
 */
export function LocationMap({
  ll,
  coverage,
  onMove,
  className,
}: {
  ll: [number, number]
  coverage: Coverage
  onMove: (ll: [number, number]) => void
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<MlMap | null>(null)
  const marker = useRef<Marker | null>(null)
  const latest = useRef({ ll, coverage, onMove })
  useLayoutEffect(() => {
    latest.current = { ll, coverage, onMove }
  })
  const { resolvedTheme } = useTheme()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    let m: MlMap | undefined
    import("maplibre-gl").then(({ default: ml }) => {
      if (!alive || !box.current) return
      const { ll: start } = latest.current
      m = new ml.Map({
        container: box.current,
        style: STYLE[resolvedTheme === "light" ? "light" : "dark"],
        center: [start[1], start[0]],
        zoom: 12,
        attributionControl: { compact: true },
      })
      m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right")
      const el = document.createElement("div")
      el.className =
        "size-6 rounded-full border-[3px] border-white bg-[#085eff] shadow-[0_0_0_6px_rgba(8,94,255,0.3),0_4px_14px_rgba(0,0,0,0.5)] cursor-grab"
      marker.current = new ml.Marker({ element: el, draggable: true }).setLngLat([start[1], start[0]]).addTo(m)
      marker.current.on("dragend", () => {
        const p = marker.current!.getLngLat()
        latest.current.onMove([+p.lat.toFixed(6), +p.lng.toFixed(6)])
      })
      m.on("click", (e) => latest.current.onMove([+e.lngLat.lat.toFixed(6), +e.lngLat.lng.toFixed(6)]))
      m.on("style.load", () => {
        if (!m!.getSource("sectors")) {
          m!.addSource("sectors", { type: "geojson", data: sectors(latest.current.ll, latest.current.coverage) })
          m!.addLayer({
            id: "sectors-fill",
            type: "fill",
            source: "sectors",
            paint: { "fill-color": ["get", "color"], "fill-opacity": 0.32 },
          })
          m!.addLayer({ id: "sectors-line", type: "line", source: "sectors", paint: { "line-color": ["get", "color"], "line-width": 1.5 } })
        }
        setReady(true)
      })
      map.current = m
    })
    return () => {
      alive = false
      m?.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- карта создаётся один раз
  }, [])

  // Новые координаты или параметры покрытия — двигаем маркер и перерисовываем секторы
  useEffect(() => {
    const m = map.current
    if (!m || !ready || Number.isNaN(ll[0]) || Number.isNaN(ll[1])) return
    marker.current?.setLngLat([ll[1], ll[0]])
    ;(m.getSource("sectors") as GeoJSONSource | undefined)?.setData(sectors(ll, coverage))
    if (!m.getBounds().contains([ll[1], ll[0]])) m.easeTo({ center: [ll[1], ll[0]] })
  }, [ll, coverage, ready])

  return (
    <div className={className}>
      <div ref={box} className="size-full" />
    </div>
  )
}

export { SECTOR }
