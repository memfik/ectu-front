"use client"

import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { backupColumns, backups } from "./backups"
import { lte, lteColumns, lteImport } from "./bwa-lte"
import { wimax, wimaxColumns, wimaxImport } from "./bwa-wimax"
import { wll, wllColumns, wllImport } from "./bwa-wll"
import { dwdmColumns, dwdmDevices, dwdmImport } from "./dwdm"
import { fiberLineColumns, fiberLines, fiberLinesImport } from "./fiber-lines"
import { ipPlan, ipPlanColumns } from "./ip-plan"
import { nodeColumns, nodes, nodesImport } from "./nodes"
import { pdhColumns, pdhDevices, pdhImport } from "./pdh"
import { radioBridgeColumns, radioBridges, radioBridgesImport } from "./radio-bridges"
import { routerColumns, routers, routersImport } from "./routers"
import { rrlColumns, rrlImport, rrlSpans } from "./rrl"
import { sdhColumns, sdhDevices, sdhImport } from "./sdh"
import { sparePartColumns, spareParts, sparePartsImport } from "./spare-parts"
import { switchColumns, switches, switchesImport } from "./switches"

/*
 * Разделы для общих экранов: «Сводные файлы» (записи по филиалам), «Аналитика» (заполненность полей — колонки отчёта),
 * «Импорт Excel» (поля и сохранение). Новый раздел — строкой сюда.
 */

type Rec = { id: number; branch?: string; status?: string }

export type SectionData = {
  key: string
  title: string
  /** Группа меню («Линии и сооружения») */
  crumb: string
  all: () => Rec[]
  columns: ReportCol<never>[]
  import?: ImportSpec<never>
}

const section = <T extends Rec>(s: { key: string; title: string; crumb: string; all: () => T[]; columns: ReportCol<T>[]; import?: ImportSpec<T> }) =>
  s as unknown as SectionData

export const SECTIONS: SectionData[] = [
  section({ key: "nodes", title: "Узлы связи", crumb: "Сеть", all: nodes.all, columns: nodeColumns, import: nodesImport }),
  section({ key: "switches", title: "Коммутаторы", crumb: "Оборудование / Системы передачи данных", all: switches.all, columns: switchColumns, import: switchesImport }),
  section({ key: "routers", title: "Маршрутизаторы", crumb: "Оборудование / Системы передачи данных", all: routers.all, columns: routerColumns, import: routersImport }),
  section({ key: "pdh", title: "PDH", crumb: "Оборудование / Проводные технологии", all: pdhDevices.all, columns: pdhColumns, import: pdhImport }),
  section({ key: "sdh", title: "SDH", crumb: "Оборудование / Проводные технологии", all: sdhDevices.all, columns: sdhColumns, import: sdhImport }),
  section({ key: "dwdm", title: "DWDM", crumb: "Оборудование / Проводные технологии", all: dwdmDevices.all, columns: dwdmColumns, import: dwdmImport }),
  section({ key: "rrl", title: "РРЛ", crumb: "Оборудование / Беспроводные технологии", all: rrlSpans.all, columns: rrlColumns, import: rrlImport }),
  section({ key: "radio-bridges", title: "Радиомосты", crumb: "Оборудование / Беспроводные технологии", all: radioBridges.all, columns: radioBridgeColumns, import: radioBridgesImport }),
  section({ key: "bwa-wimax", title: "БШД WiMAX", crumb: "Оборудование / Беспроводные технологии", all: wimax.all, columns: wimaxColumns, import: wimaxImport }),
  section({ key: "bwa-lte", title: "БШД Telrad LTE", crumb: "Оборудование / Беспроводные технологии", all: lte.all, columns: lteColumns, import: lteImport }),
  section({ key: "bwa-wll", title: "БШД WLL", crumb: "Оборудование / Беспроводные технологии", all: wll.all, columns: wllColumns, import: wllImport }),
  section({ key: "spare-parts", title: "ЗИП", crumb: "Оборудование / Склад", all: spareParts.all, columns: sparePartColumns, import: sparePartsImport }),
  section({ key: "ip-plan", title: "Единый IP-план", crumb: "Сервисы", all: ipPlan.all, columns: ipPlanColumns }),
  section({ key: "backups", title: "Резервные копии", crumb: "Сервисы", all: backups.all, columns: backupColumns }),
  section({ key: "fiber-lines", title: "ВОЛС", crumb: "Линии и сооружения", all: fiberLines.all, columns: fiberLineColumns, import: fiberLinesImport }),
]

export const sectionOf = (key: string) => SECTIONS.find((s) => s.key === key)
