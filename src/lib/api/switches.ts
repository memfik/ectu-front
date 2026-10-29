"use client"

import type { ImportSpec } from "@/lib/list/import-file"
import { createSource } from "./source"
import { blankSpd, spdColumns, spdFromValues, spdImportFields, spdName, spdRemote, spdRows, type SpdRow } from "./spd"

/*
 * 03 Коммутаторы — источник раздела. Без API — примеры в памяти вкладки (1 324 записи, первые 10 — из макета 03).
 * API техучёта: /api/spd-equipments с equipment_type=switch. Тип записи, статусы, колонки — lib/api/spd.ts.
 */

export const switches = createSource<SpdRow>({
  key: "switches",
  title: "Коммутаторы",
  name: spdName,
  seed: () => spdRows("switch"),
  remote: spdRemote("switch"),
})

export const useSwitches = switches.useAll
export const useSwitch = switches.useRecord

export const blankSwitch = () => blankSpd("switch")

/** Колонки отчёта (n-08) и аналитики заполненности. */
export const switchColumns = spdColumns

/** Импорт Excel: поля — как в форме. */
export const switchesImport: ImportSpec<SpdRow> = {
  key: "switches",
  title: "Коммутаторы",
  fields: spdImportFields(),
  build: (v, base, id = 0) => spdFromValues(base ?? { ...blankSwitch(), id }, v),
  name: spdName,
  all: switches.all,
  nextId: switches.nextId,
  save: switches.save,
}
