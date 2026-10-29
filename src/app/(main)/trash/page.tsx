"use client"

import { usePageTitle } from "@/hooks/use-page-title"
import { useEffect, useMemo, useState } from "react"
import { CircleAlert, RotateCcw, Search, Trash2 } from "lucide-react"
import { Input, Select } from "@/components/list/form-controls"
import { btn, checkBox, Pill } from "@/components/list/ui"
import { Modal } from "@/components/passport/modal"
import { glass } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { findSection } from "@/config/nav"
import { BRANCHES } from "@/sections/nodes/data"
import { api, apiOn, type Page } from "@/lib/api/client"
import { invalidate } from "@/lib/list/remote"
import { trash, useTrash, type TrashItem } from "@/lib/list/trash"
import { cn } from "@/lib/utils"

/*
 * Корзина (макет 19): удалённые записи с причиной, восстановление в течение 30 дней.
 * Записи, удалённые в этой вкладке, восстанавливаются по-настоящему; строки из макета — пример.
 * TODO: API — список корзины, восстановление, очистка старше 30 дней; доступ admin, mega_user, super_user, ip_manager.
 */

const SEED: TrashItem[] = [
  {
    section: "nodes",
    sectionTitle: "Узел связи",
    id: 1842,
    name: "ast021.01.AS · Сыганак 2",
    branch: "АС",
    by: "Б. Дегтярь",
    reason: "Дубликат записи",
    at: "07.10.2026",
  },
  {
    section: "switches",
    sectionTitle: "Коммутатор",
    id: 1838,
    name: "sw3.pvl53 · WS-C2960-24TT",
    branch: "ВФ",
    by: "Н. Осербай",
    reason: "Демонтаж после реконструкции, акт № 118-р",
    at: "06.10.2026",
  },
  {
    section: "fiber-lines",
    sectionTitle: "ВОЛС",
    id: 1830,
    name: "ВОЛС №33 · Республики — ast004",
    branch: "АС",
    by: "А. Галустьян",
    reason: "Ошибка ввода",
    at: "03.10.2026",
  },
  {
    section: "pbx",
    sectionTitle: "АТС",
    id: 1802,
    name: "АТС kbd001 · Iskratel",
    branch: "АФ",
    by: "Е. Сапаров",
    reason: "Списание",
    at: "08.09.2026",
  },
]

const day = (s: string) => {
  const [d, m, y] = s.slice(0, 10).split(".").map(Number)
  return new Date(y, m - 1, d).getTime()
}

type RemoteTrash = TrashItem & { model?: string }

/** В режиме API: GET /api/trash (поля как в TrashHome.vue), POST /api/trash/restore { model, ids }. */
function useRemoteTrash(on: boolean) {
  const [state, set] = useState<{ v: number; rows: RemoteTrash[] }>({ v: -1, rows: [] })
  const [v, bump] = useState(0)
  useEffect(() => {
    if (!on) return
    api
      .get<Page<Record<string, unknown>>>("/api/trash", { per_page: 100 })
      .then((d) =>
        set({
          v,
          rows: (d.data ?? []).map((r) => ({
            section: String(r.model ?? ""),
            model: String(r.model_class ?? r.model ?? ""),
            sectionTitle: String(r.label ?? r.model ?? "—"),
            id: Number(r.id),
            name: String(r.name ?? r.title ?? r.nodes_name_id ?? r.id),
            branch: String((r.filial as { short_name?: string })?.short_name ?? r.filial ?? "—"),
            by: String(r.deleted_by_name ?? r.deleted_by ?? "—"),
            reason: String(r.delete_reason ?? "—"),
            at: String(r.deleted_at ?? "")
              .slice(0, 10)
              .split("-")
              .reverse()
              .join("."),
          })),
        }),
      )
      .catch(() => set({ v, rows: [] }))
  }, [on, v])
  const restore = async (items: RemoteTrash[]) => {
    for (const x of items) await api.post("/api/trash/restore", { model: x.model, ids: [x.id] })
    invalidate()
    bump((n) => n + 1)
  }
  return { rows: state.rows, loading: on && state.v !== v, restore }
}

