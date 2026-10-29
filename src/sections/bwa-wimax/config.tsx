import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf } from "@/lib/api/helpers"
import { bwa } from "@/sections/bwa"

/** БШД WiMAX (макет 27): описание раздела и источник в API. */
export const spec: Spec = {
  ...bwa(
    "bwa-wimax",
    "27",
    "БШД WiMAX",
    220,
    ["BreezeMAX PRO CPE", "MacroMAXe, Air4G-W24", "BMAX-CPE-ODU-PRO-SA-3.5"],
    ["Alvarion", "Airspan"],
  ),
  api: genApi({
    base: "/api/bhd-wimax-equipments",
    trashKey: "bhd_wimax_equipments",
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
