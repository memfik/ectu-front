"use client"

import { usePageTitle } from "@/hooks/use-page-title"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BookOpen,
  Box,
  Camera,
  DatabaseBackup,
  FileChartColumn,
  FileUp,
  HousePlus,
  Keyboard,
  LifeBuoy,
  Map as MapIcon,
  Megaphone,
  MessageSquare,
  Share2,
  Trash2,
} from "lucide-react"
import { btn } from "@/components/list/ui"
import { glass } from "@/components/passport/ui"
import { toast } from "@/components/shared/toast"
import { cn } from "@/lib/utils"
import { AccountHero, SideNav } from "@/components/account/ui"

/*
 * Помощь (меню профиля): инструкции по основным сценариям, горячие клавиши (#hotkeys), что нового в v6.1 (#whats-new), поддержка.
 * TODO: обращение в поддержку — заявка в KTicket; инструкции — из базы знаний.
 */

const GUIDES: [LucideIcon, string, string, string][] = [
  [HousePlus, "Создать узел связи", "Форма с обязательными полями, черновик сохраняется сам. Координаты — на карте после создания.", "/nodes/new"],
  [FileUp, "Импорт из Excel", "Тип и филиал → файл → сопоставление колонок → проверка. Скачайте шаблон раздела.", "/excel-import"],
  [MapIcon, "Карта сети", "Слои, подложки, линейка, редактор трасс и камеры. Клик по узлу — карточка и паспорт.", "/map"],
  [FileChartColumn, "Сводные файлы", "Форма учёта по филиалам в Excel — из любого раздела кнопкой «Сводный файл».", "/summary-files"],
  [DatabaseBackup, "Резервные копии", "Конфигурации устройств: просмотр, сравнение с прошлой копией, снятие вручную.", "/backups"],
  [Trash2, "Корзина", "Удалённые записи хранятся 30 дней — восстановление со всеми полями и связями.", "/trash"],
  [Share2, "Ядро сети", "Загрузка магистралей по направлениям, аварии, раскладка карты ядра.", "/core"],
  [Camera, "Видеонаблюдение", "Камеры узлов на карте, видеостена, подключение новой камеры.", "/cameras"],
]

const KEYS: [string[], string][] = [
  [["⌘", "K"], "Поиск по системе (Ctrl + K в Windows)"],
  [["⌘", "↵"], "В поиске — открыть выбранное в новой вкладке"],
  [["↑", "↓"], "В поиске и меню — выбор пункта"],
  [["Esc"], "Закрыть окно, шторку или меню"],
  [["Двойной клик"], "По строке списка — открыть паспорт"],
]

const NEWS: [string, string][] = [
  ["Новый интерфейс", "Шапка с мега-меню вместо сайдбара, тёмная и светлая темы, мобильная версия."],
  ["Паспорта по шаблонам", "Узлы, оборудование, линии и сооружения: 3D / панель / схема / карта / фото и вкладки."],
  ["3D-модели", "Узел связи и стойки СПД в 3D, каталог моделей оборудования."],
  ["Карта сети", "Слои, подложки, линейка, редактор трасс, камеры и видеостена."],
  ["Ядро сети", "Загрузка магистральных каналов по данным Orion — перенос из KTicket."],
  ["Аналитика", "Заполненность полей по разделам и филиалам, мониторинг OneWeb, сводные файлы."],
  ["Импорт Excel", "Сопоставление колонок файла с полями ЕСТУ и проверка строк до загрузки."],
]

const NAV = [
  { id: "guides", t: "Инструкции", icon: BookOpen },
  { id: "hotkeys", t: "Горячие клавиши", icon: Keyboard },
  { id: "whats-new", t: "Что нового в v6.1", icon: Megaphone },
  { id: "support", t: "Поддержка", icon: LifeBuoy },
]

function Head({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-[10px] bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
        <Icon className="size-[18px]" />
      </span>
      <b className="text-[15px] font-semibold">{title}</b>
    </header>
  )
}

export default function HelpPage() {
  usePageTitle("Помощь")
  return (
    <div className="px-(--page-gutter) pb-10">
      <AccountHero crumb="Профиль" title="Помощь и инструкции" sub="ЕСТУ v6.1 · единая система технического учёта QMobile" />
      <div className="grid grid-cols-[240px_1fr] items-start gap-[18px] max-[1279px]:grid-cols-1">
        <SideNav items={NAV} />
        <div className="flex min-w-0 flex-col gap-[18px]">
          <section id="guides" className={cn(glass, "scroll-mt-6 p-5")}>
            <Head icon={BookOpen} title="Инструкции" />
            <div className="grid grid-cols-4 gap-2.5 max-[1500px]:grid-cols-2 max-sm:grid-cols-1">
              {GUIDES.map(([I, t, s, href]) => (
                <Link key={t} href={href} className="group flex flex-col rounded-2xl border border-border bg-[var(--chip-bg)] p-4 hover:border-[#085eff]">
                  <I className="size-5 text-[var(--link)]" />
                  <b className="mt-4 text-[14px] font-semibold">{t}</b>
                  <span className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{s}</span>
                  <span className="mt-3 flex items-center gap-1 text-[12.5px] text-[var(--link)]">
                    Открыть <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 items-start gap-[18px] max-[1279px]:grid-cols-1">
            <section id="hotkeys" className={cn(glass, "scroll-mt-6 p-5")}>
              <Head icon={Keyboard} title="Горячие клавиши" />
              {KEYS.map(([keys, t]) => (
                <div key={t} className="flex items-center justify-between gap-4 border-b border-border py-3 text-[13.5px] last:border-0">
                  <span>{t}</span>
                  <span className="flex flex-none gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="grid h-7 min-w-7 place-items-center rounded-lg border border-border bg-[var(--chip-bg)] px-2 font-sans text-[12px] font-semibold">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </div>
              ))}
            </section>

            <section id="whats-new" className={cn(glass, "scroll-mt-6 p-5")}>
              <Head icon={Megaphone} title="Что нового в v6.1" />
              <ol className="relative ml-2 border-l border-border pl-5">
                {NEWS.map(([t, s]) => (
                  <li key={t} className="relative pb-4 last:pb-0">
                    <i className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-[#085eff] shadow-[0_0_0_3px_rgba(8,94,255,0.2)]" />
                    <b className="block text-[13.5px] font-semibold">{t}</b>
                    <span className="text-[12.5px] text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section id="support" className={cn(glass, "scroll-mt-6 flex flex-wrap items-center gap-4 p-5")}>
            <span className="grid size-11 place-items-center rounded-xl bg-[rgba(8,94,255,0.14)] text-[var(--link)]">
              <LifeBuoy className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[15px] font-semibold">Не нашли ответ?</b>
              <span className="text-[13px] text-muted-foreground">Опишите проблему — обращение уйдёт в службу поддержки ЕСТУ, ответ придёт в уведомления.</span>
            </span>
            <Link href="/equipment-3d" className={btn()}>
              <Box />
              3D-каталог
            </Link>
            <button type="button" className={btn({ primary: true })} onClick={() => toast("Обращение в поддержку — после подключения KTicket")}>
              <MessageSquare />
              Написать в поддержку
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