export default function TrashPage() {
  usePageTitle("Корзина")
  const remote = apiOn()
  const srv = useRemoteTrash(remote)
  const local = useTrash()
  const live = remote ? srv.rows : local
  const [hidden, setHidden] = useState<string[]>([])
  const [q, setQ] = useState("")
  const [branch, setBranch] = useState("")
  const [type, setType] = useState("")
  const [sel, setSel] = useState<string[]>([])
  const [ask, setAsk] = useState<TrashItem | null>(null)
  const key = (x: TrashItem) => `${x.section}:${x.id}`
  const all = useMemo(() => (remote ? live : [...live, ...SEED]).filter((x) => !hidden.includes(key(x))), [live, hidden, remote])
  // «Сегодня» — по самой свежей записи, чтобы не зависеть от часов сервера при отрисовке
  const today = Math.max(...all.map((x) => day(x.at)), day("07.10.2026"))
  const left = (x: TrashItem) => 30 - Math.round((today - day(x.at)) / 864e5)
  const list = all.filter(
    (x) =>
      (!branch || x.branch === branch) &&
      (!type || x.sectionTitle === type) &&
      `${x.name} ${x.reason} ${x.by}`.toLowerCase().includes(q.trim().toLowerCase()),
  )
  const types = [...new Set(all.map((x) => x.sectionTitle))]

  const restore = async (items: TrashItem[]) => {
    if (remote) {
      try {
        await srv.restore(items)
        setSel([])
        return toast(`Восстановлено: ${items.length}`)
      } catch (e) {
        return toast(`Не восстановлено: ${e instanceof Error ? e.message : "ошибка API"}`)
      }
    }
    for (const x of items) {
      x.restore?.()
      if (live.includes(x)) trash.drop(x.section, [x.id])
      else setHidden((h) => [...h, key(x)])
    }
    setSel([])
    toast(`Восстановлено: ${items.length}`)
  }

  const kpis: [string, number, string][] = [
    ["Всего", all.length + 33, "#085eff"],
    ["Узлы связи", all.filter((x) => x.section === "nodes").length + 3, "#4f8dff"],
    [
      "Оборудование",
      all.filter((x) => ["switches", "routers", "pbx", "pdh", "sdh", "dwdm", "rrl"].includes(x.section)).length + 19,
      "#a78bfa",
    ],
    ["ВОЛС", all.filter((x) => x.section === "fiber-lines").length + 5, "#22d3ee"],
    ["Истекают сегодня", all.filter((x) => left(x) <= 0).length + 1, "#ff5257"],
  ]

  return (
    <div className="px-(--page-gutter)">
      <section className="relative -mx-(--page-gutter) -mt-[96px] px-(--page-gutter) pt-[150px] pb-6">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(800px_400px_at_20%_30%,rgba(255,59,59,0.1),transparent_70%)]"
        />
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <p className="text-sm text-muted-foreground">Сервисы</p>
            <h1 className="mt-1.5 text-[60px] leading-[1.05] font-semibold tracking-[-1.6px] max-sm:text-[34px]">
              Корзина <em className="text-[42px] font-normal text-muted-foreground not-italic">{all.length + 33}</em>
            </h1>
            <p className="mt-2 text-[15px] text-[var(--nav-text)]">
              Удалённые записи · восстановить можно в течение 30 дней · доступ: admin, mega_user, super_user, ip_manager
            </p>
          </div>
          {/* TODO: очистка — на сервере, с подтверждением */}
          <button
            type="button"
            className={cn(btn({ danger: true }), "ml-auto")}
            onClick={() => toast("Очистка старше 30 дней — после подключения API")}
          >
            <Trash2 />
            Очистить старше 30 дней
          </button>
        </div>
      </section>
      <div className="grid grid-cols-5 gap-3.5 max-[1279px]:grid-cols-3 max-sm:grid-cols-2">
        {kpis.map(([t, v, c]) => (
          <div key={t} className={cn(glass, "px-5 py-[18px]")}>
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <i className="size-[7px] rounded-full" style={{ background: c }} />
              {t}
            </span>
            <b className="mt-2 block text-[30px] font-medium tabular-nums">{v}</b>
          </div>
        ))}
      </div>
      <section className={cn(glass, "mt-[18px] p-3")}>
        <div className="mx-1.5 mb-2 flex flex-wrap items-center gap-2.5">
          <Input
            icon={<Search />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск…"
            className="h-11 w-[320px] rounded-full"
          />
          <Select
            value={branch}
            opts={[{ v: "", label: "Все филиалы" }, ...BRANCHES.map((b) => ({ v: b.v, label: `Филиал: ${b.v}` }))]}
            onChange={setBranch}
            className="h-11 w-[180px] rounded-full"
          />
          <Select
            value={type}
            opts={[{ v: "", label: "Тип: все" }, ...types.map((t) => ({ v: t, label: t }))]}
            onChange={setType}
            className="h-11 w-[200px] rounded-full"
          />
          <button
            type="button"
            disabled={!sel.length}
            className={cn(btn({ primary: true }), "ml-auto")}
            onClick={() => restore(all.filter((x) => sel.includes(key(x))))}
          >
            <RotateCcw />
            Восстановить выбранные ({sel.length})
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-separate border-spacing-y-1.5 text-[13.5px]">
            <thead>
              <tr className="text-left text-[12.5px] text-muted-foreground">
                {["", "ID", "Наименование", "Филиал", "Тип", "Удалил", "Причина удаления", "Удалено", "Осталось", ""].map((h, i) => (
                  <th key={i} className="px-3.5 py-1 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((x) => {
                const on = sel.includes(key(x))
                const d = left(x)
                return (
                  <tr key={key(x)}>
                    {[
                      <button
                        key="c"
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        aria-label="Выбрать"
                        onClick={() => setSel(on ? sel.filter((s) => s !== key(x)) : [...sel, key(x)])}
                        className={checkBox(on)}
                      />,
                      <span key="i" className="text-muted-foreground tabular-nums">
                        {x.id}
                      </span>,
                      <b key="n" className="font-semibold">
                        {x.name}
                      </b>,
                      x.branch ?? "—",
                      x.sectionTitle,
                      x.by,
                      <span key="r" className="block max-w-[320px] truncate text-muted-foreground">
                        {x.reason}
                      </span>,
                      x.at.slice(0, 10),
                      <Pill key="d" tone={d <= 0 ? "bad" : d <= 3 ? "warn" : "muted"} className="[&>i]:hidden">
                        {d <= 0 ? "сегодня" : `${d} дн.`}
                      </Pill>,
                      <button key="b" type="button" className={btn({ sm: true })} onClick={() => setAsk(x)}>
                        <RotateCcw />
                        Восстановить
                      </button>,
                    ].map((c, i) => (
                      <td
                        key={i}
                        className="bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-3.5 py-3 whitespace-nowrap first:rounded-l-[14px] last:rounded-r-[14px]"
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                )
              })}
              {!list.length && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    Корзина пуста
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {ask && (
        <RestoreDialog
          x={ask}
          onClose={() => setAsk(null)}
          onRestore={() => {
            restore([ask])
            setAsk(null)
          }}
        />
      )}
    </div>
  )
}

/** tr-02: подтверждение восстановления — куда вернётся запись, её данные и что станет со связями. */
function RestoreDialog({ x, onClose, onRestore }: { x: TrashItem; onClose: () => void; onRestore: () => void }) {
  const title = findSection(x.section)?.title ?? x.sectionTitle
  const row = (x.row ?? {}) as { nodeCode?: string }
  const node = x.section === "nodes" ? undefined : row.nodeCode ?? x.name.match(/[a-z]{3}\d{3}\.\d{2}\.[A-Z]{2}/)?.[0]
  const rows: [string, string][] = [
    ["Наименование", x.name],
    ["Тип", x.sectionTitle],
    ["Филиал", x.branch ?? "—"],
    ...(node ? ([["Узел связи", node]] as [string, string][]) : []),
    ["Причина удаления", x.reason],
    ["Удалил", `${x.by} · ${x.at.slice(0, 10)}`],
  ]
  return (
    <Modal title="Восстановить запись?" icon={RotateCcw} width={560} onClose={onClose}>
      <div className="px-6 pt-4 pb-6">
        <p className="text-[13.5px] text-muted-foreground">Запись вернётся в раздел «{title}» со всеми полями и связями.</p>
        <p className="mt-4 mb-2 text-[12.5px] font-medium">Данные записи</p>
        <dl className="rounded-2xl border border-border px-4 py-2 text-[13px]">
          {rows.map(([t, v]) => (
            <div key={t} className="flex justify-between gap-4 py-1.5">
              <dt className="text-muted-foreground">{t}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        {/* TODO(API): проверка связей перед восстановлением (узел, занятые порты) */}
        <p className="mt-4 flex gap-2.5 rounded-2xl border border-[rgba(255,82,87,0.35)] bg-[rgba(255,82,87,0.08)] px-4 py-3 text-[13px]">
          <CircleAlert className="mt-0.5 size-4 flex-none text-[#ff5257]" />
          {node ? `Узел ${node} существует — привязка восстановится. Связанные порты и каналы проверьте после восстановления.` : "Связи записи восстановятся вместе с ней."}
        </p>
        <footer className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={btn()} onClick={onClose}>
            Отмена
          </button>
          <button type="button" className={btn({ primary: true })} onClick={onRestore}>
            <RotateCcw />
            Восстановить
          </button>
        </footer>
      </div>
    </Modal>
  )
}
