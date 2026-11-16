-- AI Букет: початкова структура бази.
-- Виконується ОДИН раз у Supabase: SQL Editor → New query → вставити → Run.
-- Доступ до таблиць має лише наш сервер (секретний ключ). З браузера до бази достукатись не можна.

/* ------------------------------------------------------------------ */
/* Каталог                                                             */
/* ------------------------------------------------------------------ */

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create unique index categories_name_key on public.categories (lower(name));

create table public.flowers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  stock integer not null default 0 check (stock >= 0),
  visible boolean not null default true,
  photo_path text,
  price numeric(10, 2), -- на майбутнє, поки порожнє
  created_at timestamptz not null default now()
);
create index flowers_category_idx on public.flowers (category_id);

/* ------------------------------------------------------------------ */
/* Формати: коробка, кошик, упаковка                                   */
/* ------------------------------------------------------------------ */

create table public.formats (
  id text primary key, -- 'box' | 'basket' | 'wrap'
  name text not null,
  enabled boolean not null default true,
  sort integer not null default 0
);

-- групи виборів усередині формату: форма, колір, форма композиції
create table public.format_groups (
  id uuid primary key default gen_random_uuid(),
  format_id text not null references public.formats (id) on delete cascade,
  key text not null,
  label text not null,
  child_label text, -- якщо задано, у кожного варіанта є вкладені (колір форми коробки)
  example text, -- підказка в полі назви в адмінці
  sort integer not null default 0,
  unique (format_id, key)
);

-- варіанти: форма, колір; parent_id заповнений у кольорів конкретної форми
create table public.format_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.format_groups (id) on delete cascade,
  parent_id uuid references public.format_options (id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  photo_path text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create index format_options_group_idx on public.format_options (group_id);
create index format_options_parent_idx on public.format_options (parent_id);

-- референсні фото робіт студії (вкладка «Стиль»), окремо для кожного формату
create table public.style_refs (
  id uuid primary key default gen_random_uuid(),
  format_id text not null references public.formats (id) on delete cascade,
  photo_path text not null,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create index style_refs_format_idx on public.style_refs (format_id);

/* ------------------------------------------------------------------ */
/* Налаштування, користувачі, події                                    */
/* ------------------------------------------------------------------ */

-- один рядок з правилами продукту
create table public.settings (
  id integer primary key default 1 check (id = 1),
  max_per_type integer not null default 15 check (max_per_type >= 1),
  max_total integer not null default 35 check (max_total >= 1),
  gens_per_day integer not null default 10 check (gens_per_day >= 1)
);

-- усі, хто відкривав додаток. Роль задає, що людина бачить
create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  first_name text,
  last_name text,
  username text,
  role text not null default 'client' check (role in ('client', 'staff', 'owner')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- журнал подій: генерації, надсилання студії, поширення, ліміт (для статистики)
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid references public.app_users (id) on delete set null,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index events_type_idx on public.events (type, created_at);

/* ------------------------------------------------------------------ */
/* Безпека: закрито для всіх, окрім серверного ключа                    */
/* ------------------------------------------------------------------ */

alter table public.categories enable row level security;
alter table public.flowers enable row level security;
alter table public.formats enable row level security;
alter table public.format_groups enable row level security;
alter table public.format_options enable row level security;
alter table public.style_refs enable row level security;
alter table public.settings enable row level security;
alter table public.app_users enable row level security;
alter table public.events enable row level security;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

/* ------------------------------------------------------------------ */
/* Сховище фото                                                        */
/* ------------------------------------------------------------------ */

-- Публічне читання (картинки показуються за посиланням), записує лише наш сервер.
-- Ліміт 5 МБ на файл, лише зображення.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

/* ------------------------------------------------------------------ */
/* Початкові дані: налаштування і формати (як у прототипі)             */
/* ------------------------------------------------------------------ */

insert into public.settings (id) values (1) on conflict do nothing;

insert into public.formats (id, name, sort) values
  ('box', 'Коробка', 1),
  ('basket', 'Кошик', 2),
  ('wrap', 'Упаковка', 3);

insert into public.format_groups (format_id, key, label, child_label, example, sort) values
  ('box', 'shape', 'Форма', 'Колір', 'Кругла', 1),
  ('wrap', 'color', 'Колір паперу', null, 'Рожева', 1),
  ('wrap', 'form', 'Форма композиції', null, 'Каскадна', 2);

-- форми коробки
insert into public.format_options (group_id, name, sort)
select g.id, v.name, v.sort
from public.format_groups g,
  (values ('Циліндрична', 1), ('Квадратна', 2), ('Овальна', 3)) as v (name, sort)
where g.format_id = 'box' and g.key = 'shape';

-- кольори: свій набір для кожної форми коробки
insert into public.format_options (group_id, parent_id, name, sort)
select p.group_id, p.id, c.name, c.sort
from public.format_options p
join (values
  ('Циліндрична', 'Біла', 1), ('Циліндрична', 'Зелена', 2), ('Циліндрична', 'Кремова', 3),
  ('Квадратна', 'Біла', 1), ('Квадратна', 'Кремова', 2),
  ('Овальна', 'Біла', 1), ('Овальна', 'Зелена', 2)
) as c (shape, name, sort) on c.shape = p.name
where p.parent_id is null
  and p.group_id = (select id from public.format_groups where format_id = 'box' and key = 'shape');

-- упаковка: колір паперу
insert into public.format_options (group_id, name, sort)
select g.id, v.name, v.sort
from public.format_groups g,
  (values ('Біла', 1), ('Кремова', 2), ('Зелена', 3), ('Рожева', 4)) as v (name, sort)
where g.format_id = 'wrap' and g.key = 'color';

-- упаковка: форма композиції
insert into public.format_options (group_id, name, sort)
select g.id, v.name, v.sort
from public.format_groups g,
  (values ('Кругла', 1), ('Овальна', 2), ('Трикутна', 3)) as v (name, sort)
where g.format_id = 'wrap' and g.key = 'form';
