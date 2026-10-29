"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Copy, FileText, Globe, History, Image as ImageIcon, LayoutGrid, Maximize2, Pencil, QrCode, Trash2 } from "lucide-react"
import { DeleteDialog } from "@/components/blocks/delete-dialog"
import { PassportLoading, PassportTabs, TabBody } from "@/components/blocks/passport"
import { QrDialog } from "@/components/blocks/qr-dialog"
import { IpPlanForm } from "@/components/ip-plan/ip-plan-form"
import { btn, circ, Pill } from "@/components/list/ui"
import { DocsTab } from "@/components/nodes/tabs"
import { Gallery } from "@/components/passport/gallery"
import { Avatar, Card, glass, Kv } from "@/components/passport/ui"
import { RecordNotFound } from "@/components/shared/states"
import { toast } from "@/components/shared/toast"
import { usePageTitle } from "@/hooks/use-page-title"
import { CURRENT_USER } from "@/lib/current-user"
import { branchName, EQUIP_REMOVE, qrUrl } from "@/lib/api/equipment"
import { ipName, ipPlan, ipStatus, ipSub, useIpAddress } from "@/lib/api/ip-plan"
import type { Doc, Media } from "@/sections/nodes/detail"
import { cn } from "@/lib/utils"

/*
 * 15 Единый IP-план — паспорт адреса /ip-plan/<id>: шапка, поля, фото, ответственный; вкладки «Обзор», «Документация»,
 * «Фото и видео», «История». Без карты и узла связи. Запись — useIpAddress(id) из lib/api/ip-plan.
 * TODO(API): документы, фото и история — пока примеры.
 */

type TabKey = "overview" | "docs" | "photo" | "history"

const TITLE = "Единый IP-план"
const HERO = "/equipment/switch-hero.jpg"

