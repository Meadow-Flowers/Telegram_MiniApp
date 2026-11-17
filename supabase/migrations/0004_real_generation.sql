-- Справжня генерація: шаблон промпту й облік токенів та ціни кожного запиту.
-- Виконується ОДИН раз у Supabase: SQL Editor → New query → вставити → Run.
-- Сам шаблон промпту сюди НЕ вставляємо (репозиторій публічний): його записують окремим запитом у SQL Editor,
-- див. «Як заповнити промпт» у README.

alter table public.settings add column image_prompt text;

alter table public.generations
  add column usage jsonb, -- токени з відповіді моделі (вхід: текст і фото, вихід)
  add column cost numeric(10, 4); -- розрахункова ціна запиту, $
