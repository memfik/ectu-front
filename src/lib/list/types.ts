import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

/*
 * Шаблон «Список» (макет 01, «Структура ЕСТУ»): один движок на все разделы, разделы отличаются конфигом.
 * Таблица / Карточки / Карта, фильтры с плашками, массовое удаление, превью справа.
 */

export type Row = { id: number }

/** Цвет плашки статуса: работает / ремонт / выведен / резерв / нейтральный. */
export type Tone = "ok" | "warn" | "bad" | "info" | "muted"

export type Column<T> = {
  k: string
  t: string
  render: (x: T) => ReactNode
  /** Простое значение — для сортировки и выгрузки. */
  value: (x: T) => string | number | null
  num?: boolean
  noSort?: boolean
  /** Ширина колонки, если нужна фиксированная. */
  w?: string
}

export type Option = { v: string; label: string }

export type Filter<T> = {
  k: string
  /** Подпись на кнопке фильтра и в плашке. */
  t: string
  /** Подпись кнопки, когда ничего не выбрано («Все филиалы»). */
  all?: string
  get: (x: T) => string | string[]
  opts: Option[]
  /** Короткая подпись значения в плашке («АС» вместо «Астана (АС)»). */
  short?: (v: string) => string
  /** Только в «Ещё фильтры», не кнопкой в панели. */
  more?: boolean
}

export type Kpi = {
  t: string
  /** Цвет точки и полосы. */
  color: string
  value: string
  /** Мелко справа от числа: «94%», «568 / 569». */
  note?: string
  /** Заполнение полосы, 0…100. */
  pct: number
}

export type HeroButton = { icon: LucideIcon; label: string; primary?: boolean; href?: string; onClick?: "export" | "import" | "report" | "create" }

/** Превью записи справа от таблицы. */
export type Preview = {
  photo?: string
  status: { label: string; tone: Tone }
  title: string
  sub: string
  facts: { t: string; v: ReactNode }[]
  stats: { t: string; v: ReactNode }[]
  tags?: string[]
  /** Кнопка «Подробнее об …». */
  more: string
}

/** Карточка записи в виде «Карточки». */
export type Card = {
  photo?: string
  status: { label: string; tone: Tone }
  title: string
  sub: string
  tags?: string[]
  /** Полоса внизу карточки: «Волокна 3/32». */
  bar?: { t: string; v: string; pct: number }
  /** Кнопка карточки («Паспорт»). */
  open: string
}

export type ListConfig<T extends Row> = {
  key: string
  title: string
  /** Группа меню над заголовком («Сеть»). */
  crumb: string
  sub: string
  /** Картинка справа в шапке раздела. */
  hero?: string
  icon: LucideIcon
  search: string
  buttons: HeroButton[]
  rows: () => T[]
  /** Текст для поиска. */
  text: (x: T) => string
  name: (x: T) => string
  kpis: (rows: T[]) => Kpi[]
  filters: Filter<T>[]
  cols: Column<T>[]
  /** Сортировка по умолчанию; "" — в исходном порядке. */
  sort: [string, 1 | -1]
  preview: (x: T) => Preview
  card: (x: T) => Card
}
