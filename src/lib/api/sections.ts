"use client"

import type { ReportCol } from "@/components/blocks/report-dialog"
import type { ImportSpec } from "@/lib/list/import-file"
import { backupColumns, backups } from "./backups"
import { fiberLineColumns, fiberLines, fiberLinesImport } from "./fiber-lines"
import { ipPlan, ipPlanColumns } from "./ip-plan"
import { nodeColumns, nodes, nodesImport } from "./nodes"

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
  section({ key: "ip-plan", title: "Единый IP-план", crumb: "Сервисы", all: ipPlan.all, columns: ipPlanColumns }),
  section({ key: "backups", title: "Резервные копии", crumb: "Сервисы", all: backups.all, columns: backupColumns }),
  section({ key: "fiber-lines", title: "ВОЛС", crumb: "Линии и сооружения", all: fiberLines.all, columns: fiberLineColumns, import: fiberLinesImport }),
]

export const sectionOf = (key: string) => SECTIONS.find((s) => s.key === key)
