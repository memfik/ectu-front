import type { Spec } from "@/sections/make"
import { spec as fiberLines } from "@/sections/fiber-lines/config"
import { spec as cableLines } from "@/sections/cable-lines/config"
import { spec as cableDucts } from "@/sections/cable-ducts/config"
import { spec as odf } from "@/sections/odf/config"
import { spec as masts } from "@/sections/masts/config"
import { spec as prospects } from "@/sections/prospects/config"
import { spec as onyma } from "@/sections/onyma/config"
import { spec as channelIds } from "@/sections/channel-ids/config"
import { spec as ipPlan } from "@/sections/ip-plan/config"
import { spec as backups } from "@/sections/backups/config"
import { spec as pbx } from "@/sections/pbx/config"
import { spec as numberCapacity } from "@/sections/number-capacity/config"
import { spec as pdh } from "@/sections/pdh/config"
import { spec as sdh } from "@/sections/sdh/config"
import { spec as dwdm } from "@/sections/dwdm/config"
import { spec as rrl } from "@/sections/rrl/config"
import { spec as radioBridges } from "@/sections/radio-bridges/config"
import { spec as bwaWimax } from "@/sections/bwa-wimax/config"
import { spec as bwaLte } from "@/sections/bwa-lte/config"
import { spec as bwaWll } from "@/sections/bwa-wll/config"
import { spec as trunkBs } from "@/sections/trunk-bs/config"
import { spec as vsat } from "@/sections/vsat/config"
import { spec as oneweb } from "@/sections/oneweb/config"
import { spec as ups } from "@/sections/ups/config"

/** Разделы на общем шаблоне (макеты 07–33): у каждого своя папка src/sections/<раздел>/. */
export const SPECS: Spec[] = [
  fiberLines,
  cableLines,
  cableDucts,
  odf,
  masts,
  prospects,
  onyma,
  channelIds,
  ipPlan,
  backups,
  pbx,
  numberCapacity,
  pdh,
  sdh,
  dwdm,
  rrl,
  radioBridges,
  bwaWimax,
  bwaLte,
  bwaWll,
  trunkBs,
  vsat,
  oneweb,
  ups,
]

export const specOf = (key: string) => SPECS.find((s) => s.key === key)
