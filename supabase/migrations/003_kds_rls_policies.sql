-- Політики RLS для KDS у браузері (роль `anon` + `authenticated`).
-- УВАГА: відкритий доступ до кухонних таблиць — прийнятно лише для PoC / внутрішньої мережі.
-- У продакшені замініть на умови з auth.jwt() (наприклад location_id у user_metadata).

-- Локації: лише читання для дисплея
DROP POLICY IF EXISTS "kds_locations_select" ON public.locations;
CREATE POLICY "kds_locations_select"
  ON public.locations FOR SELECT
  TO anon, authenticated
  USING (true);

-- Замовлення: POS / KDS
DROP POLICY IF EXISTS "kds_orders_all" ON public.orders;
CREATE POLICY "kds_orders_all"
  ON public.orders FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Позиції та модифікатори
DROP POLICY IF EXISTS "kds_order_items_all" ON public.order_items;
CREATE POLICY "kds_order_items_all"
  ON public.order_items FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "kds_order_item_modifiers_all" ON public.order_item_modifiers;
CREATE POLICY "kds_order_item_modifiers_all"
  ON public.order_item_modifiers FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
