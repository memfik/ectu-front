"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { cn } from "@/lib/utils"
import { C, MODELS } from "./models"

export type ModelKey = keyof typeof MODELS

/**
 * 3D-модель оборудования (как viewer.html прототипа): OrbitControls, автоповорот, подсказка при наведении на устройство.
 * Фон прозрачный — под ним фон страницы. Подключать через `Equipment3D` (dynamic, без SSR).
 */
export default function Viewer({
  model,
  autoRotate = true,
  zoom = 1,
  className,
}: {
  model: ModelKey
  autoRotate?: boolean
  /** Дальше / ближе камера (1 — как в прототипе) */
  zoom?: number
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const controls = useRef<OrbitControls | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; t: string } | null>(null)
  const [noGl, setNoGl] = useState(false)

  useEffect(() => {
    const el = box.current!
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      // Нет WebGL (старая видеокарта, отключено ускорение) — вместо модели подпись, страница не падает
      queueMicrotask(() => setNoGl(true))
      return
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)
    renderer.domElement.style.display = "block"

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 3000)
    camera.position.set(460 * zoom, 360 * zoom, 520 * zoom)
    const ctl = new OrbitControls(camera, renderer.domElement)
    ctl.enableDamping = true
    ctl.target.set(0, 110, 0)
    ctl.maxPolarAngle = Math.PI / 2.05
    ctl.autoRotateSpeed = 0.8
    ctl.enableZoom = true
    controls.current = ctl

    scene.add(new THREE.HemisphereLight(0xc8d6ff, 0x1a1d24, 2.2))
    const key = new THREE.DirectionalLight(0xffffff, 2.6)
    key.position.set(300, 500, 200)
    scene.add(key)
    const rim = new THREE.PointLight(C.blue, 4, 900, 1.4)
    rim.position.set(-200, 120, -200)
    scene.add(rim)
    scene.add(new THREE.AmbientLight(0x8090b0, 0.8))
    const fill = new THREE.DirectionalLight(0x7fb0ff, 1.2)
    fill.position.set(-300, 200, 300)
    scene.add(fill)

    const group: THREE.Group = MODELS[model].build()
    scene.add(group)

    const resize = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = "100%"
      renderer.domElement.style.height = "100%"
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const ray = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const move = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect()
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(mouse, camera)
      const hit = ray.intersectObjects(group.children, true).find((h) => h.object.userData?.name)
      setTip(hit ? { x: e.clientX - r.left + 14, y: e.clientY - r.top + 14, t: `${hit.object.userData.name} · ${hit.object.userData.kind}` } : null)
    }
    renderer.domElement.addEventListener("pointermove", move)
    renderer.setAnimationLoop(() => {
      ctl.update()
      renderer.render(scene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      renderer.domElement.removeEventListener("pointermove", move)
      ro.disconnect()
      ctl.dispose()
      group.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
        mats.forEach((x) => x.dispose())
      })
      renderer.dispose()
      renderer.domElement.remove()
      controls.current = null
    }
  }, [model, zoom])

  useEffect(() => {
    if (controls.current) controls.current.autoRotate = autoRotate
  }, [autoRotate, model])

  return (
    <div ref={box} className={cn("relative", className)}>
      {noGl && (
        <span className="absolute inset-0 grid place-items-center text-center text-[13px] text-muted-foreground">
          3D недоступно: в браузере выключено аппаратное ускорение (WebGL)
        </span>
      )}
      {tip && (
        <span
          className="pointer-events-none absolute z-[2] rounded-xl border border-border bg-[var(--dd-bg)] px-3 py-1.5 text-[13px] shadow"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.t}
        </span>
      )}
    </div>
  )
}
