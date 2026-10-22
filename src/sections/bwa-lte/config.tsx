import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf } from "@/sections/api-helpers"
import { bwa } from "@/sections/bwa"

/** БШД Telrad LTE (макет 28): описание раздела и источник в API. */
export const spec: Spec = {
  ...bwa("bwa-lte", "28", "БШД Telrad LTE", 363, ["CPE7000", "CPE 8100", "CPE9000", "BreezeCompact 1000"], ["Telrad"]),
  api: genApi({
    base: "/api/bhd-lte-equipments",
    trashKey: "bhd_lte_equipments",
    fields: {
      model: "model",
      vendor: "vendor",
      sectors: "sector_number",
      serial: "serial_number",
      subs: pairOf("subscribers", "licenses"),
      freq: "frequency",
      place: "installation_address",
      network: "network_type",
    },
    filter: { vendor: "vendor", network: "network_type", model: "model" },
  }),
}

export const list = makeList(spec)
