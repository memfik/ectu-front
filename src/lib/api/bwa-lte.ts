"use client"

import { bwaColumns, bwaImport, bwaSource, type BwaParams } from "./bwa"

/*
 * 28 БШД Telrad LTE — данные раздела (общее для БШД — lib/api/bwa.ts). Без API — примеры в памяти вкладки.
 * API техучёта: /api/bhd-lte-equipments, удаление — /api/trash/soft-delete/bhd_lte_equipments.
 */

export const LTE_VENDORS = ["Telrad"]

export const lte = bwaSource({
  key: "bwa-lte",
  title: "БШД Telrad LTE",
  total: 363,
  models: ["CPE7000", "CPE 8100", "CPE9000", "BreezeCompact 1000"],
  vendors: LTE_VENDORS,
  base: "/api/bhd-lte-equipments",
  trashKey: "bhd_lte_equipments",
})

export const useLteList = lte.useAll
export const useLte = lte.useRecord

export const lteColumns = bwaColumns
export const lteImport = bwaImport(lte, { key: "bwa-lte", title: "БШД Telrad LTE", vendors: LTE_VENDORS })

/** Паспорт: дальность покрытия, км · ширина полосы, MHz · вендор. */
export const LTE_PASSPORT: BwaParams = { km: 8, band: 20, vendor: "Telrad Networks" }
