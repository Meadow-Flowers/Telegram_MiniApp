-- Фото самого формату (коробка, кошик, упаковка) для екрана вибору формату в клієнта.
-- Виконується один раз у Supabase SQL Editor.

alter table public.formats add column photo_path text;
