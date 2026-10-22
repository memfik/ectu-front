# ЕСТУ (QMobile) — фронтенд на Next.js

Перенос HTML-макетов в рабочий фронтенд. Описание дизайна: `docs/design-handoff.md`.
Макеты: `~/Downloads/QMobile-ЕСТУ-дизайн/` (старт — `00-Меню.html`; тёмная тема основная, `Светлая тема/`, `Телефон/`).

- Стек: Next.js (App Router, `src/`), Tailwind v4, shadcn + **Opaline** (liquid glass, `src/components/ui/opaline/`), lucide-react.
- Разделы: `src/sections/<раздел>/` — `config` (описание, форма, источник API), у узлов и СПД ещё `data`, `detail`, `passport`, `tabs`; паспорта разделов 07–33 — `<раздел>/passport.tsx` на общем шаблоне `src/sections/lines/` (`LineKind`: шапка, сцена / схема, вкладки; оборудование — `lines/equipment.tsx`, БШД — `lines/bwa.tsx`; панели и схемы — `components/passport/chassis.tsx`, `radio.tsx`). IP-план и резервные копии — свои страницы `<раздел>/page.tsx`. Общий движок: `src/sections/make.tsx` (описание → список, форма, отчёт), `api-helpers.ts`, `spec-helpers.ts`, реестры `index.ts` (LISTS) и `specs.ts`. Шаблон «Список» — `src/components/list/`, старый общий паспорт `components/passport/entity-passport.tsx` — только для IP-плана и бэкапов.
- Маршруты: у каждого раздела `app/(main)/<раздел>/page.tsx` и `[id]/page.tsx`; `app/(main)/[section]` — заглушка для ещё не перенесённых. Меню — `src/config/nav.ts` (номер = номер макета).
- Отложенное и вопросы — `docs/backlog.md`.
- Токены тем: конец `src/app/globals.css`. Тёмная по умолчанию (`html.dark`); тема переключается в «Быстрых настройках» шапки (`header-popovers.tsx`).
- Порядок работ: docs/design-handoff.md §7. Бренд только синий `#085eff`.
- Бэкенд: техучёт `https://stage-techaccount.jusanmobile.kz:8101` (как в старом фронте `../techaccaunt_front`, `src/services/api/modules/*`; токен Bearer). Адрес — `NEXT_PUBLIC_API_URL` (`.env.example`). Ядро сети (43) — из `../kticket-back`. 3D — через `dynamic(..., { ssr: false })`.
