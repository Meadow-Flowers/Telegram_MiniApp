-- Генерації, денний ліміт і ціна генерації для статистики.
-- Виконується ОДИН раз у Supabase: SQL Editor → New query → вставити → Run.

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  format_id text not null references public.formats (id),
  recipe jsonb not null, -- що обрав клієнт: квіти з кількістю, формат, варіанти, розмір
  summary text not null, -- «Троянда ×7 · Коробка · Циліндрична · Біла · розмір M»
  image_path text not null,
  model text not null default 'stub', -- яка модель намалювала (поки заглушка)
  sent_to_studio_at timestamptz,
  created_at timestamptz not null default now()
);
create index generations_user_day_idx on public.generations (user_id, created_at);

alter table public.generations enable row level security;
grant all on public.generations to service_role;

-- Скільки генерацій людина зробила сьогодні (доба рахується за київським часом)
create function public.generations_today(p_user uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.generations
  where user_id = p_user
    and created_at >= (date_trunc('day', now() at time zone 'Europe/Kyiv') at time zone 'Europe/Kyiv');
$$;
grant execute on function public.generations_today(uuid) to service_role;

-- Ціна однієї генерації (для орієнтовних витрат у статистиці); порожня, поки не обрано модель
alter table public.settings add column generation_cost numeric(10, 4);
