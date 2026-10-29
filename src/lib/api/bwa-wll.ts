"use client"

import { bwaColumns, bwaImport, bwaSource, type BwaParams } from "./bwa"

/*
 * 29 БШД WLL — данные раздела (общее для БШД — lib/api/bwa.ts). Без API — примеры в памяти вкладки.
 * API техучёта: /api/bhd-wll-equipments, удаление — /api/trash/soft-delete/bhd_wll_equipments.
 */

export const WLL_VENDORS = ["Ubiquiti Networks", "InfiNet"]

export const wll = bwaSource({
  key: "bwa-wll",
  title: "БШД WLL",
  total: 131,
  models: ["NanoStation M3", "Rocket M5", "SkyMAN R5000", "PowerBeam M5-400"],
  vendors: WLL_VENDORS,
  base: "/api/bhd-wll-equipments",
  trashKey: "bhd_wll_equipments",
})

export const useWllList = wll.useAll
export const useWll = wll.useRecord

export const wllColumns = bwaColumns
export const wllImport = bwaImport(wll, { key: "bwa-wll", title: "БШД WLL", vendors: WLL_VENDORS })

/** Паспорт: дальность покрытия, км · ширина полосы, MHz · вендор. */
export const WLL_PASSPORT: BwaParams = { km: 15, band: 1, vendor: "Ubiquiti Networks" }
