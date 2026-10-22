"use client"

import { Activity, Calendar, CircleCheck, Contact, MapPin, Satellite, Wifi } from "lucide-react"
import { RadioPanel, SatelliteLink } from "@/components/passport/radio"
import { Card, Kv } from "@/components/passport/ui"
import { LinePassport } from "@/sections/lines/passport"
import { equipmentKind } from "@/sections/lines/equipment"
import { BRANCHES } from "@/sections/nodes/data"
import type { GenRow } from "@/sections/make"
import { list, spec } from "./config"

/*
 * OneWeb LEO (макет 32): терминал Hughes и связь со спутником, «Спутник» — низкая орбита,
 * вкладки «Место установки», «Терминал», «Точка доступа», «Тест».
 * TODO(API): район, сельский округ, IMEI, IP, VLAN, точка доступа, тестовый период — нет в /api/oneweb.
 */

const CLIENT = "КГУ «Школа № 12»"
const town = (x: GenRow) => String(x.f.client ?? "—")
const tv = (rows: { t: string; v: React.ReactNode }[]) => <Kv rows={rows} />

const OW = equipmentKind({
  section: "oneweb",
  spec,
  list,
  pill: () => "LEO",
  panel: (c) => (
    <RadioPanel
      left={String(c.x.f.terminal)}
      right={String(c.x.f.station)}
      indoor={{
        t: String(c.x.f.terminal),
        sub: "панель 598 × 402 мм · ESA",
        groups: [{ label: "POE · LAN", ports: [true] }],
      }}
      outdoor={{
        t: "Связь",
        sub: "OneWeb LEO · хэндовер",
        lines: ["LINK     UP", "SAT      0612 → 0617", "LATENCY  42 ms", "AVAIL    99.6 %"],
        from: "терминал",
        to: "LEO 1 200 км",
        len: "",
      }}
      notes={[
        { t: "Плоская антенна ESA", v: "луч переключается между спутниками", at: 24 },
        { t: "PoE · LAN", v: "→ Wi-Fi точка доступа", at: 74 },
      ]}
    />
  ),
  schema: (c) => (
    <SatelliteLink
      orbit="Низкая орбита · OneWeb LEO 1 200 км"
      up="Inbound CIR 20 / MIR 100"
      down="Outbound CIR 20 / MIR 100"
      station={`SHI-012 · ${String(c.x.f.terminal).replace(/W$/, "")}`}
      stationSub={`${c.x.f.category ?? "Fixed"} · Class 1 · Wi-Fi EAP245`}
      card={{ t: "Предоставляемые услуги", v: "WWW · ПД · Голос", sub: "VLAN 1120", ok: "Станция в работе" }}
    />
  ),
  schemaLabel: ["Спутник", Satellite],
  capTitle: "",
  cap: () => [],
  extra: (c) => [
    {
      k: "place",
      t: "Место установки",
      icon: MapPin,
      node: (
        <Card icon={MapPin} title="Место установки" className="max-w-[1200px]">
          {tv([
            { t: "Область", v: String(c.x.f.oblast ?? "—") },
            { t: "Район", v: "Шиелийский" },
            { t: "Сельский округ", v: "Шиелийский с/о" },
            { t: "Населенный пункт", v: town(c.x) },
            { t: "Адрес", v: "ул. Абая, 14" },
            { t: "Широта", v: c.x.ll[0].toFixed(4) },
            { t: "Долгота", v: c.x.ll[1].toFixed(4) },
          ])}
        </Card>
      ),
    },
    {
      k: "terminal",
      t: "Терминал",
      icon: Satellite,
      node: (
        <Card icon={Satellite} title="Абонентский терминал" className="max-w-[1200px]">
          {tv([
            { t: "Тип", v: String(c.x.f.terminal ?? "—") },
            { t: "Категория", v: String(c.x.f.category ?? "—") },
            { t: "Класс", v: "Class 1" },
            { t: "Название станции", v: String(c.x.f.station ?? "—") },
            { t: "Серийный номер", v: `HL1120-${88200 + c.x.id}` },
            { t: "IMEI", v: "35 881231 004412 7" },
            { t: "IP address", v: String(c.x.f.ip ?? "—") },
            { t: "VLAN", v: 1120 },
          ])}
        </Card>
      ),
    },
    {
      k: "ap",
      t: "Точка доступа",
      icon: Wifi,
      node: (
        <Card icon={Wifi} title="Точка доступа" className="max-w-[1200px]">
          {tv([
            { t: "Модель точки доступа", v: "TP-Link EAP245" },
            { t: "MAC-адрес", v: "60:A4:B7:12:44:1C" },
            { t: "S/N", v: "22314A0012" },
          ])}
        </Card>
      ),
    },
    {
      k: "test",
      t: "Тест",
      icon: Calendar,
      node: (
        <Card icon={Calendar} title="Тестовый период" className="max-w-[1200px]">
          {tv([
            { t: "Статус станции", v: list.card(c.x).status.label },
            { t: "Дата начала теста", v: "03.06.2025" },
            { t: "Дата окончания теста", v: "03.07.2025" },
            { t: "Основание", v: "№ 211-р" },
          ])}
        </Card>
      ),
    },
  ],
  stats: () => [
    { icon: Activity, t: "MIR", v: 100, em: "Мбит/с" },
    { icon: Satellite, t: "Орбита", v: "LEO", em: "1 200 км" },
    { icon: Wifi, t: "Wi-Fi", v: "EAP245" },
  ],
  summary: (c) => [
    {
      icon: Activity,
      title: "MIR / CIR",
      tab: "terminal",
      v: (
        <>
          100 / 20 <em>Мбит/с</em>
        </>
      ),
    },
    {
      icon: Activity,
      title: "Интернет",
      tab: "terminal",
      v: (
        <>
          50 <em>Мбит/с</em>
        </>
      ),
    },
    {
      icon: Contact,
      title: "Клиент",
      tab: "place",
      v: (
        <>
          Школа № 12 <em>{town(c.x).replace(/^с\. /, "")}</em>
        </>
      ),
    },
    { icon: CircleCheck, title: "Статус", tab: "test", v: list.card(c.x).status.label },
  ],
  rows: (x) => [
    { t: "Нумерация", v: x.num },
    { t: "Филиал", v: BRANCHES.find((b) => b.v === x.branch)?.full ?? x.branch },
    { t: "Клиент", v: CLIENT },
    { t: "Собственник оборудования", v: "QMobile" },
    { t: "Область", v: String(x.f.oblast ?? "—") },
    { t: "Район", v: "Шиелийский" },
    { t: "Сельский округ", v: "Шиелийский с/о" },
    { t: "Населенный пункт", v: town(x) },
    { t: "Адрес", v: "Бейбитшиликский сельский округ" },
    { t: "Широта", v: x.ll[0].toFixed(4) },
    { t: "Долгота", v: x.ll[1].toFixed(4) },
    { t: "Тип абонентского терминала", v: String(x.f.terminal ?? "—") },
  ],
  lastEdit: () => ["Изменён статус станции", "Тест", "В работе"],
})

/** Паспорт станции OneWeb (макет 32). */
export function OneWebPassport({ id }: { id: number }) {
  return <LinePassport k={OW} id={id} />
}
