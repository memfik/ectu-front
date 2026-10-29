# Разделы на явных страницах (без конфигов)

Как в kcrm-front: у раздела нет описания-конфига, по которому общий движок рисует страницы. Страницы — явный код из блоков,
данные — модуль в `src/lib/api`. Образец — **07 ВОЛС** (`fiber-lines`).

## Где что лежит

| Что | Где | Образец |
| --- | --- | --- |
| Данные раздела: тип записи, статусы, справочники, примеры, источник API, `use<Имя>s()` / `use<Имя>(id)`, `<имя>.save/remove`, колонки отчёта, импорт, демо-детали паспорта | `src/lib/api/<key>.ts` | `lib/api/fiber-lines.ts` |
| Список | `src/app/(main)/<key>/page.tsx` (`"use client"`, заголовок — `usePageTitle`) | `fiber-lines/page.tsx` |
| Паспорт | `src/app/(main)/<key>/[id]/page.tsx` (`"use client"`, `use(params)`) | `fiber-lines/[id]/page.tsx` |
| Форма (общая для списка и паспорта) и другие общие части раздела | `src/components/<key>/` | `components/fiber-lines/fiber-line-form.tsx` |
| Блоки (только пропсы, о разделе не знают) | `src/components/blocks/` | list-hero, toolbar, table, record-card, preview, map-block, filters-panel, form-panel, delete/report/import/qr-dialog, passport |
| Общее для разделов 07–37 (запись `Equip` = место + статус + поля `f`) | `lib/api/equipment.ts` (генератор `seedEquip`, `withNode`, `EQUIP_REMOVE`, `qrUrl`, филиалы), `lib/api/helpers.ts` (`genApi`), `components/equipment/` (ячейки, «Размещение» в форме) | |
| Хранилище и API | `lib/api/source.ts` (`createSource`: примеры в памяти или API техучёта), `remote.ts`, `collection.ts` | |
| Реестр для «Сводных файлов», «Аналитики», «Импорта Excel» | `lib/api/sections.ts` — строка на раздел | |
| Отбор на странице | `lib/list/filter.ts` (`picked`, `sortRows`, `withCounts`, `distinct`) | |

## Правила
- Поведение и вёрстка — 1:1 с тем, что рисовал движок (`sections/make.tsx` → `components/list/list-page.tsx`, паспорт — `sections/lines/passport.tsx`). Данные примеров не меняются: тот же `key`, `total`, `gen`, `seed`, статусы.
- Тип записи — `Equip<{ …поля f… }>` с перечисленными полями (а не `Record`).
- Колонки, фильтры, KPI, поля формы, вкладки паспорта — перечисляются прямо в коде страницы / формы. Дублирование между разделами допустимо.
- Режим API (`NEXT_PUBLIC_API_URL`) сохраняется: список через `<src>.usePage()`, варианты фильтров `<src>.useOptions()`, запись `<src>.useRecord(id)`.
- Отличия от прежнего поведения — в `docs/backlog.md`.
