# ЕСТУ (QMobile) — фронтенд на Next.js

Перенос HTML-макетов в рабочий фронтенд. Описание дизайна: `docs/design-handoff.md`.
Макеты: `~/Downloads/QMobile-ЕСТУ-дизайн/` (старт — `00-Меню.html`; тёмная тема основная, `Светлая тема/`, `Телефон/`).

- Стек: Next.js (App Router, `src/`), Tailwind v4, shadcn + **Opaline** (liquid glass, `src/components/ui/opaline/`), lucide-react.
- Разделы — без конфигов, как в kcrm-front (`docs/explicit-pages.md`, образец — 07 ВОЛС): данные — `src/lib/api/<раздел>.ts` (тип записи, статусы, примеры, источник API через `createSource` из `lib/api/source.ts`, хуки `use…()`, колонки отчёта, импорт, демо-детали паспорта); список и паспорт — явный код в `app/(main)/<раздел>/page.tsx` и `[id]/page.tsx` (`"use client"`, заголовок вкладки — `usePageTitle`) из блоков `src/components/blocks/` (только пропсы, о разделе не знают); форма и части раздела — `src/components/<раздел>/`. Общее для 07–37: `lib/api/equipment.ts` (запись `Equip`, генератор примеров), `lib/api/helpers.ts` (`genApi`), `lib/api/lines.ts` (детали линий), `components/equipment/`, `components/lines/`. Реестр для сводных файлов, аналитики и импорта — `lib/api/sections.ts`. Дублирование между разделами допустимо.
- Маршруты: у каждого раздела `app/(main)/<раздел>/page.tsx` и `[id]/page.tsx`; неизвестный адрес — `app/not-found.tsx` в своём каркасе (`components/layout/error-layout.tsx`). Меню — `src/config/nav.ts` (номер = номер макета).
- Отложенное и вопросы — `docs/backlog.md`.
- Токены тем: конец `src/app/globals.css`. Тёмная по умолчанию (`html.dark`); тема переключается в «Быстрых настройках» шапки (`header-popovers.tsx`).
- Порядок работ: docs/design-handoff.md §7. Бренд только синий `#085eff`.
- Бэкенд: техучёт `https://stage-techaccount.jusanmobile.kz:8101` (как в старом фронте `../techaccaunt_front`, `src/services/api/modules/*`; токен Bearer). Адрес — `NEXT_PUBLIC_API_URL` (`.env.example`). Ядро сети (43) — из `../kticket-back`. 3D — через `dynamic(..., { ssr: false })`.
