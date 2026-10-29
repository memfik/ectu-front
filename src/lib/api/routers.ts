"use client"

import type { ImportSpec } from "@/lib/list/import-file"
import { createSource } from "./source"
import { blankSpd, spdColumns, spdFromValues, spdImportFields, spdName, spdRemote, spdRows, type SpdRow } from "./spd"

/*
 * 04 Маршрутизаторы — источник раздела. Без API — примеры в памяти вкладки (78 записей).
 * API техучёта: /api/spd-equipments с equipment_type=router. Тип записи, статусы, колонки — lib/api/spd.ts.
 */

export const routers = createSource<SpdRow>({
  key: "routers",
  title: "Маршрутизаторы",
  name: spdName,
  seed: () => spdRows("router"),
  remote: spdRemote("router"),
})

export const useRouters = routers.useAll
/** Запись по id (имя не useRouter — занято next/navigation) */
export const useRouterRow = routers.useRecord

export const blankRouter = () => blankSpd("router")

/** Колонки отчёта (n-08) и аналитики заполненности. */
export const routerColumns = spdColumns

/** Импорт Excel: поля — как в форме. */
export const routersImport: ImportSpec<SpdRow> = {
  key: "routers",
  title: "Маршрутизаторы",
  fields: spdImportFields(),
  build: (v, base, id = 0) => spdFromValues(base ?? { ...blankRouter(), id }, v),
  name: spdName,
  all: routers.all,
  nextId: routers.nextId,
  save: routers.save,
}
