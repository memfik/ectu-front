import { makeList, type Spec } from "@/sections/make"
import { genApi, pairOf } from "@/lib/api/helpers"
import { bwa } from "@/sections/bwa"

/** БШД WLL (макет 29): описание раздела и источник в API. */
export const spec: Spec = {
  ...bwa(
    "bwa-wll",
    "29",
    "БШД WLL",
    131,
    ["NanoStation M3", "Rocket M5", "SkyMAN R5000", "PowerBeam M5-400"],
    ["Ubiquiti Networks", "InfiNet"],
  ),
  api: genApi({
    base: "/api/bhd-wll-equipments",
    trashKey: "bhd_wll_equipments",
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
