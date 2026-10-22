"use client"

import { useState } from "react"
import type { GenRow } from "@/sections/make"
import { staffOf } from "@/sections/spd/detail"
import { MolTab, MovesTab, type Staff } from "@/sections/spd/tabs"

/*
 * Вкладки «МОЛ и ответственные» и «История перемещений» для паспортов оборудования (АТС, номерная ёмкость,
 * PDH, SDH, DWDM): те же, что у СПД, данные — пока общие примеры. TODO(API): МОЛ и перемещения из 1С / СЭД.
 */

const init = (x: GenRow) => staffOf({ branch: x.branch, nodeCode: x.nodeCode, since: "12.03.2019" }, "Отдел эксплуатации")

export function MolPane({ x }: { x: GenRow }) {
  const [d, set] = useState<Staff>(() => init(x))
  return <MolTab d={d} onChange={(mol) => set({ ...d, mol })} />
}

export function MovesPane({ x }: { x: GenRow }) {
  const [d, set] = useState<Staff>(() => init(x))
  return <MovesTab d={d} x={x} onChange={(moves) => set({ ...d, moves })} />
}