export default function IpAddressPage({ params }: PageProps<"/ip-plan/[id]">) {
  const id = +use(params).id
  const router = useRouter()
  const { row: x, loading } = useIpAddress(id)
  const [tab, setTab] = useState<TabKey>("overview")
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const [qr, setQr] = useState(false)
  const [gallery, setGallery] = useState<number | null>(null)
  usePageTitle(x ? ipName(x) : `${TITLE} · паспорт`)

  if (loading) return <PassportLoading />
  if (!x) return <RecordNotFound title="Запись не найдена" href="/ip-plan" back="К списку" />

  const name = ipName(x)
  const sub = ipSub(x)
  const [label, tone] = ipStatus(x)
  const editable = !ipPlan.readOnly()
  const media: Media[] = [HERO, "/nodes/g-1.jpg", "/nodes/g-3.jpg", "/nodes/g-5.jpg"].map((src, i) => ({
    src,
    title: `${name} · фото ${i + 1}`,
    date: "14.01.2026, 10:12",
    info: "4032×3024 · 3.1 МБ",
    author: "Борис Б. Дегтярь",
    geo: `${x.ll[0].toFixed(4)}, ${x.ll[1].toFixed(4)}`,
    tags: [TITLE],
    text: "Фото с обхода объекта.",
  }))
  const docs: Doc[] = [
    { id: 1, name: `Паспорт ${name}.pdf`, kind: "Техническая", size: "1.4 МБ", date: "14.01.2026", ext: "pdf" },
    { id: 2, name: "Акт ввода в эксплуатацию.pdf", kind: "Приёмо-сдаточная", size: "620 КБ", date: "12.03.2019", ext: "pdf" },
    { id: 3, name: `Сводный ${TITLE}.xlsx`, kind: "Приёмо-сдаточная", size: "84 КБ", date: "05.10.2026", ext: "xlsx" },
  ]
  const history = [
    { what: "Изменено поле «Статус»", who: CURRENT_USER.name, date: "06.10.2026, 14:22" },
    { what: "Загружен «Акт ввода в эксплуатацию.pdf»", who: "Борис Б. Дегтярь", date: "14.01.2026, 10:05" },
    { what: "Запись создана", who: "Импорт Excel", date: "12.03.2019, 09:40" },
  ]

  return (
    <div className="relative isolate">
      <section className="relative -mt-[96px] overflow-hidden px-(--page-gutter) pt-[112px] pb-6">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(900px_300px_at_60%_0%,rgba(0,26,159,0.45),transparent_70%)]" />
        <header className="flex flex-wrap items-center gap-x-[18px] gap-y-4">
          <button type="button" onClick={() => router.push("/ip-plan")} className={cn(circ, "size-[54px] [&_svg]:size-5")} aria-label="Назад к списку">
            <ChevronLeft />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-[var(--nav-text)]">
              Сервисы /{" "}
              <Link href="/ip-plan" className="hover:text-foreground">
                {TITLE}
              </Link>{" "}
              / Паспорт
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-3 text-4xl font-semibold tracking-[-0.6px] max-sm:text-[26px]">
              <span className="max-w-[900px] truncate">{name}</span>
              <button
                type="button"
                aria-label="Скопировать"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigator.clipboard?.writeText(name).then(() => toast("Скопировано"))}
              >
                <Copy className="size-5" />
              </button>
              <Pill tone={tone}>{label}</Pill>
              <span className="inline-flex h-[26px] items-center rounded-full bg-[var(--chip-bg)] px-2.5 text-xs font-semibold">{x.branch}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <button type="button" className={cn(circ, "size-11")} title="QR-код" onClick={() => setQr(true)}>
              <QrCode />
            </button>
            {editable && (
              <>
                <button type="button" className={btn({ primary: true })} onClick={() => setEdit(true)}>
                  <Pencil />
                  Редактировать
                </button>
                <button
                  type="button"
                  aria-label="Удалить"
                  onClick={() => setDel(true)}
                  className={cn(circ, "size-11 text-[#ff5257] hover:border-[#ff3b30] hover:bg-[#ff3b30]")}
                >
                  <Trash2 />
                </button>
              </>
            )}
          </div>
        </header>

        <div className="mt-7 grid grid-cols-[420px_1fr_380px] gap-[18px] max-[1500px]:grid-cols-[380px_1fr_340px] max-[1279px]:grid-cols-1">
          <Card
            icon={Globe}
            title="Паспорт"
            className="self-start"
            action={
              editable && (
                <button type="button" className={circ} title="Все поля" onClick={() => setEdit(true)}>
                  <Maximize2 />
                </button>
              )
            }
          >
            <Kv
              rows={[
                { t: "Нумерация", v: x.num },
                { t: "Филиал", v: branchName(x.branch) },
                { t: "IP-адрес", v: x.f.ip },
                { t: "Префикс", v: x.f.prefix },
                { t: "Клиент", v: x.f.client },
                { t: "Локация", v: x.f.place },
                { t: "Скорость", v: x.f.speed },
                { t: "Заявка KCRM", v: x.f.kcrm },
                { t: "Менеджер/Инженер", v: x.f.eng },
                { t: "Статус", v: label },
              ]}
            />
          </Card>

          <section className={cn(glass, "relative min-h-[480px] overflow-hidden")}>
            <button
              type="button"
              onClick={() => setGallery(0)}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${HERO})` }}
              aria-label="Открыть галерею"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(10,11,14,0.8))]" />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-[rgba(18,20,25,0.84)] p-[5px] backdrop-blur-[12px]">
              <button type="button" className="flex h-[38px] items-center gap-[7px] rounded-full bg-[#085eff] px-4 text-[13.5px] font-semibold text-white">
                <ImageIcon className="size-4" />
                Фото
              </button>
            </div>
          </section>

          <div className="flex flex-col gap-[18px]">
            <section className={cn(glass, "flex items-center gap-3 px-[18px] py-3.5")}>
              <Avatar initials="БД" color="linear-gradient(135deg,#0ea5e9,#0369a1)" className="size-11" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">Ответственный за эксплуатацию</span>
                <b className="block truncate text-sm font-semibold">Борис Б. Дегтярь</b>
              </span>
            </section>
          </div>
        </div>
      </section>

      <PassportTabs<TabKey>
        value={tab}
        onChange={setTab}
        tabs={[
          { k: "overview", t: "Обзор", icon: LayoutGrid },
          { k: "docs", t: "Документация", icon: FileText, n: docs.length },
          { k: "photo", t: "Фото и видео", icon: ImageIcon, n: media.length },
          { k: "history", t: "История", icon: History, n: history.length },
        ]}
      />

      <TabBody>
        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-[18px] max-[1279px]:grid-cols-1">
            <Card icon={FileText} title="Последние документы" count={docs.length}>
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-border py-2.5 text-[13.5px] last:border-0">
                  <span>
                    <b className="block font-medium">{d.name}</b>
                    <span className="text-xs text-muted-foreground">
                      {d.kind} · {d.size} · {d.date}
                    </span>
                  </span>
                </div>
              ))}
            </Card>
            <Card icon={History} title="История" count={history.length}>
              <HistoryList items={history} />
            </Card>
          </div>
        )}
        {tab === "docs" && (
          <DocsTab
            d={{
              docs,
              docGroups: [
                { kind: "Техническая", paper: true },
                { kind: "Приёмо-сдаточная", paper: false },
              ],
            }}
            onUpload={() => toast("Загрузка документов — после подключения API")}
          />
        )}
        {tab === "photo" && (
          <div className="grid grid-cols-4 gap-3 max-sm:grid-cols-2">
            {media.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGallery(i)}
                className="h-[200px] rounded-2xl bg-cover bg-center"
                style={{ backgroundImage: `url(${m.src})` }}
                aria-label={m.title}
              />
            ))}
          </div>
        )}
        {tab === "history" && (
          <Card icon={History} title="История изменений" count={history.length}>
            <HistoryList items={history} />
          </Card>
        )}
      </TabBody>

      {gallery !== null && <Gallery title={`Фото и видео · ${name}`} sub={sub} media={media} start={gallery} onClose={() => setGallery(null)} />}
      {qr && <QrDialog title={name} sub={sub} url={qrUrl("ip-plan", x.id)} onClose={() => setQr(false)} />}
      {edit && (
        <IpPlanForm
          row={x}
          onClose={() => setEdit(false)}
          onDelete={() => {
            setEdit(false)
            setDel(true)
          }}
        />
      )}
      {del && (
        <DeleteDialog
          icon={Globe}
          noun={["запись", "записи", "записей"]}
          items={[{ id: x.id, name, sub: x.f.client }]}
          {...EQUIP_REMOVE}
          onConfirm={(reason) => ipPlan.remove([x], reason)}
          onClose={() => setDel(false)}
          onDone={() => router.push("/ip-plan")}
        />
      )}
    </div>
  )
}

function HistoryList({ items }: { items: { what: string; who: string; date: string }[] }) {
  return (
    <ol className="relative ml-1.5 border-l border-border pl-5">
      {items.map((h) => (
        <li key={h.what} className="relative pb-4 last:pb-0">
          <i className="absolute top-1 -left-[27px] size-3 rounded-full border-2 border-[#4f8dff] bg-[var(--glass-card-solid)]" />
          <b className="block text-sm font-semibold">{h.what}</b>
          <span className="text-xs text-muted-foreground">
            {h.who} · {h.date}
          </span>
        </li>
      ))}
    </ol>
  )
}
