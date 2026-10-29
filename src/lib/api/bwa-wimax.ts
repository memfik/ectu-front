"use client"

import { bwaColumns, bwaImport, bwaSource, type BwaParams } from "./bwa"

/*
 * 27 БШД WiMAX — данные раздела (общее для БШД — lib/api/bwa.ts). Без API — примеры в памяти вкладки.
 * API техучёта: /api/bhd-wimax-equipments, удаление — /api/trash/soft-delete/bhd_wimax_equipments.
 */

export const WIMAX_VENDORS = ["Alvarion", "Airspan"]

export const wimax = bwaSource({
  key: "bwa-wimax",
  title: "БШД WiMAX",
  total: 220,
  models: ["BreezeMAX PRO CPE", "MacroMAXe, Air4G-W24", "BMAX-CPE-ODU-PRO-SA-3.5"],
  vendors: WIMAX_VENDORS,
  base: "/api/bhd-wimax-equipments",
  trashKey: "bhd_wimax_equipments",
})

export const useWimaxList = wimax.useAll
export const useWimax = wimax.useRecord

export const wimaxColumns = bwaColumns
export const wimaxImport = bwaImport(wimax, { key: "bwa-wimax", title: "БШД WiMAX", vendors: WIMAX_VENDORS })

/** Паспорт: дальность покрытия, км · ширина полосы, MHz · вендор. */
export const WIMAX_PASSPORT: BwaParams = { km: 6, band: 7, vendor: "Alvarion" }
