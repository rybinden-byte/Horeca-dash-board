-- Підписка Realtime на зміни тикетів (виконайте один раз; якщо таблиця вже в publication — ігноруйте помилку).

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_item_modifiers;
