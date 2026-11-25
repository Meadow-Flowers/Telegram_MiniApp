-- Позначки для референсних фото у вкладці «Стиль»: розмір і форма, а також вимикач «Не використовувати».
-- Потрібні для генерації за шаблоном: сервер обиратиме фото під вибір клієнта (форма й розмір).
-- Виконується вручну один раз у Supabase → SQL Editor. Існуючі дані не змінює: нові стовпці порожні.
-- ВАЖЛИВО: виконайте це ДО того, як новий код потрапить на Vercel (інакше позначки не збережуться).

alter table public.style_refs
  add column if not exists size text check (size in ('small', 'large')), -- малий чи великий букет
  add column if not exists option_id uuid references public.format_options (id) on delete set null, -- форма: Циліндр/Квадрат/Овал (коробка) чи Круг/Трикутник (упаковка)
  add column if not exists skip boolean not null default false; -- true: не використовувати це фото в генерації
