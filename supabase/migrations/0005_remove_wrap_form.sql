-- Упаковка: з форм композиції прибираємо «Овальну» (її не буде ні в адмінці, ні в клієнта).
-- Лишаються «Кругла» і «Трикутна» (з фото, які додає адмін).
-- Виконується один раз у Supabase SQL Editor.

delete from public.format_options
where name = 'Овальна'
  and group_id = (select id from public.format_groups where format_id = 'wrap' and key = 'form');
