# ЕСТУ (QMobile) — фронтенд на Next.js

Перенос HTML-макетов в рабочий фронтенд. Описание дизайна: `docs/design-handoff.md`.
Макеты: `~/Downloads/QMobile-ЕСТУ-дизайн/` (старт — `00-Меню.html`; тёмная тема основная, `Светлая тема/`, `Телефон/`).

- Стек: Next.js (App Router, `src/`), Tailwind v4, shadcn + **Opaline** (liquid glass, `src/components/ui/opaline/`), lucide-react.
- Разделы и маршруты: `src/config/nav.ts` (номер = номер макета). Страница-заглушка: `src/app/(main)/[section]/page.tsx`.
- Токены тем: конец `src/app/globals.css`. Тёмная по умолчанию (`html.dark`); тема переключается в «Быстрых настройках» шапки (`header-popovers.tsx`).
- Порядок работ: docs/design-handoff.md §7. Бренд только синий `#085eff`.
- Бэкенд: `../kticket-back`. 3D — через `dynamic(..., { ssr: false })`.
