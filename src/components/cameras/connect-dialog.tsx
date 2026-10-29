"use client"

import { useState } from "react"
import { ArrowRight, Camera as CameraIcon, Check, CircleCheck, Lock, RefreshCw } from "lucide-react"
import { Input, Select } from "@/components/list/form-controls"
import { btn, checkBox } from "@/components/list/ui"
import { Modal } from "@/components/passport/modal"
import { toast } from "@/components/shared/toast"
import { nodeRows } from "@/sections/nodes/data"
import { cn } from "@/lib/utils"

/*
 * cam-04: подключение камеры — узел, название, протокол, RTSP, логин; схема доступа камера → VPN → go2rtc → браузер, проверка потока.
 * TODO(API): сохранение камеры и проверка потока на сервере (go2rtc), пароль — только на сервере в зашифрованном виде.
 */
export function ConnectDialog({ onClose }: { onClose: () => void }) {
  const nodes = nodeRows()
  const [v, setV] = useState({
    node: nodes[0]?.code ?? "",
    name: "CAM-07 · Периметр С",
    proto: "ONVIF (автопоиск)",
    vendor: "Hikvision",
    rtsp: "rtsp://10.40.12.27:554/Streaming/Channels/101",
    login: "estu_view",
    pass: "",
    archive: "14 дней",
  })
  const [flags, setFlags] = useState({ preview: true, notify: true, roles: true })
  const [checked, setChecked] = useState<"idle" | "busy" | "ok">("idle")
  const set = (k: keyof typeof v) => (t: string) => setV({ ...v, [k]: t })
  const node = nodes.find((n) => n.code === v.node)
  const test = () => {
    setChecked("busy")
    setTimeout(() => setChecked("ok"), 900)
  }
  const label = (t: string, req?: boolean) => (
    <span className="mb-2 block text-[13px] font-medium">
      {t} {req && <span className="text-[#ff5257]">*</span>}
    </span>
  )
  const steps = [
    ["Камера", v.rtsp.match(/\d+\.\d+\.\d+\.\d+/)?.[0] ?? "—", "сеть узла"],
    ["VPN", `${node?.branch ?? "—"} IPsec`, "RTSP"],
    ["Медиасервер", "go2rtc", "WebRTC"],
    ["Браузер", "ЕСТУ", ""],
  ]
  return (
    <Modal side title="Подключить камеру" sub="Камера появится на карте, в паспорте узла и на видеостене" icon={CameraIcon} width={640} onClose={onClose}>
      <div className="flex-1 overflow-y-auto px-7 py-5">
        <p className="mb-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">Объект</p>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            {label("Узел связи", true)}
            <Select value={v.node} opts={nodes.slice(0, 300).map((n) => ({ v: n.code, label: `${n.code} · ${n.object}` }))} onChange={set("node")} />
          </div>
          <div>
            {label("Название камеры", true)}
            <Input value={v.name} onChange={(e) => set("name")(e.target.value)} />
          </div>
        </div>
        <p className="mt-6 mb-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">Подключение</p>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            {label("Протокол", true)}
            <Select value={v.proto} opts={["ONVIF (автопоиск)", "RTSP", "HLS"].map((o) => ({ v: o, label: o }))} onChange={set("proto")} />
          </div>
          <div>
            {label("Производитель")}
            <Select value={v.vendor} opts={["Hikvision", "Dahua", "Axis", "Другой"].map((o) => ({ v: o, label: o }))} onChange={set("vendor")} />
          </div>
          <div className="col-span-full">
            {label("RTSP-адрес", true)}
            <Input value={v.rtsp} onChange={(e) => set("rtsp")(e.target.value)} className="font-mono" />
          </div>
          <div>
            {label("Логин")}
            <Input value={v.login} onChange={(e) => set("login")(e.target.value)} />
          </div>
          <div>
            {label("Пароль")}
            <Input type="password" value={v.pass} onChange={(e) => set("pass")(e.target.value)} placeholder="••••••••••" icon={<Lock />} />
            <span className="mt-1 block text-[11px] text-muted-foreground">Пароль хранится в зашифрованном виде</span>
          </div>
        </div>
        <p className="mt-6 mb-3 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">Как ЕСТУ достучится до камеры</p>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border p-3">
          {steps.map(([t, s, arrow], i) => (
            <span key={t} className="flex items-center gap-2">
              <span className="rounded-xl bg-[var(--chip-bg)] px-3 py-2">
                <b className="block text-[12px] font-semibold">{t}</b>
                <span className="text-[11px] text-muted-foreground">{s}</span>
              </span>
              {i < steps.length - 1 && (
                <span className="flex flex-col items-center text-[10px] text-muted-foreground">
                  <ArrowRight className="size-4 text-[var(--link)]" />
                  {arrow}
                </span>
              )}
            </span>
          ))}
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-3.5">
          <div>
            {label("VPN-туннель")}
            <Input value={`${node?.branch ?? "—"} · ipsec-${(node?.code ?? "ast").slice(0, 3)}-01`} readOnly />
          </div>
          <div>
            {label("Архив записи")}
            <Select value={v.archive} opts={["7 дней", "14 дней", "30 дней"].map((o) => ({ v: o, label: o }))} onChange={set("archive")} />
          </div>
        </div>
        {checked === "ok" && (
          <p className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-[rgba(43,212,99,0.3)] bg-[rgba(43,212,99,0.08)] px-4 py-3 text-[13px]">
            <CircleCheck className="mt-0.5 size-4 flex-none text-[var(--status-ok)]" />
            <span>
              <b className="block">Проверка прошла · 1920×1080 · 25 к/с · задержка 0,4 с</b>
              <span className="text-muted-foreground">Камера ответила через VPN, поток доступен</span>
            </span>
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2.5 text-[13px]">
          {(
            [
              ["preview", "Показывать превью на карте"],
              ["notify", "Уведомлять при потере сигнала"],
              ["roles", "Доступ только ролям admin и ответственным узла"],
            ] as const
          ).map(([k, t]) => (
            <button key={k} type="button" className="flex items-center gap-2.5 text-left" onClick={() => setFlags({ ...flags, [k]: !flags[k] })}>
              <span className={checkBox(flags[k])} />
              {t}
            </button>
          ))}
        </div>
      </div>
      <footer className="flex gap-2.5 border-t border-[var(--dd-line)] px-7 py-4">
        <button type="button" className={btn()} onClick={test} disabled={checked === "busy"}>
          <RefreshCw className={cn(checked === "busy" && "animate-spin")} />
          {checked === "idle" ? "Проверить поток" : "Проверить снова"}
        </button>
        <button type="button" className={cn(btn(), "ml-auto")} onClick={onClose}>
          Отмена
        </button>
        <button
          type="button"
          className={btn({ primary: true })}
          onClick={() => {
            if (!v.node || !v.name.trim() || !v.rtsp.trim()) return toast("Заполните узел, название и RTSP-адрес")
            toast(`Камера ${v.name} подключена — после подключения видеосервера появится на карте`)
            onClose()
          }}
        >
          <Check />
          Подключить
        </button>
      </footer>
    </Modal>
  )
}
