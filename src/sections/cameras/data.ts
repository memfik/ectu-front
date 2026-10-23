import { nodeRows } from "@/sections/nodes/data"

/*
 * Камеры видеонаблюдения на узлах (макет 05, cam-01…05): 186 камер, 164 online, 22 offline, 3 с тревогами.
 * TODO(API): реестр камер и потоки (RTSP → go2rtc → WebRTC), архив 14 дней, события — нет в техучёте; превью — фото узлов.
 */

export type Camera = {
  id: string
  title: string
  nodeId: number
  nodeCode: string
  nodeTitle: string
  branch: string
  ll: [number, number]
  img: string
  online: boolean
  alarm?: boolean
  model: string
  ip: string
  /** Публичная веб-камера (Windy и др.) */
  pub?: boolean
}

const IMG = ["/nodes/g-1.jpg", "/nodes/g-4.jpg", "/nodes/g-2.jpg", "/nodes/g-5.jpg", "/nodes/g-6.jpg", "/nodes/g-3.jpg"]
const PLACES = ["Вход КСО", "Стойка СПД", "АМС", "Периметр", "Аппаратная", "Кросс ODF", "Вход", "АМС, вид сверху", "Периметр Ю"]
const MODELS = ["Hikvision DS-2DE4425IW", "Hikvision DS-2CD2143G2", "Dahua IPC-HFW2431S"]

let cache: Camera[] | null = null

export function cameras(): Camera[] {
  if (cache) return cache
  const nodes = nodeRows()
  const out: Camera[] = []
  for (let i = 0; i < 186; i++) {
    const n = nodes[(i * 7) % nodes.length]
    const k = i % 4
    out.push({
      id: `CAM-${String(i + 1).padStart(2, "0")}`,
      title: PLACES[(i + k) % PLACES.length],
      nodeId: n.id,
      nodeCode: n.code,
      nodeTitle: n.object,
      branch: n.branch,
      ll: [n.ll[0] + (k - 1.5) * 0.0004, n.ll[1] + (k - 1.5) * 0.0006],
      img: IMG[i % IMG.length],
      online: i % 9 !== 5,
      alarm: i === 3 || i === 40 || i === 77,
      model: MODELS[i % MODELS.length],
      ip: `10.40.${12 + (i % 20)}.${20 + (i % 200)}`,
    })
  }
  cache = out
  return out
}

/** Камеры одного узла (cam-02, список справа). */
export const nodeCameras = (nodeId: number) => cameras().filter((c) => c.nodeId === nodeId)

/** Публичные веб-камеры городов (cam-05). */
export const PUBLIC_CAMS: Camera[] = [
  ["Алматы · Кок-Тобе", 43.2333, 76.9767],
  ["Астана · Байтерек", 51.1283, 71.4305],
  ["Шымкент · центр", 42.3155, 69.5869],
  ["Медеу", 43.1574, 77.0591],
  ["Бурабай", 53.0833, 70.3],
].map(([t, a, b], i) => ({
  id: `PUB-${i + 1}`,
  title: String(t),
  nodeId: 0,
  nodeCode: "Windy",
  nodeTitle: String(t),
  branch: "",
  ll: [Number(a), Number(b)] as [number, number],
  img: IMG[(i + 2) % IMG.length],
  online: true,
  model: "Windy Webcams API",
  ip: "—",
  pub: true,
}))
