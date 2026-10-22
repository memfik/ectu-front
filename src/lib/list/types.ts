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
  /**
   * Вид в шторке «Фильтры»: `tags` — плашки с «Добавить…», `multi` — выпадающий список с флажками (по умолчанию),
   * `flag` — флажок в блоке «Дополнительно» (значение "1").
   */
  ui?: "tags" | "multi" | "flag"
  /** В шторке: подпись, когда ничего не выбрано («Все регионы», «Любая»). */
  any?: string
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
  /** Порты устройства вместо цифр (оборудование СПД) */
  ports?: { n: string; state: "up" | "down" | "sfp" | "free" }[]
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

/** Значение поля формы: строка или список (теги). */
export type FieldValue = string | string[]

/** Поле шторки создания / редактирования (FormDrawer, экраны n-04, n-05). */
export type Field<T> = {
  k: string
  t: string
  /** Блок формы: «Основное», «Эксплуатация»… — подзаголовок перед первым полем блока. */
  section: string
  type: "text" | "number" | "select" | "tags" | "textarea" | "date"
  /** Половина ширины — два поля в строке. */
  half?: boolean
  /** Треть ширины — три поля в строке (комплектация). */
  third?: boolean
  required?: boolean
  placeholder?: string
  /** Подсказка справа от подписи («формат: город+№.№.филиал»). */
  hint?: string
  opts?: Option[]
  /** Плашка статуса вместо текста в выбранном значении. */
  tone?: (v: string) => Tone | undefined
  /** Ошибка значения (кроме «обязательно»). */
  check?: (v: FieldValue) => string | undefined
  get: (x: T) => FieldValue
  set: (x: T, v: FieldValue) => T
}

export type FormConfig<T> = {
  fields: Field<T>[]
  /** Пустая запись для «Создать». */
  blank: (id: number) => T
  create: { title: string; sub: string; submit: string }
  /** «Последнее изменение ДД.ММ.ГГГГ» в шапке редактирования. */
  updated?: (x: T) => string
  /** Метка изменения записи при сохранении (дата). */
  touch?: (x: T) => T
}

/** Колонка отчёта (экран n-08): `off` — не отмечена по умолчанию. */
export type ReportCol<T> = { k: string; t: string; value: (x: T) => string | number; off?: boolean }

/**
 * Источник данных в API техучёта (как BaseApiService в techaccaunt_front): `${base}/filter`, `/pasport`, `/create`, `/update`,
 * `/filter-params`; удаление — POST /api/trash/soft-delete/{trashKey}. Включается, когда задан NEXT_PUBLIC_API_URL.
 */
export type ApiSource<T extends Row> = {
  base: string
  /** Путь списка внутри base, по умолчанию "/filter" */
  list?: string
  /** Параметр id в /pasport ("node_id", "equipment_id", "vols_id"…) */
  idParam: string
  trashKey?: string
  /** Сырая запись API → запись раздела */
  map: (raw: Record<string, unknown>) => T
  /** Колонка → sort_by */
  sort?: Record<string, string>
  /** Фильтр → параметр запроса; branch переводится в id филиала */
  filter?: Record<string, string>
  /** Постоянные параметры (тип оборудования) */
  fixed?: Record<string, unknown>
  /** Имя параметра направления сортировки (onyma-clients ждёт sort_dir) */
  sortDir?: string
  /** Запись → тело /create и /update */
  payload?: (x: T) => Record<string, unknown>
  /** Нет создания / правки / удаления */
  readOnly?: boolean
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
  /** «Показать 1 110 узлов» — родительный падеж мн. ч. и склонения: [1, 2–4, 5+]. */
  unit: [string, string, string]
  form: FormConfig<T>
  /** Источник в API (без него раздел всегда на примерных данных) */
  api?: ApiSource<T>
  /** «Удалить 2 узла связи?» — формы слова для 1, 2–4, 5+. */
  noun: [string, string, string]
  /** Удаление с причиной (экран n-09): что станет со связанными записями и быстрые причины. */
  remove: { warning: string; reasons: string[] }
  /** QR-код для наклейки (экран n-10). */
  qr?: (x: T) => { title: string; sub: string; url: string }
  report: {
    cols: ReportCol<T>[]
    /** Дата записи для «Периода», ДД.ММ.ГГГГ. */
    date?: (x: T) => string
  }
  /** Точка для вида «Карта»; без него вида «Карта» нет. */
  map?: (x: T) => { ll: [number, number]; title: string; sub: string; tone: Tone; note: string } | null
}
